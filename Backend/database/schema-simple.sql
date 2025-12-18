-- ============================================
-- Droppio MVP - Simplified Database Schema
-- Matches Current Backend Structure
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: users
-- Core identity + profile data (denormalized for simplicity)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('viewer', 'creator', 'admin')) DEFAULT 'viewer',
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    platform TEXT CHECK (platform IN ('twitch', 'youtube', 'kick', 'tiktok')),
    payout_wallet TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_display_name ON users(display_name);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================
-- TABLE: streams
-- Off-chain stream metadata
-- ============================================
CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('twitch', 'youtube', 'kick', 'tiktok')),
    stream_key TEXT,
    is_live BOOLEAN NOT NULL DEFAULT false,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for streams
CREATE INDEX idx_streams_creator_id ON streams(creator_id);
CREATE INDEX idx_streams_is_live ON streams(is_live);
CREATE INDEX idx_streams_started_at ON streams(started_at);
CREATE INDEX idx_streams_creator_live ON streams(creator_id, is_live) WHERE is_live = true;

-- ============================================
-- TABLE: tips
-- Immutable, append-only tip records
-- ============================================
CREATE TABLE tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stream_id UUID REFERENCES streams(id) ON DELETE SET NULL,
    viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount_eth NUMERIC(18, 18) NOT NULL CHECK (amount_eth > 0),
    tx_hash TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for tips
CREATE INDEX idx_tips_creator_id ON tips(creator_id);
CREATE INDEX idx_tips_stream_id ON tips(stream_id);
CREATE INDEX idx_tips_viewer_id ON tips(viewer_id);
CREATE INDEX idx_tips_tx_hash ON tips(tx_hash);
CREATE INDEX idx_tips_created_at ON tips(created_at DESC);
CREATE INDEX idx_tips_creator_created ON tips(creator_id, created_at DESC);

-- ============================================
-- TABLE: overlays
-- OBS overlay configuration per creator
-- ============================================
CREATE TABLE overlays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    theme JSONB NOT NULL DEFAULT '{"primaryColor": "#0F9E99", "secondaryColor": "#FFFFFF", "fontFamily": "Inter", "fontSize": 16, "animationStyle": "slide"}'::jsonb,
    alert_settings JSONB NOT NULL DEFAULT '{"enabled": true, "soundEnabled": false, "minAmount": "0", "showDuration": 5000}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for overlays
CREATE INDEX idx_overlays_creator_id ON overlays(creator_id);

-- ============================================
-- TRIGGER FUNCTION: update_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streams_updated_at BEFORE UPDATE ON streams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_overlays_updated_at BEFORE UPDATE ON overlays
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE overlays ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust for your auth system)
-- For custom JWT auth, you'll need to set app.current_wallet_address

-- Users: Can read own data, admins can read all
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (
        wallet_address = current_setting('app.current_wallet_address', true) OR
        EXISTS (SELECT 1 FROM users WHERE wallet_address = current_setting('app.current_wallet_address', true) AND role = 'admin')
    );

-- Users: Can update own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (wallet_address = current_setting('app.current_wallet_address', true));

-- Streams: Creators can manage own, public can read
CREATE POLICY "Streams publicly readable" ON streams FOR SELECT USING (true);
CREATE POLICY "Creators can manage own streams" ON streams
    FOR ALL USING (
        creator_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.current_wallet_address', true) AND role = 'creator')
    );

-- Tips: Publicly readable, creators can read own
CREATE POLICY "Tips publicly readable" ON tips FOR SELECT USING (true);
CREATE POLICY "Tips can be inserted" ON tips FOR INSERT WITH CHECK (true);

-- Overlays: Creators can manage own
CREATE POLICY "Overlays creators can manage" ON overlays
    FOR ALL USING (
        creator_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.current_wallet_address', true) AND role = 'creator')
    );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE users IS 'Core identity table - wallet address is the primary identifier. Includes profile data for simplicity.';
COMMENT ON TABLE streams IS 'Off-chain stream metadata. Tracks live streaming sessions.';
COMMENT ON TABLE tips IS 'Immutable tip records. Append-only.';
COMMENT ON TABLE overlays IS 'OBS overlay configuration per creator.';

-- ============================================
-- SCHEMA COMPLETE
-- ============================================

