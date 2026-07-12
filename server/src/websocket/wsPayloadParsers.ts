import {
  AcceptMarketOfferPayload,
  CreateMarketOfferPayload,
  DevSeedBotOfferPayload,
  TileActionPayload,
  JoinLobbyPayload,
  StartSessionPayload,
  RecycleResourcePayload,
  CancelMarketOfferPayload,
} from './ws.types';
import { isRecord } from './wsProtocol';
import { OfferType, ResourceType } from '../game/game.types';

function isResourceType(value: unknown): value is ResourceType {
  return value === 'wood' || value === 'stone' || value === 'grain';
}

function isOfferType(value: unknown): value is OfferType {
  return value === 'buy' || value === 'sell';
}

export function parseTileActionPayload(payload: unknown): TileActionPayload | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (
    typeof payload.sessionId !== 'string' ||
    typeof payload.x !== 'number' ||
    typeof payload.y !== 'number'
  ) {
    return null;
  }

  if (!Number.isInteger(payload.x) || !Number.isInteger(payload.y)) {
    return null;
  }

  return {
    sessionId: payload.sessionId,
    x: payload.x,
    y: payload.y,
  };
}

export function parseCreateMarketOfferPayload(payload: unknown): CreateMarketOfferPayload | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (
    typeof payload.sessionId !== 'string' ||
    !isOfferType(payload.offerType) ||
    !isResourceType(payload.resource) ||
    typeof payload.quantity !== 'number' ||
    typeof payload.pricePerUnit !== 'number'
  ) {
    return null;
  }

  if (
    !Number.isInteger(payload.quantity) ||
    !Number.isInteger(payload.pricePerUnit) ||
    payload.quantity <= 0 ||
    payload.pricePerUnit <= 0
  ) {
    return null;
  }

  return {
    sessionId: payload.sessionId,
    offerType: payload.offerType,
    resource: payload.resource,
    quantity: payload.quantity,
    pricePerUnit: payload.pricePerUnit,
  };
}

export function parseAcceptMarketOfferPayload(payload: unknown): AcceptMarketOfferPayload | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (
    typeof payload.sessionId !== 'string' ||
    typeof payload.offerId !== 'string' ||
    typeof payload.quantity !== 'number'
  ) {
    return null;
  }

  if (!Number.isInteger(payload.quantity) || payload.quantity <= 0) {
    return null;
  }

  return {
    sessionId: payload.sessionId,
    offerId: payload.offerId,
    quantity: payload.quantity,
  };
}

export function parseDevSeedBotOfferPayload(payload: unknown): DevSeedBotOfferPayload | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (typeof payload.sessionId !== 'string') {
    return null;
  }

  const offerType = payload.offerType === undefined ? 'sell' : payload.offerType;
  const resource = payload.resource === undefined ? 'wood' : payload.resource;
  const quantity = payload.quantity === undefined ? 100 : payload.quantity;
  const pricePerUnit = payload.pricePerUnit === undefined ? 5 : payload.pricePerUnit;

  if (!isOfferType(offerType) || !isResourceType(resource)) {
    return null;
  }

  if (
    typeof quantity !== 'number' ||
    typeof pricePerUnit !== 'number' ||
    !Number.isInteger(quantity) ||
    !Number.isInteger(pricePerUnit) ||
    quantity <= 0 ||
    pricePerUnit <= 0
  ) {
    return null;
  }

  return {
    sessionId: payload.sessionId,
    offerType,
    resource,
    quantity,
    pricePerUnit,
  };
}

export function parseJoinLobbyPayload(payload: unknown): JoinLobbyPayload | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (typeof payload.lobbyCode !== 'string') {
    return null;
  }

  const lobbyCode = payload.lobbyCode.trim().toUpperCase();

  if (lobbyCode.length === 0) {
    return null;
  }

  return {
    lobbyCode,
  };
}

export function parseStartSessionPayload(payload: unknown): StartSessionPayload | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (typeof payload.sessionId !== 'string' || payload.sessionId.trim().length === 0) {
    return null;
  }

  return {
    sessionId: payload.sessionId,
  };
}

export function parseRecycleResourcePayload(payload: unknown): RecycleResourcePayload | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (
    typeof payload.sessionId !== 'string' ||
    !isResourceType(payload.resource) ||
    typeof payload.quantity !== 'number'
  ) {
    return null;
  }

  if (!Number.isInteger(payload.quantity) || payload.quantity <= 0) {
    return null;
  }

  return {
    sessionId: payload.sessionId,
    resource: payload.resource,
    quantity: payload.quantity,
  };
}

export function parseCancelMarketOfferPayload(payload: unknown): CancelMarketOfferPayload | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (typeof payload.sessionId !== 'string' || typeof payload.offerId !== 'string') {
    return null;
  }

  return {
    sessionId: payload.sessionId,
    offerId: payload.offerId,
  };
}
