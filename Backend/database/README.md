# Droppio Database Schema

## Overview

Production-ready PostgreSQL schema for Droppio MVP, compatible with Supabase.

## Quick Start

### 1. Run Migration

```bash
# Using Supabase CLI
supabase db reset

# Or using psql
psql -h your-db-host -U postgres -d droppio < database/schema.sql
```

### 2. Verify Tables

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- `users`
- `profiles`
- `streams`
- `tips`
- `overlays`
- `platform_connections`

## Schema Details

### Entity Relationship Diagram

```
users (1) ──< (1) profiles
users (1) ──< (*) streams
users (1) ──< (*) tips
users (1) ──< (1) overlays
users (1) ──< (*) platform_connections
streams (1) ──< (*) tips
```

### Table Descriptions

#### `users`
- **Purpose**: Core identity - wallet address = user identity
- **Key Fields**: `wallet_address` (unique), `role`
- **Relationships**: One-to-one with `profiles`, one-to-many with `streams`, `tips`, `overlays`, `platform_connections`

#### `profiles`
- **Purpose**: App identity - display name, avatar, bio
- **Key Fields**: `display_name` (required), `avatar_url`, `bio`
- **Relationships**: One-to-one with `users`

#### `streams`
- **Purpose**: Off-chain stream metadata
- **Key Fields**: `creator_id`, `platform`, `is_live`, `started_at`, `ended_at`
- **Relationships**: Many-to-one with `users`, one-to-many with `tips`

#### `tips`
- **Purpose**: Immutable tip records (append-only)
- **Key Fields**: `tx_hash` (unique), `amount_eth`, `tip_mode`
- **Relationships**: Many-to-one with `users` and `streams`

#### `overlays`
- **Purpose**: OBS overlay configuration
- **Key Fields**: `access_token` (unique), `theme`, `alert_settings` (JSONB)
- **Relationships**: One-to-one with `users`

#### `platform_connections`
- **Purpose**: Creator platform account connections
- **Key Fields**: `platform`, `platform_user_id`
- **Relationships**: Many-to-one with `users`
- **Constraints**: Unique per `(creator_id, platform)`

## Indexes

### Performance Indexes
- `wallet_address` - Fast user lookups
- `creator_id` - Fast creator data queries
- `created_at DESC` - Fast recent tips/streams queries
- `is_live` - Fast active stream queries
- Composite indexes for common query patterns

### Unique Constraints
- `users.wallet_address` - One wallet = one user
- `profiles.user_id` - One profile per user
- `tips.tx_hash` - Prevent duplicate tips
- `overlays.creator_id` - One overlay per creator
- `overlays.access_token` - Unique overlay tokens
- `platform_connections(creator_id, platform)` - One connection per platform

## Row Level Security (RLS)

### Policy Pattern
- **Users**: Can read/update own data
- **Creators**: Can manage own streams, tips, overlays, connections
- **Public**: Can read profiles, streams, tips (for display)
- **Admins**: Can read all data

### Custom Auth Integration
For custom JWT auth (not Supabase Auth):
1. Set `app.current_wallet_address` setting in backend
2. Adjust RLS policies to use wallet address instead of `auth.uid()`

## Scalability Considerations

### Indexing Strategy
- **High-frequency queries**: Indexed (wallet_address, creator_id, created_at)
- **Composite indexes**: For common query patterns
- **Partial indexes**: For active streams (`WHERE is_live = true`)

### Partitioning (Future)
- `tips` table can be partitioned by `created_at` if needed
- Consider monthly partitions for high-volume scenarios

### Archival Strategy
- Old tips/streams can be archived to separate tables
- Keep recent data (< 90 days) in main tables

## Migration Notes

### From Existing Schema
If migrating from existing schema:
1. Backup existing data
2. Run schema migration
3. Migrate data if needed
4. Verify constraints

### Supabase Compatibility
- Uses `uuid-ossp` extension (enabled by default in Supabase)
- RLS policies use `auth.uid()` pattern
- Compatible with Supabase REST API and PostgREST

## Testing

### Verify Schema
```sql
-- Check all tables exist
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check indexes
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';
```

### Test Constraints
```sql
-- Test unique wallet_address
INSERT INTO users (wallet_address, role) VALUES ('0x123...', 'viewer');
INSERT INTO users (wallet_address, role) VALUES ('0x123...', 'viewer'); -- Should fail

-- Test foreign keys
INSERT INTO profiles (user_id, display_name) VALUES ('00000000-0000-0000-0000-000000000000', 'Test'); -- Should fail
```

## Maintenance

### Regular Tasks
- Monitor index usage
- Check for slow queries
- Review RLS policy performance
- Archive old data if needed

### Backup Strategy
- Daily backups recommended
- Point-in-time recovery enabled
- Test restore procedures regularly

