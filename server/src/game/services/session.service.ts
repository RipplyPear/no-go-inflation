import {AuthenticatedUser} from "../../websocket/ws.types";
import {pool} from "../../config/db";
import {generatePlayerMap, type TileType} from "../mapGenerator";
import {INITIAL_AVERAGE_PRICE, INITIAL_GALBENI, INITIAL_INFLATION, INITIAL_RESOURCE_AMOUNT} from "../game.constants";
import {ResourceType} from "../game.types";
import {randomInt} from "node:crypto";
import {parseJoinLobbyPayload, parseStartSessionPayload} from "../../websocket/wsPayloadParsers";

const LOBBY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LOBBY_CODE_LENGTH = 6;
const MAX_LOBBY_PARTICIPANTS = 8;

// Pentru test rapid poate rămâne 1.
// Dacă vrei regulă strict multiplayer, îl schimbăm ulterior la 2.
const MIN_PARTICIPANTS_TO_START = 1;

type Queryable = Pick<typeof pool, "query">;

function generateLobbyCode(): string {
    let code = "";

    for (let i = 0; i < LOBBY_CODE_LENGTH; i++) {
        code += LOBBY_CODE_ALPHABET[randomInt(LOBBY_CODE_ALPHABET.length)];
    }

    return code;
}

async function generateUniqueLobbyCode(queryable: Queryable): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
        const lobbyCode = generateLobbyCode();

        const result = await queryable.query(
            `
            SELECT 1
            FROM game_sessions
            WHERE lobby_code = $1
            LIMIT 1
            `,
            [lobbyCode]
        );

        if (result.rows.length === 0) {
            return lobbyCode;
        }
    }

    throw new Error("Nu s-a putut genera un cod unic pentru lobby.");
}

async function initializeParticipantGameState(
    queryable: Queryable,
    sessionId: string,
    participantId: string
): Promise<void> {
    const playerMap = generatePlayerMap();

    await queryable.query(
        `
        INSERT INTO player_states (
            session_id,
            participant_id,
            galbeni,
            economic_score,
            total_recycled_amount
        )
        VALUES ($1, $2, $3, 0, 0)
        ON CONFLICT (participant_id) DO NOTHING
        `,
        [sessionId, participantId, INITIAL_GALBENI]
    );

    for (const resource of ["wood", "stone", "grain"] as const) {
        await queryable.query(
            `
            INSERT INTO player_resources (
                participant_id,
                resource,
                amount
            )
            VALUES ($1, $2, $3)
            ON CONFLICT (participant_id, resource) DO NOTHING
            `,
            [participantId, resource, INITIAL_RESOURCE_AMOUNT]
        );
    }

    for (let y = 0; y < playerMap.tiles.length; y++) {
        for (let x = 0; x < playerMap.tiles[y].length; x++) {
            await queryable.query(
                `
                INSERT INTO player_map_tiles (
                    participant_id,
                    tile_x,
                    tile_y,
                    tile
                )
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (participant_id, tile_x, tile_y) DO NOTHING
                `,
                [participantId, x, y, playerMap.tiles[y][x]]
            );
        }
    }
}

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

