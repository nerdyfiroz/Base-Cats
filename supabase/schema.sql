-- ============================================================
-- BASE CATZ: NEON HEIST — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Players
CREATE TABLE IF NOT EXISTS players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address  TEXT UNIQUE NOT NULL,
  username        TEXT,
  gang_id         UUID,
  pvp_rank        INT  DEFAULT 1000,
  season_points   INT  DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_players_wallet ON players(wallet_address);

-- Cats (mirrors on-chain data; synced via indexer)
CREATE TABLE IF NOT EXISTS cats (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id                 INT  UNIQUE NOT NULL,
  owner_wallet             TEXT NOT NULL,
  level                    INT  DEFAULT 1,
  xp                       INT  DEFAULT 0,
  stamina_current          INT  DEFAULT 100,
  stamina_last_regen       TIMESTAMPTZ DEFAULT NOW(),
  active_ability_cooldown  TIMESTAMPTZ,
  gear_head                UUID,
  gear_body                UUID,
  gear_weapon              UUID,
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_cats_owner ON cats(owner_wallet);

-- Resources (one row per player)
CREATE TABLE IF NOT EXISTS resources (
  player_id  UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  scrap      INT DEFAULT 0,
  wire       INT DEFAULT 0,
  chip       INT DEFAULT 0,
  fuel       INT DEFAULT 0,
  glow       INT DEFAULT 0,
  cred       INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gear (off-chain crafted items)
CREATE TABLE IF NOT EXISTS gear (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_wallet TEXT NOT NULL,
  gear_type    TEXT NOT NULL,
  durability   INT  DEFAULT 100,
  equipped_to  INT,
  is_nft       BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_gear_owner ON gear(owner_wallet);

-- Gangs
CREATE TABLE IF NOT EXISTS gangs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT UNIQUE NOT NULL,
  leader_wallet  TEXT NOT NULL,
  emblem_url     TEXT,
  bank_cred      INT  DEFAULT 0,
  pvp_wins       INT  DEFAULT 0,
  season_rank    INT  DEFAULT 999,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Add gang_id FK after gangs table created
ALTER TABLE players ADD CONSTRAINT fk_gang FOREIGN KEY (gang_id) REFERENCES gangs(id) ON DELETE SET NULL;

-- Territories
CREATE TABLE IF NOT EXISTS territories (
  district_id         TEXT PRIMARY KEY,
  controlling_gang_id UUID REFERENCES gangs(id) ON DELETE SET NULL,
  hp                  INT  DEFAULT 1000,
  tax_rate            DECIMAL DEFAULT 0.05,
  last_updated        TIMESTAMPTZ DEFAULT NOW()
);

-- Seed territories
INSERT INTO territories (district_id) VALUES
  ('neon_alley'), ('rust_bazaar'), ('vapor_heights'),
  ('data_nexus'), ('shadow_docks'), ('the_vault')
ON CONFLICT DO NOTHING;

-- Heist Log
CREATE TABLE IF NOT EXISTS heist_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cat_token_id     INT  NOT NULL,
  player_wallet    TEXT NOT NULL,
  district_id      TEXT NOT NULL,
  tier             INT  NOT NULL,
  outcome          TEXT NOT NULL CHECK (outcome IN ('full','partial','busted')),
  resources_earned JSONB,
  vrf_seed         TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_heist_player ON heist_log(player_wallet);
CREATE INDEX idx_heist_created ON heist_log(created_at DESC);

-- PvP Battles
CREATE TABLE IF NOT EXISTS pvp_battles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attacker_wallet         TEXT NOT NULL,
  defender_wallet         TEXT NOT NULL,
  attacker_cat_id         INT,
  defender_cat_id         INT,
  winner_wallet           TEXT,
  rounds                  JSONB,
  rank_change_attacker    INT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pvp_attacker ON pvp_battles(attacker_wallet);
CREATE INDEX idx_pvp_created  ON pvp_battles(created_at DESC);

-- Seasonal Leaderboard
CREATE TABLE IF NOT EXISTS season_leaderboard (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id       INT  NOT NULL,
  player_id       UUID REFERENCES players(id) ON DELETE CASCADE,
  gang_id         UUID REFERENCES gangs(id)   ON DELETE CASCADE,
  score           INT  DEFAULT 0,
  rank            INT,
  reward_claimed  BOOLEAN DEFAULT FALSE,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_season_score ON season_leaderboard(season_id, score DESC);

-- Gang War Log
CREATE TABLE IF NOT EXISTS gang_wars (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id           INT  NOT NULL,
  attacker_gang_id    UUID REFERENCES gangs(id),
  defender_gang_id    UUID REFERENCES gangs(id),
  start_time          TIMESTAMPTZ NOT NULL,
  end_time            TIMESTAMPTZ NOT NULL,
  winner_gang_id      UUID REFERENCES gangs(id),
  settled             BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security ────────────────────────────────────────
ALTER TABLE players    ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cats       ENABLE ROW LEVEL SECURITY;
ALTER TABLE gear       ENABLE ROW LEVEL SECURITY;

-- Players: anyone can read, only owner can update
CREATE POLICY "public read players"    ON players    FOR SELECT USING (true);
CREATE POLICY "own wallet update"      ON players    FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet');

CREATE POLICY "public read resources"  ON resources  FOR SELECT USING (true);
CREATE POLICY "public read cats"       ON cats       FOR SELECT USING (true);
CREATE POLICY "public read gear"       ON gear       FOR SELECT USING (true);
CREATE POLICY "public read gangs"      ON gangs      FOR SELECT USING (true);
CREATE POLICY "public read territories" ON territories FOR SELECT USING (true);
CREATE POLICY "public read heist_log"  ON heist_log  FOR SELECT USING (true);
CREATE POLICY "public read pvp"        ON pvp_battles FOR SELECT USING (true);
CREATE POLICY "public read leaderboard" ON season_leaderboard FOR SELECT USING (true);

-- ─── Functions ────────────────────────────────────────────────

-- Reduce gear durability
CREATE OR REPLACE FUNCTION reduce_gear_durability(cat_token_id INT, amount INT)
RETURNS VOID AS $$
  UPDATE gear
  SET durability = GREATEST(0, durability - amount)
  WHERE equipped_to = cat_token_id;
$$ LANGUAGE SQL;

-- Init resources on player creation
CREATE OR REPLACE FUNCTION init_player_resources()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO resources (player_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_player_created
  AFTER INSERT ON players
  FOR EACH ROW EXECUTE FUNCTION init_player_resources();

-- Update season leaderboard score
CREATE OR REPLACE FUNCTION award_season_points(p_player_id UUID, p_points INT, p_season_id INT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO season_leaderboard (season_id, player_id, score)
  VALUES (p_season_id, p_player_id, p_points)
  ON CONFLICT (season_id, player_id)
  DO UPDATE SET score = season_leaderboard.score + p_points, updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
