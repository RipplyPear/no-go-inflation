BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- ENUM TYPES
-- ============================================================

DO $$
    BEGIN
        CREATE TYPE resource_type AS ENUM ('wood', 'stone', 'grain');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

DO $$
    BEGIN
        CREATE TYPE tile_type AS ENUM ('field', 'quarry', 'forest');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

DO $$
    BEGIN
        CREATE TYPE building_type AS ENUM ('farm', 'mine', 'lumberyard');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

DO $$
    BEGIN
        CREATE TYPE participant_type AS ENUM ('human', 'bot');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

DO $$
    BEGIN
        CREATE TYPE participant_role AS ENUM ('host', 'player', 'bot');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

DO $$
    BEGIN
        CREATE TYPE session_status AS ENUM ('lobby', 'active', 'finished', 'cancelled');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

DO $$
    BEGIN
        CREATE TYPE collective_result AS ENUM ('pending', 'win', 'loss');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

DO $$
    BEGIN
        CREATE TYPE offer_type AS ENUM ('buy', 'sell');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

DO $$
    BEGIN
        CREATE TYPE offer_status AS ENUM ('active', 'completed', 'cancelled', 'expired');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

DO $$
    BEGIN
        CREATE TYPE economy_snapshot_reason AS ENUM (
            'session_start',
            'periodic',
            'trade',
            'recycle',
            'disconnect',
            'session_end'
            );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

-- ============================================================
-- GAME SESSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS game_sessions (
                                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                                             host_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

                                             lobby_code TEXT UNIQUE,
                                             is_private BOOLEAN NOT NULL DEFAULT false,

                                             status session_status NOT NULL DEFAULT 'lobby',

    -- 1 = luni, 5 = vineri
                                             current_day INTEGER NOT NULL DEFAULT 1,

    -- minute in-game: 08:00 = 480, 20:00 = 1200
                                             current_minute INTEGER NOT NULL DEFAULT 480,

                                             final_inflation INTEGER,
                                             result collective_result NOT NULL DEFAULT 'pending',

                                             started_at TIMESTAMPTZ,
                                             ended_at TIMESTAMPTZ,

                                             created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                             updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

                                             CONSTRAINT game_sessions_day_valid CHECK (current_day BETWEEN 1 AND 5),
                                             CONSTRAINT game_sessions_minute_valid CHECK (current_minute BETWEEN 480 AND 1200),
                                             CONSTRAINT game_sessions_final_inflation_valid CHECK (
                                                 final_inflation IS NULL OR final_inflation BETWEEN 0 AND 100
                                                 )
);

-- ============================================================
-- SESSION PARTICIPANTS
-- ============================================================

CREATE TABLE IF NOT EXISTS session_participants (
                                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                                                    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
                                                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

                                                    participant_type participant_type NOT NULL DEFAULT 'human',
                                                    role participant_role NOT NULL DEFAULT 'player',

                                                    display_name TEXT NOT NULL,

                                                    is_ready BOOLEAN NOT NULL DEFAULT false,
                                                    is_connected BOOLEAN NOT NULL DEFAULT true,

                                                    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                                    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),

                                                    CONSTRAINT session_participants_display_name_not_empty CHECK (length(trim(display_name)) > 0),

                                                    CONSTRAINT session_participants_human_has_user CHECK (
                                                        (participant_type = 'human' AND user_id IS NOT NULL)
                                                            OR
                                                        (participant_type = 'bot' AND user_id IS NULL)
                                                        ),

                                                    CONSTRAINT session_participants_role_valid CHECK (
                                                        (participant_type = 'bot' AND role = 'bot')
                                                            OR
                                                        (participant_type = 'human' AND role IN ('host', 'player'))
                                                        )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_session_participants_session_user
    ON session_participants(session_id, user_id)
    WHERE user_id IS NOT NULL;

-- ============================================================
-- PLAYER CURRENT STATE
-- ============================================================

CREATE TABLE IF NOT EXISTS player_states (
                                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                                             session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
                                             participant_id UUID NOT NULL REFERENCES session_participants(id) ON DELETE CASCADE,

                                             galbeni INTEGER NOT NULL DEFAULT 100,
                                             economic_score INTEGER NOT NULL DEFAULT 0,
                                             total_recycled_amount INTEGER NOT NULL DEFAULT 0,

                                             updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

                                             CONSTRAINT player_states_unique_participant UNIQUE (participant_id),
                                             CONSTRAINT player_states_galbeni_non_negative CHECK (galbeni >= 0),
                                             CONSTRAINT player_states_score_non_negative CHECK (economic_score >= 0),
                                             CONSTRAINT player_states_recycled_non_negative CHECK (total_recycled_amount >= 0)
);

