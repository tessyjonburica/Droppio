# Droppio Backend

Complete backend implementation for Droppio MVP - Wallet-based streaming platform.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the `Backend` directory with the following variables:

```env
# Server
PORT=5000
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_min_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Blockchain
USDC_BASE_CONTRACT_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
BASE_RPC_URL=https://mainnet.base.org
CHAIN_ID=8453

# WebSocket
WS_PORT=3001
```

**Important:** Replace all placeholder values with your actual credentials.

### 3. Database Setup

Run the SQL migration in your Supabase PostgreSQL database:

```bash
# Copy the contents of migrations/001_initial_schema.sql
# and execute it in your Supabase SQL Editor
```

Or use Supabase CLI:
```bash
supabase db push
```

### 4. Start Redis

Make sure Redis is running locally:

```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest

# Or install Redis locally and start the service
```

### 5. Run the Backend

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

The server will start on:
- HTTP API: `http://localhost:5000`
- WebSocket: `ws://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with wallet signature
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and blacklist tokens

### Users
- `POST /api/users/onboard` - Onboard new user
- `GET /api/users/me` - Get current user profile

### Streams
- `POST /api/streams/start` - Start a new stream (streamer only)
- `POST /api/streams/end` - End a stream (streamer only)
- `GET /api/streams/:id` - Get stream details
- `GET /api/streams/active/:streamer_id` - Get active stream for streamer

### Tips
- `POST /api/tips/send` - Send a tip (viewer only)

### Overlays
- `GET /api/overlay/:streamer_id/config` - Get overlay configuration
- `PATCH /api/overlay/:streamer_id/config` - Update overlay configuration

## WebSocket Endpoints

- `ws://localhost:3001/ws/streamer/:streamerId` - Streamer channel
- `ws://localhost:3001/ws/viewer/:streamId` - Viewer channel
- `ws://localhost:3001/ws/overlay/:streamerId` - Overlay channel

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting errors
- `npm run format` - Format code with Prettier

## Project Structure

```
Backend/
├── migrations/          # Database migrations
├── src/
│   ├── config/         # Configuration (db, redis, env)
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, validation middleware
│   ├── models/         # Database models (Supabase)
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   ├── utils/          # Utilities (JWT, blockchain, logger)
│   ├── websockets/     # WebSocket handlers
│   └── server.ts       # Main entry point
├── package.json
├── tsconfig.json
└── jest.config.js
```

## Authentication Flow

1. User connects wallet and signs a message
2. Backend verifies signature using ethers.js
3. Backend generates JWT access token (15min) and refresh token (7 days)
4. Refresh tokens are stored in Redis and rotated on refresh
5. Tokens are blacklisted in Redis on logout

## Blockchain Integration

- USDC Base contract verification
- Transaction hash validation
- Amount verification (6 decimal places)
- Base network RPC integration

## Important Notes

- All wallet addresses are normalized to lowercase
- Streamer authentication required for stream operations
- Viewer authentication required for tip operations
- WebSocket connections require JWT authentication for streamer/overlay channels
- Redis is required for token management

## Troubleshooting

**Redis connection failed:**
- Ensure Redis is running on the configured host/port
- Check Redis password if configured

**Supabase connection failed:**
- Verify SUPABASE_URL and keys are correct
- Check Supabase project status

**WebSocket not connecting:**
- Verify WS_PORT is not in use
- Check firewall settings

## Next Steps

1. Set up environment variables
2. Run database migrations
3. Start Redis
4. Install dependencies: `npm install`
5. Run the server: `npm run dev`
6. Test API endpoints
7. Connect frontend (if applicable)

