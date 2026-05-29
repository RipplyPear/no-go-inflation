import type { IncomingMessage, Server as HttpServer } from "node:http";
import { WebSocket, WebSocketServer, type RawData } from "ws";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";
import { generatePlayerMap, type TileType } from "../game/mapGenerator";

type BuildingType = "farm" | "mine" | "lumberyard";
type ResourceType = "wood" | "stone" | "grain";

type OfferType = "buy" | "sell";

type CreateMarketOfferPayload = {
    sessionId: string;
    offerType: OfferType;
    resource: ResourceType;
    quantity: number;
    pricePerUnit: number;
};

type AcceptMarketOfferPayload = {
    sessionId: string;
    offerId: string;
    quantity: number;
};

type AuthenticatedUser = {
    id: number;
    username: string;
    email: string;
};

type AuthenticatedWebSocket = WebSocket & {
    user?: AuthenticatedUser;
    currentSessionId?: string;
};

type ClientMessage = {
    type: string;
    payload?: unknown;
};

type EconomySnapshotReason =
    | "session_start"
    | "periodic"
    | "trade"
    | "recycle"
    | "disconnect"
    | "session_end";

type EconomyPressures = {
    demandSupplyPressure?: number;
    overpricePressure?: number;
    recyclePressure?: number;
};

type PlayerFinalResult = {
    participantId: string;
    displayName: string;
    economicScore: number;
    rank: string;
    tradesCount: number;
    totalTradedValue: number;
    totalRecycledAmount: number;
};

type SessionFinalResult = {
    sessionId: string;
    finalInflation: number;
    collectiveResult: "win" | "loss";
    averageEconomicScore: number;
    results: PlayerFinalResult[];
};

const DAY_START_MINUTE = 480; // 08:00
const DAY_END_MINUTE = 1200; // 20:00
const FINAL_DAY = 5;

const MARKET_OPEN_MINUTE = 540; // 09:00
const MARKET_CLOSE_MINUTE = 1020; // 17:00
const OFFER_DURATION_MINUTES = 30;

const GAME_TICK_REAL_SECONDS = 5;
const GAME_MINUTES_PER_TICK = 5;

const INITIAL_RESOURCE_AMOUNT = 200;
const INITIAL_GALBENI = 100;
const INITIAL_INFLATION = 20;

const OVERPRICE_THRESHOLD_MULTIPLIER = 1.5;
const MAX_TRADE_INFLATION_PRESSURE = 8;

const INITIAL_AVERAGE_PRICE = 5;

const AVG_PRICE_TRADE_QUANTITY_CAP = 100;
const DEMAND_SUPPLY_PRESSURE_THRESHOLD = 0.6;
const MAX_DEMAND_SUPPLY_PRESSURE = 5;

const INFLATION_LOSS_THRESHOLD = 75;
const MIN_AVERAGE_ECONOMIC_SCORE = 3200;

const BUILDING_SCORE_PER_LEVEL = 120;
const TRADE_VALUE_SCORE_DIVISOR = 10;

const BUILDING_BY_TILE: Record<TileType, BuildingType> = {
    field: "farm",
    quarry: "mine",
    forest: "lumberyard",
};

