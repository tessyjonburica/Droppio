# 🔧 Fix: "TypeError: fetch failed" Error

## The Problem

The error changed from "permission denied" to **"TypeError: fetch failed"**. This means:
- ✅ Database permissions are likely fine now
- ❌ **Network/connection issue** - Can't reach Supabase

## Root Cause

This is a **network connectivity issue**, not a database permission issue. Possible causes:
1. **SUPABASE_URL is incorrect** in `.env`
2. **Network connectivity problem**
3. **Supabase project is paused/deleted**
4. **Custom headers** we added might be causing issues (now removed)

## Solution Steps

### Step 1: Test Supabase URL

```bash
cd Backend
node scripts/test-supabase-url.js
```

This will:
- ✅ Check if SUPABASE_URL is set correctly
- ✅ Verify URL format (should start with https://)
- ✅ Test if URL is accessible
- ✅ Check service role key format

### Step 2: Verify Your .env File

Make sure `Backend/.env` has:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important checks:**
- ✅ SUPABASE_URL should start with `https://`
- ✅ Should contain `.supabase.co`
- ✅ Should match your Supabase project URL exactly

**Where to find it:**
- Supabase Dashboard → Settings → API
- Look for "Project URL" (not the anon key)

### Step 3: Verify Service Role Key

The service role key should:
- ✅ Start with `eyJ...` (JWT format)
- ✅ Be 200+ characters long
- ✅ Found in: Supabase Dashboard → Settings → API → **service_role** (secret)
- ✅ **NOT** the anon key

### Step 4: Check Supabase Project Status

1. Go to **Supabase Dashboard**
2. Check if your project is **active** (not paused)
3. Verify the project URL matches your `.env` file

### Step 5: Restart Backend

After fixing the URL/key:

```bash
npm run dev
```

You should now see:
```
Service role connection test: OK
```

## What We Fixed

1. ✅ **Removed custom headers** - They might have been causing fetch issues
2. ✅ **Added better error logging** - Now shows actual error details
3. ✅ **Added URL validation** - Checks format on startup
4. ✅ **Created test script** - `test-supabase-url.js` to diagnose issues

## Common Issues

### Issue: "Cannot reach Supabase URL"

**Solution:**
1. Check SUPABASE_URL in `.env` matches Supabase Dashboard
2. Verify project is not paused
3. Check internet connection
4. Try accessing the URL in browser: `https://your-project.supabase.co`

### Issue: "URL should start with https://"

**Solution:**
- Make sure SUPABASE_URL starts with `https://`
- Should be: `https://xxxxx.supabase.co`
- NOT: `http://xxxxx.supabase.co` or just `xxxxx.supabase.co`

### Issue: "Key seems too short"

**Solution:**
- Make sure you copied the **entire** service role key
- It should be 200+ characters
- Copy from: Supabase Dashboard → Settings → API → service_role (secret)

## Quick Diagnostic

Run this to see exactly what's wrong:

```bash
cd Backend
node scripts/test-supabase-url.js
```

It will tell you:
- ✅ If URL is correct
- ✅ If URL is accessible
- ✅ If keys are in correct format
- ❌ What's wrong if something fails

## After Fixing

1. ✅ Run `node scripts/test-supabase-url.js` - should pass all checks
2. ✅ Run `npm run dev` - should see "Service role connection test: OK"
3. ✅ Try login from frontend - should work now

The "fetch failed" error is almost always a URL/key configuration issue. Fix those and it should work!

