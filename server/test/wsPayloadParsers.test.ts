import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseAcceptMarketOfferPayload,
  parseCancelMarketOfferPayload,
  parseCreateMarketOfferPayload,
  parseDevSeedBotOfferPayload,
  parseJoinLobbyPayload,
  parseRecycleResourcePayload,
  parseStartSessionPayload,
  parseTileActionPayload,
} from '../src/websocket/wsPayloadParsers';

test('parses valid tile actions', () => {
  assert.deepEqual(parseTileActionPayload({ sessionId: 'session-1', x: 2, y: 3 }), {
    sessionId: 'session-1',
    x: 2,
    y: 3,
  });
});

test('rejects tile actions with non-integer coordinates', () => {
  assert.equal(parseTileActionPayload({ sessionId: 'session-1', x: 2.5, y: 3 }), null);
});

test('parses valid market offers', () => {
  assert.deepEqual(
    parseCreateMarketOfferPayload({
      sessionId: 'session-1',
      offerType: 'sell',
      resource: 'wood',
      quantity: 10,
      pricePerUnit: 5,
    }),
    {
      sessionId: 'session-1',
      offerType: 'sell',
      resource: 'wood',
      quantity: 10,
      pricePerUnit: 5,
    }
  );
});

test('rejects invalid market offer values', () => {
  const invalidOffers = [
    {
      sessionId: 'session-1',
      offerType: 'trade',
      resource: 'wood',
      quantity: 10,
      pricePerUnit: 5,
    },
    {
      sessionId: 'session-1',
      offerType: 'sell',
      resource: 'iron',
      quantity: 10,
      pricePerUnit: 5,
    },
    {
      sessionId: 'session-1',
      offerType: 'sell',
      resource: 'wood',
      quantity: 0,
      pricePerUnit: 5,
    },
    {
      sessionId: 'session-1',
      offerType: 'sell',
      resource: 'wood',
      quantity: 10,
      pricePerUnit: 2.5,
    },
  ];

  for (const offer of invalidOffers) {
    assert.equal(parseCreateMarketOfferPayload(offer), null);
  }
});

test('applies defaults to development bot offers', () => {
  assert.deepEqual(parseDevSeedBotOfferPayload({ sessionId: 'session-1' }), {
    sessionId: 'session-1',
    offerType: 'sell',
    resource: 'wood',
    quantity: 100,
    pricePerUnit: 5,
  });
});

test('normalizes lobby codes', () => {
  assert.deepEqual(parseJoinLobbyPayload({ lobbyCode: '  ab12cd  ' }), {
    lobbyCode: 'AB12CD',
  });
  assert.equal(parseJoinLobbyPayload({ lobbyCode: '   ' }), null);
});

test('validates session and market identifiers', () => {
  assert.deepEqual(parseStartSessionPayload({ sessionId: 'session-1' }), {
    sessionId: 'session-1',
  });
  assert.equal(parseStartSessionPayload({ sessionId: '   ' }), null);

  assert.deepEqual(
    parseCancelMarketOfferPayload({
      sessionId: 'session-1',
      offerId: 'offer-1',
    }),
    {
      sessionId: 'session-1',
      offerId: 'offer-1',
    }
  );

  assert.equal(parseCancelMarketOfferPayload({ sessionId: 'session-1' }), null);
});

test('accepts only positive integer trade and recycle quantities', () => {
  assert.deepEqual(
    parseAcceptMarketOfferPayload({
      sessionId: 'session-1',
      offerId: 'offer-1',
      quantity: 4,
    }),
    {
      sessionId: 'session-1',
      offerId: 'offer-1',
      quantity: 4,
    }
  );

  assert.equal(
    parseAcceptMarketOfferPayload({
      sessionId: 'session-1',
      offerId: 'offer-1',
      quantity: -1,
    }),
    null
  );

  assert.deepEqual(
    parseRecycleResourcePayload({
      sessionId: 'session-1',
      resource: 'grain',
      quantity: 20,
    }),
    {
      sessionId: 'session-1',
      resource: 'grain',
      quantity: 20,
    }
  );

  assert.equal(
    parseRecycleResourcePayload({
      sessionId: 'session-1',
      resource: 'gold',
      quantity: 20,
    }),
    null
  );
});
