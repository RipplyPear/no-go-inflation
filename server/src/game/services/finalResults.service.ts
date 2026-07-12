import { PlayerFinalResult, SessionFinalResult } from '../game.types';
import { pool } from '../../config/db';
import {
  BUILDING_SCORE_PER_LEVEL,
  INFLATION_LOSS_THRESHOLD,
  MIN_AVERAGE_ECONOMIC_SCORE,
  TRADE_VALUE_SCORE_DIVISOR,
} from '../game.constants';
import { getRankForEconomicScore } from '../gameRules';
import { applyEconomyPressuresAndSaveSnapshot } from './economy.service';

async function getSessionFinalResult(sessionId: string): Promise<SessionFinalResult> {
  const sessionResult = await pool.query(
    `
        SELECT final_inflation, result
        FROM game_sessions
        WHERE id = $1
        `,
    [sessionId]
  );

  if (sessionResult.rows.length === 0) {
    throw new Error('Sesiunea nu există.');
  }

  const session = sessionResult.rows[0];

  const resultsResult = await pool.query(
    `
        SELECT
            psr.participant_id,
            sp.display_name,
            psr.economic_score,
            psr.rank,
            psr.trades_count,
            psr.total_traded_value,
            psr.total_recycled_amount
        FROM player_session_results psr
        JOIN session_participants sp
          ON sp.id = psr.participant_id
        WHERE psr.session_id = $1
        ORDER BY psr.economic_score DESC
        `,
    [sessionId]
  );

  const results: PlayerFinalResult[] = resultsResult.rows.map((row) => ({
    participantId: String(row.participant_id),
    displayName: String(row.display_name),
    economicScore: Number(row.economic_score),
    rank: String(row.rank),
    tradesCount: Number(row.trades_count),
    totalTradedValue: Number(row.total_traded_value),
    totalRecycledAmount: Number(row.total_recycled_amount),
  }));

  const averageEconomicScore =
    results.length === 0
      ? 0
      : Math.round(results.reduce((sum, result) => sum + result.economicScore, 0) / results.length);

  return {
    sessionId,
    finalInflation: Number(session.final_inflation ?? 0),
    collectiveResult: session.result === 'win' ? 'win' : 'loss',
    averageEconomicScore,
    results,
  };
}

