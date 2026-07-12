import { AuthenticatedUser } from '../../websocket/ws.types';
import { parseTileActionPayload } from '../../websocket/wsPayloadParsers';
import { pool } from '../../config/db';
import { getParticipantForSession } from './participant.service';
import { BuildingType, ResourceType } from '../game.types';
import { getSessionStateForUser } from './session.service';
import type { TileType } from '../mapGenerator';
import { BUILD_COSTS, BUILDING_BY_TILE, RESOURCE_BY_BUILDING } from '../game.constants';
import { PoolClient } from 'pg';

function getUpgradeCost(
  building: BuildingType,
  currentLevel: number
): Partial<Record<ResourceType, number>> {
  const buildCost = BUILD_COSTS[building];

  if (currentLevel === 1) {
    return Object.fromEntries(
      Object.entries(buildCost).map(([resource, amount]) => [resource, Number(amount) * 2])
    ) as Partial<Record<ResourceType, number>>;
  }

  if (currentLevel === 2) {
    return Object.fromEntries(
      Object.entries(buildCost).map(([resource, amount]) => [resource, Number(amount) * 4])
    ) as Partial<Record<ResourceType, number>>;
  }

  return {};
}

function getCostEntries(
  cost: Partial<Record<ResourceType, number>>
): Array<[ResourceType, number]> {
  return Object.entries(cost) as Array<[ResourceType, number]>;
}

async function getAvailableResourcesForUpdate(
  client: PoolClient,
  participantId: string
): Promise<Record<ResourceType, number>> {
  const resourceResult = await client.query(
    `
            SELECT resource, amount
            FROM player_resources
            WHERE participant_id = $1
                FOR UPDATE
        `,
    [participantId]
  );

  const available: Record<ResourceType, number> = {
    wood: 0,
    stone: 0,
    grain: 0,
  };

  for (const row of resourceResult.rows) {
    const resource = row.resource as ResourceType;

    if (resource === 'wood' || resource === 'stone' || resource === 'grain') {
      available[resource] = Number(row.amount);
    }
  }

  return available;
}

export async function buildBuilding(user: AuthenticatedUser, rawPayload: unknown) {
  const payload = parseTileActionPayload(rawPayload);

  if (!payload) {
    throw new Error('Payload invalid pentru BUILD_BUILDING.');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const participant = await getParticipantForSession(client, user, payload.sessionId);

    const tileResult = await client.query(
      `
            SELECT tile
            FROM player_map_tiles
            WHERE participant_id = $1
              AND tile_x = $2
              AND tile_y = $3
            `,
      [participant.id, payload.x, payload.y]
    );

    if (tileResult.rows.length === 0) {
      throw new Error('Lotul selectat nu există.');
    }

    const tile = tileResult.rows[0].tile as TileType;
    const building = BUILDING_BY_TILE[tile];

    const existingBuildingResult = await client.query(
      `
            SELECT id
            FROM player_buildings
            WHERE participant_id = $1
              AND tile_x = $2
              AND tile_y = $3
            `,
      [participant.id, payload.x, payload.y]
    );

    if (existingBuildingResult.rows.length > 0) {
      throw new Error('Pe acest lot există deja o clădire.');
    }

    const cost = BUILD_COSTS[building];
    const costEntries = getCostEntries(cost);

    const available = await getAvailableResourcesForUpdate(client, participant.id);

    for (const [resource, amount] of costEntries) {
      if (available[resource] < amount) {
        throw new Error(`Resurse insuficiente pentru construire. Lipsește: ${resource}.`);
      }
    }

    for (const [resource, amount] of costEntries) {
      await client.query(
        `
                UPDATE player_resources
                SET amount = amount - $3,
                    updated_at = now()
                WHERE participant_id = $1
                  AND resource = $2
                `,
        [participant.id, resource, amount]
      );
    }

    await client.query(
      `
            INSERT INTO player_buildings (
                session_id,
                participant_id,
                tile_x,
                tile_y,
                tile,
                building,
                level,
                stored_amount
            )
            VALUES ($1, $2, $3, $4, $5, $6, 1, 0)
            `,
      [payload.sessionId, participant.id, payload.x, payload.y, tile, building]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return getSessionStateForUser(user, payload.sessionId);
}

export async function collectBuilding(user: AuthenticatedUser, rawPayload: unknown) {
  const payload = parseTileActionPayload(rawPayload);

  if (!payload) {
    throw new Error('Payload invalid pentru COLLECT_BUILDING.');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const participant = await getParticipantForSession(client, user, payload.sessionId);

    const buildingResult = await client.query(
      `
            SELECT id, building, stored_amount
            FROM player_buildings
            WHERE participant_id = $1
              AND tile_x = $2
              AND tile_y = $3
            FOR UPDATE
            `,
      [participant.id, payload.x, payload.y]
    );

    if (buildingResult.rows.length === 0) {
      throw new Error('Nu există clădire pe acest lot.');
    }

    const existingBuilding = buildingResult.rows[0];
    const building = existingBuilding.building as BuildingType;
    const storedAmount = Number(existingBuilding.stored_amount);

    if (storedAmount <= 0) {
      throw new Error('Clădirea nu are resurse de colectat.');
    }

    const producedResource = RESOURCE_BY_BUILDING[building];

    await client.query(
      `
            UPDATE player_resources
            SET amount = amount + $3,
                updated_at = now()
            WHERE participant_id = $1
              AND resource = $2
            `,
      [participant.id, producedResource, storedAmount]
    );

    await client.query(
      `
            UPDATE player_buildings
            SET stored_amount = 0,
                updated_at = now()
            WHERE id = $1
            `,
      [existingBuilding.id]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return getSessionStateForUser(user, payload.sessionId);
}

export async function upgradeBuilding(user: AuthenticatedUser, rawPayload: unknown) {
  const payload = parseTileActionPayload(rawPayload);

  if (!payload) {
    throw new Error('Payload invalid pentru UPGRADE_BUILDING.');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const participant = await getParticipantForSession(client, user, payload.sessionId);

    const buildingResult = await client.query(
      `
            SELECT id, building, level
            FROM player_buildings
            WHERE participant_id = $1
              AND tile_x = $2
              AND tile_y = $3
            FOR UPDATE
            `,
      [participant.id, payload.x, payload.y]
    );

    if (buildingResult.rows.length === 0) {
      throw new Error('Nu există clădire pe acest lot.');
    }

    const existingBuilding = buildingResult.rows[0];
    const building = existingBuilding.building as BuildingType;
    const currentLevel = Number(existingBuilding.level);

    if (currentLevel >= 3) {
      throw new Error('Clădirea este deja la nivel maxim.');
    }

    const cost = getUpgradeCost(building, currentLevel);
    const costEntries = getCostEntries(cost);

    const available = await getAvailableResourcesForUpdate(client, participant.id);

    for (const [resource, amount] of costEntries) {
      if (available[resource] < amount) {
        throw new Error(`Resurse insuficiente pentru upgrade. Lipsește: ${resource}.`);
      }
    }

    for (const [resource, amount] of costEntries) {
      await client.query(
        `
                UPDATE player_resources
                SET amount = amount - $3,
                    updated_at = now()
                WHERE participant_id = $1
                  AND resource = $2
                `,
        [participant.id, resource, amount]
      );
    }

    await client.query(
      `
            UPDATE player_buildings
            SET level = level + 1,
                updated_at = now()
            WHERE id = $1
            `,
      [existingBuilding.id]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return getSessionStateForUser(user, payload.sessionId);
}
