import type { WebSocket } from 'ws';
import type { OfferType, ResourceType } from '../game/game.types';

export type AuthenticatedUser = {
  id: number;
  username: string;
  email: string;
};

export type AuthenticatedWebSocket = WebSocket & {
  user?: AuthenticatedUser;
  currentSessionId?: string;
};

export type ClientMessage = {
  type: string;
  payload?: unknown;
};

export type TileActionPayload = {
  sessionId: string;
  x: number;
  y: number;
};

export type CreateMarketOfferPayload = {
  sessionId: string;
  offerType: OfferType;
  resource: ResourceType;
  quantity: number;
  pricePerUnit: number;
};

export type AcceptMarketOfferPayload = {
  sessionId: string;
  offerId: string;
  quantity: number;
};

export type DevSeedBotOfferPayload = {
  sessionId: string;
  offerType?: OfferType;
  resource?: ResourceType;
  quantity?: number;
  pricePerUnit?: number;
};

export type RecycleResourcePayload = {
  sessionId: string;
  resource: ResourceType;
  quantity: number;
};

export type CancelMarketOfferPayload = {
  sessionId: string;
  offerId: string;
};

export type JoinLobbyPayload = {
  lobbyCode: string;
};

export type StartSessionPayload = {
  sessionId: string;
};