export async function createLobby(user: AuthenticatedUser) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const lobbyCode = await generateUniqueLobbyCode(client);

        const sessionResult = await client.query(
            `
            INSERT INTO game_sessions (
                host_user_id,
                lobby_code,
                is_private,
                status
            )
            VALUES ($1, $2, true, 'lobby')
            RETURNING id
            `,
            [user.id, lobbyCode]
        );

        const session = sessionResult.rows[0];

        await client.query(
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
            `,
            [session.id, user.id, user.username]
        );

        await client.query("COMMIT");

        return getLobbyStateForUser(user, session.id);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function joinLobby(user: AuthenticatedUser, rawPayload: unknown) {
    const payload = parseJoinLobbyPayload(rawPayload);

    if (!payload) {
        throw new Error("Payload invalid pentru JOIN_LOBBY.");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const sessionResult = await client.query(
            `
            SELECT id, status
            FROM game_sessions
            WHERE lobby_code = $1
            FOR UPDATE
            `,
            [payload.lobbyCode]
        );

        if (sessionResult.rows.length === 0) {
            throw new Error("Lobby-ul nu există.");
        }

        const session = sessionResult.rows[0];

        if (session.status !== "lobby") {
            throw new Error("Lobby-ul nu mai este disponibil.");
        }

        const existingParticipantResult = await client.query(
            `
            SELECT id
            FROM session_participants
            WHERE session_id = $1
              AND user_id = $2
            LIMIT 1
            `,
            [session.id, user.id]
        );

        if (existingParticipantResult.rows.length > 0) {
            await client.query(
                `
                UPDATE session_participants
                SET is_connected = true,
                    last_seen_at = now()
                WHERE session_id = $1
                  AND user_id = $2
                `,
                [session.id, user.id]
            );

            await client.query("COMMIT");
            return getLobbyStateForUser(user, session.id);
        }

        const participantCountResult = await client.query(
            `
            SELECT COUNT(*) AS participant_count
            FROM session_participants
            WHERE session_id = $1
            `,
            [session.id]
        );

        const participantCount = Number(participantCountResult.rows[0]?.participant_count ?? 0);

        if (participantCount >= MAX_LOBBY_PARTICIPANTS) {
            throw new Error("Lobby-ul este plin.");
        }

        await client.query(
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
            VALUES ($1, $2, 'human', 'player', $3, true, true)
            `,
            [session.id, user.id, user.username]
        );

        await client.query("COMMIT");

        return getLobbyStateForUser(user, session.id);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function startLobbySession(user: AuthenticatedUser, rawPayload: unknown) {
    const payload = parseStartSessionPayload(rawPayload);

    if (!payload) {
        throw new Error("Payload invalid pentru START_SESSION.");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const sessionResult = await client.query(
            `
            SELECT id, status, host_user_id
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

        if (session.status !== "lobby") {
            throw new Error("Sesiunea nu este în starea lobby.");
        }

        if (Number(session.host_user_id) !== user.id) {
            throw new Error("Doar host-ul poate porni sesiunea.");
        }

        const participantsResult = await client.query(
            `
            SELECT id
            FROM session_participants
            WHERE session_id = $1
            ORDER BY joined_at
            `,
            [payload.sessionId]
        );

        if (participantsResult.rows.length < MIN_PARTICIPANTS_TO_START) {
            throw new Error("Nu sunt suficienți participanți pentru pornirea sesiunii.");
        }

        for (const participant of participantsResult.rows) {
            await initializeParticipantGameState(
                client,
                payload.sessionId,
                participant.id
            );
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
            ON CONFLICT (session_id) DO NOTHING
            `,
            [payload.sessionId, INITIAL_INFLATION, INITIAL_AVERAGE_PRICE]
        );

        await client.query(
            `
            UPDATE game_sessions
            SET status = 'active',
                started_at = COALESCE(started_at, now()),
                updated_at = now()
            WHERE id = $1
            `,
            [payload.sessionId]
        );

        await client.query("COMMIT");

        return {
            sessionId: payload.sessionId,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function getLobbyStateForUser(user: AuthenticatedUser, sessionId: string) {
    const sessionResult = await pool.query(
        `
        SELECT id, lobby_code, status, host_user_id
        FROM game_sessions
        WHERE id = $1
        `,
        [sessionId]
    );

    if (sessionResult.rows.length === 0) {
        throw new Error("Lobby-ul nu există.");
    }

    const session = sessionResult.rows[0];

    const participantResult = await pool.query(
        `
        SELECT id, display_name, role, is_ready, is_connected
        FROM session_participants
        WHERE session_id = $1
          AND user_id = $2
        LIMIT 1
        `,
        [sessionId, user.id]
    );

    if (participantResult.rows.length === 0) {
        throw new Error("Jucătorul nu aparține acestui lobby.");
    }

    const participant = participantResult.rows[0];

    const participantsResult = await pool.query(
        `
        SELECT id, user_id, display_name, role, is_ready, is_connected
        FROM session_participants
        WHERE session_id = $1
        ORDER BY joined_at
        `,
        [sessionId]
    );

    return {
        sessionId: session.id,
        lobbyCode: session.lobby_code,
        status: session.status,
        hostUserId: Number(session.host_user_id),
        participant: {
            id: participant.id,
            displayName: participant.display_name,
            role: participant.role,
            isReady: Boolean(participant.is_ready),
            isConnected: Boolean(participant.is_connected),
        },
        participants: participantsResult.rows.map((row) => ({
            id: row.id,
            userId: row.user_id === null ? null : Number(row.user_id),
            displayName: row.display_name,
            role: row.role,
            isReady: Boolean(row.is_ready),
            isConnected: Boolean(row.is_connected),
        })),
    };
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