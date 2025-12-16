# Environment Variables Reference

Complete mapping of all environment variables for Droppio deployment.

## Frontend Environment Variables

### Local Development (.env.local)

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Blockchain Configuration (Base Sepolia Testnet)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_CHAIN_ID=84532
```

### Testnet Deployment (Vercel)

```env
NEXT_PUBLIC_API_URL=https://api-testnet.droppio.xyz
NEXT_PUBLIC_WS_URL=wss://ws-testnet.droppio.xyz
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # Base Sepolia contract
NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_CHAIN_ID=84532
```

### Production Deployment (Vercel)

```env
NEXT_PUBLIC_API_URL=https://api.droppio.xyz
NEXT_PUBLIC_WS_URL=wss://ws.droppio.xyz
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # Base Mainnet contract
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_CHAIN_ID=8453
```

## Backend Environment Variables

### Local Development (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development
WS_PORT=3001

# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Authentication
JWT_SECRET=your_jwt_secret_min_32_chars_long
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars_long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Blockchain Configuration (Base Sepolia)
DROPPIO_CONTRACT_ADDRESS=0x...
BASE_RPC_URL=https://sepolia.base.org
CHAIN_ID=84532
USDC_BASE_CONTRACT_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Testnet Deployment (Render)

```env
# Server Configuration
PORT=5000
NODE_ENV=production
WS_PORT=3001

# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Authentication
JWT_SECRET=your_jwt_secret_min_32_chars_long
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars_long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis Cache (Render Redis instance)
REDIS_HOST=redis-testnet.onrender.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Blockchain Configuration (Base Sepolia)
DROPPIO_CONTRACT_ADDRESS=0x...
BASE_RPC_URL=https://sepolia.base.org
CHAIN_ID=84532
USDC_BASE_CONTRACT_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Production Deployment (Render)

```env
# Server Configuration
PORT=5000
NODE_ENV=production
WS_PORT=3001

# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Authentication
JWT_SECRET=your_jwt_secret_min_32_chars_long
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars_long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis Cache (Render Redis instance)
REDIS_HOST=redis-production.onrender.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Blockchain Configuration (Base Mainnet)
DROPPIO_CONTRACT_ADDRESS=0x...
BASE_RPC_URL=https://mainnet.base.org
CHAIN_ID=8453
USDC_BASE_CONTRACT_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

## Variable Descriptions

### Frontend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.droppio.xyz` |
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL | `wss://ws.droppio.xyz` |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Droppio contract address | `0x1234...` |
| `NEXT_PUBLIC_BASE_RPC_URL` | Base network RPC URL | `https://mainnet.base.org` |
| `NEXT_PUBLIC_CHAIN_ID` | Base chain ID | `8453` (mainnet) or `84532` (sepolia) |

### Backend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | HTTP server port | `5000` |
| `WS_PORT` | WebSocket server port | `3001` |
| `NODE_ENV` | Node environment | `production` or `development` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `your_secret_key_here` |
| `JWT_REFRESH_SECRET` | JWT refresh secret (min 32 chars) | `your_refresh_secret_here` |
| `JWT_ACCESS_EXPIRY` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | `7d` |
| `REDIS_HOST` | Redis host address | `localhost` or `redis.onrender.com` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password (optional) | `your_password` |
| `DROPPIO_CONTRACT_ADDRESS` | Droppio contract address | `0x1234...` |
| `BASE_RPC_URL` | Base network RPC URL | `https://mainnet.base.org` |
| `CHAIN_ID` | Base chain ID | `8453` (mainnet) or `84532` (sepolia) |
| `USDC_BASE_CONTRACT_ADDRESS` | USDC contract on Base | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |

## GitHub Secrets

### Frontend Secrets

```yaml
VERCEL_TOKEN: Vercel API token
VERCEL_ORG_ID: Vercel organization ID
VERCEL_PROJECT_ID: Vercel project ID
NEXT_PUBLIC_API_URL_TESTNET: Backend testnet URL
NEXT_PUBLIC_WS_URL_TESTNET: WebSocket testnet URL
NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET: Base Sepolia contract address
NEXT_PUBLIC_BASE_RPC_URL_TESTNET: Base Sepolia RPC URL
NEXT_PUBLIC_API_URL_PRODUCTION: Backend production URL
NEXT_PUBLIC_WS_URL_PRODUCTION: WebSocket production URL
NEXT_PUBLIC_CONTRACT_ADDRESS_PRODUCTION: Base Mainnet contract address
NEXT_PUBLIC_BASE_RPC_URL_PRODUCTION: Base Mainnet RPC URL
```

### Backend Secrets

```yaml
RENDER_API_KEY: Render API key
RENDER_SERVICE_ID_TESTNET: Render testnet service ID
RENDER_SERVICE_ID_PRODUCTION: Render production service ID
```

### Contract Secrets

```yaml
DEPLOYER_PRIVATE_KEY_TESTNET: Testnet deployer private key
DEPLOYER_PRIVATE_KEY_PRODUCTION: Production deployer private key
BASE_SEPOLIA_RPC_URL: Base Sepolia RPC URL
BASE_MAINNET_RPC_URL: Base Mainnet RPC URL
BASESCAN_API_KEY: BaseScan API key for verification
```

### Optional Notifications

```yaml
SLACK_WEBHOOK_URL: Slack webhook URL for notifications
```

## Security Best Practices

1. **Never commit secrets**
   - Use `.gitignore` for `.env` files
   - Use GitHub Secrets for CI/CD
   - Use platform secrets (Vercel/Render) for deployments

2. **Use different keys per environment**
   - Separate testnet and production keys
   - Rotate keys regularly
   - Use strong, random secrets (min 32 chars for JWT)

3. **Limit access**
   - Only grant access to necessary team members
   - Use read-only keys where possible
   - Monitor secret access logs

4. **Validate environment variables**
   - Backend uses Zod schema validation
   - Frontend should validate required vars at build time
   - Fail fast on missing required variables

## Environment-Specific Notes

### Local Development
- Use `.env.local` for frontend (gitignored)
- Use `.env` for backend (gitignored)
- Use local Redis instance or Docker
- Use Base Sepolia testnet

### Testnet Deployment
- Use Base Sepolia network
- Use testnet contract addresses
- Use separate Supabase project (optional)
- Use testnet RPC endpoints

### Production Deployment
- Use Base Mainnet network
- Use production contract addresses
- Use production Supabase project
- Use production RPC endpoints
- Enable all security headers
- Use HTTPS/WSS only

## Troubleshooting

### Missing Environment Variables

**Frontend:**
- Check Vercel environment variables
- Verify `NEXT_PUBLIC_` prefix
- Rebuild after adding variables

**Backend:**
- Check Render environment variables
- Verify variable names match schema
- Check logs for validation errors

### Wrong Network

- Verify `CHAIN_ID` matches network
- Check `BASE_RPC_URL` is correct
- Verify contract address is for correct network

### Connection Issues

- Verify URLs use correct protocol (https/wss)
- Check CORS settings
- Verify firewall rules allow connections

