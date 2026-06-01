import {PoolClient} from "pg";

import {pool} from "../../config/db";
import {AuthenticatedUser} from "../../websocket/ws.types";
import {parseRecycleResourcePayload} from "../../websocket/wsPayloadParsers";
import {getParticipantForSession} from "./participant.service";
import {getSessionStateForUser} from "./session.service";
import {ResourceType} from "../game.types";

const RESOURCES_PER_GALBEN = 2;
const MIN_RECYCLE_QUANTITY = 2;
const MAX_INFLATION_REDUCTION = 5;
const RESOURCES_PER_INFLATION_POINT = 50;

async function getCurrentEconomyForSnapshot(client: PoolClient, sessionId: string) {
    const result = await client.query(
        `
        SELECT inflation, wood_avg_price, stone_avg_price, grain_avg_price
        FROM session_economy_state
        WHERE session_id = $1
        FOR UPDATE
        `,
        [sessionId]
    );

    return result.rows[0];
}

export async function recycleResource(user: AuthenticatedUser, rawPayload: unknown) {
    const payload = parseRecycleResourcePayload(rawPayload);

    if (!payload) {
        throw new Error("Payload invalid pentru RECYCLE_RESOURCE.");
    }

    if (payload.quantity < MIN_RECYCLE_QUANTITY) {
        throw new Error(`Cantitatea minimă pentru reciclare este ${MIN_RECYCLE_QUANTITY}.`);
    }

    const galbeniGained = Math.floor(payload.quantity / RESOURCES_PER_GALBEN);

    if (galbeniGained <= 0) {
        throw new Error("Cantitatea reciclată este prea mică pentru a primi galbeni.");
    }

    const inflationReduction = Math.min(
        MAX_INFLATION_REDUCTION,
        Math.floor(payload.quantity / RESOURCES_PER_INFLATION_POINT)
    );

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const participant = await getParticipantForSession(
            client,
            user,
            payload.sessionId
        );

        const sessionResult = await client.query(
            `
            SELECT status
            FROM game_sessions
            WHERE id = $1
            FOR UPDATE
            `,
            [payload.sessionId]
        );

        if (sessionResult.rows.length === 0) {
            throw new Error("Sesiunea nu există.");
        }

        if (sessionResult.rows[0].status !== "active") {
            throw new Error("Reciclarea este disponibilă doar într-o sesiune activă.");
        }

        const resourceResult = await client.query(
            `
            SELECT amount
            FROM player_resources
            WHERE participant_id = $1
              AND resource = $2
            FOR UPDATE
            `,
            [participant.id, payload.resource]
        );

        const availableAmount = Number(resourceResult.rows[0]?.amount ?? 0);

        if (availableAmount < payload.quantity) {
            throw new Error("Nu ai suficiente resurse pentru reciclare.");
        }

        await client.query(
            `
            UPDATE player_resources
            SET amount = amount - $3,
                updated_at = now()
            WHERE participant_id = $1
              AND resource = $2
            `,
            [participant.id, payload.resource, payload.quantity]
        );

        await client.query(
            `
            UPDATE player_states
            SET galbeni = galbeni + $2,
                total_recycled_amount = total_recycled_amount + $3,
                updated_at = now()
            WHERE participant_id = $1
            `,
            [participant.id, galbeniGained, payload.quantity]
        );

        const economyRow = await getCurrentEconomyForSnapshot(client, payload.sessionId);

        const newInflation = Math.max(
            0,
            Number(economyRow?.inflation ?? 20) - inflationReduction
        );

        await client.query(
            `
            UPDATE session_economy_state
            SET inflation = $2,
                last_calculated_at = now()
            WHERE session_id = $1
            `,
            [payload.sessionId, newInflation]
        );

        await client.query(
            `
            INSERT INTO economy_snapshots (
                session_id,
                inflation,
                wood_avg_price,
                stone_avg_price,
                grain_avg_price,
                recycle_pressure,
                reason
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'recycle')
            `,
            [
                payload.sessionId,
                newInflation,
                Number(economyRow?.wood_avg_price ?? 5),
                Number(economyRow?.stone_avg_price ?? 5),
                Number(economyRow?.grain_avg_price ?? 5),
                -inflationReduction,
            ]
        );

        await client.query("COMMIT");

        return {
            sessionId: payload.sessionId,
            resource: payload.resource as ResourceType,
            quantity: payload.quantity,
            galbeniGained,
            inflationReduction,
            sessionState: await getSessionStateForUser(user, payload.sessionId),
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}
