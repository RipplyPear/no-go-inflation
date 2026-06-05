import type { TileType } from "./mapGenerator";

export type { TileType };

export type BuildingType = "farm" | "mine" | "lumberyard";
export type ResourceType = "wood" | "stone" | "grain";
export type OfferType = "buy" | "sell";

export type EconomySnapshotReason =
    | "session_start"
    | "periodic"
    | "trade"
    | "recycle"
    | "disconnect"
    | "session_end";

export type EconomyPressures = {
    demandSupplyPressure?: number;
    overpricePressure?: number;
    underpricePressure?: number;
    recyclePressure?: number;
    stabilizationPressure?: number;
};

export type PlayerFinalResult = {
    participantId: string;
    displayName: string;
    economicScore: number;
    rank: string;
    tradesCount: number;
    totalTradedValue: number;
    totalRecycledAmount: number;
};

export type SessionFinalResult = {
    sessionId: string;
    finalInflation: number;
    collectiveResult: "win" | "loss";
    averageEconomicScore: number;
    results: PlayerFinalResult[];
};