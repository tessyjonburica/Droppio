-- Migration 005: Enable RLS and Create Security Policies
-- Purpose: Add Row Level Security to protect data access
-- Note: service_role bypasses RLS, so backend API operations continue to work

-- ============================================
-- STEP 1: Create RLS Policies for Users Table
-- ============================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: service_role has full access (for backend operations)
CREATE POLICY "service_role_full_access_users" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Users can read their own record
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  TO authenticated
  USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'walletAddress');

-- Policy: Users can update only their own profile fields
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'walletAddress')
  WITH CHECK (wallet_address = current_setting('request.jwt.claims', true)::json->>'walletAddress');

-- ============================================
-- STEP 2: Create RLS Policies for Tips Table
-- ============================================

ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

-- Policy: service_role has full access
CREATE POLICY "service_role_full_access_tips" ON tips
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Creators can read tips they received
CREATE POLICY "tips_select_creator" ON tips
  FOR SELECT
  TO authenticated
  USING (
    creator_id IN (
      SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'walletAddress'
    )
  );

-- Policy: Viewers can read tips they sent
CREATE POLICY "tips_select_viewer" ON tips
  FOR SELECT
  TO authenticated
  USING (
    viewer_id IN (
      SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'walletAddress'
    )
  );

-- ============================================
-- STEP 3: Create RLS Policies for Streams Table
-- ============================================

ALTER TABLE streams ENABLE ROW LEVEL SECURITY;

-- Policy: service_role has full access
CREATE POLICY "service_role_full_access_streams" ON streams
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Anyone can read active streams
CREATE POLICY "streams_select_all" ON streams
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Policy: Creators can manage their own streams
CREATE POLICY "streams_manage_own" ON streams
  FOR ALL
  TO authenticated
  USING (
    creator_id IN (
      SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'walletAddress'
    )
  )
  WITH CHECK (
    creator_id IN (
      SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'walletAddress'
    )
  );

-- ============================================
-- STEP 4: Create RLS Policies for Overlays Table
-- ============================================

ALTER TABLE overlays ENABLE ROW LEVEL SECURITY;

-- Policy: service_role has full access
CREATE POLICY "service_role_full_access_overlays" ON overlays
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Creators can manage their own overlay
CREATE POLICY "overlays_manage_own" ON overlays
  FOR ALL
  TO authenticated
  USING (
    creator_id IN (
      SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'walletAddress'
    )
  )
  WITH CHECK (
    creator_id IN (
      SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'walletAddress'
    )
  );

-- ============================================
-- STEP 5: Create RLS Policies for Overlay Tokens Table
-- ============================================

ALTER TABLE overlay_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: service_role has full access
CREATE POLICY "service_role_full_access_overlay_tokens" ON overlay_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Creators can read only their own overlay token
CREATE POLICY "overlay_tokens_select_own" ON overlay_tokens
  FOR SELECT
  TO authenticated
  USING (
    creator_id IN (
      SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'walletAddress'
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================

-- Check that RLS is enabled on all tables
SELECT 
    tablename,
    rowsecurity AS rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN 'RLS ENABLED'
        ELSE 'RLS DISABLED'
    END AS status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'streams', 'tips', 'overlays', 'overlay_tokens')
ORDER BY tablename;

-- List all policies
SELECT schemaname, tablename, policyname, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT 'RLS enabled and policies created successfully' AS message;