export async function finalizeSessionIfNeeded(
  sessionId: string
): Promise<SessionFinalResult | null> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const sessionResult = await client.query(
      `
            SELECT id, status, result
            FROM game_sessions
            WHERE id = $1
            FOR UPDATE
            `,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error('Sesiunea nu există.');
    }

    const session = sessionResult.rows[0];

    if (session.status !== 'finished') {
      await client.query('COMMIT');
      return null;
    }

    if (session.result !== 'pending') {
      await client.query('COMMIT');
      return await getSessionFinalResult(sessionId);
    }

    const economyResult = await client.query(
      `
            SELECT inflation, wood_avg_price, stone_avg_price, grain_avg_price
            FROM session_economy_state
            WHERE session_id = $1
            FOR UPDATE
            `,
      [sessionId]
    );

    if (economyResult.rows.length === 0) {
      throw new Error('Starea economiei nu există pentru această sesiune.');
    }

    const economy = economyResult.rows[0];
    const finalInflation = Number(economy.inflation);

    const participantsResult = await client.query(
      `
            WITH resource_values AS (
                SELECT
                    pr.participant_id,
                    SUM(
                        CASE pr.resource
                            WHEN 'wood' THEN pr.amount * $2::numeric
                            WHEN 'stone' THEN pr.amount * $3::numeric
                            WHEN 'grain' THEN pr.amount * $4::numeric
                            ELSE 0
                        END
                    ) AS resource_value
                FROM player_resources pr
                GROUP BY pr.participant_id
            ),
             stored_resource_values AS (
                 SELECT
                     participant_id,
                     SUM(
                             CASE building
                                 WHEN 'lumberyard' THEN stored_amount * $2::numeric
                                 WHEN 'mine' THEN stored_amount * $3::numeric
                                 WHEN 'farm' THEN stored_amount * $4::numeric
                                 ELSE 0
                                 END
                     ) AS stored_resource_value
                 FROM player_buildings
                 WHERE session_id = $1
                 GROUP BY participant_id
             ),
            building_values AS (
                SELECT
                    participant_id,
                    SUM(level * $5::integer) AS building_value
                FROM player_buildings
                WHERE session_id = $1
                GROUP BY participant_id
            ),
            trade_values AS (
                SELECT
                    participant_id,
                    COUNT(*) AS trades_count,
                    SUM(total_price) AS total_traded_value
                FROM (
                    SELECT seller_participant_id AS participant_id, total_price
                    FROM trade_transactions
                    WHERE session_id = $1

                    UNION ALL

                    SELECT buyer_participant_id AS participant_id, total_price
                    FROM trade_transactions
                    WHERE session_id = $1
                ) t
                GROUP BY participant_id
            )
            SELECT
                sp.id AS participant_id,
                sp.display_name,
                COALESCE(ps.galbeni, 0) AS galbeni,
                COALESCE(ps.total_recycled_amount, 0) AS total_recycled_amount,
                COALESCE(rv.resource_value, 0) AS resource_value,
                COALESCE(srv.stored_resource_value, 0) AS stored_resource_value,
                COALESCE(bv.building_value, 0) AS building_value,
                COALESCE(tv.trades_count, 0) AS trades_count,
                COALESCE(tv.total_traded_value, 0) AS total_traded_value
            FROM session_participants sp
            LEFT JOIN player_states ps
              ON ps.participant_id = sp.id
            LEFT JOIN resource_values rv
              ON rv.participant_id = sp.id
            LEFT JOIN stored_resource_values srv
              ON srv.participant_id = sp.id
            LEFT JOIN building_values bv
              ON bv.participant_id = sp.id
            LEFT JOIN trade_values tv
              ON tv.participant_id = sp.id
            WHERE sp.session_id = $1
              AND sp.participant_type = 'human'
            ORDER BY sp.joined_at
            `,
      [
        sessionId,
        Number(economy.wood_avg_price),
        Number(economy.stone_avg_price),
        Number(economy.grain_avg_price),
        BUILDING_SCORE_PER_LEVEL,
      ]
    );

    const finalRows = participantsResult.rows.map((row) => {
      const galbeni = Number(row.galbeni ?? 0);
      const resourceValue = Number(row.resource_value ?? 0);
      const buildingValue = Number(row.building_value ?? 0);
      const tradesCount = Number(row.trades_count ?? 0);
      const totalTradedValue = Number(row.total_traded_value ?? 0);
      const totalRecycledAmount = Number(row.total_recycled_amount ?? 0);
      const storedResourceValue = Number(row.stored_resource_value ?? 0);

      const MAX_TRADE_BONUS = 300;

      const RECYCLE_SCORE_DIVISOR = 10;
      const recycleBonus = Math.floor(totalRecycledAmount / RECYCLE_SCORE_DIVISOR);

      const tradeBonus = Math.min(
        MAX_TRADE_BONUS,
        Math.floor(totalTradedValue / TRADE_VALUE_SCORE_DIVISOR)
      );

      const economicScore = Math.max(
        0,
        Math.round(
          galbeni + resourceValue + storedResourceValue + buildingValue + tradeBonus + recycleBonus
        )
      );

      return {
        participantId: String(row.participant_id),
        displayName: String(row.display_name),
        economicScore,
        rank: getRankForEconomicScore(economicScore),
        tradesCount,
        totalTradedValue,
        totalRecycledAmount,
      };
    });

    finalRows.sort((a, b) => b.economicScore - a.economicScore);

    const averageEconomicScore =
      finalRows.length === 0
        ? 0
        : Math.round(finalRows.reduce((sum, row) => sum + row.economicScore, 0) / finalRows.length);

    const collectiveResult =
      finalInflation >= INFLATION_LOSS_THRESHOLD ||
      averageEconomicScore < MIN_AVERAGE_ECONOMIC_SCORE
        ? 'loss'
        : 'win';

    for (const row of finalRows) {
      await client.query(
        `
                INSERT INTO player_session_results (
                    session_id,
                    participant_id,
                    economic_score,
                    rank,
                    trades_count,
                    total_traded_value,
                    total_recycled_amount
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (session_id, participant_id)
                DO UPDATE SET
                    economic_score = EXCLUDED.economic_score,
                    rank = EXCLUDED.rank,
                    trades_count = EXCLUDED.trades_count,
                    total_traded_value = EXCLUDED.total_traded_value,
                    total_recycled_amount = EXCLUDED.total_recycled_amount
                `,
        [
          sessionId,
          row.participantId,
          row.economicScore,
          row.rank,
          row.tradesCount,
          row.totalTradedValue,
          row.totalRecycledAmount,
        ]
      );

      await client.query(
        `
                UPDATE player_states
                SET economic_score = $2,
                    updated_at = now()
                WHERE participant_id = $1
                `,
        [row.participantId, row.economicScore]
      );
    }

    await client.query(
      `
            UPDATE game_sessions
            SET final_inflation = $2,
                result = $3::collective_result,
                ended_at = COALESCE(ended_at, now()),
                updated_at = now()
            WHERE id = $1
            `,
      [sessionId, finalInflation, collectiveResult]
    );

    await applyEconomyPressuresAndSaveSnapshot(client, sessionId, 'session_end');

    await client.query('COMMIT');

    return {
      sessionId,
      finalInflation,
      collectiveResult,
      averageEconomicScore,
      results: finalRows,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
