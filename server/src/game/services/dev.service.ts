import {AuthenticatedUser} from "../../websocket/ws.types";
import {ResourceType, SessionFinalResult} from "../game.types";
import {isRecord} from "../../websocket/wsProtocol";
import {getParticipantForSession} from "./participant.service";
import {pool} from "../../config/db";
import {DAY_END_MINUTE, FINAL_DAY, MARKET_CLOSE_MINUTE, MARKET_OPEN_MINUTE} from "../game.constants";
import {finalizeSessionIfNeeded} from "./finalResults.service";
import {parseDevSeedBotOfferPayload} from "../../websocket/wsPayloadParsers";

export async function forceFinishSessionForTesting(
    user: AuthenticatedUser,
    rawPayload: unknown
): Promise<SessionFinalResult> {
    if (!isRecord(rawPayload) || typeof rawPayload.sessionId !== "string") {
        throw new Error("Payload invalid pentru DEV_FORCE_FINISH_SESSION.");
    }

    await getParticipantForSession(pool, user, rawPayload.sessionId);

    await pool.query(
        `
        UPDATE game_sessions
        SET current_day = $2,
            current_minute = $3,
            status = 'finished',
            ended_at = COALESCE(ended_at, now()),
            updated_at = now()
        WHERE id = $1
        `,
        [rawPayload.sessionId, FINAL_DAY, DAY_END_MINUTE]
    );

    const finalResult = await finalizeSessionIfNeeded(rawPayload.sessionId);

    if (!finalResult) {
        throw new Error("Sesiunea nu a putut fi finalizată.");
    }

    return finalResult;
}

export async function seedBotOfferForTesting(user: AuthenticatedUser, rawPayload: unknown) {
    const payload = parseDevSeedBotOfferPayload(rawPayload);

    if (!payload) {
        throw new Error("Payload invalid pentru DEV_SEED_BOT_OFFER.");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await getParticipantForSession(client, user, payload.sessionId);

        const sessionResult = await client.query(
            `
            SELECT id, status, current_minute
            FROM game_sessions
            WHERE id = $1
            FOR UPDATE
            `,
            [payload.sessionId]
        );

        if (sessionResult.rows.length === 0) {
            throw new Error("Sesiunea nu există.");
        }

        const session = sessionResult.rows[0];

        if (session.status !== "active") {
            throw new Error("Seed-ul de ofertă merge doar într-o sesiune activă.");
        }

        const currentMinute = Number(session.current_minute);

        if (currentMinute < MARKET_OPEN_MINUTE || currentMinute >= MARKET_CLOSE_MINUTE) {
            await client.query(
                `
                UPDATE game_sessions
                SET current_minute = $2
                WHERE id = $1
                `,
                [payload.sessionId, MARKET_OPEN_MINUTE]
            );
        }

        const existingBotResult = await client.query(
            `
            SELECT id
            FROM session_participants
            WHERE session_id = $1
              AND participant_type = 'bot'
              AND display_name = 'Bot Test'
            LIMIT 1
            `,
            [payload.sessionId]
        );

        let botParticipantId: string;

        if (existingBotResult.rows.length > 0) {
            botParticipantId = existingBotResult.rows[0].id;
        } else {
            const botResult = await client.query(
                `
                INSERT INTO session_participants (
                    session_id,
                    user_id,
                    participant_type,
                    role,
                    display_name,
                    is_ready,
                    is_connected
                )
                VALUES (
                    $1,
                    NULL,
                    'bot',
                    'bot',
                    'Bot Test',
                    true,
                    true
                )
                RETURNING id
                `,
                [payload.sessionId]
            );

            botParticipantId = botResult.rows[0].id;
        }

        await client.query(
            `
            INSERT INTO player_states (
                session_id,
                participant_id,
                galbeni,
                economic_score,
                total_recycled_amount
            )
            VALUES ($1, $2, 10000, 0, 0)
            ON CONFLICT (participant_id)
            DO UPDATE SET
                galbeni = GREATEST(player_states.galbeni, 10000),
                updated_at = now()
            `,
            [payload.sessionId, botParticipantId]
        );

        for (const resource of ["wood", "stone", "grain"] as ResourceType[]) {
            await client.query(
                `
                INSERT INTO player_resources (participant_id, resource, amount)
                VALUES ($1, $2::resource_type, 2000)
                ON CONFLICT (participant_id, resource)
                DO UPDATE SET
                    amount = GREATEST(player_resources.amount, 2000),
                    updated_at = now()
                `,
                [botParticipantId, resource]
            );
        }

        await client.query(
            `
            UPDATE market_offers
            SET status = 'cancelled',
                updated_at = now()
            WHERE creator_participant_id = $1
              AND status = 'active'
            `,
            [botParticipantId]
        );

        const offerResult = await client.query(
            `
            INSERT INTO market_offers (
                session_id,
                creator_participant_id,
                offer_type,
                resource,
                min_quantity,
                max_quantity,
                remaining_quantity,
                price_per_unit,
                status,
                expires_at
            )
            VALUES (
                $1,
                $2,
                $3::offer_type,
                $4::resource_type,
                1,
                $5,
                $5,
                $6,
                'active',
                now() + interval '30 minutes'
            )
            RETURNING id, offer_type, resource, remaining_quantity, price_per_unit, expires_at
            `,
            [
                payload.sessionId,
                botParticipantId,
                payload.offerType,
                payload.resource,
                payload.quantity,
                payload.pricePerUnit,
            ]
        );

        await client.query("COMMIT");

        return {
            sessionId: payload.sessionId,
            botParticipantId,
            offer: offerResult.rows[0],
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}