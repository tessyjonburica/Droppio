# Database Migrations Guide

## Current Migration Files

### `001_initial_schema.sql`
- **Purpose**: Creates initial database schema
- **When to run**: First time setup only
- **Contains**: Tables (users, streams, tips, overlays), indexes, triggers

### `FINAL_FIX.sql` ⭐ **USE THIS ONE**
- **Purpose**: Fixes all permission issues permanently
- **When to run**: When you get "permission denied" errors
- **What it does**:
  - Drops all RLS policies
  - Disables RLS completely
  - Fixes role constraint to allow 'creator'
  - Grants necessary permissions
  - Verifies everything works

## How to Fix Permission Errors

### Step 1: Run FINAL_FIX.sql

1. Open **Supabase Dashboard** → Your Project → **SQL Editor**
2. Copy **entire contents** of `Backend/migrations/FINAL_FIX.sql`
3. Paste and **Run** it
4. You should see a success message with table statuses

### Step 2: Verify Service Role Key

Check `Backend/.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find it:**
- Supabase Dashboard → Settings → API
- Look for **"service_role"** key (secret, starts with `eyJ...`)
- **NOT** the anon key!

### Step 3: Test Connection

```bash
cd Backend
node scripts/verify-supabase-setup.js
```

This will test:
- ✅ Service role SELECT
- ✅ Service role INSERT
- ✅ Service role UPDATE
- ✅ RLS status

### Step 4: Restart Backend

```bash
npm run dev
```

You should see:
```
Service role connection test: OK
```

## Troubleshooting

### Still getting "permission denied"?

1. **Verify migration ran**: Check Supabase SQL Editor history
2. **Check service role key**: Run `node scripts/verify-supabase-setup.js`
3. **Verify RLS is disabled**: Run this in Supabase SQL Editor:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename = 'users';
   ```
   Should show `rowsecurity = false`

### Service role key issues?

- Make sure you copied the **service_role** key (not anon key)
- The key should start with `eyJ...` (JWT format)
- It's found in: Supabase Dashboard → Settings → API → service_role (secret)

## Migration History

- ❌ `002_fix_rls_and_roles.sql` - **REMOVED** (re-enabled RLS, caused issues)
- ❌ `003_disable_rls_completely.sql` - **REMOVED** (redundant)
- ❌ `003_simple_fix.sql` - **REMOVED** (redundant)
- ✅ `FINAL_FIX.sql` - **CURRENT** (definitive solution)

