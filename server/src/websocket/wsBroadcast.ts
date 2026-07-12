import { getClientsInSession } from './wsClients';
import { getMarketStateForUser } from '../game/services/market.service';
import { sendJson } from './wsProtocol';
import { getLobbyStateForUser, getSessionStateForUser } from '../game/services/session.service';

export async function broadcastMarketStateToSession(sessionId: string): Promise<void> {
  for (const client of getClientsInSession(sessionId)) {
    if (!client.user) {
      continue;
    }

    const marketState = await getMarketStateForUser(client.user, sessionId);
    sendJson(client, 'MARKET_STATE', marketState);
  }
}

export async function broadcastSessionStateToSession(sessionId: string): Promise<void> {
  for (const client of getClientsInSession(sessionId)) {
    if (!client.user) {
      continue;
    }

    const sessionState = await getSessionStateForUser(client.user, sessionId);
    sendJson(client, 'SESSION_STATE', sessionState);
  }
}

export async function broadcastLobbyStateToSession(sessionId: string): Promise<void> {
  for (const client of getClientsInSession(sessionId)) {
    if (!client.user) {
      continue;
    }

    const lobbyState = await getLobbyStateForUser(client.user, sessionId);
    sendJson(client, 'LOBBY_STATE', lobbyState);
  }
}

export function broadcastSessionCancelled(sessionId: string, reason: string): void {
  for (const client of getClientsInSession(sessionId)) {
    sendJson(client, 'SESSION_CANCELLED', {
      sessionId,
      reason,
    });
  }
}
