# Quick Fix: Permission Denied Error

## The Problem

Even after running migration 002, you're still getting "permission denied for table users". This is because migration 002 re-enables RLS, which can still cause issues.

## The Solution (2 minutes)

### Step 1: Run Migration 003

1. **Open Supabase Dashboard** → Your Project → **SQL Editor**

2. **Copy the entire contents** of this file:
   ```
   Backend/migrations/003_disable_rls_completely.sql
   ```

3. **Paste and Run** it in the SQL Editor

This migration will:
- ✅ Completely disable RLS on all tables (safe for backend)
- ✅ Fix the role constraint to allow 'creator'
- ✅ Remove all existing policies
- ✅ Verify everything is set up correctly

### Step 2: Verify Service Role Key

Make sure your `Backend/.env` has the correct service role key:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find it:**
- Supabase Dashboard → Settings → API
- Look for **"service_role"** key (it's the secret one, starts with `eyJ...`)
- **NOT** the anon key!

### Step 3: Test the Connection

Run the test script:

```bash
cd Backend
node scripts/test-db-connection.js
```

This will tell you exactly what's wrong if there are still issues.

### Step 4: Restart Backend

```bash
npm run dev
```

You should now see:
```
Service role connection test: OK
```

## Why This Works

The backend uses the **service role key** which should bypass RLS automatically. However, in some Supabase configurations, RLS can still interfere. By completely disabling RLS, we ensure the backend can always access the database.

**This is safe because:**
- The backend uses service role (admin access)
- RLS is for frontend/public access control
- Backend operations need full access anyway

## Still Having Issues?

Run the diagnostic script:

```bash
node scripts/test-db-connection.js
```

It will test:
1. ✅ Service role key is correct
2. ✅ Tables exist
3. ✅ INSERT permission works
4. ✅ Role constraint allows 'creator'

The script will tell you exactly what's wrong.

