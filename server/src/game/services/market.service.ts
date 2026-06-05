import {AuthenticatedUser} from "../../websocket/ws.types";
import {
    parseAcceptMarketOfferPayload,
    parseCancelMarketOfferPayload,
    parseCreateMarketOfferPayload
} from "../../websocket/wsPayloadParsers";
import {pool} from "../../config/db";
import {getParticipantForSession} from "./participant.service";
import {
    INITIAL_AVERAGE_PRICE,
    MARKET_CLOSE_MINUTE,
    MARKET_OPEN_MINUTE,
    OFFER_DURATION_MINUTES, STABLE_TRADE_MIN_QUANTITY
} from "../game.constants";
import {OfferType, ResourceType} from "../game.types";
import {getAveragePriceColumn} from "../gameRules";
import {
    applyEconomyPressuresAndSaveSnapshot,
    calculateDemandSupplyPressure,
    calculateOverpricePressure, calculateUnderpricePressure,
    updateAveragePricesAfterTrade
} from "./economy.service";
import type { PoolClient } from "pg";

async function syncSellOffersWithSellerResources(
    queryable: Pick<typeof pool, "query">,
    sessionId: string
): Promise<void> {
    await queryable.query(
        `
        WITH availability AS (
            SELECT
                mo.id,
                COALESCE(pr.amount, 0) AS available_amount
            FROM market_offers mo
            LEFT JOIN player_resources pr
              ON pr.participant_id = mo.creator_participant_id
             AND pr.resource = mo.resource
            WHERE mo.session_id = $1
              AND mo.status = 'active'
              AND mo.offer_type = 'sell'
        )
        UPDATE market_offers mo
        SET remaining_quantity = LEAST(mo.remaining_quantity, availability.available_amount),
            status = CASE
                WHEN LEAST(mo.remaining_quantity, availability.available_amount) <= 0
                    THEN 'cancelled'::offer_status
                ELSE mo.status
            END,
            updated_at = now()
        FROM availability
        WHERE mo.id = availability.id
          AND mo.remaining_quantity > availability.available_amount
        `,
        [sessionId]
    );
}

async function getParticipantAndLockedSession(
    client: PoolClient,
    user: AuthenticatedUser,
    sessionId: string
) {
    const participant = await getParticipantForSession(
        client,
        user,
        sessionId
    );

    const sessionResult = await client.query(
        `
        SELECT status, current_minute
        FROM game_sessions
        WHERE id = $1
        FOR UPDATE
        `,
        [sessionId]
    );

    if (sessionResult.rows.length === 0) {
        throw new Error("Sesiunea nu există.");
    }

    const session = sessionResult.rows[0];

    return {
        participant,
        session,
        currentMinute: Number(session.current_minute),
    };
}

async function expireOldOffers(sessionId: string): Promise<void> {
    await pool.query(
        `
        UPDATE market_offers
        SET status = 'expired',
            updated_at = now()
        WHERE session_id = $1
          AND status = 'active'
          AND expires_at <= now()
        `,
        [sessionId]
    );
}

export async function cancelActiveMarketOffersForParticipant(
    queryable: Pick<typeof pool, "query">,
    sessionId: string,
    participantId: string
): Promise<number> {
    const result = await queryable.query(
        `
        UPDATE market_offers
        SET status = 'cancelled',
            remaining_quantity = 0,
            updated_at = now()
        WHERE session_id = $1
          AND creator_participant_id = $2
          AND status = 'active'
        RETURNING id
        `,
        [sessionId, participantId]
    );

    return result.rowCount ?? 0;
}

