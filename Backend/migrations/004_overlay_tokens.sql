-- Migration 004: Add Overlay Tokens Table
-- Purpose: Create long-lived tokens for OBS overlay authentication
-- This allows overlays to persist for hours/days without token expiry

CREATE TABLE IF NOT EXISTS overlay_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- Index for fast token lookup
CREATE INDEX idx_overlay_tokens_token ON overlay_tokens(token);
CREATE INDEX idx_overlay_tokens_creator_id ON overlay_tokens(creator_id);

-- Grant permissions
GRANT ALL ON overlay_tokens TO postgres;
GRANT ALL ON overlay_tokens TO authenticated;
GRANT ALL ON overlay_tokens TO anon;
GRANT ALL ON overlay_tokens TO service_role;
GRANT ALL ON overlay_tokens TO authenticator;

-- Verification
SELECT 'Overlay tokens table created successfully' AS message;