const BUILD_COSTS: Record<BuildingType, Partial<Record<ResourceType, number>>> = {
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

const RESOURCE_BY_BUILDING: Record<BuildingType, ResourceType> = {
    farm: "grain",
    mine: "stone",
    lumberyard: "wood",
};

const connectedClients = new Set<AuthenticatedWebSocket>();
let gameLoopStarted = false;

function getRankForEconomicScore(score: number): string {
    if (score >= 4500) {
        return "S";
    }

    if (score >= 3600) {
        return "A";
    }

    if (score >= 3200) {
        return "B";
    }

    if (score >= 2500) {
        return "C";
    }

    return "D";
}

function clampNumber(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function getAveragePriceColumn(resource: ResourceType): string {
    switch (resource) {
        case "wood":
            return "wood_avg_price";
        case "stone":
            return "stone_avg_price";
        case "grain":
            return "grain_avg_price";
    }
}

async function calculateDemandSupplyPressure(
    queryable: Pick<typeof pool, "query">,
    sessionId: string
): Promise<number> {
    const result = await queryable.query(
        `
        SELECT
            resource,
            SUM(
                CASE
                    WHEN offer_type = 'buy' THEN remaining_quantity
                    ELSE 0
                END
            ) AS buy_quantity,
            SUM(
                CASE
                    WHEN offer_type = 'sell' THEN remaining_quantity
                    ELSE 0
                END
            ) AS sell_quantity
        FROM market_offers
        WHERE session_id = $1
          AND status = 'active'
          AND expires_at > now()
        GROUP BY resource
        `,
        [sessionId]
    );

    let totalPressure = 0;

    for (const row of result.rows) {
        const buyQuantity = Number(row.buy_quantity ?? 0);
        const sellQuantity = Number(row.sell_quantity ?? 0);
        const totalQuantity = buyQuantity + sellQuantity;

        if (totalQuantity <= 0) {
            continue;
        }

        const imbalance = Math.abs(buyQuantity - sellQuantity) / totalQuantity;

        if (imbalance <= DEMAND_SUPPLY_PRESSURE_THRESHOLD) {
            continue;
        }

        const rawPressure =
            (imbalance - DEMAND_SUPPLY_PRESSURE_THRESHOLD) * 10;

        totalPressure += rawPressure;
    }

    return clampNumber(
        Math.round(totalPressure),
        0,
        MAX_DEMAND_SUPPLY_PRESSURE
    );
}

function calculateOverpricePressure(
    pricePerUnit: number,
    currentAveragePrice: number
): number {
    if (currentAveragePrice <= 0) {
        return 0;
    }

    const ratio = pricePerUnit / currentAveragePrice;

    if (ratio <= OVERPRICE_THRESHOLD_MULTIPLIER) {
        return 0;
    }

    const rawPressure = Math.ceil((ratio - OVERPRICE_THRESHOLD_MULTIPLIER) * 4);

    return clampNumber(rawPressure, 1, MAX_TRADE_INFLATION_PRESSURE);
}

function startGameLoop(): void {
    if (gameLoopStarted) {
        return;
    }

    gameLoopStarted = true;

    setInterval(() => {
        void processGameLoopTick(GAME_MINUTES_PER_TICK);
    }, GAME_TICK_REAL_SECONDS * 1000);
}

async function getHumanParticipantForSession(
    queryable: Pick<typeof pool, "query">,
    user: AuthenticatedUser,
    sessionId: string
) {
    const participantResult = await queryable.query(
        `
        SELECT id, display_name, role
        FROM session_participants
        WHERE session_id = $1
          AND user_id = $2
        LIMIT 1
        `,
        [sessionId, user.id]
    );

    if (participantResult.rows.length === 0) {
        throw new Error("Jucătorul nu aparține acestei sesiuni.");
    }

    return participantResult.rows[0];
}

async function processGameLoopTick(gameMinutesToAdvance: number): Promise<void> {
    const sessionIds = new Set<string>();

    for (const ws of connectedClients) {
        if (
            ws.readyState === WebSocket.OPEN &&
            ws.user &&
            ws.currentSessionId
        ) {
            sessionIds.add(ws.currentSessionId);
        }
    }

    for (const sessionId of sessionIds) {
        try {
            const sessionWasUpdated = await advanceSessionTime(
                sessionId,
                gameMinutesToAdvance
            );

            if (!sessionWasUpdated) {
                continue;
            }

            const finalResult = await finalizeSessionIfNeeded(sessionId);

            for (const ws of connectedClients) {
                if (
                    ws.readyState !== WebSocket.OPEN ||
                    !ws.user ||
                    ws.currentSessionId !== sessionId
                ) {
                    continue;
                }

                const sessionState = await getSessionStateForUser(
                    ws.user,
                    sessionId
                );

                sendJson(ws, "SESSION_STATE", sessionState);
                if (finalResult) {
                    sendJson(ws, "GAME_FINISHED", finalResult);
                }
            }
        } catch (error) {
            console.error("Game loop tick failed:", error);
        }
    }
}

async function forceFinishSessionForTesting(
    user: AuthenticatedUser,
    rawPayload: unknown
): Promise<SessionFinalResult> {
    if (!isRecord(rawPayload) || typeof rawPayload.sessionId !== "string") {
        throw new Error("Payload invalid pentru DEV_FORCE_FINISH_SESSION.");
    }

    await getHumanParticipantForSession(pool, user, rawPayload.sessionId);

    await pool.query(
        `
        UPDATE game_sessions
        SET current_day = $2,
            current_minute = $3,
            status = 'finished',
            ended_at = COALESCE(ended_at, now()),
            updated_at = now()
        WHERE id = $1
        `,
        [rawPayload.sessionId, FINAL_DAY, DAY_END_MINUTE]
    );

    const finalResult = await finalizeSessionIfNeeded(rawPayload.sessionId);

    if (!finalResult) {
        throw new Error("Sesiunea nu a putut fi finalizată.");
    }

    return finalResult;
}

function getUpgradeCost(
    building: BuildingType,
    currentLevel: number
): Partial<Record<ResourceType, number>> {
    const buildCost = BUILD_COSTS[building];

    if (currentLevel === 1) {
        return Object.fromEntries(
            Object.entries(buildCost).map(([resource, amount]) => [
                resource,
                Number(amount) * 2,
            ])
        ) as Partial<Record<ResourceType, number>>;
    }

    if (currentLevel === 2) {
        return Object.fromEntries(
            Object.entries(buildCost).map(([resource, amount]) => [
                resource,
                Number(amount) * 4,
            ])
        ) as Partial<Record<ResourceType, number>>;
    }

    return {};
}

function sendJson(ws: WebSocket, type: string, payload: unknown = {}) {
    ws.send(
        JSON.stringify({
            type,
            payload,
        })
    );
}

function getTokenFromRequest(request: IncomingMessage): string | null {
    const host = request.headers.host ?? "localhost";
    const url = new URL(request.url ?? "", `http://${host}`);

    return url.searchParams.get("token");
}

function authenticateRequest(request: IncomingMessage): AuthenticatedUser | null {
    const token = getTokenFromRequest(request);

    if (!token) {
        return null;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        console.error("JWT_SECRET is missing");
        return null;
    }

    try {
        const decoded = jwt.verify(token, secret);

        if (typeof decoded === "string") {
            return null;
        }

        return {
            id: Number(decoded.userId),
            username: String(decoded.username),
            email: String(decoded.email),
        };
    } catch (error) {
        console.error("Invalid WebSocket token:", error);
        return null;
    }
}

function parseClientMessage(rawMessage: RawData): ClientMessage | null {
    try {
        const text = rawMessage.toString();
        const parsed = JSON.parse(text);

        if (typeof parsed !== "object" || parsed === null) {
            return null;
        }

        if (typeof parsed.type !== "string") {
            return null;
        }

        return parsed as ClientMessage;
    } catch {
        return null;
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

type TileActionPayload = {
    sessionId: string;
    x: number;
    y: number;
};

function parseTileActionPayload(payload: unknown): TileActionPayload | null {
    if (!isRecord(payload)) {
        return null;
    }

    if (
        typeof payload.sessionId !== "string" ||
        typeof payload.x !== "number" ||
        typeof payload.y !== "number"
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

function isResourceType(value: unknown): value is ResourceType {
    return value === "wood" || value === "stone" || value === "grain";
}

function isOfferType(value: unknown): value is OfferType {
    return value === "buy" || value === "sell";
}

function parseCreateMarketOfferPayload(payload: unknown): CreateMarketOfferPayload | null {
    if (!isRecord(payload)) {
        return null;
    }

    if (
        typeof payload.sessionId !== "string" ||
        !isOfferType(payload.offerType) ||
        !isResourceType(payload.resource) ||
        typeof payload.quantity !== "number" ||
        typeof payload.pricePerUnit !== "number"
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

function parseAcceptMarketOfferPayload(payload: unknown): AcceptMarketOfferPayload | null {
    if (!isRecord(payload)) {
        return null;
    }

    if (
        typeof payload.sessionId !== "string" ||
        typeof payload.offerId !== "string" ||
        typeof payload.quantity !== "number"
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

async function buildBuilding(user: AuthenticatedUser, rawPayload: unknown) {
    const payload = parseTileActionPayload(rawPayload);

    if (!payload) {
        throw new Error("Payload invalid pentru BUILD_BUILDING.");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const participant = await getHumanParticipantForSession(
            client,
            user,
            payload.sessionId
        );

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
            throw new Error("Lotul selectat nu există.");
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
            throw new Error("Pe acest lot există deja o clădire.");
        }

        const cost = BUILD_COSTS[building];
        const costEntries = Object.entries(cost) as Array<[ResourceType, number]>;

        const resourceResult = await client.query(
            `
            SELECT resource, amount
            FROM player_resources
            WHERE participant_id = $1
            FOR UPDATE
            `,
            [participant.id]
        );

        const available: Record<ResourceType, number> = {
            wood: 0,
            stone: 0,
            grain: 0,
        };

        for (const row of resourceResult.rows) {
            const resource = row.resource as ResourceType;

            if (resource === "wood" || resource === "stone" || resource === "grain") {
                available[resource] = Number(row.amount);
            }
        }

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
            [
                payload.sessionId,
                participant.id,
                payload.x,
                payload.y,
                tile,
                building,
            ]
        );

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }

    return getSessionStateForUser(user, payload.sessionId);
}

async function collectBuilding(user: AuthenticatedUser, rawPayload: unknown) {
    const payload = parseTileActionPayload(rawPayload);

    if (!payload) {
        throw new Error("Payload invalid pentru COLLECT_BUILDING.");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const participant = await getHumanParticipantForSession(
            client,
            user,
            payload.sessionId
        );

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
            throw new Error("Nu există clădire pe acest lot.");
        }

        const existingBuilding = buildingResult.rows[0];
        const building = existingBuilding.building as BuildingType;
        const storedAmount = Number(existingBuilding.stored_amount);

        if (storedAmount <= 0) {
            throw new Error("Clădirea nu are resurse de colectat.");
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

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }

    return getSessionStateForUser(user, payload.sessionId);
}

async function upgradeBuilding(user: AuthenticatedUser, rawPayload: unknown) {
    const payload = parseTileActionPayload(rawPayload);

    if (!payload) {
        throw new Error("Payload invalid pentru UPGRADE_BUILDING.");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const participant = await getHumanParticipantForSession(
            client,
            user,
            payload.sessionId
        );

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
            throw new Error("Nu există clădire pe acest lot.");
        }

        const existingBuilding = buildingResult.rows[0];
        const building = existingBuilding.building as BuildingType;
        const currentLevel = Number(existingBuilding.level);

        if (currentLevel >= 3) {
            throw new Error("Clădirea este deja la nivel maxim.");
        }

        const cost = getUpgradeCost(building, currentLevel);
        const costEntries = Object.entries(cost) as Array<[ResourceType, number]>;

        const resourceResult = await client.query(
            `
            SELECT resource, amount
            FROM player_resources
            WHERE participant_id = $1
            FOR UPDATE
            `,
            [participant.id]
        );

        const available: Record<ResourceType, number> = {
            wood: 0,
            stone: 0,
            grain: 0,
        };

        for (const row of resourceResult.rows) {
            const resource = row.resource as ResourceType;

            if (resource === "wood" || resource === "stone" || resource === "grain") {
                available[resource] = Number(row.amount);
            }
        }

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

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }

    return getSessionStateForUser(user, payload.sessionId);
}

async function createDemoSession(user: AuthenticatedUser) {
    const client = await pool.connect();

    const lobbyCode = Math.random().toString(36).slice(2, 8).toUpperCase();

    const demoMap = generatePlayerMap();

    try {
        await client.query("BEGIN");

        const sessionResult = await client.query(
            `
            INSERT INTO game_sessions (
                host_user_id,
                lobby_code,
                is_private,
                status,
                started_at
            )
            VALUES ($1, $2, false, 'active', now())
            RETURNING id, lobby_code, status, current_day, current_minute
            `,
            [user.id, lobbyCode]
        );

        const session = sessionResult.rows[0];

        const participantResult = await client.query(
            `
            INSERT INTO session_participants (
                session_id,
                user_id,
                participant_type,
                role,
                display_name,
                is_ready,
                is_connected
            )
            VALUES ($1, $2, 'human', 'host', $3, true, true)
            RETURNING id, display_name, role
            `,
            [session.id, user.id, user.username]
        );

        const participant = participantResult.rows[0];

        await client.query(
            `
            INSERT INTO player_states (
                session_id,
                participant_id,
                galbeni,
                economic_score,
                total_recycled_amount
            )
            VALUES ($1, $2, $3, 0, 0)
            `,
            [session.id, participant.id, INITIAL_GALBENI]
        );

        for (const resource of ["wood", "stone", "grain"]) {
            await client.query(
                `
                INSERT INTO player_resources (
                    participant_id,
                    resource,
                    amount
                )
                VALUES ($1, $2, $3)
                `,
                [participant.id, resource, INITIAL_RESOURCE_AMOUNT]
            );
        }

        for (let y = 0; y < demoMap.tiles.length; y++) {
            for (let x = 0; x < demoMap.tiles[y].length; x++) {
                await client.query(
                    `
            INSERT INTO player_map_tiles (
                participant_id,
                tile_x,
                tile_y,
                tile
            )
            VALUES ($1, $2, $3, $4)
            `,
                    [participant.id, x, y, demoMap.tiles[y][x]]
                );
            }
        }

        await client.query(
            `
                INSERT INTO session_economy_state (
                    session_id,
                    inflation,
                    wood_avg_price,
                    stone_avg_price,
                    grain_avg_price
                )
                VALUES ($1, $2, $3, $3, $3)
            `,
            [session.id, INITIAL_INFLATION, INITIAL_AVERAGE_PRICE]
        );

        await client.query("COMMIT");

        return {
            sessionId: session.id,
            lobbyCode: session.lobby_code,
            status: session.status,
            currentDay: session.current_day,
            currentMinute: session.current_minute,
            participant: {
                id: participant.id,
                displayName: participant.display_name,
                role: participant.role,
            },
            resources: {
                wood: INITIAL_RESOURCE_AMOUNT,
                stone: INITIAL_RESOURCE_AMOUNT,
                grain: INITIAL_RESOURCE_AMOUNT,
                galbeni: INITIAL_GALBENI,
            },
            economy: {
                inflation: INITIAL_INFLATION,
                averagePrices: {
                    wood: INITIAL_AVERAGE_PRICE,
                    stone: INITIAL_AVERAGE_PRICE,
                    grain: INITIAL_AVERAGE_PRICE,
                },
            },
            map: demoMap,
            buildings: [],
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function getSessionStateForUser(user: AuthenticatedUser, sessionId: string) {
    const sessionResult = await pool.query(
        `
        SELECT id, lobby_code, status, current_day, current_minute
        FROM game_sessions
        WHERE id = $1
        `,
        [sessionId]
    );

    if (sessionResult.rows.length === 0) {
        throw new Error("Sesiunea nu există.");
    }

    const session = sessionResult.rows[0];

    const participantResult = await pool.query(
        `
        SELECT id, display_name, role
        FROM session_participants
        WHERE session_id = $1
          AND user_id = $2
        LIMIT 1
        `,
        [sessionId, user.id]
    );

    if (participantResult.rows.length === 0) {
        throw new Error("Jucătorul nu aparține acestei sesiuni.");
    }

    const participant = participantResult.rows[0];

    const playerStateResult = await pool.query(
        `
        SELECT galbeni
        FROM player_states
        WHERE participant_id = $1
        `,
        [participant.id]
    );

    const galbeni = Number(playerStateResult.rows[0]?.galbeni ?? 0);

    const resourceResult = await pool.query(
        `
        SELECT resource, amount
        FROM player_resources
        WHERE participant_id = $1
        `,
        [participant.id]
    );

    const resources: Record<ResourceType | "galbeni", number> = {
        wood: 0,
        stone: 0,
        grain: 0,
        galbeni,
    };

    for (const row of resourceResult.rows) {
        const resource = row.resource as ResourceType;

        if (resource === "wood" || resource === "stone" || resource === "grain") {
            resources[resource] = Number(row.amount);
        }
    }

    const economyResult = await pool.query(
        `
        SELECT inflation, wood_avg_price, stone_avg_price, grain_avg_price
        FROM session_economy_state
        WHERE session_id = $1
        `,
        [sessionId]
    );

    const economyRow = economyResult.rows[0];

    const tileResult = await pool.query(
        `
        SELECT tile_x, tile_y, tile
        FROM player_map_tiles
        WHERE participant_id = $1
        ORDER BY tile_y, tile_x
        `,
        [participant.id]
    );

    let width = 0;
    let height = 0;

    for (const row of tileResult.rows) {
        width = Math.max(width, Number(row.tile_x) + 1);
        height = Math.max(height, Number(row.tile_y) + 1);
    }

    const tiles: TileType[][] = Array.from({ length: height }, () =>
        Array.from({ length: width }, () => "field" as TileType)
    );

    for (const row of tileResult.rows) {
        tiles[Number(row.tile_y)][Number(row.tile_x)] = row.tile as TileType;
    }

    const buildingResult = await pool.query(
        `
        SELECT tile_x, tile_y, building, level, stored_amount
        FROM player_buildings
        WHERE participant_id = $1
        ORDER BY tile_y, tile_x
        `,
        [participant.id]
    );

    const buildings = buildingResult.rows.map((row) => ({
        x: Number(row.tile_x),
        y: Number(row.tile_y),
        type: String(row.building),
        level: Number(row.level),
        stored: Number(row.stored_amount),
    }));

    return {
        sessionId: session.id,
        lobbyCode: session.lobby_code,
        status: session.status,
        currentDay: Number(session.current_day),
        currentMinute: Number(session.current_minute),
        participant: {
            id: participant.id,
            displayName: participant.display_name,
            role: participant.role,
        },
        resources,
        economy: {
            inflation: Number(economyRow?.inflation ?? 20),
            averagePrices: {
                wood: Number(economyRow?.wood_avg_price ?? INITIAL_AVERAGE_PRICE),
                stone: Number(economyRow?.stone_avg_price ?? INITIAL_AVERAGE_PRICE),
                grain: Number(economyRow?.grain_avg_price ?? INITIAL_AVERAGE_PRICE),
            },
        },
        map: {
            width,
            height,
            tiles,
        },
        buildings,
    };
}

async function getSessionFinalResult(sessionId: string): Promise<SessionFinalResult> {
    const sessionResult = await pool.query(
        `
        SELECT final_inflation, result
        FROM game_sessions
        WHERE id = $1
        `,
        [sessionId]
    );

    if (sessionResult.rows.length === 0) {
        throw new Error("Sesiunea nu există.");
    }

    const session = sessionResult.rows[0];

    const resultsResult = await pool.query(
        `
        SELECT
            psr.participant_id,
            sp.display_name,
            psr.economic_score,
            psr.rank,
            psr.trades_count,
            psr.total_traded_value,
            psr.total_recycled_amount
        FROM player_session_results psr
        JOIN session_participants sp
          ON sp.id = psr.participant_id
        WHERE psr.session_id = $1
        ORDER BY psr.economic_score DESC
        `,
        [sessionId]
    );

    const results: PlayerFinalResult[] = resultsResult.rows.map((row) => ({
        participantId: String(row.participant_id),
        displayName: String(row.display_name),
        economicScore: Number(row.economic_score),
        rank: String(row.rank),
        tradesCount: Number(row.trades_count),
        totalTradedValue: Number(row.total_traded_value),
        totalRecycledAmount: Number(row.total_recycled_amount),
    }));

    const averageEconomicScore =
        results.length === 0
            ? 0
            : Math.round(
                results.reduce((sum, result) => sum + result.economicScore, 0) /
                results.length
            );

    return {
        sessionId,
        finalInflation: Number(session.final_inflation ?? 0),
        collectiveResult: session.result === "win" ? "win" : "loss",
        averageEconomicScore,
        results,
    };
}

async function advanceSessionTime(
    sessionId: string,
    gameMinutesToAdvance: number
): Promise<boolean> {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const sessionResult = await client.query(
            `
                SELECT current_day, current_minute, status
                FROM game_sessions
                WHERE id = $1
                    FOR UPDATE
            `,
            [sessionId]
        );

        if (sessionResult.rows.length === 0) {
            throw new Error("Sesiunea nu există.");
        }

        const session = sessionResult.rows[0];

        if (session.status !== "active") {
            await client.query("COMMIT");
            return false;
        }

        const currentDay = Number(session.current_day);
        const currentMinute = Number(session.current_minute);

        let nextDay = currentDay;
        let nextMinute = currentMinute;
        let nextStatus = "active";
        let productionMinutes = 0;

        if (currentMinute >= DAY_END_MINUTE) {
            if (currentDay >= FINAL_DAY) {
                nextDay = FINAL_DAY;
                nextMinute = DAY_END_MINUTE;
                nextStatus = "finished";
            } else {
                nextDay = currentDay + 1;
                nextMinute = DAY_START_MINUTE;
            }
        } else {
            productionMinutes = Math.min(
                gameMinutesToAdvance,
                DAY_END_MINUTE - currentMinute
            );

            nextMinute = currentMinute + productionMinutes;

            if (nextMinute >= DAY_END_MINUTE) {
                nextMinute = DAY_END_MINUTE;

                if (currentDay >= FINAL_DAY) {
                    nextStatus = "finished";
                }
            }
        }

        await client.query(
            `
                UPDATE game_sessions
                SET current_day = $2,
                    current_minute = $3,
                    status = $4::session_status,
                    ended_at = CASE
                                   WHEN $4::session_status = 'finished'::session_status
                                       THEN COALESCE(ended_at, now())
                                   ELSE ended_at
                        END,
                    updated_at = now()
                WHERE id = $1
            `,
            [sessionId, nextDay, nextMinute, nextStatus]
        );

        if (productionMinutes > 0) {
            await client.query(
                `
                UPDATE player_buildings
                SET stored_amount = LEAST(
                        stored_amount + (level * $2),
                        level * 60
                    ),
                    updated_at = now()
                WHERE session_id = $1
                  AND stored_amount < level * 60
                `,
                [sessionId, productionMinutes]
            );
        }

        await client.query("COMMIT");
        return true;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function expireOldOffers(sessionId: string): Promise<void> {
    await pool.query(
        `
        UPDATE market_offers
        SET status = 'expired',
            updated_at = now()
        WHERE session_id = $1
          AND status = 'active'
          AND expires_at <= now()
        `,
        [sessionId]
    );
}

async function getMarketStateForUser(user: AuthenticatedUser, sessionId: string) {
    await expireOldOffers(sessionId);

    const participant = await getHumanParticipantForSession(pool, user, sessionId);

    const offersResult = await pool.query(
        `
        SELECT
            mo.id,
            mo.offer_type,
            mo.resource,
            mo.min_quantity,
            mo.max_quantity,
            mo.remaining_quantity,
            mo.price_per_unit,
            mo.expires_at,
            mo.creator_participant_id,
            sp.display_name AS creator_name
        FROM market_offers mo
        JOIN session_participants sp
          ON sp.id = mo.creator_participant_id
        WHERE mo.session_id = $1
          AND mo.status = 'active'
          AND mo.expires_at > now()
        ORDER BY mo.created_at DESC
        `,
        [sessionId]
    );

    const economyResult = await pool.query(
        `
        SELECT inflation, wood_avg_price, stone_avg_price, grain_avg_price
        FROM session_economy_state
        WHERE session_id = $1
        `,
        [sessionId]
    );

    const economyRow = economyResult.rows[0];

    return {
        sessionId,
        economy: {
            inflation: Number(economyRow?.inflation ?? 20),
            averagePrices: {
                wood: Number(economyRow?.wood_avg_price ?? INITIAL_AVERAGE_PRICE),
                stone: Number(economyRow?.stone_avg_price ?? INITIAL_AVERAGE_PRICE),
                grain: Number(economyRow?.grain_avg_price ?? INITIAL_AVERAGE_PRICE),
            },
        },
        offers: offersResult.rows.map((row) => ({
            id: row.id,
            offerType: row.offer_type,
            resource: row.resource,
            minQuantity: Number(row.min_quantity),
            maxQuantity: Number(row.max_quantity),
            remainingQuantity: Number(row.remaining_quantity),
            pricePerUnit: Number(row.price_per_unit),
            expiresAt: row.expires_at,
            creatorName: row.creator_name,
            creatorParticipantId: row.creator_participant_id,
            isOwnOffer: row.creator_participant_id === participant.id,
        })),
    };
}

async function createMarketOffer(user: AuthenticatedUser, rawPayload: unknown) {
    const payload = parseCreateMarketOfferPayload(rawPayload);

    if (!payload) {
        throw new Error("Payload invalid pentru CREATE_MARKET_OFFER.");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const participant = await getHumanParticipantForSession(
            client,
            user,
            payload.sessionId
        );

        const sessionResult = await client.query(
            `
            SELECT status, current_minute
            FROM game_sessions
            WHERE id = $1
            FOR UPDATE
            `,
            [payload.sessionId]
        );

        if (sessionResult.rows.length === 0) {
            throw new Error("Sesiunea nu există.");
        }

        const session = sessionResult.rows[0];
        const currentMinute = Number(session.current_minute);

        if (session.status !== "active") {
            throw new Error("Piața este disponibilă doar într-o sesiune activă.");
        }

        if (currentMinute < MARKET_OPEN_MINUTE || currentMinute >= MARKET_CLOSE_MINUTE) {
            throw new Error("Piața este închisă. Program: 09:00–17:00.");
        }

        const offerResult = await client.query(
            `
            INSERT INTO market_offers (
                session_id,
                creator_participant_id,
                offer_type,
                resource,
                min_quantity,
                max_quantity,
                remaining_quantity,
                price_per_unit,
                status,
                expires_at
            )
            VALUES (
                $1,
                $2,
                $3::offer_type,
                $4::resource_type,
                $5,
                $5,
                $5,
                $6,
                'active',
                now() + ($7::text || ' minutes')::interval
            )
            RETURNING id, offer_type, resource, remaining_quantity, price_per_unit, expires_at
            `,
            [
                payload.sessionId,
                participant.id,
                payload.offerType,
                payload.resource,
                payload.quantity,
                payload.pricePerUnit,
                OFFER_DURATION_MINUTES,
            ]
        );

        await client.query("COMMIT");

        return {
            sessionId: payload.sessionId,
            offer: offerResult.rows[0],
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

type DevSeedBotOfferPayload = {
    sessionId: string;
    offerType?: OfferType;
    resource?: ResourceType;
    quantity?: number;
    pricePerUnit?: number;
};

function parseDevSeedBotOfferPayload(payload: unknown): DevSeedBotOfferPayload | null {
    if (!isRecord(payload)) {
        return null;
    }

    if (typeof payload.sessionId !== "string") {
        return null;
    }

    const offerType = payload.offerType === undefined ? "sell" : payload.offerType;
    const resource = payload.resource === undefined ? "wood" : payload.resource;
    const quantity = payload.quantity === undefined ? 100 : payload.quantity;
    const pricePerUnit = payload.pricePerUnit === undefined ? 5 : payload.pricePerUnit;

    if (!isOfferType(offerType) || !isResourceType(resource)) {
        return null;
    }

    if (
        typeof quantity !== "number" ||
        typeof pricePerUnit !== "number" ||
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

async function seedBotOfferForTesting(user: AuthenticatedUser, rawPayload: unknown) {
    const payload = parseDevSeedBotOfferPayload(rawPayload);

    if (!payload) {
        throw new Error("Payload invalid pentru DEV_SEED_BOT_OFFER.");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await getHumanParticipantForSession(client, user, payload.sessionId);

        const sessionResult = await client.query(
            `
            SELECT id, status, current_minute
            FROM game_sessions
            WHERE id = $1
            FOR UPDATE
            `,
            [payload.sessionId]
        );

        if (sessionResult.rows.length === 0) {
            throw new Error("Sesiunea nu există.");
        }

        const session = sessionResult.rows[0];

        if (session.status !== "active") {
            throw new Error("Seed-ul de ofertă merge doar într-o sesiune activă.");
        }

        const currentMinute = Number(session.current_minute);

        if (currentMinute < MARKET_OPEN_MINUTE || currentMinute >= MARKET_CLOSE_MINUTE) {
            await client.query(
                `
                UPDATE game_sessions
                SET current_minute = $2
                WHERE id = $1
                `,
                [payload.sessionId, MARKET_OPEN_MINUTE]
            );
        }

        const existingBotResult = await client.query(
            `
            SELECT id
            FROM session_participants
            WHERE session_id = $1
              AND participant_type = 'bot'
              AND display_name = 'Bot Test'
            LIMIT 1
            `,
            [payload.sessionId]
        );

        let botParticipantId: string;

        if (existingBotResult.rows.length > 0) {
            botParticipantId = existingBotResult.rows[0].id;
        } else {
            const botResult = await client.query(
                `
                INSERT INTO session_participants (
                    session_id,
                    user_id,
                    participant_type,
                    role,
                    display_name,
                    is_ready,
                    is_connected
                )
                VALUES (
                    $1,
                    NULL,
                    'bot',
                    'bot',
                    'Bot Test',
                    true,
                    true
                )
                RETURNING id
                `,
                [payload.sessionId]
            );

            botParticipantId = botResult.rows[0].id;
        }

        await client.query(
            `
            INSERT INTO player_states (
                session_id,
                participant_id,
                galbeni,
                economic_score,
                total_recycled_amount
            )
            VALUES ($1, $2, 10000, 0, 0)
            ON CONFLICT (participant_id)
            DO UPDATE SET
                galbeni = GREATEST(player_states.galbeni, 10000),
                updated_at = now()
            `,
            [payload.sessionId, botParticipantId]
        );

        for (const resource of ["wood", "stone", "grain"] as ResourceType[]) {
            await client.query(
                `
                INSERT INTO player_resources (participant_id, resource, amount)
                VALUES ($1, $2::resource_type, 2000)
                ON CONFLICT (participant_id, resource)
                DO UPDATE SET
                    amount = GREATEST(player_resources.amount, 2000),
                    updated_at = now()
                `,
                [botParticipantId, resource]
            );
        }

        await client.query(
            `
            UPDATE market_offers
            SET status = 'cancelled',
                updated_at = now()
            WHERE creator_participant_id = $1
              AND status = 'active'
            `,
            [botParticipantId]
        );

        const offerResult = await client.query(
            `
            INSERT INTO market_offers (
                session_id,
                creator_participant_id,
                offer_type,
                resource,
                min_quantity,
                max_quantity,
                remaining_quantity,
                price_per_unit,
                status,
                expires_at
            )
            VALUES (
                $1,
                $2,
                $3::offer_type,
                $4::resource_type,
                1,
                $5,
                $5,
                $6,
                'active',
                now() + interval '30 minutes'
            )
            RETURNING id, offer_type, resource, remaining_quantity, price_per_unit, expires_at
            `,
            [
                payload.sessionId,
                botParticipantId,
                payload.offerType,
                payload.resource,
                payload.quantity,
                payload.pricePerUnit,
            ]
        );

        await client.query("COMMIT");

        return {
            sessionId: payload.sessionId,
            botParticipantId,
            offer: offerResult.rows[0],
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function updateAveragePricesAfterTrade(
    queryable: Pick<typeof pool, "query">,
    sessionId: string
): Promise<void> {
    await queryable.query(
        `
            WITH ranked_trades AS (
                SELECT
                    resource,
                    LEAST(quantity, $2::integer) AS capped_quantity,
                    price_per_unit,
                    ROW_NUMBER() OVER (
                        PARTITION BY resource
                        ORDER BY created_at DESC
                        ) AS rn
                FROM trade_transactions
                WHERE session_id = $1
            ),
                 recent_trades AS (
                     SELECT resource, capped_quantity, price_per_unit
                     FROM ranked_trades
                     WHERE rn <= 20
                 ),
                 averages AS (
                     SELECT
                         resource,
                         ROUND(
                                 SUM(capped_quantity * price_per_unit)::numeric
                                     / NULLIF(SUM(capped_quantity), 0),
                                 2
                         ) AS avg_price
                     FROM recent_trades
                     GROUP BY resource
                 )
            UPDATE session_economy_state
            SET
                wood_avg_price = COALESCE(
                        (SELECT avg_price FROM averages WHERE resource = 'wood'),
                        wood_avg_price
                                 ),
                stone_avg_price = COALESCE(
                        (SELECT avg_price FROM averages WHERE resource = 'stone'),
                        stone_avg_price
                                  ),
                grain_avg_price = COALESCE(
                        (SELECT avg_price FROM averages WHERE resource = 'grain'),
                        grain_avg_price
                                  ),
                last_calculated_at = now()
            WHERE session_id = $1
        `,
        [sessionId, AVG_PRICE_TRADE_QUANTITY_CAP]
    );
}

async function applyEconomyPressuresAndSaveSnapshot(
    queryable: Pick<typeof pool, "query">,
    sessionId: string,
    reason: EconomySnapshotReason,
    pressures: EconomyPressures = {}
): Promise<void> {
    const demandSupplyPressure = pressures.demandSupplyPressure ?? 0;
    const overpricePressure = pressures.overpricePressure ?? 0;
    const recyclePressure = pressures.recyclePressure ?? 0;

    const totalPositivePressure =
        demandSupplyPressure + overpricePressure + recyclePressure;

    const currentEconomyResult = await queryable.query(
        `
        SELECT
            inflation,
            wood_avg_price,
            stone_avg_price,
            grain_avg_price
        FROM session_economy_state
        WHERE session_id = $1
        FOR UPDATE
        `,
        [sessionId]
    );

    if (currentEconomyResult.rows.length === 0) {
        throw new Error("Starea economiei nu există pentru această sesiune.");
    }

    const economy = currentEconomyResult.rows[0];

    const currentInflation = Number(economy.inflation);
    const inflationDelta = Math.round(totalPositivePressure);
    const nextInflation = clampNumber(currentInflation + inflationDelta, 0, 100);

    await queryable.query(
        `
        UPDATE session_economy_state
        SET inflation = $2,
            last_calculated_at = now()
        WHERE session_id = $1
        `,
        [sessionId, nextInflation]
    );

    const updatedEconomyResult = await queryable.query(
        `
        SELECT
            inflation,
            wood_avg_price,
            stone_avg_price,
            grain_avg_price
        FROM session_economy_state
        WHERE session_id = $1
        `,
        [sessionId]
    );

    const updatedEconomy = updatedEconomyResult.rows[0];

    await queryable.query(
        `
        INSERT INTO economy_snapshots (
            session_id,
            inflation,
            wood_avg_price,
            stone_avg_price,
            grain_avg_price,
            demand_supply_pressure,
            overprice_pressure,
            recycle_pressure,
            reason
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9::economy_snapshot_reason
        )
        `,
        [
            sessionId,
            Number(updatedEconomy.inflation),
            Number(updatedEconomy.wood_avg_price),
            Number(updatedEconomy.stone_avg_price),
            Number(updatedEconomy.grain_avg_price),
            demandSupplyPressure,
            overpricePressure,
            recyclePressure,
            reason,
        ]
    );
}

async function acceptMarketOffer(user: AuthenticatedUser, rawPayload: unknown) {
    const payload = parseAcceptMarketOfferPayload(rawPayload);

    if (!payload) {
        throw new Error("Payload invalid pentru ACCEPT_MARKET_OFFER.");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const acceptor = await getHumanParticipantForSession(
            client,
            user,
            payload.sessionId
        );

        const sessionResult = await client.query(
            `
            SELECT status, current_minute
            FROM game_sessions
            WHERE id = $1
            FOR UPDATE
            `,
            [payload.sessionId]
        );

        if (sessionResult.rows.length === 0) {
            throw new Error("Sesiunea nu există.");
        }

        const session = sessionResult.rows[0];
        const currentMinute = Number(session.current_minute);

        if (session.status !== "active") {
            throw new Error("Tranzacțiile sunt disponibile doar într-o sesiune activă.");
        }

        if (currentMinute < MARKET_OPEN_MINUTE || currentMinute >= MARKET_CLOSE_MINUTE) {
            throw new Error("Piața este închisă. Program: 09:00–17:00.");
        }

        const offerResult = await client.query(
            `
            SELECT
                id,
                creator_participant_id,
                offer_type,
                resource,
                min_quantity,
                remaining_quantity,
                price_per_unit,
                status,
                expires_at
            FROM market_offers
            WHERE id = $1
              AND session_id = $2
            FOR UPDATE
            `,
            [payload.offerId, payload.sessionId]
        );

        if (offerResult.rows.length === 0) {
            throw new Error("Oferta nu există.");
        }

        const offer = offerResult.rows[0];

        if (offer.status !== "active") {
            throw new Error("Oferta nu mai este activă.");
        }

        if (new Date(offer.expires_at).getTime() <= Date.now()) {
            await client.query(
                `
                UPDATE market_offers
                SET status = 'expired',
                    updated_at = now()
                WHERE id = $1
                `,
                [offer.id]
            );

            throw new Error("Oferta a expirat.");
        }

        const creatorParticipantId = String(offer.creator_participant_id);
        const acceptorParticipantId = String(acceptor.id);

        if (creatorParticipantId === acceptorParticipantId) {
            throw new Error("Nu poți accepta propria ofertă.");
        }

        const minQuantity = Number(offer.min_quantity);
        const remainingQuantity = Number(offer.remaining_quantity);
        const quantity = payload.quantity;
        const pricePerUnit = Number(offer.price_per_unit);
        const totalPrice = quantity * pricePerUnit;
        const resource = offer.resource as ResourceType;
        const offerType = offer.offer_type as OfferType;
        const averagePriceColumn = getAveragePriceColumn(resource);

        const economyBeforeTradeResult = await client.query(
            `
            SELECT ${averagePriceColumn} AS average_price
            FROM session_economy_state
            WHERE session_id = $1
            FOR UPDATE
            `,
            [payload.sessionId]
        );

        const averagePriceBeforeTrade = Number(
            economyBeforeTradeResult.rows[0]?.average_price ?? 1
        );

        const overpricePressure = calculateOverpricePressure(
            pricePerUnit,
            averagePriceBeforeTrade
        );

        if (quantity < minQuantity) {
            throw new Error(`Cantitatea minimă acceptată este ${minQuantity}.`);
        }

        if (quantity > remainingQuantity) {
            throw new Error("Cantitatea cerută depășește cantitatea disponibilă.");
        }

        const sellerParticipantId =
            offerType === "sell" ? creatorParticipantId : acceptorParticipantId;

        const buyerParticipantId =
            offerType === "sell" ? acceptorParticipantId : creatorParticipantId;

        const sellerResourceResult = await client.query(
            `
            SELECT amount
            FROM player_resources
            WHERE participant_id = $1
              AND resource = $2
            FOR UPDATE
            `,
            [sellerParticipantId, resource]
        );

        const sellerResourceAmount = Number(sellerResourceResult.rows[0]?.amount ?? 0);

        if (sellerResourceAmount < quantity) {
            throw new Error("Vânzătorul nu mai are suficiente resurse pentru tranzacție.");
        }

        const buyerStateResult = await client.query(
            `
            SELECT galbeni
            FROM player_states
            WHERE participant_id = $1
            FOR UPDATE
            `,
            [buyerParticipantId]
        );

        const buyerGalbeni = Number(buyerStateResult.rows[0]?.galbeni ?? 0);

        if (buyerGalbeni < totalPrice) {
            throw new Error("Cumpărătorul nu are suficienți galbeni.");
        }

        await client.query(
            `
            UPDATE player_resources
            SET amount = amount - $3,
                updated_at = now()
            WHERE participant_id = $1
              AND resource = $2
            `,
            [sellerParticipantId, resource, quantity]
        );

        await client.query(
            `
            UPDATE player_resources
            SET amount = amount + $3,
                updated_at = now()
            WHERE participant_id = $1
              AND resource = $2
            `,
            [buyerParticipantId, resource, quantity]
        );

        await client.query(
            `
            UPDATE player_states
            SET galbeni = galbeni - $2,
                updated_at = now()
            WHERE participant_id = $1
            `,
            [buyerParticipantId, totalPrice]
        );

        await client.query(
            `
            UPDATE player_states
            SET galbeni = galbeni + $2,
                updated_at = now()
            WHERE participant_id = $1
            `,
            [sellerParticipantId, totalPrice]
        );

        const transactionResult = await client.query(
            `
            INSERT INTO trade_transactions (
                session_id,
                offer_id,
                seller_participant_id,
                buyer_participant_id,
                resource,
                quantity,
                price_per_unit
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5::resource_type,
                $6,
                $7
            )
            RETURNING id, resource, quantity, price_per_unit, total_price, created_at
            `,
            [
                payload.sessionId,
                offer.id,
                sellerParticipantId,
                buyerParticipantId,
                resource,
                quantity,
                pricePerUnit,
            ]
        );

        const newRemainingQuantity = remainingQuantity - quantity;

        await client.query(
            `
            UPDATE market_offers
            SET remaining_quantity = $2,
                status = CASE
                    WHEN $2 = 0 THEN 'completed'::offer_status
                    ELSE 'active'::offer_status
                END,
                updated_at = now()
            WHERE id = $1
            `,
            [offer.id, newRemainingQuantity]
        );

        await updateAveragePricesAfterTrade(client, payload.sessionId);

        const demandSupplyPressure = await calculateDemandSupplyPressure(
            client,
            payload.sessionId
        );

        await applyEconomyPressuresAndSaveSnapshot(
            client,
            payload.sessionId,
            "trade",
            {
                demandSupplyPressure,
                overpricePressure,
            }
        );

        await client.query("COMMIT");

        return {
            sessionId: payload.sessionId,
            transaction: transactionResult.rows[0],
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function finalizeSessionIfNeeded(
    sessionId: string
): Promise<SessionFinalResult | null> {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const sessionResult = await client.query(
            `
            SELECT id, status, result
            FROM game_sessions
            WHERE id = $1
            FOR UPDATE
            `,
            [sessionId]
        );

        if (sessionResult.rows.length === 0) {
            throw new Error("Sesiunea nu există.");
        }

        const session = sessionResult.rows[0];

        if (session.status !== "finished") {
            await client.query("COMMIT");
            return null;
        }

        if (session.result !== "pending") {
            await client.query("COMMIT");
            return await getSessionFinalResult(sessionId);
        }

        const economyResult = await client.query(
            `
            SELECT inflation, wood_avg_price, stone_avg_price, grain_avg_price
            FROM session_economy_state
            WHERE session_id = $1
            FOR UPDATE
            `,
            [sessionId]
        );

        if (economyResult.rows.length === 0) {
            throw new Error("Starea economiei nu există pentru această sesiune.");
        }

        const economy = economyResult.rows[0];
        const finalInflation = Number(economy.inflation);

        const participantsResult = await client.query(
            `
            WITH resource_values AS (
                SELECT
                    pr.participant_id,
                    SUM(
                        CASE pr.resource
                            WHEN 'wood' THEN pr.amount * $2::numeric
                            WHEN 'stone' THEN pr.amount * $3::numeric
                            WHEN 'grain' THEN pr.amount * $4::numeric
                            ELSE 0
                        END
                    ) AS resource_value
                FROM player_resources pr
                GROUP BY pr.participant_id
            ),
            building_values AS (
                SELECT
                    participant_id,
                    SUM(level * $5::integer) AS building_value
                FROM player_buildings
                WHERE session_id = $1
                GROUP BY participant_id
            ),
            trade_values AS (
                SELECT
                    participant_id,
                    COUNT(*) AS trades_count,
                    SUM(total_price) AS total_traded_value
                FROM (
                    SELECT seller_participant_id AS participant_id, total_price
                    FROM trade_transactions
                    WHERE session_id = $1

                    UNION ALL

                    SELECT buyer_participant_id AS participant_id, total_price
                    FROM trade_transactions
                    WHERE session_id = $1
                ) t
                GROUP BY participant_id
            )
            SELECT
                sp.id AS participant_id,
                sp.display_name,
                COALESCE(ps.galbeni, 0) AS galbeni,
                COALESCE(ps.total_recycled_amount, 0) AS total_recycled_amount,
                COALESCE(rv.resource_value, 0) AS resource_value,
                COALESCE(bv.building_value, 0) AS building_value,
                COALESCE(tv.trades_count, 0) AS trades_count,
                COALESCE(tv.total_traded_value, 0) AS total_traded_value
            FROM session_participants sp
            LEFT JOIN player_states ps
              ON ps.participant_id = sp.id
            LEFT JOIN resource_values rv
              ON rv.participant_id = sp.id
            LEFT JOIN building_values bv
              ON bv.participant_id = sp.id
            LEFT JOIN trade_values tv
              ON tv.participant_id = sp.id
            WHERE sp.session_id = $1
              AND sp.participant_type = 'human'
            ORDER BY sp.joined_at ASC
            `,
            [
                sessionId,
                Number(economy.wood_avg_price),
                Number(economy.stone_avg_price),
                Number(economy.grain_avg_price),
                BUILDING_SCORE_PER_LEVEL,
            ]
        );

        const finalRows = participantsResult.rows.map((row) => {
            const galbeni = Number(row.galbeni ?? 0);
            const resourceValue = Number(row.resource_value ?? 0);
            const buildingValue = Number(row.building_value ?? 0);
            const tradesCount = Number(row.trades_count ?? 0);
            const totalTradedValue = Number(row.total_traded_value ?? 0);
            const totalRecycledAmount = Number(row.total_recycled_amount ?? 0);

            const tradeBonus = Math.floor(
                totalTradedValue / TRADE_VALUE_SCORE_DIVISOR
            );

            const economicScore = Math.max(
                0,
                Math.round(galbeni + resourceValue + buildingValue + tradeBonus)
            );

            return {
                participantId: String(row.participant_id),
                displayName: String(row.display_name),
                economicScore,
                rank: getRankForEconomicScore(economicScore),
                tradesCount,
                totalTradedValue,
                totalRecycledAmount,
            };
        });

        const averageEconomicScore =
            finalRows.length === 0
                ? 0
                : Math.round(
                    finalRows.reduce((sum, row) => sum + row.economicScore, 0) /
                    finalRows.length
                );

        const collectiveResult =
            finalInflation >= INFLATION_LOSS_THRESHOLD ||
            averageEconomicScore < MIN_AVERAGE_ECONOMIC_SCORE
                ? "loss"
                : "win";

        for (const row of finalRows) {
            await client.query(
                `
                INSERT INTO player_session_results (
                    session_id,
                    participant_id,
                    economic_score,
                    rank,
                    trades_count,
                    total_traded_value,
                    total_recycled_amount
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (session_id, participant_id)
                DO UPDATE SET
                    economic_score = EXCLUDED.economic_score,
                    rank = EXCLUDED.rank,
                    trades_count = EXCLUDED.trades_count,
                    total_traded_value = EXCLUDED.total_traded_value,
                    total_recycled_amount = EXCLUDED.total_recycled_amount
                `,
                [
                    sessionId,
                    row.participantId,
                    row.economicScore,
                    row.rank,
                    row.tradesCount,
                    row.totalTradedValue,
                    row.totalRecycledAmount,
                ]
            );

            await client.query(
                `
                UPDATE player_states
                SET economic_score = $2,
                    updated_at = now()
                WHERE participant_id = $1
                `,
                [row.participantId, row.economicScore]
            );
        }

        await client.query(
            `
            UPDATE game_sessions
            SET final_inflation = $2,
                result = $3::collective_result,
                ended_at = COALESCE(ended_at, now()),
                updated_at = now()
            WHERE id = $1
            `,
            [sessionId, finalInflation, collectiveResult]
        );

        await applyEconomyPressuresAndSaveSnapshot(
            client,
            sessionId,
            "session_end"
        );

        await client.query("COMMIT");

        return {
            sessionId,
            finalInflation,
            collectiveResult,
            averageEconomicScore,
            results: finalRows,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

function requireWsUser(ws: AuthenticatedWebSocket): AuthenticatedUser | null {
    if (!ws.user) {
        sendJson(ws, "ERROR", {
            message: "User not authenticated.",
        });
        return null;
    }

    return ws.user;
}

async function broadcastMarketStateToSession(sessionId: string): Promise<void> {
    for (const client of connectedClients) {
        if (
            client.readyState !== WebSocket.OPEN ||
            !client.user ||
            client.currentSessionId !== sessionId
        ) {
            continue;
        }

        const marketState = await getMarketStateForUser(client.user, sessionId);
        sendJson(client, "MARKET_STATE", marketState);
    }
}

async function broadcastSessionStateToSession(sessionId: string): Promise<void> {
    for (const client of connectedClients) {
        if (
            client.readyState !== WebSocket.OPEN ||
            !client.user ||
            client.currentSessionId !== sessionId
        ) {
            continue;
        }

        const sessionState = await getSessionStateForUser(client.user, sessionId);
        sendJson(client, "SESSION_STATE", sessionState);
    }
}

async function handleClientMessage(ws: AuthenticatedWebSocket, message: ClientMessage) {
    switch (message.type) {
        case "PING": {
            sendJson(ws, "PONG", {
                receivedAt: new Date().toISOString(),
                user: ws.user,
            });
            break;
        }

        case "CREATE_DEMO_SESSION": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            try {
                const sessionState = await createDemoSession(user);
                ws.currentSessionId = sessionState.sessionId;

                sendJson(ws, "SESSION_STATE", sessionState);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error
                        ? error.message
                        : "Could not create demo session.",
                });
            }

            break;
        }

        case "BUILD_BUILDING": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            try {
                const sessionState = await buildBuilding(user, message.payload);
                sendJson(ws, "SESSION_STATE", sessionState);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error ? error.message : "Construirea a eșuat.",
                });
            }

            break;
        }

        case "UPGRADE_BUILDING": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            try {
                const sessionState = await upgradeBuilding(user, message.payload);
                sendJson(ws, "SESSION_STATE", sessionState);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error ? error.message : "Upgrade-ul a eșuat.",
                });
            }

            break;
        }

        case "COLLECT_BUILDING": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            try {
                const sessionState = await collectBuilding(user, message.payload);
                sendJson(ws, "SESSION_STATE", sessionState);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error ? error.message : "Colectarea a eșuat.",
                });
            }

            break;
        }

        case "GET_MARKET_STATE": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            const payload = message.payload;

            if (!isRecord(payload) || typeof payload.sessionId !== "string") {
                sendJson(ws, "ERROR", {
                    message: "Payload invalid pentru GET_MARKET_STATE.",
                });
                return;
            }

            try {
                ws.currentSessionId = payload.sessionId;

                const marketState = await getMarketStateForUser(
                    user,
                    payload.sessionId
                );

                sendJson(ws, "MARKET_STATE", marketState);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error
                        ? error.message
                        : "Nu s-a putut încărca piața.",
                });
            }

            break;
        }

        case "CREATE_MARKET_OFFER": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            try {
                const result = await createMarketOffer(user, message.payload);
                ws.currentSessionId = result.sessionId;

                sendJson(ws, "OFFER_CREATED", result.offer);
                await broadcastMarketStateToSession(result.sessionId);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error
                        ? error.message
                        : "Crearea ofertei a eșuat.",
                });
            }

            break;
        }

        case "ACCEPT_MARKET_OFFER": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            try {
                const result = await acceptMarketOffer(user, message.payload);
                ws.currentSessionId = result.sessionId;

                sendJson(ws, "TRADE_COMPLETED", result.transaction);

                await broadcastSessionStateToSession(result.sessionId);
                await broadcastMarketStateToSession(result.sessionId);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error
                        ? error.message
                        : "Acceptarea ofertei a eșuat.",
                });
            }

            break;
        }

        case "DEV_SEED_BOT_OFFER": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            if (process.env.NODE_ENV === "production") {
                sendJson(ws, "ERROR", {
                    message: "Comenzile DEV nu sunt disponibile în production.",
                });
                return;
            }

            try {
                const result = await seedBotOfferForTesting(user, message.payload);
                ws.currentSessionId = result.sessionId;

                sendJson(ws, "DEV_BOT_OFFER_CREATED", result.offer);

                await broadcastSessionStateToSession(result.sessionId);
                await broadcastMarketStateToSession(result.sessionId);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error
                        ? error.message
                        : "Nu s-a putut crea oferta de test.",
                });
            }

            break;
        }

        case "DEV_FORCE_FINISH_SESSION": {
            const user = requireWsUser(ws);

            if (!user) {
                return;
            }

            if (process.env.NODE_ENV === "production") {
                sendJson(ws, "ERROR", {
                    message: "Comenzile DEV nu sunt disponibile în production.",
                });
                return;
            }

            try {
                const finalResult = await forceFinishSessionForTesting(
                    user,
                    message.payload
                );

                await broadcastSessionStateToSession(finalResult.sessionId);

                for (const client of connectedClients) {
                    if (
                        client.readyState !== WebSocket.OPEN ||
                        !client.user ||
                        client.currentSessionId !== finalResult.sessionId
                    ) {
                        continue;
                    }

                    sendJson(client, "GAME_FINISHED", finalResult);
                }
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error
                        ? error.message
                        : "Nu s-a putut finaliza sesiunea.",
                });
            }

            break;
        }

        default: {
            sendJson(ws, "ERROR", {
                message: `Unknown message type: ${message.type}`,
            });
            break;
        }
    }
}

