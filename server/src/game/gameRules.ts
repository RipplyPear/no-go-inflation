import type { ResourceType } from './game.types';

export function getRankForEconomicScore(score: number): string {
  if (score >= 4500) return 'S';
  if (score >= 3600) return 'A';
  if (score >= 3200) return 'B';
  if (score >= 2500) return 'C';
  return 'D';
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getAveragePriceColumn(resource: ResourceType): string {
  switch (resource) {
    case 'wood':
      return 'wood_avg_price';
    case 'stone':
      return 'stone_avg_price';
    case 'grain':
      return 'grain_avg_price';
  }
}
