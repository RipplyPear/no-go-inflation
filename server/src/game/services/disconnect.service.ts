import {pool} from "../../config/db";

export type DisconnectResult = {
    sessionId: string;
    sessionStatus: "lobby" | "active" | "finished" | "cancelled";
    cancelled: boolean;
    reason?: string;
};

export async function handleParticipantDisconnect(
    userId: number,
    sessionId: string
): Promise<DisconnectResult | null> {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const sessionResult = await client.query(
            `
            SELECT id, status, host_user_id
            FROM game_sessions
            WHERE id = $1
            FOR UPDATE
            `,
            [sessionId]
        );

        if (sessionResult.rows.length === 0) {
            await client.query("COMMIT");
            return null;
        }

        const session = sessionResult.rows[0];

        await client.query(
            `
            UPDATE session_participants
            SET is_connected = false,
                last_seen_at = now()
            WHERE session_id = $1
              AND user_id = $2
            `,
            [sessionId, userId]
        );

        if (session.status === "finished" || session.status === "cancelled") {
            await client.query("COMMIT");
            return {
                sessionId,
                sessionStatus: session.status,
                cancelled: false,
            };
        }

        if (session.status === "lobby" && Number(session.host_user_id) === userId) {
            await client.query(
                `
                UPDATE game_sessions
                SET status = 'cancelled',
                    ended_at = now(),
                    updated_at = now()
                WHERE id = $1
                `,
                [sessionId]
            );

            await client.query("COMMIT");

            return {
                sessionId,
                sessionStatus: "cancelled",
                cancelled: true,
                reason: "Host-ul a părăsit lobby-ul.",
            };
        }

        if (session.status === "active") {
            const connectedHumansResult = await client.query(
                `
                SELECT COUNT(*) AS connected_humans
                FROM session_participants
                WHERE session_id = $1
                  AND participant_type = 'human'
                  AND is_connected = true
                `,
                [sessionId]
            );

            const connectedHumans = Number(
                connectedHumansResult.rows[0]?.connected_humans ?? 0
            );

            if (connectedHumans < 2) {
                await client.query(
                    `
                    UPDATE game_sessions
                    SET status = 'cancelled',
                        result = 'loss',
                        ended_at = now(),
                        updated_at = now()
                    WHERE id = $1
                    `,
                    [sessionId]
                );

                await client.query("COMMIT");

                return {
                    sessionId,
                    sessionStatus: "cancelled",
                    cancelled: true,
                    reason: "Sesiunea a fost oprită deoarece au rămas mai puțin de 2 jucători conectați.",
                };
            }
        }

        await client.query("COMMIT");

        return {
            sessionId,
            sessionStatus: session.status,
            cancelled: false,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}
