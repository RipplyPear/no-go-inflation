import type { IncomingMessage, Server as HttpServer } from "node:http";
import { WebSocket, WebSocketServer, type RawData } from "ws";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";
import { generatePlayerMap, type TileType } from "../game/mapGenerator";

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

type BuildingType = "farm" | "mine" | "lumberyard";
type ResourceType = "wood" | "stone" | "grain";

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

const GAME_TICK_REAL_SECONDS = 5;
const GAME_MINUTES_PER_TICK = 5;

function startGameLoop(): void {
    if (gameLoopStarted) {
        return;
    }

    gameLoopStarted = true;

    setInterval(() => {
        void processGameLoopTick(GAME_MINUTES_PER_TICK);
    }, GAME_TICK_REAL_SECONDS * 1000);
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
            await advanceSessionTime(sessionId, gameMinutesToAdvance);

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
            }
        } catch (error) {
            console.error("Game loop tick failed:", error);
        }
    }
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

type BuildBuildingPayload = {
    sessionId: string;
    x: number;
    y: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBuildBuildingPayload(payload: unknown): BuildBuildingPayload | null {
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

type UpgradeBuildingPayload = {
    sessionId: string;
    x: number;
    y: number;
};

function parseUpgradeBuildingPayload(payload: unknown): UpgradeBuildingPayload | null {
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

type CollectBuildingPayload = {
    sessionId: string;
    x: number;
    y: number;
};

function parseCollectBuildingPayload(payload: unknown): CollectBuildingPayload | null {
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

async function collectBuilding(user: AuthenticatedUser, rawPayload: unknown) {
    const payload = parseCollectBuildingPayload(rawPayload);

    if (!payload) {
        throw new Error("Payload invalid pentru COLLECT_BUILDING.");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const participantResult = await client.query(
            `
            SELECT id
            FROM session_participants
            WHERE session_id = $1
              AND user_id = $2
            LIMIT 1
            `,
            [payload.sessionId, user.id]
        );

        if (participantResult.rows.length === 0) {
            throw new Error("Jucătorul nu aparține acestei sesiuni.");
        }

        const participant = participantResult.rows[0];

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
    const payload = parseUpgradeBuildingPayload(rawPayload);

    if (!payload) {
        throw new Error("Payload invalid pentru UPGRADE_BUILDING.");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const participantResult = await client.query(
            `
            SELECT id
            FROM session_participants
            WHERE session_id = $1
              AND user_id = $2
            LIMIT 1
            `,
            [payload.sessionId, user.id]
        );

        if (participantResult.rows.length === 0) {
            throw new Error("Jucătorul nu aparține acestei sesiuni.");
        }

        const participant = participantResult.rows[0];

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
            VALUES ($1, $2, 100, 0, 0)
            `,
            [session.id, participant.id]
        );

        for (const resource of ["wood", "stone", "grain"]) {
            await client.query(
                `
                INSERT INTO player_resources (
                    participant_id,
                    resource,
                    amount
                )
                VALUES ($1, $2, 200)
                `,
                [participant.id, resource]
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
            VALUES ($1, 20, 1.00, 1.00, 1.00)
            `,
            [session.id]
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
                wood: 200,
                stone: 200,
                grain: 200,
                galbeni: 100,
            },
            economy: {
                inflation: 20,
                averagePrices: {
                    wood: 1,
                    stone: 1,
                    grain: 1,
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
                wood: Number(economyRow?.wood_avg_price ?? 1),
                stone: Number(economyRow?.stone_avg_price ?? 1),
                grain: Number(economyRow?.grain_avg_price ?? 1),
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

async function advanceSessionTime(
    sessionId: string,
    gameMinutesToAdvance: number
): Promise<void> {
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
            return;
        }

        const currentDay = Number(session.current_day);
        const currentMinute = Number(session.current_minute);

        let nextDay = currentDay;
        let nextMinute = currentMinute + gameMinutesToAdvance;
        let nextStatus = "active";

        if (nextMinute > 1200) {
            if (currentDay >= 5) {
                nextDay = 5;
                nextMinute = 1200;
                nextStatus = "finished";
            } else {
                nextDay = currentDay + 1;
                nextMinute = 480;
            }
        }

        await client.query(
            `
            UPDATE game_sessions
            SET current_day = $2,
                current_minute = $3,
                status = $4,
                updated_at = now()
            WHERE id = $1
            `,
            [sessionId, nextDay, nextMinute, nextStatus]
        );

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
            [sessionId, gameMinutesToAdvance]
        );

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function buildBuilding(user: AuthenticatedUser, rawPayload: unknown) {
    const payload = parseBuildBuildingPayload(rawPayload);

    if (!payload) {
        throw new Error("Payload invalid pentru BUILD_BUILDING.");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const participantResult = await client.query(
            `
            SELECT id
            FROM session_participants
            WHERE session_id = $1
              AND user_id = $2
            LIMIT 1
            `,
            [payload.sessionId, user.id]
        );

        if (participantResult.rows.length === 0) {
            throw new Error("Jucătorul nu aparține acestei sesiuni.");
        }

        const participant = participantResult.rows[0];

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
            if (!ws.user) {
                sendJson(ws, "ERROR", {
                    message: "User not authenticated.",
                });
                return;
            }

            try {
                const sessionState = await createDemoSession(ws.user);
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
            if (!ws.user) {
                sendJson(ws, "ERROR", {
                    message: "User not authenticated.",
                });
                return;
            }

            try {
                const sessionState = await buildBuilding(ws.user, message.payload);
                sendJson(ws, "SESSION_STATE", sessionState);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error ? error.message : "Construirea a eșuat.",
                });
            }

            break;
        }

        case "UPGRADE_BUILDING": {
            if (!ws.user) {
                sendJson(ws, "ERROR", {
                    message: "User not authenticated.",
                });
                return;
            }

            try {
                const sessionState = await upgradeBuilding(ws.user, message.payload);
                sendJson(ws, "SESSION_STATE", sessionState);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error ? error.message : "Upgrade-ul a eșuat.",
                });
            }

            break;
        }

        case "COLLECT_BUILDING": {
            if (!ws.user) {
                sendJson(ws, "ERROR", {
                    message: "User not authenticated.",
                });
                return;
            }

            try {
                const sessionState = await collectBuilding(ws.user, message.payload);
                sendJson(ws, "SESSION_STATE", sessionState);
            } catch (error) {
                sendJson(ws, "ERROR", {
                    message: error instanceof Error ? error.message : "Colectarea a eșuat.",
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