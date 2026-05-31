import type {Server as HttpServer} from "node:http";
import {WebSocketServer} from "ws";

import {AuthenticatedWebSocket} from "./ws.types";
import {parseClientMessage, sendJson} from "./wsProtocol";
import {authenticateRequest} from "./wsAuth";
import {addClient, removeClient,} from "./wsClients";
import {startGameLoop} from "./wsGameLoop";
import {handleClientMessage} from "./wsMessageHandler";

export function setupWebSocketServer(server: HttpServer) {
    const wss = new WebSocketServer({
        server,
        path: "/ws",
    });

    startGameLoop();

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

        addClient(ws);

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
            removeClient(ws);
        });

        ws.on("error", (error) => {
            console.error("WebSocket error:", error);
        });
    });

    console.log("WebSocket server mounted on /ws");

    return wss;
}