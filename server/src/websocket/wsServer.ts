import type { IncomingMessage, Server as HttpServer } from "node:http";
import { WebSocket, WebSocketServer, type RawData } from "ws";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";
import { generatePlayerMap } from "../game/mapGenerator";

type AuthenticatedUser = {
    id: number;
    username: string;
    email: string;
};

type AuthenticatedWebSocket = WebSocket & {
    user?: AuthenticatedUser;
};

type ClientMessage = {
    type: string;
    payload?: unknown;
};

function sendJson(ws: WebSocket, type: string, payload: unknown = {}) {
    ws.send(
        JSON.stringify({
            type,
            payload,
        })
    );
}

function getTokenFromRequest(request: IncomingMessage): string | null {
    const host = request.headers.host ?? "localhost";
    const url = new URL(request.url ?? "", `http://${host}`);

    return url.searchParams.get("token");
}

function authenticateRequest(request: IncomingMessage): AuthenticatedUser | null {
    const token = getTokenFromRequest(request);

    if (!token) {
        return null;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        console.error("JWT_SECRET is missing");
        return null;
    }

    try {
        const decoded = jwt.verify(token, secret);

        if (typeof decoded === "string") {
            return null;
        }

        return {
            id: Number(decoded.userId),
            username: String(decoded.username),
            email: String(decoded.email),
        };
    } catch (error) {
        console.error("Invalid WebSocket token:", error);
        return null;
    }
}

function parseClientMessage(rawMessage: RawData): ClientMessage | null {
    try {
        const text = rawMessage.toString();
        const parsed = JSON.parse(text);

        if (typeof parsed !== "object" || parsed === null) {
            return null;
        }

        if (typeof parsed.type !== "string") {
            return null;
        }

        return parsed as ClientMessage;
    } catch {
        return null;
    }
}

async function createDemoSession(user: AuthenticatedUser) {
    const client = await pool.connect();

    const lobbyCode = Math.random().toString(36).slice(2, 8).toUpperCase();

    const demoMap = generatePlayerMap();

    try {
        await client.query("BEGIN");

        const sessionResult = await client.query(
            `
            INSERT INTO game_sessions (
                host_user_id,
                lobby_code,
                is_private,
                status,
                started_at
            )
            VALUES ($1, $2, false, 'active', now())
            RETURNING id, lobby_code, status, current_day, current_minute
            `,
            [user.id, lobbyCode]
        );

        const session = sessionResult.rows[0];

        const participantResult = await client.query(
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
            VALUES ($1, $2, 'human', 'host', $3, true, true)
            RETURNING id, display_name, role
            `,
            [session.id, user.id, user.username]
        );

        const participant = participantResult.rows[0];

        await client.query(
            `
            INSERT INTO player_states (
                session_id,
                participant_id,
                galbeni,
                economic_score,
                total_recycled_amount
            )
            VALUES ($1, $2, 100, 0, 0)
            `,
            [session.id, participant.id]
        );

        for (const resource of ["wood", "stone", "grain"]) {
            await client.query(
                `
                INSERT INTO player_resources (
                    participant_id,
                    resource,
                    amount
                )
                VALUES ($1, $2, 50)
                `,
                [participant.id, resource]
            );
        }

        for (let y = 0; y < demoMap.tiles.length; y++) {
            for (let x = 0; x < demoMap.tiles[y].length; x++) {
                await client.query(
                    `
            INSERT INTO player_map_tiles (
                participant_id,
                tile_x,
                tile_y,
                tile
            )
            VALUES ($1, $2, $3, $4)
            `,
                    [participant.id, x, y, demoMap.tiles[y][x]]
                );
            }
        }

        await client.query(
            `
            INSERT INTO session_economy_state (
                session_id,
                inflation,
                wood_avg_price,
                stone_avg_price,
                grain_avg_price
            )
            VALUES ($1, 20, 1.00, 1.00, 1.00)
            `,
            [session.id]
        );

        await client.query("COMMIT");

        return {
            sessionId: session.id,
            lobbyCode: session.lobby_code,
            status: session.status,
            currentDay: session.current_day,
            currentMinute: session.current_minute,
            participant: {
                id: participant.id,
                displayName: participant.display_name,
                role: participant.role,
            },
            resources: {
                wood: 50,
                stone: 50,
                grain: 50,
                galbeni: 100,
            },
            economy: {
                inflation: 20,
                averagePrices: {
                    wood: 1,
                    stone: 1,
                    grain: 1,
                },
            },
            map: demoMap,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function handleClientMessage(ws: AuthenticatedWebSocket, message: ClientMessage) {
    switch (message.type) {
        case "PING": {
            sendJson(ws, "PONG", {
                receivedAt: new Date().toISOString(),
                user: ws.user,
            });
            break;
        }

        case "CREATE_DEMO_SESSION": {
            if (!ws.user) {
                sendJson(ws, "ERROR", {
                    message: "User not authenticated.",
                });
                return;
            }

            const sessionState = await createDemoSession(ws.user);

            sendJson(ws, "SESSION_STATE", sessionState);
            break;
        }

        default: {
            sendJson(ws, "ERROR", {
                message: `Unknown message type: ${message.type}`,
            });
            break;
        }
    }
}

export function setupWebSocketServer(server: HttpServer) {
    const wss = new WebSocketServer({
        server,
        path: "/ws",
    });

    wss.on("connection", (socket, request) => {
        const ws = socket as AuthenticatedWebSocket;
        const user = authenticateRequest(request);

        if (!user) {
            sendJson(ws, "ERROR", {
                message: "Unauthorized WebSocket connection",
            });

            ws.close(1008, "Unauthorized");
            return;
        }

        ws.user = user;

        console.log(`WebSocket connected: ${user.username} (${user.id})`);

        sendJson(ws, "AUTHENTICATED", {
            user,
            message: "WebSocket connection established",
        });

        ws.on("message", (rawMessage) => {
            const message = parseClientMessage(rawMessage);

            if (!message) {
                sendJson(ws, "ERROR", {
                    message: "Invalid JSON message",
                });
                return;
            }

            handleClientMessage(ws, message).catch((error) => {
                console.error("WebSocket message handling failed:", error);

                sendJson(ws, "ERROR", {
                    message: "Server error while handling WebSocket message.",
                });
            });
        });

        ws.on("close", () => {
            console.log(`WebSocket disconnected: ${user.username} (${user.id})`);
        });

        ws.on("error", (error) => {
            console.error("WebSocket error:", error);
        });
    });

    console.log("WebSocket server mounted on /ws");

    return wss;
}