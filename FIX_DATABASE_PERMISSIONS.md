# Fix: "Permission denied for table users" Error

## What Happened

You're getting this error because:
1. **RLS (Row Level Security) is blocking database access** - Even though the backend uses the service role key, RLS policies might be too restrictive
2. **Role mismatch** - The database constraint allows 'streamer' but the code uses 'creator'
3. **Service role key might be incorrect** - If the key is wrong, Supabase won't recognize it as a service role

## Quick Fix (5 minutes)

### Option 1: Run Migration (Recommended)

1. **Open Supabase Dashboard** → Your Project → SQL Editor

2. **Copy and paste** the entire contents of:
   ```
   Backend/migrations/002_fix_rls_and_roles.sql
   ```

3. **Click "Run"** to execute the migration

4. **Restart your backend server**:
   ```bash
   cd Backend
   npm run dev
   ```

5. **Check the logs** - You should see:
   ```
   Service role connection test: OK
   ```

### Option 2: Manual SQL Fix

If you prefer to run SQL manually, execute these in Supabase SQL Editor:

```sql
-- Fix role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('viewer', 'creator', 'admin'));

-- Disable RLS (service role bypasses it anyway)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE streams DISABLE ROW LEVEL SECURITY;
ALTER TABLE tips DISABLE ROW LEVEL SECURITY;
ALTER TABLE overlays DISABLE ROW LEVEL SECURITY;

-- Re-enable with permissive policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON users
    FOR ALL USING (true) WITH CHECK (true);

-- Repeat for other tables
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON streams
    FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON tips
    FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE overlays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON overlays
    FOR ALL USING (true) WITH CHECK (true);
```

## Verify Your Setup

### 1. Check Environment Variables

Make sure `Backend/.env` has:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find service role key:**
- Supabase Dashboard → Settings → API
- Look for "service_role" key (it's secret, starts with `eyJ...`)

### 2. Verify Table Exists

Run in Supabase SQL Editor:

```sql
SELECT * FROM users LIMIT 1;
```

If you get "relation users does not exist", run `001_initial_schema.sql` first.

### 3. Test Backend Connection

After restarting the backend, check the console output. You should see:

✅ **Success:**
```
Service role connection test: OK
Server running on port 5000
```

❌ **Failure:**
```
Service role connection test failed: permission denied for table users
```

If you see the failure, the migration didn't work. Check:
- Did you run the SQL in the correct Supabase project?
- Is the service role key correct?
- Does the users table exist?

## What We Fixed

1. ✅ **Created migration script** (`002_fix_rls_and_roles.sql`) to fix RLS and roles
2. ✅ **Improved error messages** - Now shows specific guidance when database errors occur
3. ✅ **Added connection test** - Backend tests service role connection on startup
4. ✅ **Better diagnostics** - Error messages now tell you exactly what to check

## After Fixing

Once the migration is applied:

1. **Restart backend**: `cd Backend && npm run dev`
2. **Try login again** from the frontend
3. **Check backend logs** for any remaining errors

The error should be resolved! If you still see issues, check the backend logs for the specific error message - they now include detailed guidance.

