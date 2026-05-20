import type { IncomingMessage, Server as HttpServer } from "node:http";
import { WebSocket, WebSocketServer, type RawData } from "ws";
import jwt from "jsonwebtoken";

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

function handleClientMessage(ws: AuthenticatedWebSocket, message: ClientMessage) {
    switch (message.type) {
        case "PING": {
            sendJson(ws, "PONG", {
                receivedAt: new Date().toISOString(),
                user: ws.user,
            });
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

            handleClientMessage(ws, message);
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