import assert from 'node:assert/strict';
import test from 'node:test';

import { generatePlayerMap, type TileType } from '../src/game/mapGenerator';

const VALID_TILE_TYPES = new Set<TileType>(['field', 'quarry', 'forest']);

test('generates a map with the requested dimensions and valid tiles', () => {
  const map = generatePlayerMap(12, 9);

  assert.equal(map.width, 12);
  assert.equal(map.height, 9);
  assert.equal(map.tiles.length, 9);

  for (const row of map.tiles) {
    assert.equal(row.length, 12);

    for (const tile of row) {
      assert.ok(VALID_TILE_TYPES.has(tile));
    }
  }
});

test('ensures every terrain type has the minimum representation', () => {
  for (let iteration = 0; iteration < 25; iteration += 1) {
    const map = generatePlayerMap();
    const counts: Record<TileType, number> = {
      field: 0,
      quarry: 0,
      forest: 0,
    };

    for (const row of map.tiles) {
      for (const tile of row) {
        counts[tile] += 1;
      }
    }

    const minimumCount = Math.max(6, Math.floor(map.width * map.height * 0.12));

    for (const count of Object.values(counts)) {
      assert.ok(count >= minimumCount);
    }
  }
});
