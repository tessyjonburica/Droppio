-- Migration 006: Add Stream Active Constraint
-- Purpose: Prevent multiple active streams per creator at database level
-- This prevents race conditions where service-level checks can be bypassed

-- Create unique partial index
-- Only one stream can have is_live = true for each streamer_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_streams_one_active_per_creator 
ON streams(streamer_id) 
WHERE is_live = true;

-- Verification
SELECT 
    indexname,
    indexdef,
    '✅ Constraint created: Only one active stream per creator' AS message
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'streams'
AND indexname = 'idx_streams_one_active_per_creator';

SELECT '✅ Stream active constraint created successfully' AS message;
