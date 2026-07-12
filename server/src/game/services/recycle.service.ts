import { pool } from '../../config/db';
import { AuthenticatedUser } from '../../websocket/ws.types';
import { parseRecycleResourcePayload } from '../../websocket/wsPayloadParsers';
import { getParticipantForSession } from './participant.service';
import { getSessionStateForUser } from './session.service';
import { ResourceType } from '../game.types';
import { applyEconomyPressuresAndSaveSnapshot } from './economy.service';

const RESOURCES_PER_GALBEN = 2;
const MIN_RECYCLE_QUANTITY = 2;
const RESOURCES_PER_INFLATION_POINT = 50;
const MAX_MODERATE_RECYCLE_REDUCTION = 3;

const MODERATE_RECYCLE_MAX_QUANTITY = 150;
const EXCESSIVE_RECYCLE_START_QUANTITY = 200;
const MAX_EXCESSIVE_RECYCLE_PRESSURE = 5;

function calculateRecyclePressure(quantity: number): number {
  if (quantity <= MODERATE_RECYCLE_MAX_QUANTITY) {
    const reduction = Math.min(
      MAX_MODERATE_RECYCLE_REDUCTION,
      Math.floor(quantity / RESOURCES_PER_INFLATION_POINT)
    );

    return -reduction;
  }

  if (quantity <= EXCESSIVE_RECYCLE_START_QUANTITY) {
    return 0;
  }

  const excessiveQuantity = quantity - EXCESSIVE_RECYCLE_START_QUANTITY;

  return Math.min(
    MAX_EXCESSIVE_RECYCLE_PRESSURE,
    Math.ceil(excessiveQuantity / RESOURCES_PER_INFLATION_POINT)
  );
}

export async function recycleResource(user: AuthenticatedUser, rawPayload: unknown) {
  const payload = parseRecycleResourcePayload(rawPayload);

  if (!payload) {
    throw new Error('Payload invalid pentru RECYCLE_RESOURCE.');
  }

  if (payload.quantity < MIN_RECYCLE_QUANTITY) {
    throw new Error(`Cantitatea minimă pentru reciclare este ${MIN_RECYCLE_QUANTITY}.`);
  }

  const galbeniGained = Math.floor(payload.quantity / RESOURCES_PER_GALBEN);

  if (galbeniGained <= 0) {
    throw new Error('Cantitatea reciclată este prea mică pentru a primi galbeni.');
  }

  const recyclePressure = calculateRecyclePressure(payload.quantity);
  const inflationReduction = Math.max(0, -recyclePressure);
  const inflationIncrease = Math.max(0, recyclePressure);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const participant = await getParticipantForSession(client, user, payload.sessionId);

    const sessionResult = await client.query(
      `
            SELECT status
            FROM game_sessions
            WHERE id = $1
            FOR UPDATE
            `,
      [payload.sessionId]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error('Sesiunea nu există.');
    }

    if (sessionResult.rows[0].status !== 'active') {
      throw new Error('Reciclarea este disponibilă doar într-o sesiune activă.');
    }

    const resourceResult = await client.query(
      `
            SELECT amount
            FROM player_resources
            WHERE participant_id = $1
              AND resource = $2
            FOR UPDATE
            `,
      [participant.id, payload.resource]
    );

    const availableAmount = Number(resourceResult.rows[0]?.amount ?? 0);

    if (availableAmount < payload.quantity) {
      throw new Error('Nu ai suficiente resurse pentru reciclare.');
    }

    await client.query(
      `
            UPDATE player_resources
            SET amount = amount - $3,
                updated_at = now()
            WHERE participant_id = $1
              AND resource = $2
            `,
      [participant.id, payload.resource, payload.quantity]
    );

    await client.query(
      `
            UPDATE player_states
            SET galbeni = galbeni + $2,
                total_recycled_amount = total_recycled_amount + $3,
                updated_at = now()
            WHERE participant_id = $1
            `,
      [participant.id, galbeniGained, payload.quantity]
    );

    await applyEconomyPressuresAndSaveSnapshot(client, payload.sessionId, 'recycle', {
      recyclePressure,
    });

    await client.query('COMMIT');

    return {
      sessionId: payload.sessionId,
      resource: payload.resource as ResourceType,
      quantity: payload.quantity,
      galbeniGained,
      inflationReduction,
      inflationIncrease,
      recyclePressure,
      sessionState: await getSessionStateForUser(user, payload.sessionId),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
