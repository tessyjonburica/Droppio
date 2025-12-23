# 🔍 Debug: Permission Denied (Error 42501)

## The Problem

You're getting **"permission denied for table users"** with error code `42501`. This is a PostgreSQL permission error, not an RLS issue.

## Root Cause

Even though RLS is disabled, the **service role doesn't have explicit table permissions**. Supabase requires explicit GRANT statements.

## The Solution

### Step 1: Run the Updated Migration

The migration `000_FRESH_START.sql` has been updated to:
1. ✅ Drop all policies
2. ✅ Disable RLS completely
3. ✅ **Grant explicit permissions** to all roles (including service_role and authenticator)
4. ✅ Set default privileges for future tables

**Run it now:**
1. Open **Supabase Dashboard** → SQL Editor
2. Copy **entire contents** of `Backend/migrations/000_FRESH_START.sql`
3. Paste and **Run** it

### Step 2: Verify Permissions Were Granted

After running the migration, you should see output like:
```
✅ RLS DISABLED (for all tables)
authenticated_select: true
authenticated_insert: true
service_role_select: true
```

### Step 3: Test Again

```bash
cd Backend
node scripts/verify-supabase-setup.js
```

You should now see:
```
✅ SELECT works
✅ INSERT works
✅ UPDATE works
✅ ALL TESTS PASSED!
```

## What Changed in the Migration

The updated migration now:
- ✅ Grants permissions to `service_role` role explicitly
- ✅ Grants permissions to `authenticator` role (Supabase connection role)
- ✅ Grants permissions to `authenticated` role
- ✅ Sets default privileges so future tables work too

## Why This Happens

Supabase uses role-based access. Even with RLS disabled, you need explicit GRANT statements for:
- `service_role` - The role used by service role key
- `authenticator` - The connection role Supabase uses
- `authenticated` - The authenticated user role

## If Still Not Working

### Check 1: Verify Migration Ran Successfully

Run this in Supabase SQL Editor:

```sql
SELECT 
    tablename,
    has_table_privilege('service_role', tablename, 'SELECT') AS service_role_select,
    has_table_privilege('authenticated', tablename, 'SELECT') AS authenticated_select
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';
```

Should show `true` for both.

### Check 2: Verify RLS is Disabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';
```

Should show `rowsecurity = false`.

### Check 3: Re-run Permission Grants

If permissions are still missing, run this:

```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticator;
```

## Summary

The issue is **missing explicit permissions**, not RLS. The updated migration fixes this by granting permissions to all necessary roles. Run it and test again!

