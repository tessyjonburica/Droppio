-- Droppio MVP Database Schema
-- Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('viewer', 'streamer')),
    display_name TEXT,
    avatar_url TEXT,
    platform TEXT,
    payout_wallet TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Streams table
CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    streamer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    stream_key TEXT NOT NULL,
    is_live BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- Tips table
CREATE TABLE tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_usdc NUMERIC(20, 6) NOT NULL,
    tx_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Overlays table
CREATE TABLE overlays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    streamer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme JSONB NOT NULL DEFAULT '{}',
    alert_settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(streamer_id)
);

-- Indexes for performance
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_streams_streamer_id ON streams(streamer_id);
CREATE INDEX idx_streams_is_live ON streams(is_live);
CREATE INDEX idx_tips_stream_id ON tips(stream_id);
CREATE INDEX idx_tips_viewer_id ON tips(viewer_id);
CREATE INDEX idx_tips_created_at ON tips(created_at DESC);
CREATE INDEX idx_overlays_streamer_id ON overlays(streamer_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_overlays_updated_at BEFORE UPDATE ON overlays
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

