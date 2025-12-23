# Troubleshooting: "Unable to connect to the server" Error

## Problem
You're seeing the error: "Unable to connect to the server at http://localhost:5000"

## Root Cause
**The backend server is not running.** The frontend is trying to connect to `http://localhost:5000/api/auth/login`, but nothing is listening on that port.

## Solution

### Step 1: Start the Backend Server

1. Open a new terminal/command prompt
2. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

4. You should see output like:
   ```
   Server running on port 5000 in development mode
   Redis connected
   ```

### Step 2: Verify Server is Running

Open your browser and go to: http://localhost:5000/health

You should see:
```json
{"status":"ok","timestamp":"2025-12-22T..."}
```

### Step 3: Test the Frontend Again

Once the backend is running, try logging in again from the frontend.

## What We Fixed

1. **Better Error Messages**: The frontend now shows clear messages when the server isn't reachable
2. **Health Check**: Added automatic server health checking on the login page
3. **Visual Indicators**: The login page now shows a warning if the server isn't accessible
4. **Timeout Handling**: Added 30-second timeout to prevent hanging requests
5. **Better Diagnostics**: Console logs show which API URL is being used

## Common Issues

### Issue: Server won't start - Environment Variables Error
**Solution**: 
- Make sure `.env` file exists in `Backend` directory
- Check that all required variables are set (see `ENV_VARIABLES.md`)
- Required: SUPABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, etc.

### Issue: Port 5000 already in use
**Solution**:
- Change `PORT=5000` to a different port in `Backend/.env`
- Update `NEXT_PUBLIC_API_URL` in `Frontend/.env.local` to match

### Issue: Redis Connection Error
**Solution**:
- Redis errors won't prevent the server from starting, but some features may not work
- To fix: `docker run -d -p 6379:6379 redis:latest`

### Issue: Server starts but frontend still can't connect
**Solution**:
- Check that `NEXT_PUBLIC_API_URL` in `Frontend/.env.local` matches the backend port
- Default should be: `NEXT_PUBLIC_API_URL=http://localhost:5000`
- Restart the frontend dev server after changing `.env.local`

## Quick Diagnostic Commands

### Check if server is running (Windows PowerShell):
```powershell
Test-NetConnection -ComputerName localhost -Port 5000
```

### Check server health (once running):
```bash
curl http://localhost:5000/health
```

### Or use the check script:
```bash
cd Backend
node check-server.js
```

## Files Changed

1. `Frontend/services/api.ts` - Added timeout and better logging
2. `Frontend/services/auth.service.ts` - Improved error handling
3. `Frontend/services/health-check.ts` - New health check utility
4. `Frontend/components/auth/creator-login-client.tsx` - Added server status checking

## Next Steps

1. ✅ Start the backend server: `cd Backend && npm run dev`
2. ✅ Verify it's running: Visit http://localhost:5000/health
3. ✅ Try logging in from the frontend again
4. ✅ Check the browser console for the API URL being used (in dev mode)

