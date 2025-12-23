# 🚀 Fresh Start: Complete Database Reset

## What This Does

This migration (`000_FRESH_START.sql`) will:
1. ✅ **Drop ALL existing tables** (clean slate)
2. ✅ **Create all tables** with correct schema
3. ✅ **Set up indexes** for performance
4. ✅ **Create triggers** for auto-updating timestamps
5. ✅ **Disable RLS** (backend uses service role)
6. ✅ **Grant all permissions** properly
7. ✅ **Verify everything** is set up correctly

## ⚠️ WARNING

**This will DELETE ALL DATA in your database!**

Only run this if you want to start completely fresh.

## How to Run

### Step 1: Open Supabase SQL Editor

1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Migration

1. **Copy the entire contents** of `Backend/migrations/000_FRESH_START.sql`
2. **Paste** it into the SQL Editor
3. **Click "Run"** (or press Ctrl+Enter)

### Step 3: Verify Success

You should see output like:
```
✅ RLS DISABLED (for all tables)
Setup verification: 4 tables created
```

### Step 4: Test Your Backend

```bash
cd Backend
node scripts/verify-supabase-setup.js
```

You should see:
```
✅ ALL TESTS PASSED!
```

### Step 5: Start Backend

```bash
npm run dev
```

You should see:
```
Service role connection test: OK
Server running on port 5000
```

## What Gets Created

### Tables
- `users` - User accounts (wallet-based)
- `streams` - Stream sessions
- `tips` - Tip transactions
- `overlays` - OBS overlay configurations

### Features
- ✅ UUID primary keys
- ✅ Foreign key constraints
- ✅ Check constraints (role, platform)
- ✅ Indexes for fast queries
- ✅ Auto-updating timestamps
- ✅ RLS disabled (backend uses service role)

## Troubleshooting

### Error: "relation already exists"
- The migration tried to create a table that already exists
- This shouldn't happen since we drop everything first
- If it does, manually drop the table and re-run

### Error: "permission denied"
- Make sure you're running as the database owner
- Check that your Supabase project has proper permissions

### Still getting permission errors after migration?
1. Verify RLS is disabled:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename = 'users';
   ```
   Should show `rowsecurity = false`

2. Test service role:
   ```bash
   node scripts/verify-supabase-setup.js
   ```

## Current Migration Files

- ✅ `000_FRESH_START.sql` - **Use this one!** Complete fresh setup

That's it! One migration, everything set up correctly.

