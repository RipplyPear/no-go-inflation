import {AuthenticatedUser} from "../../websocket/ws.types";
import {pool} from "../../config/db";
import {generatePlayerMap, type TileType} from "../mapGenerator";
import {INITIAL_AVERAGE_PRICE, INITIAL_GALBENI, INITIAL_INFLATION, INITIAL_RESOURCE_AMOUNT} from "../game.constants";
import {ResourceType} from "../game.types";

export async function createDemoSession(user: AuthenticatedUser) {
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

export async function getSessionStateForUser(user: AuthenticatedUser, sessionId: string) {
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

    const tiles: TileType[][] = Array.from({length: height}, () =>
        Array.from({length: width}, () => "field" as TileType)
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