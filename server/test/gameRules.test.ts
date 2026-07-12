import assert from 'node:assert/strict';
import test from 'node:test';

import { clampNumber, getAveragePriceColumn, getRankForEconomicScore } from '../src/game/gameRules';

test('assigns ranks at their exact score boundaries', () => {
  assert.equal(getRankForEconomicScore(4499), 'A');
  assert.equal(getRankForEconomicScore(4500), 'S');
  assert.equal(getRankForEconomicScore(3600), 'A');
  assert.equal(getRankForEconomicScore(3200), 'B');
  assert.equal(getRankForEconomicScore(2500), 'C');
  assert.equal(getRankForEconomicScore(2499), 'D');
});

test('clamps numbers to the provided range', () => {
  assert.equal(clampNumber(-5, 0, 10), 0);
  assert.equal(clampNumber(5, 0, 10), 5);
  assert.equal(clampNumber(15, 0, 10), 10);
});

test('maps resources to their average price columns', () => {
  assert.equal(getAveragePriceColumn('wood'), 'wood_avg_price');
  assert.equal(getAveragePriceColumn('stone'), 'stone_avg_price');
  assert.equal(getAveragePriceColumn('grain'), 'grain_avg_price');
});
