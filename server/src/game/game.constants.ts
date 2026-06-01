import type { BuildingType, ResourceType, TileType } from "./game.types";

export const DAY_START_MINUTE = 480;
export const DAY_END_MINUTE = 1200;
export const FINAL_DAY = 5;

export const MARKET_OPEN_MINUTE = 540;
export const MARKET_CLOSE_MINUTE = 1020;
export const OFFER_DURATION_MINUTES = 30;

// Accelerare
// export const GAME_TICK_REAL_SECONDS = 2;
// export const GAME_MINUTES_PER_TICK = 15;
export const GAME_TICK_REAL_SECONDS = 5;
export const GAME_MINUTES_PER_TICK = 5;

export const INITIAL_RESOURCE_AMOUNT = 200;
export const INITIAL_GALBENI = 100;
export const INITIAL_INFLATION = 20;
export const INITIAL_AVERAGE_PRICE = 5;

export const OVERPRICE_THRESHOLD_MULTIPLIER = 1.5;
export const MAX_TRADE_INFLATION_PRESSURE = 8;

export const AVG_PRICE_TRADE_QUANTITY_CAP = 100;
export const DEMAND_SUPPLY_PRESSURE_THRESHOLD = 0.6;
export const MAX_DEMAND_SUPPLY_PRESSURE = 5;

export const INFLATION_LOSS_THRESHOLD = 75;
export const MIN_AVERAGE_ECONOMIC_SCORE = 3200;

export const BUILDING_SCORE_PER_LEVEL = 120;
export const TRADE_VALUE_SCORE_DIVISOR = 10;

export const BUILDING_BY_TILE: Record<TileType, BuildingType> = {
    field: "farm",
    quarry: "mine",
    forest: "lumberyard",
};

export const BUILD_COSTS: Record<BuildingType, Partial<Record<ResourceType, number>>> = {
    farm: {
        wood: 10,
        stone: 20,
    },
    mine: {
        wood: 20,
        grain: 10,
    },
    lumberyard: {
        stone: 10,
        grain: 20,
    },
};

export const RESOURCE_BY_BUILDING: Record<BuildingType, ResourceType> = {
    farm: "grain",
    mine: "stone",
    lumberyard: "wood",
};