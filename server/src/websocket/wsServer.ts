import type { Server as HttpServer } from 'node:http';
import { WebSocketServer } from 'ws';

import { AuthenticatedWebSocket } from './ws.types';
import { parseClientMessage, sendJson } from './wsProtocol';
import { authenticateRequest } from './wsAuth';
import { addClient, hasActiveClientForUser, removeClient } from './wsClients';
import { startGameLoop } from './wsGameLoop';
import { handleClientMessage } from './wsMessageHandler';
import { handleSocketDisconnect } from '../game/services/connection.service';
import {
  broadcastLobbyStateToSession,
  broadcastSessionCancelled,
  broadcastSessionStateToSession,
  broadcastMarketStateToSession,
} from './wsBroadcast';

export function setupWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
  });

  startGameLoop();

  wss.on('connection', (socket, request) => {
    const ws = socket as AuthenticatedWebSocket;
    const user = authenticateRequest(request);

    if (!user) {
      sendJson(ws, 'ERROR', {
        message: 'Conexiune WebSocket neautorizată.',
      });

      ws.close(1008, 'Unauthorized');
      return;
    }

    ws.user = user;

    if (hasActiveClientForUser(user.id)) {
      console.log(`Rejected duplicate WebSocket connection for ${user.username} (${user.id})`);

      sendJson(ws, 'ERROR', {
        code: 'USER_ALREADY_CONNECTED',
        message: 'Acest utilizator este deja conectat.',
      });

      setTimeout(() => {
        ws.close(1008, 'USER_ALREADY_CONNECTED');
      }, 50);

      return;
    }

    addClient(ws);

    console.log(`WebSocket connected: ${user.username} (${user.id})`);

    sendJson(ws, 'AUTHENTICATED', {
      user,
      message: 'Conexiune WebSocket stabilită.',
    });

    ws.on('message', (rawMessage) => {
      const message = parseClientMessage(rawMessage);

      if (!message) {
        sendJson(ws, 'ERROR', {
          message: 'Mesaj JSON invalid.',
        });
        return;
      }

      handleClientMessage(ws, message).catch((error) => {
        console.error('WebSocket message handling failed:', error);

        sendJson(ws, 'ERROR', {
          message: 'Eroare server la procesarea mesajului WebSocket.',
        });
      });
    });

    ws.on('close', (code, reasonBuffer) => {
      const reason = reasonBuffer.toString();

      console.log(
        `WebSocket disconnected: ${user.username} (${user.id}) code=${code} reason=${reason}`
      );

      const sessionId = ws.currentSessionId;
      removeClient(ws);

      if (!sessionId) {
        return;
      }

      handleSocketDisconnect(user, sessionId)
        .then(async (result) => {
          if (!result) {
            return;
          }

          if (result.cancelled) {
            broadcastSessionCancelled(
              result.sessionId,
              result.reason ?? 'Sesiunea a fost anulată.'
            );
            return;
          }

          if (result.shouldBroadcastLobby) {
            await broadcastLobbyStateToSession(result.sessionId);
            return;
          }

          await broadcastSessionStateToSession(result.sessionId);
          await broadcastMarketStateToSession(result.sessionId);
        })
        .catch((error) => {
          console.error('Failed to handle WebSocket disconnect:', error);
        });
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('WebSocket server mounted on /ws');

  return wss;
}