export async function getMarketStateForUser(user: AuthenticatedUser, sessionId: string) {
    await expireOldOffers(sessionId);
    await syncSellOffersWithSellerResources(pool, sessionId);

    const participant = await getParticipantForSession(pool, user, sessionId);

    const offersResult = await pool.query(
        `
        SELECT
            mo.id,
            mo.offer_type,
            mo.resource,
            mo.min_quantity,
            mo.max_quantity,
            mo.remaining_quantity,
            mo.price_per_unit,
            mo.expires_at,
            mo.creator_participant_id,
            sp.display_name AS creator_name
        FROM market_offers mo
        JOIN session_participants sp
          ON sp.id = mo.creator_participant_id
        WHERE mo.session_id = $1
          AND mo.status = 'active'
          AND mo.expires_at > now()
          AND sp.is_connected = true
        ORDER BY mo.created_at DESC
        `,
        [sessionId]
    );

    const economyResult = await pool.query(
        `
        SELECT inflation, wood_avg_price, stone_avg_price, grain_avg_price
        FROM session_economy_state
        WHERE session_id = $1
        `,
        [sessionId]
    );

    const economyRow = economyResult.rows[0];

    return {
        sessionId,
        economy: {
            inflation: Number(economyRow?.inflation ?? 20),
            averagePrices: {
                wood: Number(economyRow?.wood_avg_price ?? INITIAL_AVERAGE_PRICE),
                stone: Number(economyRow?.stone_avg_price ?? INITIAL_AVERAGE_PRICE),
                grain: Number(economyRow?.grain_avg_price ?? INITIAL_AVERAGE_PRICE),
            },
        },
        offers: offersResult.rows.map((row) => ({
            id: row.id,
            offerType: row.offer_type,
            resource: row.resource,
            minQuantity: Number(row.min_quantity),
            maxQuantity: Number(row.max_quantity),
            remainingQuantity: Number(row.remaining_quantity),
            pricePerUnit: Number(row.price_per_unit),
            expiresAt: row.expires_at,
            creatorName: row.creator_name,
            creatorParticipantId: row.creator_participant_id,
            isOwnOffer: row.creator_participant_id === participant.id,
        })),
    };
}

