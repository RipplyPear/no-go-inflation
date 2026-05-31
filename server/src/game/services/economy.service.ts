import {
    AVG_PRICE_TRADE_QUANTITY_CAP,
    DEMAND_SUPPLY_PRESSURE_THRESHOLD,
    MAX_DEMAND_SUPPLY_PRESSURE,
    MAX_TRADE_INFLATION_PRESSURE,
    OVERPRICE_THRESHOLD_MULTIPLIER
} from "../game.constants";
import {clampNumber} from "../gameRules";
import {pool} from "../../config/db";
import {EconomyPressures, EconomySnapshotReason} from "../game.types";

export async function calculateDemandSupplyPressure(
    queryable: Pick<typeof pool, "query">,
    sessionId: string
): Promise<number> {
    const result = await queryable.query(
        `
        SELECT
            resource,
            SUM(
                CASE
                    WHEN offer_type = 'buy' THEN remaining_quantity
                    ELSE 0
                END
            ) AS buy_quantity,
            SUM(
                CASE
                    WHEN offer_type = 'sell' THEN remaining_quantity
                    ELSE 0
                END
            ) AS sell_quantity
        FROM market_offers
        WHERE session_id = $1
          AND status = 'active'
          AND expires_at > now()
        GROUP BY resource
        `,
        [sessionId]
    );

    let totalPressure = 0;

    for (const row of result.rows) {
        const buyQuantity = Number(row.buy_quantity ?? 0);
        const sellQuantity = Number(row.sell_quantity ?? 0);
        const totalQuantity = buyQuantity + sellQuantity;

        if (totalQuantity <= 0) {
            continue;
        }

        const imbalance = Math.abs(buyQuantity - sellQuantity) / totalQuantity;

        if (imbalance <= DEMAND_SUPPLY_PRESSURE_THRESHOLD) {
            continue;
        }

        const rawPressure =
            (imbalance - DEMAND_SUPPLY_PRESSURE_THRESHOLD) * 10;

        totalPressure += rawPressure;
    }

    return clampNumber(
        Math.round(totalPressure),
        0,
        MAX_DEMAND_SUPPLY_PRESSURE
    );
}

export function calculateOverpricePressure(
    pricePerUnit: number,
    currentAveragePrice: number
): number {
    if (currentAveragePrice <= 0) {
        return 0;
    }

    const ratio = pricePerUnit / currentAveragePrice;

    if (ratio <= OVERPRICE_THRESHOLD_MULTIPLIER) {
        return 0;
    }

    const rawPressure = Math.ceil((ratio - OVERPRICE_THRESHOLD_MULTIPLIER) * 4);

    return clampNumber(rawPressure, 1, MAX_TRADE_INFLATION_PRESSURE);
}

export async function updateAveragePricesAfterTrade(
    queryable: Pick<typeof pool, "query">,
    sessionId: string
): Promise<void> {
    await queryable.query(
        `
            WITH ranked_trades AS (
                SELECT
                    resource,
                    LEAST(quantity, $2::integer) AS capped_quantity,
                    price_per_unit,
                    ROW_NUMBER() OVER (
                        PARTITION BY resource
                        ORDER BY created_at DESC
                        ) AS rn
                FROM trade_transactions
                WHERE session_id = $1
            ),
                 recent_trades AS (
                     SELECT resource, capped_quantity, price_per_unit
                     FROM ranked_trades
                     WHERE rn <= 20
                 ),
                 averages AS (
                     SELECT
                         resource,
                         ROUND(
                                 SUM(capped_quantity * price_per_unit)::numeric
                                     / NULLIF(SUM(capped_quantity), 0),
                                 2
                         ) AS avg_price
                     FROM recent_trades
                     GROUP BY resource
                 )
            UPDATE session_economy_state
            SET
                wood_avg_price = COALESCE(
                        (SELECT avg_price FROM averages WHERE resource = 'wood'),
                        wood_avg_price
                                 ),
                stone_avg_price = COALESCE(
                        (SELECT avg_price FROM averages WHERE resource = 'stone'),
                        stone_avg_price
                                  ),
                grain_avg_price = COALESCE(
                        (SELECT avg_price FROM averages WHERE resource = 'grain'),
                        grain_avg_price
                                  ),
                last_calculated_at = now()
            WHERE session_id = $1
        `,
        [sessionId, AVG_PRICE_TRADE_QUANTITY_CAP]
    );
}

export async function applyEconomyPressuresAndSaveSnapshot(
    queryable: Pick<typeof pool, "query">,
    sessionId: string,
    reason: EconomySnapshotReason,
    pressures: EconomyPressures = {}
): Promise<void> {
    const demandSupplyPressure = pressures.demandSupplyPressure ?? 0;
    const overpricePressure = pressures.overpricePressure ?? 0;
    const recyclePressure = pressures.recyclePressure ?? 0;

    const totalPositivePressure =
        demandSupplyPressure + overpricePressure + recyclePressure;

    const currentEconomyResult = await queryable.query(
        `
        SELECT
            inflation,
            wood_avg_price,
            stone_avg_price,
            grain_avg_price
        FROM session_economy_state
        WHERE session_id = $1
        FOR UPDATE
        `,
        [sessionId]
    );

    if (currentEconomyResult.rows.length === 0) {
        throw new Error("Starea economiei nu există pentru această sesiune.");
    }

    const economy = currentEconomyResult.rows[0];

    const currentInflation = Number(economy.inflation);
    const inflationDelta = Math.round(totalPositivePressure);
    const nextInflation = clampNumber(currentInflation + inflationDelta, 0, 100);

    await queryable.query(
        `
        UPDATE session_economy_state
        SET inflation = $2,
            last_calculated_at = now()
        WHERE session_id = $1
        `,
        [sessionId, nextInflation]
    );

    const updatedEconomyResult = await queryable.query(
        `
        SELECT
            inflation,
            wood_avg_price,
            stone_avg_price,
            grain_avg_price
        FROM session_economy_state
        WHERE session_id = $1
        `,
        [sessionId]
    );

    const updatedEconomy = updatedEconomyResult.rows[0];

    await queryable.query(
        `
        INSERT INTO economy_snapshots (
            session_id,
            inflation,
            wood_avg_price,
            stone_avg_price,
            grain_avg_price,
            demand_supply_pressure,
            overprice_pressure,
            recycle_pressure,
            reason
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9::economy_snapshot_reason
        )
        `,
        [
            sessionId,
            Number(updatedEconomy.inflation),
            Number(updatedEconomy.wood_avg_price),
            Number(updatedEconomy.stone_avg_price),
            Number(updatedEconomy.grain_avg_price),
            demandSupplyPressure,
            overpricePressure,
            recyclePressure,
            reason,
        ]
    );
}