CREATE TABLE IF NOT EXISTS player_resources (
                                                participant_id UUID NOT NULL REFERENCES session_participants(id) ON DELETE CASCADE,
                                                resource resource_type NOT NULL,

                                                amount INTEGER NOT NULL DEFAULT 0,

                                                updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

                                                PRIMARY KEY (participant_id, resource),

                                                CONSTRAINT player_resources_amount_non_negative CHECK (amount >= 0)
);

-- ============================================================
-- MAP / BUILDINGS CURRENT STATE
-- ============================================================

CREATE TABLE IF NOT EXISTS player_map_tiles (
                                                participant_id UUID NOT NULL REFERENCES session_participants(id) ON DELETE CASCADE,

                                                tile_x INTEGER NOT NULL,
                                                tile_y INTEGER NOT NULL,
                                                tile tile_type NOT NULL,

                                                PRIMARY KEY (participant_id, tile_x, tile_y),

                                                CONSTRAINT player_map_tiles_x_valid CHECK (tile_x >= 0),
                                                CONSTRAINT player_map_tiles_y_valid CHECK (tile_y >= 0)
);

CREATE TABLE IF NOT EXISTS player_buildings (
                                                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                                                session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
                                                participant_id UUID NOT NULL REFERENCES session_participants(id) ON DELETE CASCADE,

                                                tile_x INTEGER NOT NULL,
                                                tile_y INTEGER NOT NULL,

                                                tile tile_type NOT NULL,
                                                building building_type NOT NULL,

                                                level INTEGER NOT NULL DEFAULT 1,
                                                stored_amount INTEGER NOT NULL DEFAULT 0,

                                                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                                updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

                                                CONSTRAINT player_buildings_one_per_tile UNIQUE (participant_id, tile_x, tile_y),

                                                CONSTRAINT player_buildings_level_valid CHECK (level BETWEEN 1 AND 3),
                                                CONSTRAINT player_buildings_stored_non_negative CHECK (stored_amount >= 0),
                                                CONSTRAINT player_buildings_storage_capacity_valid CHECK (stored_amount <= level * 60),

                                                CONSTRAINT player_buildings_type_matches_tile CHECK (
                                                    (tile = 'field' AND building = 'farm')
                                                        OR
                                                    (tile = 'quarry' AND building = 'mine')
                                                        OR
                                                    (tile = 'forest' AND building = 'lumberyard')
                                                    ),

                                                CONSTRAINT player_buildings_tile_exists FOREIGN KEY (participant_id, tile_x, tile_y)
                                                    REFERENCES player_map_tiles(participant_id, tile_x, tile_y)
                                                    ON DELETE CASCADE
);

-- ============================================================
-- MARKET OFFERS
-- ============================================================

CREATE TABLE IF NOT EXISTS market_offers (
                                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                                             session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
                                             creator_participant_id UUID NOT NULL REFERENCES session_participants(id) ON DELETE CASCADE,

                                             offer_type offer_type NOT NULL,
                                             resource resource_type NOT NULL,

                                             min_quantity INTEGER NOT NULL,
                                             max_quantity INTEGER NOT NULL,
                                             remaining_quantity INTEGER NOT NULL,

                                             price_per_unit INTEGER NOT NULL,

                                             status offer_status NOT NULL DEFAULT 'active',

                                             expires_at TIMESTAMPTZ NOT NULL,

                                             created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                             updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

                                             CONSTRAINT market_offers_min_quantity_positive CHECK (min_quantity > 0),
                                             CONSTRAINT market_offers_max_quantity_valid CHECK (max_quantity >= min_quantity),
                                             CONSTRAINT market_offers_remaining_valid CHECK (
                                                 remaining_quantity >= 0 AND remaining_quantity <= max_quantity
                                                 ),
                                             CONSTRAINT market_offers_price_positive CHECK (price_per_unit > 0)
);

CREATE INDEX IF NOT EXISTS idx_market_offers_session_status
    ON market_offers(session_id, status);

CREATE INDEX IF NOT EXISTS idx_market_offers_resource_status
    ON market_offers(resource, status);

-- ============================================================
-- TRADE TRANSACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS trade_transactions (
                                                  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                                                  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
                                                  offer_id UUID REFERENCES market_offers(id) ON DELETE SET NULL,

                                                  seller_participant_id UUID NOT NULL REFERENCES session_participants(id) ON DELETE CASCADE,
                                                  buyer_participant_id UUID NOT NULL REFERENCES session_participants(id) ON DELETE CASCADE,

                                                  resource resource_type NOT NULL,

                                                  quantity INTEGER NOT NULL,
                                                  price_per_unit INTEGER NOT NULL,
                                                  total_price INTEGER GENERATED ALWAYS AS (quantity * price_per_unit) STORED,

                                                  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

                                                  CONSTRAINT trade_transactions_participants_different CHECK (
                                                      seller_participant_id <> buyer_participant_id
                                                      ),
                                                  CONSTRAINT trade_transactions_quantity_positive CHECK (quantity > 0),
                                                  CONSTRAINT trade_transactions_price_positive CHECK (price_per_unit > 0)
);