export async function createMarketOffer(user: AuthenticatedUser, rawPayload: unknown) {
    const payload = parseCreateMarketOfferPayload(rawPayload);

    if (!payload) {
        throw new Error("Payload invalid pentru CREATE_MARKET_OFFER.");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { participant, session, currentMinute } =
            await getParticipantAndLockedSession(
                client,
                user,
                payload.sessionId
            );

        if (session.status !== "active") {
            throw new Error("Piața este disponibilă doar într-o sesiune activă.");
        }

        if (currentMinute < MARKET_OPEN_MINUTE || currentMinute >= MARKET_CLOSE_MINUTE) {
            throw new Error("Piața este închisă. Program: 09:00–17:00.");
        }

        if (payload.offerType === "sell") {
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

            if (availableAmount <= 0) {
                throw new Error("Nu ai această resursă disponibilă pentru vânzare.");
            }

            if (payload.quantity > availableAmount) {
                throw new Error(
                    `Nu poți vinde ${payload.quantity} unități. Ai disponibile doar ${availableAmount}.`
                );
            }
        }

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
                   now() + ($7::text || ' minutes')::interval
            )
            RETURNING id, offer_type, resource, remaining_quantity, price_per_unit, expires_at
            `,
            [
                payload.sessionId,
                participant.id,
                payload.offerType,
                payload.resource,
                payload.quantity,
                payload.pricePerUnit,
                OFFER_DURATION_MINUTES,
            ]
        );

        await client.query("COMMIT");

        return {
            sessionId: payload.sessionId,
            offer: offerResult.rows[0],
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function cancelMarketOffer(user: AuthenticatedUser, rawPayload: unknown) {
    const payload = parseCancelMarketOfferPayload(rawPayload);

    if (!payload) {
        throw new Error("Payload invalid pentru CANCEL_MARKET_OFFER.");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const participant = await getParticipantForSession(
            client,
            user,
            payload.sessionId
        );

        const result = await client.query(
            `
            UPDATE market_offers
            SET status = 'cancelled',
                remaining_quantity = 0,
                updated_at = now()
            WHERE id = $1
              AND session_id = $2
              AND creator_participant_id = $3
              AND status = 'active'
            RETURNING id
            `,
            [payload.offerId, payload.sessionId, participant.id]
        );

        if (result.rows.length === 0) {
            throw new Error("Oferta nu există, nu îți aparține sau nu mai este activă.");
        }

        await client.query("COMMIT");

        return {
            sessionId: payload.sessionId,
            offerId: payload.offerId,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}


export async function acceptMarketOffer(user: AuthenticatedUser, rawPayload: unknown) {
    const payload = parseAcceptMarketOfferPayload(rawPayload);

    if (!payload) {
        throw new Error("Payload invalid pentru ACCEPT_MARKET_OFFER.");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await syncSellOffersWithSellerResources(client, payload.sessionId);

        const { participant: acceptor, session, currentMinute } =
            await getParticipantAndLockedSession(
                client,
                user,
                payload.sessionId
            );

        if (session.status !== "active") {
            throw new Error("Tranzacțiile sunt disponibile doar într-o sesiune activă.");
        }

        if (currentMinute < MARKET_OPEN_MINUTE || currentMinute >= MARKET_CLOSE_MINUTE) {
            throw new Error("Piața este închisă. Program: 09:00–17:00.");
        }

        const offerResult = await client.query(
            `
                SELECT
                    mo.id,
                    mo.creator_participant_id,
                    mo.offer_type,
                    mo.resource,
                    mo.min_quantity,
                    mo.remaining_quantity,
                    mo.price_per_unit,
                    mo.status,
                    mo.expires_at,
                    creator_sp.is_connected AS creator_is_connected
                FROM market_offers mo
                         JOIN session_participants creator_sp
                              ON creator_sp.id = mo.creator_participant_id
                WHERE mo.id = $1
                  AND mo.session_id = $2
                    FOR UPDATE
            `,
            [payload.offerId, payload.sessionId]
        );

        if (offerResult.rows.length === 0) {
            throw new Error("Oferta nu există.");
        }

        const offer = offerResult.rows[0];

        if (offer.status !== "active") {
            throw new Error("Oferta nu mai este activă.");
        }

        if (!offer.creator_is_connected) {
            throw new Error("Creatorul ofertei nu mai este conectat.");
        }

        if (new Date(offer.expires_at).getTime() <= Date.now()) {
            await client.query(
                `
                UPDATE market_offers
                SET status = 'expired',
                    updated_at = now()
                WHERE id = $1
                `,
                [offer.id]
            );

            throw new Error("Oferta a expirat.");
        }

        const creatorParticipantId = String(offer.creator_participant_id);
        const acceptorParticipantId = String(acceptor.id);

        if (creatorParticipantId === acceptorParticipantId) {
            throw new Error("Nu poți accepta propria ofertă.");
        }

        const minQuantity = Number(offer.min_quantity);
        const remainingQuantity = Number(offer.remaining_quantity);
        const quantity = payload.quantity;
        const pricePerUnit = Number(offer.price_per_unit);
        const totalPrice = quantity * pricePerUnit;
        const resource = offer.resource as ResourceType;
        const offerType = offer.offer_type as OfferType;
        const averagePriceColumn = getAveragePriceColumn(resource);

        const economyBeforeTradeResult = await client.query(
            `
            SELECT ${averagePriceColumn} AS average_price
            FROM session_economy_state
            WHERE session_id = $1
            FOR UPDATE
            `,
            [payload.sessionId]
        );

        const averagePriceBeforeTrade = Number(
            economyBeforeTradeResult.rows[0]?.average_price ?? 1
        );

        const overpricePressure = calculateOverpricePressure(
            pricePerUnit,
            averagePriceBeforeTrade
        );

        const underpricePressure = calculateUnderpricePressure(
            pricePerUnit,
            averagePriceBeforeTrade
        );

        if (quantity < minQuantity) {
            throw new Error(`Cantitatea minimă acceptată este ${minQuantity}.`);
        }

        if (quantity > remainingQuantity) {
            throw new Error("Cantitatea cerută depășește cantitatea disponibilă.");
        }

        const sellerParticipantId =
            offerType === "sell" ? creatorParticipantId : acceptorParticipantId;

        const buyerParticipantId =
            offerType === "sell" ? acceptorParticipantId : creatorParticipantId;

        const sellerResourceResult = await client.query(
            `
            SELECT amount
            FROM player_resources
            WHERE participant_id = $1
              AND resource = $2
            FOR UPDATE
            `,
            [sellerParticipantId, resource]
        );

        const sellerResourceAmount = Number(sellerResourceResult.rows[0]?.amount ?? 0);

        if (sellerResourceAmount < quantity) {
            throw new Error("Vânzătorul nu mai are suficiente resurse pentru tranzacție.");
        }

        const buyerStateResult = await client.query(
            `
            SELECT galbeni
            FROM player_states
            WHERE participant_id = $1
            FOR UPDATE
            `,
            [buyerParticipantId]
        );

        const buyerGalbeni = Number(buyerStateResult.rows[0]?.galbeni ?? 0);

        if (buyerGalbeni < totalPrice) {
            throw new Error("Cumpărătorul nu are suficienți galbeni.");
        }

        await client.query(
            `
            UPDATE player_resources
            SET amount = amount - $3,
                updated_at = now()
            WHERE participant_id = $1
              AND resource = $2
            `,
            [sellerParticipantId, resource, quantity]
        );

        await client.query(
            `
            UPDATE player_resources
            SET amount = amount + $3,
                updated_at = now()
            WHERE participant_id = $1
              AND resource = $2
            `,
            [buyerParticipantId, resource, quantity]
        );

        await client.query(
            `
            UPDATE player_states
            SET galbeni = galbeni - $2,
                updated_at = now()
            WHERE participant_id = $1
            `,
            [buyerParticipantId, totalPrice]
        );

        await client.query(
            `
            UPDATE player_states
            SET galbeni = galbeni + $2,
                updated_at = now()
            WHERE participant_id = $1
            `,
            [sellerParticipantId, totalPrice]
        );

        const transactionResult = await client.query(
            `
            INSERT INTO trade_transactions (
                session_id,
                offer_id,
                seller_participant_id,
                buyer_participant_id,
                resource,
                quantity,
                price_per_unit
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5::resource_type,
                $6,
                $7
            )
            RETURNING id, resource, quantity, price_per_unit, total_price, created_at
            `,
            [
                payload.sessionId,
                offer.id,
                sellerParticipantId,
                buyerParticipantId,
                resource,
                quantity,
                pricePerUnit,
            ]
        );

        const newRemainingQuantity = remainingQuantity - quantity;

        await client.query(
            `
            UPDATE market_offers
            SET remaining_quantity = $2,
                status = CASE
                    WHEN $2 = 0 THEN 'completed'::offer_status
                    ELSE 'active'::offer_status
                END,
                updated_at = now()
            WHERE id = $1
            `,
            [offer.id, newRemainingQuantity]
        );

        await updateAveragePricesAfterTrade(client, payload.sessionId);

        const demandSupplyPressure = await calculateDemandSupplyPressure(
            client,
            payload.sessionId,
            {
                excludedOfferId: offer.id,
            }
        );

        const economyResult = await client.query(
            `
                SELECT inflation
                FROM session_economy_state
                WHERE session_id = $1
                FOR UPDATE
                `,
            [payload.sessionId]
        );

        const currentInflationForTrade = Number(economyResult.rows[0]?.inflation ?? 20);

        const MIN_INFLATION_FOR_TRADE_STABILIZATION = 10;

        const stabilizationPressure =
            overpricePressure === 0 &&
            underpricePressure === 0 &&
            demandSupplyPressure === 0 &&
            quantity >= STABLE_TRADE_MIN_QUANTITY
                ? 1
                : 0;

        await applyEconomyPressuresAndSaveSnapshot(
            client,
            payload.sessionId,
            "trade",
            {
                demandSupplyPressure,
                overpricePressure,
                underpricePressure,
                stabilizationPressure,
            }
        );

        await client.query("COMMIT");

        return {
            sessionId: payload.sessionId,
            transaction: transactionResult.rows[0],
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}