import { GAME_MINUTES_PER_TICK, GAME_TICK_REAL_SECONDS } from '../game/game.constants';
import { getConnectedClients } from './wsClients';
import { WebSocket } from 'ws';
import { advanceSessionTime } from '../game/services/sessionTime.service';
import { finalizeSessionIfNeeded } from '../game/services/finalResults.service';
import { getSessionStateForUser } from '../game/services/session.service';
import { sendJson } from './wsProtocol';
import { maybeApplyPeriodicEconomyUpdate } from '../game/services/economy.service';

let gameLoopStarted = false;

export function startGameLoop(): void {
  if (gameLoopStarted) {
    return;
  }

  gameLoopStarted = true;

  setInterval(() => {
    void processGameLoopTick(GAME_MINUTES_PER_TICK);
  }, GAME_TICK_REAL_SECONDS * 1000);
}

async function processGameLoopTick(gameMinutesToAdvance: number): Promise<void> {
  const sessionIds = new Set<string>();

  for (const ws of getConnectedClients()) {
    if (ws.readyState === WebSocket.OPEN && ws.user && ws.currentSessionId) {
      sessionIds.add(ws.currentSessionId);
    }
  }

  for (const sessionId of sessionIds) {
    try {
      const sessionWasUpdated = await advanceSessionTime(sessionId, gameMinutesToAdvance);

      if (!sessionWasUpdated) {
        continue;
      }

      await maybeApplyPeriodicEconomyUpdate(sessionId);

      const finalResult = await finalizeSessionIfNeeded(sessionId);

      for (const ws of getConnectedClients()) {
        if (ws.readyState !== WebSocket.OPEN || !ws.user || ws.currentSessionId !== sessionId) {
          continue;
        }

        const sessionState = await getSessionStateForUser(ws.user, sessionId);

        sendJson(ws, 'SESSION_STATE', sessionState);
        if (finalResult) {
          sendJson(ws, 'GAME_FINISHED', finalResult);
        }
      }
    } catch (error) {
      console.error('Game loop tick failed:', error);
    }
  }
}
