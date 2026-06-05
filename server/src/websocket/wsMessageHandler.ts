import {AuthenticatedWebSocket, ClientMessage} from "./ws.types";
import {isRecord, sendJson} from "./wsProtocol";
import {requireWsUser} from "./wsAuth";
import {createDemoSession, createLobby, joinLobby, startLobbySession} from "../game/services/session.service";
import { leaveActiveSession, leaveLobby } from "../game/services/connection.service";
import {buildBuilding, collectBuilding, upgradeBuilding} from "../game/services/building.service";
import {
    acceptMarketOffer,
    cancelMarketOffer,
    createMarketOffer,
    getMarketStateForUser
} from "../game/services/market.service";
import {
    broadcastLobbyStateToSession,
    broadcastMarketStateToSession,
    broadcastSessionCancelled,
    broadcastSessionStateToSession
} from "./wsBroadcast";
import {forceFinishSessionForTesting, seedBotOfferForTesting} from "../game/services/dev.service";
import {getConnectedClients} from "./wsClients";
import {recycleResource} from "../game/services/recycle.service";
import {WebSocket} from "ws";

export async function handleClientMessage(ws: AuthenticatedWebSocket, message: ClientMessage) {
    switch (message.type) {
        case "PING": {
            sendJson(ws, "PONG", {
                receivedAt: new Date().toISOString(),
                user: ws.user,
            });
            break;
        }

        case "CREATE_LOBBY": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            try {
                const lobbyState = await createLobby(user);
                ws.currentSessionId = lobbyState.sessionId;

                sendJson(ws, "LOBBY_STATE", lobbyState);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error
                        ? error.message
                        : "Nu s-a putut crea lobby-ul.",
                });
            }

            break;
        }

        case "JOIN_LOBBY": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            try {
                const lobbyState = await joinLobby(user, message.payload);
                ws.currentSessionId = lobbyState.sessionId;

                await broadcastLobbyStateToSession(lobbyState.sessionId);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error
                        ? error.message
                        : "Nu s-a putut realiza alăturarea la lobby.",
                });
            }

            break;
        }

        case "LEAVE_LOBBY": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            try {
                const result = await leaveLobby(user, message.payload);

                ws.currentSessionId = undefined;

                if (result.cancelled) {
                    broadcastSessionCancelled(
                        result.sessionId,
                        result.reason ?? "Lobby-ul a fost închis."
                    );
                } else if (result.shouldBroadcastLobby) {
                    await broadcastLobbyStateToSession(result.sessionId);
                }
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error
                        ? error.message
                        : "Nu s-a putut părăsi lobby-ul.",
                });
            }

            break;
        }

        case "LEAVE_SESSION": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            try {
                const result = await leaveActiveSession(user, message.payload);

                ws.currentSessionId = undefined;

                sendJson(ws, "SESSION_LEFT", {
                    sessionId: result.sessionId,
                });

                if (result.cancelled) {
                    broadcastSessionCancelled(
                        result.sessionId,
                        result.reason ?? "Sesiunea a fost oprită."
                    );
                } else {
                    await broadcastSessionStateToSession(result.sessionId);
                    await broadcastMarketStateToSession(result.sessionId);
                }
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error
                        ? error.message
                        : "Nu s-a putut părăsi sesiunea.",
                });
            }

            break;
        }

        case "START_SESSION": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            try {
                const result = await startLobbySession(user, message.payload);
                ws.currentSessionId = result.sessionId;

                await broadcastSessionStateToSession(result.sessionId);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error
                        ? error.message
                        : "Nu s-a putut porni sesiunea.",
                });
            }

            break;
        }

        case "CREATE_DEMO_SESSION": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            try {
                const sessionState = await createDemoSession(user);
                ws.currentSessionId = sessionState.sessionId;

                sendJson(ws, "SESSION_STATE", sessionState);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error
                        ? error.message
                        : "Could not create demo session.",
                });
            }

            break;
        }

        case "BUILD_BUILDING": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            try {
                const sessionState = await buildBuilding(user, message.payload);
                sendJson(ws, "SESSION_STATE", sessionState);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error ? error.message : "Construirea a eșuat.",
                });
            }

            break;
        }

        case "UPGRADE_BUILDING": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            try {
                const sessionState = await upgradeBuilding(user, message.payload);
                sendJson(ws, "SESSION_STATE", sessionState);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error ? error.message : "Upgrade-ul a eșuat.",
                });
            }

            break;
        }

        case "COLLECT_BUILDING": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            try {
                const sessionState = await collectBuilding(user, message.payload);
                sendJson(ws, "SESSION_STATE", sessionState);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error ? error.message : "Colectarea a eșuat.",
                });
            }

            break;
        }

        case "RECYCLE_RESOURCE": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            try {
                const result = await recycleResource(user, message.payload);
                ws.currentSessionId = result.sessionId;

                sendJson(ws, "RESOURCE_RECYCLED", {
                    resource: result.resource,
                    quantity: result.quantity,
                    galbeniGained: result.galbeniGained,
                    inflationReduction: result.inflationReduction,
                    inflationIncrease: result.inflationIncrease,
                    recyclePressure: result.recyclePressure,
                });

                await broadcastSessionStateToSession(result.sessionId);
                await broadcastMarketStateToSession(result.sessionId);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error
                        ? error.message
                        : "Reciclarea a eșuat.",
                });
            }

            break;
        }

        case "GET_MARKET_STATE": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            const payload = message.payload;

            if (!isRecord(payload) || typeof payload.sessionId !== "string") {
                sendJson(ws, "ERROR", {
                    message: "Payload invalid pentru GET_MARKET_STATE.",
                });
                return;
            }

            try {
                ws.currentSessionId = payload.sessionId;

                const marketState = await getMarketStateForUser(
                    user,
                    payload.sessionId
                );

                sendJson(ws, "MARKET_STATE", marketState);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error
                        ? error.message
                        : "Nu s-a putut încărca piața.",
                });
            }

            break;
        }

        case "CREATE_MARKET_OFFER": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            try {
                const result = await createMarketOffer(user, message.payload);
                ws.currentSessionId = result.sessionId;

                sendJson(ws, "OFFER_CREATED", result.offer);
                await broadcastMarketStateToSession(result.sessionId);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error
                        ? error.message
                        : "Crearea ofertei a eșuat.",
                });
            }

            break;
        }

        case "ACCEPT_MARKET_OFFER": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            try {
                const result = await acceptMarketOffer(user, message.payload);
                ws.currentSessionId = result.sessionId;

                sendJson(ws, "TRADE_COMPLETED", result.transaction);

                await broadcastSessionStateToSession(result.sessionId);
                await broadcastMarketStateToSession(result.sessionId);
            } catch (error) {
                const payload = isRecord(message.payload) ? message.payload : {};
                const offerId = typeof payload.offerId === "string"
                    ? payload.offerId
                    : undefined;

                sendJson(ws, "ERROR", {
                    context: "ACCEPT_MARKET_OFFER",
                    offerId,
                    message: error instanceof Error
                        ? error.message
                        : "Acceptarea ofertei a eșuat.",
                });
            }

            break;
        }

        case "CANCEL_MARKET_OFFER": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            try {
                const result = await cancelMarketOffer(user, message.payload);

                sendJson(ws, "OFFER_CANCELLED", {
                    offerId: result.offerId,
                    message: "Oferta a fost retrasă.",
                });

                await broadcastMarketStateToSession(result.sessionId);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error
                        ? error.message
                        : "Nu s-a putut retrage oferta.",
                });
            }

            break;
        }

        case "DEV_SEED_BOT_OFFER": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            if (process.env.NODE_ENV === "production") {
                sendJson(ws, "ERROR", {
                    message: "Comenzile DEV nu sunt disponibile în production.",
                });
                return;
            }

            try {
                const result = await seedBotOfferForTesting(user, message.payload);
                ws.currentSessionId = result.sessionId;

                sendJson(ws, "DEV_BOT_OFFER_CREATED", result.offer);

                await broadcastSessionStateToSession(result.sessionId);
                await broadcastMarketStateToSession(result.sessionId);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error
                        ? error.message
                        : "Nu s-a putut crea oferta de test.",
                });
            }

            break;
        }

        case "DEV_FORCE_FINISH_SESSION": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            if (process.env.NODE_ENV === "production") {
                sendJson(ws, "ERROR", {
                    message: "Comenzile DEV nu sunt disponibile în production.",
                });
                return;
            }

            try {
                const finalResult = await forceFinishSessionForTesting(
                    user,
                    message.payload
                );

                await broadcastSessionStateToSession(finalResult.sessionId);

                for (const client of getConnectedClients()) {
                    if (
                        client.readyState !== WebSocket.OPEN ||
                        !client.user ||
                        client.currentSessionId !== finalResult.sessionId
                    ) {
                        continue;
                    }

                    sendJson(client, "GAME_FINISHED", finalResult);
                }
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error
                        ? error.message
                        : "Nu s-a putut finaliza sesiunea.",
                });
            }

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