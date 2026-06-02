import { pool } from "../../config/db";
import { AuthenticatedUser } from "../../websocket/ws.types";
import { cancelActiveMarketOffersForParticipant } from "./market.service";

type ConnectionUpdateResult = {
    sessionId: string;
    cancelled: boolean;
    shouldBroadcastLobby: boolean;
    reason?: string;
};

function getSessionIdFromPayload(rawPayload: unknown): string | null {
    if (
        typeof rawPayload !== "object" ||
        rawPayload === null ||
        Array.isArray(rawPayload)
    ) {
        return null;
    }

    const payload = rawPayload as Record<string, unknown>;

    if (typeof payload.sessionId !== "string" || payload.sessionId.trim() === "") {
        return null;
    }

    return payload.sessionId;
}

async function countConnectedHumans(
    queryable: Pick<typeof pool, "query">,
    sessionId: string
): Promise<number> {
    const result = await queryable.query(
        `
        SELECT COUNT(*) AS connected_count
        FROM session_participants
        WHERE session_id = $1
          AND participant_type = 'human'
          AND is_connected = true
        `,
        [sessionId]
    );

    return Number(result.rows[0]?.connected_count ?? 0);
}

async function cancelSession(
    queryable: Pick<typeof pool, "query">,
    sessionId: string,
    reasonIsActiveGame: boolean
): Promise<void> {
    await queryable.query(
        `
        UPDATE game_sessions
        SET status = 'cancelled',
            result = CASE
                WHEN $2 = true THEN 'loss'::collective_result
                ELSE result
            END,
            ended_at = now(),
            updated_at = now()
        WHERE id = $1
        `,
        [sessionId, reasonIsActiveGame]
    );
}

export async function leaveLobby(
    user: AuthenticatedUser,
    rawPayload: unknown
): Promise<ConnectionUpdateResult> {
    const sessionId = getSessionIdFromPayload(rawPayload);

    if (!sessionId) {
        throw new Error("Payload invalid pentru LEAVE_LOBBY.");
    }

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
            throw new Error("Lobby-ul nu există.");
        }

        const session = sessionResult.rows[0];

        if (session.status !== "lobby") {
            throw new Error("Lobby-ul nu mai este activ.");
        }

        const participantResult = await client.query(
            `
            SELECT id, role
            FROM session_participants
            WHERE session_id = $1
              AND user_id = $2
            LIMIT 1
            `,
            [sessionId, user.id]
        );

        if (participantResult.rows.length === 0) {
            throw new Error("Jucătorul nu aparține acestui lobby.");
        }

        const isHost =
            Number(session.host_user_id) === user.id ||
            participantResult.rows[0].role === "host";

        if (isHost) {
            await cancelSession(client, sessionId, false);
            await client.query("COMMIT");

            return {
                sessionId,
                cancelled: true,
                shouldBroadcastLobby: false,
                reason: "Host-ul a închis lobby-ul.",
            };
        }

        await client.query(
            `
            DELETE FROM session_participants
            WHERE session_id = $1
              AND user_id = $2
            `,
            [sessionId, user.id]
        );

        await client.query("COMMIT");

        return {
            sessionId,
            cancelled: false,
            shouldBroadcastLobby: true,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function leaveActiveSession(
    user: AuthenticatedUser,
    rawPayload: unknown
): Promise<ConnectionUpdateResult> {
    const sessionId = getSessionIdFromPayload(rawPayload);

    if (!sessionId) {
        throw new Error("Payload invalid pentru LEAVE_SESSION.");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const sessionResult = await client.query(
            `
            SELECT id, status
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

        if (session.status !== "active") {
            throw new Error("Poți părăsi doar o sesiune activă.");
        }

        const updateResult = await client.query(
            `
            UPDATE session_participants
            SET is_connected = false,
                last_seen_at = now()
            WHERE session_id = $1
              AND user_id = $2
            RETURNING id
            `,
            [sessionId, user.id]
        );

        if (updateResult.rows.length === 0) {
            throw new Error("Jucătorul nu aparține acestei sesiuni.");
        }

        const participantId = String(updateResult.rows[0].id);

        await cancelActiveMarketOffersForParticipant(
            client,
            sessionId,
            participantId
        );

        const connectedHumans = await countConnectedHumans(client, sessionId);

        if (connectedHumans < 2) {
            await cancelSession(client, sessionId, true);
            await client.query("COMMIT");

            return {
                sessionId,
                cancelled: true,
                shouldBroadcastLobby: false,
                reason: "Sesiunea a fost oprită deoarece un jucător a părăsit jocul.",
            };
        }

        await client.query("COMMIT");

        return {
            sessionId,
            cancelled: false,
            shouldBroadcastLobby: false,
            reason: `${user.username} a părăsit sesiunea.`,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function handleSocketDisconnect(
    user: AuthenticatedUser,
    sessionId: string
): Promise<ConnectionUpdateResult | null> {
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
            [sessionId, user.id]
        );

        if (session.status === "lobby") {
            const isHost = Number(session.host_user_id) === user.id;

            if (isHost) {
                await cancelSession(client, sessionId, false);
                await client.query("COMMIT");

                return {
                    sessionId,
                    cancelled: true,
                    shouldBroadcastLobby: false,
                    reason: "Host-ul s-a deconectat. Lobby-ul a fost închis.",
                };
            }

            await client.query("COMMIT");

            return {
                sessionId,
                cancelled: false,
                shouldBroadcastLobby: true,
                reason: `${user.username} s-a deconectat.`,
            };
        }

        if (session.status === "active") {
            const connectedHumans = await countConnectedHumans(client, sessionId);

            if (connectedHumans < 2) {
                await cancelSession(client, sessionId, true);
                await client.query("COMMIT");

                return {
                    sessionId,
                    cancelled: true,
                    shouldBroadcastLobby: false,
                    reason: "Sesiunea a fost oprită deoarece au rămas mai puțin de 2 jucători conectați.",
                };
            }
        }

        await client.query("COMMIT");

        return {
            sessionId,
            cancelled: false,
            shouldBroadcastLobby: false,
            reason: `${user.username} s-a deconectat.`,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}
