# Starting the Backend Server

## Quick Start

1. **Navigate to the Backend directory:**
   ```bash
   cd Backend
   ```

2. **Verify .env file exists:**
   - Make sure you have a `.env` file in the `Backend` directory
   - Check `ENV_VARIABLES.md` in the root for required variables

3. **Install dependencies (if not done):**
   ```bash
   npm install
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

5. **Verify it's running:**
   - You should see: `Server running on port 5000 in development mode`
   - Open http://localhost:5000/health in your browser
   - Should return: `{"status":"ok","timestamp":"..."}`

## Common Issues

### Server won't start - Missing Environment Variables
If you see errors about invalid environment variables:
- Check that your `.env` file has all required variables
- See `ENV_VARIABLES.md` for the complete list
- Required variables include: SUPABASE_URL, JWT_SECRET, etc.

### Port 5000 already in use
If port 5000 is already taken:
- Change `PORT=5000` to a different port in `.env`
- Update `NEXT_PUBLIC_API_URL` in Frontend `.env.local` to match

### Redis Connection Error
If you see Redis connection errors:
- Make sure Redis is running: `docker run -d -p 6379:6379 redis:latest`
- Or install Redis locally and start the service

### Database Connection Error
If you see Supabase connection errors:
- Verify your Supabase credentials in `.env`
- Make sure the database is accessible

## Testing the Server

Once running, test with:
```bash
# Check health endpoint
curl http://localhost:5000/health

# Or use the check script
node check-server.js
```