export function setupWebSocketServer(server: HttpServer) {
    const wss = new WebSocketServer({
        server,
        path: "/ws",
    });

    startGameLoop();

    wss.on("connection", (socket, request) => {
        const ws = socket as AuthenticatedWebSocket;
        const user = authenticateRequest(request);

        if (!user) {
            sendJson(ws, "ERROR", {
                message: "Unauthorized WebSocket connection",
            });

            ws.close(1008, "Unauthorized");
            return;
        }

        ws.user = user;

        connectedClients.add(ws);

        console.log(`WebSocket connected: ${user.username} (${user.id})`);

        sendJson(ws, "AUTHENTICATED", {
            user,
            message: "WebSocket connection established",
        });

        ws.on("message", (rawMessage) => {
            const message = parseClientMessage(rawMessage);

            if (!message) {
                sendJson(ws, "ERROR", {
                    message: "Invalid JSON message",
                });
                return;
            }

            handleClientMessage(ws, message).catch((error) => {
                console.error("WebSocket message handling failed:", error);

                sendJson(ws, "ERROR", {
                    message: "Server error while handling WebSocket message.",
                });
            });
        });

        ws.on("close", () => {
            console.log(`WebSocket disconnected: ${user.username} (${user.id})`);
            connectedClients.delete(ws);
        });

        ws.on("error", (error) => {
            console.error("WebSocket error:", error);
        });
    });

    console.log("WebSocket server mounted on /ws");

    return wss;
}