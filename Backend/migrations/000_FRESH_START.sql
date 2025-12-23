-- ============================================
-- FRESH START: Complete Database Reset
-- Run this ONCE to drop everything and rebuild correctly
-- ============================================

-- ============================================
-- STEP 1: Drop ALL existing tables (CASCADE removes dependencies)
-- ============================================
DROP TABLE IF EXISTS overlays CASCADE;
DROP TABLE IF EXISTS tips CASCADE;
DROP TABLE IF EXISTS streams CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions and triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================
-- STEP 2: Enable UUID extension
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 3: Create users table
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('viewer', 'creator', 'admin')) DEFAULT 'viewer',
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    platform TEXT CHECK (platform IN ('twitch', 'youtube', 'kick', 'tiktok')),
    payout_wallet TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- STEP 4: Create streams table
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

-- ============================================
-- STEP 5: Create tips table
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

-- ============================================
-- STEP 6: Create overlays table
-- ============================================
CREATE TABLE overlays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    theme JSONB NOT NULL DEFAULT '{"primaryColor": "#0F9E99", "secondaryColor": "#FFFFFF", "fontFamily": "Inter", "fontSize": 16, "animationStyle": "slide"}'::jsonb,
    alert_settings JSONB NOT NULL DEFAULT '{"enabled": true, "soundEnabled": false, "minAmount": "0", "showDuration": 5000}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- STEP 7: Create indexes for performance
-- ============================================
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_display_name ON users(display_name);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_streams_creator_id ON streams(creator_id);
CREATE INDEX idx_streams_is_live ON streams(is_live);
CREATE INDEX idx_streams_started_at ON streams(started_at);
CREATE INDEX idx_streams_creator_live ON streams(creator_id, is_live) WHERE is_live = true;

CREATE INDEX idx_tips_creator_id ON tips(creator_id);
CREATE INDEX idx_tips_stream_id ON tips(stream_id);
CREATE INDEX idx_tips_viewer_id ON tips(viewer_id);
CREATE INDEX idx_tips_tx_hash ON tips(tx_hash);
CREATE INDEX idx_tips_created_at ON tips(created_at DESC);
CREATE INDEX idx_tips_creator_created ON tips(creator_id, created_at DESC);

CREATE INDEX idx_overlays_creator_id ON overlays(creator_id);

-- ============================================
-- STEP 8: Create trigger function for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 9: Create triggers
-- ============================================
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streams_updated_at 
    BEFORE UPDATE ON streams
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_overlays_updated_at 
    BEFORE UPDATE ON overlays
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 10: Drop ALL existing policies first
-- ============================================
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on users
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
    END LOOP;
    
    -- Drop all policies on streams
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'streams'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON streams', pol.policyname);
    END LOOP;
    
    -- Drop all policies on tips
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'tips'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON tips', pol.policyname);
    END LOOP;
    
    -- Drop all policies on overlays
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'overlays'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON overlays', pol.policyname);
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if pg_policies doesn't exist or no policies
        NULL;
END $$;

-- ============================================
-- STEP 11: DISABLE RLS completely
-- ============================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE streams DISABLE ROW LEVEL SECURITY;
ALTER TABLE tips DISABLE ROW LEVEL SECURITY;
ALTER TABLE overlays DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 12: Grant ALL permissions to service role and authenticated users
-- ============================================
-- Grant to postgres (database owner)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Grant to authenticated role (Supabase uses this for service role)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant to anon role (for public access if needed)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant to service_role (explicit grant)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant to authenticator (Supabase connection role)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticator;

-- ============================================
-- STEP 13: Set default privileges for future tables
-- ============================================
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticator;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticator;

-- ============================================
-- STEP 14: Verify RLS is disabled
-- ============================================
SELECT 
    tablename,
    rowsecurity AS rls_enabled,
    CASE 
        WHEN rowsecurity = false THEN '✅ RLS DISABLED'
        ELSE '❌ RLS STILL ENABLED - RUN THIS AGAIN'
    END AS status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'streams', 'tips', 'overlays')
ORDER BY tablename;

-- ============================================
-- STEP 15: Verify permissions
-- ============================================
SELECT 
    'Permissions check' AS check_type,
    tablename,
    has_table_privilege('authenticated', tablename, 'SELECT') AS authenticated_select,
    has_table_privilege('authenticated', tablename, 'INSERT') AS authenticated_insert,
    has_table_privilege('authenticated', tablename, 'UPDATE') AS authenticated_update,
    has_table_privilege('service_role', tablename, 'SELECT') AS service_role_select
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'streams', 'tips', 'overlays')
ORDER BY tablename;

-- ============================================
-- STEP 16: Test query (should work now)
-- ============================================
SELECT 
    '✅ Migration completed successfully!' AS message,
    COUNT(*) AS table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'streams', 'tips', 'overlays');

-- ============================================
-- DONE! Your database is ready to use.
-- ============================================
