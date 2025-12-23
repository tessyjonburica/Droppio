# Database Setup Guide

## Problem: "Permission denied for table users"

This error occurs when:
1. RLS (Row Level Security) is blocking the service role
2. The service role key is incorrect or missing
3. The database schema doesn't match the codebase

## Solution

### Step 1: Run the Migration

Execute the migration script in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `Backend/migrations/002_fix_rls_and_roles.sql`
4. Run the migration

This migration will:
- Fix the role constraint to allow 'creator' (not just 'streamer')
- Disable/update RLS policies to allow service role access
- Create permissive policies for public access

### Step 2: Verify Environment Variables

Make sure your `Backend/.env` file has:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important:** The `SUPABASE_SERVICE_ROLE_KEY` is different from `SUPABASE_ANON_KEY`. 
- Find it in: Supabase Dashboard → Settings → API → `service_role` key (secret)

### Step 3: Verify Table Exists

Run this in Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users';
```

If the table doesn't exist, run `Backend/migrations/001_initial_schema.sql` first.

### Step 4: Test the Connection

Restart your backend server:

```bash
cd Backend
npm run dev
```

You should see in the logs:
- `Service role connection test: OK` (if working)
- Or error messages with specific guidance (if not working)

## Troubleshooting

### Error: "Service role connection test failed"

**Possible causes:**
1. **Wrong service role key**: Double-check `SUPABASE_SERVICE_ROLE_KEY` in `.env`
2. **RLS still blocking**: Run migration `002_fix_rls_and_roles.sql` again
3. **Table doesn't exist**: Run `001_initial_schema.sql` first

### Error: "Invalid role value"

The role constraint doesn't allow 'creator'. Run migration `002_fix_rls_and_roles.sql`.

### Error: "Table users does not exist"

Run the initial migration:
1. Copy `Backend/migrations/001_initial_schema.sql`
2. Paste in Supabase SQL Editor
3. Execute it
4. Then run `002_fix_rls_and_roles.sql`

## Quick Fix Script

If you have Supabase CLI:

```bash
cd Backend
supabase db reset  # WARNING: This deletes all data!
# Or apply migrations:
supabase migration up
```

## Manual Fix (Supabase Dashboard)

1. Go to SQL Editor
2. Run this to disable RLS temporarily:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE streams DISABLE ROW LEVEL SECURITY;
ALTER TABLE tips DISABLE ROW LEVEL SECURITY;
ALTER TABLE overlays DISABLE ROW LEVEL SECURITY;
```

3. Update role constraint:

```sql
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('viewer', 'creator', 'admin'));
```

4. Re-enable RLS with permissive policies:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON users
    FOR ALL USING (true) WITH CHECK (true);
```

Repeat for other tables (streams, tips, overlays).