CREATE INDEX IF NOT EXISTS idx_trade_transactions_session
    ON trade_transactions(session_id);

CREATE INDEX IF NOT EXISTS idx_trade_transactions_created_at
    ON trade_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_trade_transactions_resource
    ON trade_transactions(resource);

-- ============================================================
-- ECONOMY CURRENT STATE
-- ============================================================

CREATE TABLE IF NOT EXISTS session_economy_state (
                                                     session_id UUID PRIMARY KEY REFERENCES game_sessions(id) ON DELETE CASCADE,

                                                     inflation INTEGER NOT NULL DEFAULT 20,

                                                     wood_avg_price NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
                                                     stone_avg_price NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
                                                     grain_avg_price NUMERIC(10, 2) NOT NULL DEFAULT 1.00,

                                                     last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

                                                     CONSTRAINT session_economy_inflation_valid CHECK (inflation BETWEEN 0 AND 100),
                                                     CONSTRAINT session_economy_wood_price_positive CHECK (wood_avg_price > 0),
                                                     CONSTRAINT session_economy_stone_price_positive CHECK (stone_avg_price > 0),
                                                     CONSTRAINT session_economy_grain_price_positive CHECK (grain_avg_price > 0)
);

CREATE TABLE IF NOT EXISTS economy_snapshots (
                                                 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                                                 session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,

                                                 inflation INTEGER NOT NULL,

                                                 wood_avg_price NUMERIC(10, 2) NOT NULL,
                                                 stone_avg_price NUMERIC(10, 2) NOT NULL,
                                                 grain_avg_price NUMERIC(10, 2) NOT NULL,

                                                 demand_supply_pressure NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
                                                 overprice_pressure NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
                                                 recycle_pressure NUMERIC(10, 2) NOT NULL DEFAULT 0.00,

                                                 reason economy_snapshot_reason NOT NULL DEFAULT 'periodic',

                                                 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

                                                 CONSTRAINT economy_snapshots_inflation_valid CHECK (inflation BETWEEN 0 AND 100),
                                                 CONSTRAINT economy_snapshots_prices_positive CHECK (
                                                     wood_avg_price > 0
                                                         AND stone_avg_price > 0
                                                         AND grain_avg_price > 0
                                                     )
);

CREATE INDEX IF NOT EXISTS idx_economy_snapshots_session_created
    ON economy_snapshots(session_id, created_at);

-- ============================================================
-- FINAL RESULTS
-- ============================================================

CREATE TABLE IF NOT EXISTS player_session_results (
                                                      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                                                      session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
                                                      participant_id UUID NOT NULL REFERENCES session_participants(id) ON DELETE CASCADE,

                                                      economic_score INTEGER NOT NULL DEFAULT 0,
                                                      rank TEXT NOT NULL,

                                                      trades_count INTEGER NOT NULL DEFAULT 0,
                                                      total_traded_value INTEGER NOT NULL DEFAULT 0,
                                                      total_recycled_amount INTEGER NOT NULL DEFAULT 0,

                                                      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

                                                      CONSTRAINT player_session_results_unique_participant UNIQUE (session_id, participant_id),

                                                      CONSTRAINT player_session_results_score_non_negative CHECK (economic_score >= 0),
                                                      CONSTRAINT player_session_results_trades_count_non_negative CHECK (trades_count >= 0),
                                                      CONSTRAINT player_session_results_traded_value_non_negative CHECK (total_traded_value >= 0),
                                                      CONSTRAINT player_session_results_recycled_non_negative CHECK (total_recycled_amount >= 0),
                                                      CONSTRAINT player_session_results_rank_not_empty CHECK (length(trim(rank)) > 0)
);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_game_sessions_updated_at ON game_sessions;
CREATE TRIGGER trg_game_sessions_updated_at
    BEFORE UPDATE ON game_sessions
    FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_player_buildings_updated_at ON player_buildings;
CREATE TRIGGER trg_player_buildings_updated_at
    BEFORE UPDATE ON player_buildings
    FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_market_offers_updated_at ON market_offers;
CREATE TRIGGER trg_market_offers_updated_at
    BEFORE UPDATE ON market_offers
    FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;