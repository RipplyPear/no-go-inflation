import { WebSocket } from 'ws';
import type { AuthenticatedWebSocket } from './ws.types';

const connectedClients = new Set<AuthenticatedWebSocket>();
/* A bit of a blind spot here
 * La deconectarile anormale, nu se elimina din set conexiunea inchisa,
 * Protejam prin `ws.readyState === WebSocket.OPEN` dar ideal
 * ar fi un mecanism de tipul heartbeat cu ping/pong*/

export function addClient(ws: AuthenticatedWebSocket): void {
  connectedClients.add(ws);
}

export function removeClient(ws: AuthenticatedWebSocket): void {
  connectedClients.delete(ws);
}

export function getConnectedClients(): AuthenticatedWebSocket[] {
  return [...connectedClients];
}

export function getClientsInSession(sessionId: string): AuthenticatedWebSocket[] {
  return [...connectedClients].filter(
    (ws) => ws.readyState === WebSocket.OPEN && !!ws.user && ws.currentSessionId === sessionId
  );
}

export function hasActiveClientForUser(userId: number): boolean {
  return [...connectedClients].some(
    (ws) => ws.readyState === WebSocket.OPEN && ws.user?.id === userId
  );
}
