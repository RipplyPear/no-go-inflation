export type TileType = 'field' | 'quarry' | 'forest';

export type GeneratedMap = {
  width: number;
  height: number;
  tiles: TileType[][];
};

type MapCenter = {
  type: TileType;
  x: number;
  y: number;
};

const TILE_TYPES: TileType[] = ['field', 'quarry', 'forest'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function distanceSquared(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;

  return dx * dx + dy * dy;
}

function countTiles(tiles: TileType[][]): Record<TileType, number> {
  const counts: Record<TileType, number> = {
    field: 0,
    quarry: 0,
    forest: 0,
  };

  for (const row of tiles) {
    for (const tile of row) {
      counts[tile]++;
    }
  }

  return counts;
}

function ensureMinimumTileCounts(tiles: TileType[][], centers: MapCenter[], minCount: number) {
  const height = tiles.length;
  const width = tiles[0]?.length ?? 0;

  for (const center of centers) {
    const counts = countTiles(tiles);
    const currentCount = counts[center.type];

    if (currentCount >= minCount) {
      continue;
    }

    const needed = minCount - currentCount;

    const candidates: Array<{
      x: number;
      y: number;
      distance: number;
    }> = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (tiles[y][x] === center.type) {
          continue;
        }

        candidates.push({
          x,
          y,
          distance: distanceSquared(x, y, center.x, center.y),
        });
      }
    }

    candidates.sort((a, b) => a.distance - b.distance);

    for (let i = 0; i < needed && i < candidates.length; i++) {
      const cell = candidates[i];
      tiles[cell.y][cell.x] = center.type;
    }
  }
}

export function generatePlayerMap(width = 10, height = 8): GeneratedMap {
  const shuffledTypes = shuffle(TILE_TYPES);

  const centers: MapCenter[] = [
    {
      type: shuffledTypes[0],
      x: randomInt(1, Math.max(1, Math.floor(width * 0.3))),
      y: randomInt(1, Math.max(1, height - 2)),
    },
    {
      type: shuffledTypes[1],
      x: randomInt(Math.floor(width * 0.35), Math.max(1, Math.floor(width * 0.65))),
      y: randomInt(1, Math.max(1, height - 2)),
    },
    {
      type: shuffledTypes[2],
      x: randomInt(Math.floor(width * 0.7), Math.max(1, width - 2)),
      y: randomInt(1, Math.max(1, height - 2)),
    },
  ];

  const tiles: TileType[][] = [];

  for (let y = 0; y < height; y++) {
    const row: TileType[] = [];

    for (let x = 0; x < width; x++) {
      let bestCenter = centers[0];
      let bestScore = Number.POSITIVE_INFINITY;

      for (const center of centers) {
        const noise = Math.random() * 4;
        const score = distanceSquared(x, y, center.x, center.y) + noise;

        if (score < bestScore) {
          bestScore = score;
          bestCenter = center;
        }
      }

      row.push(bestCenter.type);
    }

    tiles.push(row);
  }

  const minCountPerType = Math.max(6, Math.floor(width * height * 0.12));
  ensureMinimumTileCounts(tiles, centers, minCountPerType);

  return {
    width,
    height,
    tiles,
  };
}
