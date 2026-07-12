import { pool } from '../../config/db';
import { DAY_END_MINUTE, DAY_START_MINUTE, FINAL_DAY } from '../game.constants';

export async function advanceSessionTime(
  sessionId: string,
  gameMinutesToAdvance: number
): Promise<boolean> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const sessionResult = await client.query(
      `
                SELECT current_day, current_minute, status
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

    if (session.status !== 'active') {
      await client.query('COMMIT');
      return false;
    }

    const currentDay = Number(session.current_day);
    const currentMinute = Number(session.current_minute);

    let nextDay = currentDay;
    let nextMinute: number;
    let nextStatus = 'active';
    let productionMinutes = 0;

    if (currentMinute >= DAY_END_MINUTE) {
      if (currentDay >= FINAL_DAY) {
        nextDay = FINAL_DAY;
        nextMinute = DAY_END_MINUTE;
        nextStatus = 'finished';
      } else {
        nextDay = currentDay + 1;
        nextMinute = DAY_START_MINUTE;
      }
    } else {
      productionMinutes = Math.min(gameMinutesToAdvance, DAY_END_MINUTE - currentMinute);

      nextMinute = currentMinute + productionMinutes;

      if (nextMinute >= DAY_END_MINUTE) {
        nextMinute = DAY_END_MINUTE;

        if (currentDay >= FINAL_DAY) {
          nextStatus = 'finished';
        }
      }
    }

    await client.query(
      `
                UPDATE game_sessions
                SET current_day = $2,
                    current_minute = $3,
                    status = $4::session_status,
                    ended_at = CASE
                                   WHEN $4::session_status = 'finished'::session_status
                                       THEN COALESCE(ended_at, now())
                                   ELSE ended_at
                        END,
                    updated_at = now()
                WHERE id = $1
            `,
      [sessionId, nextDay, nextMinute, nextStatus]
    );

    if (productionMinutes > 0) {
      await client.query(
        `
                UPDATE player_buildings
                SET stored_amount = LEAST(
                        stored_amount + (level * $2),
                        level * 60
                    ),
                    updated_at = now()
                WHERE session_id = $1
                  AND stored_amount < level * 60
                `,
        [sessionId, productionMinutes]
      );
    }

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
