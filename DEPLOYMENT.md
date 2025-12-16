# Droppio Deployment Guide

Complete deployment pipeline for Droppio Web3 tipping platform on Base.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Backend Deployment (Render)](#backend-deployment-render)
5. [Smart Contract Deployment](#smart-contract-deployment)
6. [CI/CD Setup](#cicd-setup)
7. [Scaling WebSocket Server](#scaling-websocket-server)
8. [Monitoring & Logging](#monitoring--logging)

## Prerequisites

- GitHub account with repository access
- Vercel account
- Render account (or Fly.io)
- Supabase account
- Base Sepolia testnet access
- Base Mainnet deployment access
- Foundry installed (for contract deployment)

## Environment Variables

### Local Development

#### Frontend (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Blockchain Configuration (Testnet)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_CHAIN_ID=84532
```

#### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development
WS_PORT=3001

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Blockchain
DROPPIO_CONTRACT_ADDRESS=0x...
BASE_RPC_URL=https://sepolia.base.org
CHAIN_ID=84532
USDC_BASE_CONTRACT_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Testnet Deployment

#### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL` - Backend testnet URL
- `NEXT_PUBLIC_WS_URL` - WebSocket testnet URL
- `NEXT_PUBLIC_CONTRACT_ADDRESS` - Base Sepolia contract address
- `NEXT_PUBLIC_BASE_RPC_URL` - Base Sepolia RPC URL
- `NEXT_PUBLIC_CHAIN_ID` - `84532`

#### Backend (Render)
- All backend env vars from local development
- Use Base Sepolia RPC URL
- Use Base Sepolia contract address
- `CHAIN_ID=84532`

### Production Deployment

#### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL` - Backend production URL
- `NEXT_PUBLIC_WS_URL` - WebSocket production URL
- `NEXT_PUBLIC_CONTRACT_ADDRESS` - Base Mainnet contract address
- `NEXT_PUBLIC_BASE_RPC_URL` - Base Mainnet RPC URL
- `NEXT_PUBLIC_CHAIN_ID` - `8453`

#### Backend (Render)
- All backend env vars from local development
- Use Base Mainnet RPC URL
- Use Base Mainnet contract address
- `CHAIN_ID=8453`

## Frontend Deployment (Vercel)

### Step 1: Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the `Frontend` directory as root

### Step 2: Configure Build Settings

- **Framework Preset**: Next.js
- **Root Directory**: `Frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Step 3: Set Environment Variables

Add all frontend environment variables in Vercel dashboard:
- Settings → Environment Variables
- Add variables for Production, Preview, and Development

### Step 4: Deploy

- Push to `main` branch → Production deployment
- Push to `develop` branch → Testnet deployment
- Or use Vercel CLI: `vercel --prod`

### Step 5: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain (e.g., `droppio.xyz`)
3. Configure DNS records as instructed

## Backend Deployment (Render)

### Option 1: Using Render Dashboard

1. **Create Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Select repository and branch

2. **Configure Service**
   - **Name**: `droppio-backend-production`
   - **Environment**: Node
   - **Build Command**: `cd Backend && npm ci && npm run build`
   - **Start Command**: `cd Backend && npm start`
   - **Root Directory**: `Backend`

3. **Set Environment Variables**
   - Add all backend environment variables
   - Use "Secret" type for sensitive values

4. **Create Redis Instance**
   - Go to "New +" → "Redis"
   - Name: `redis-production`
   - Plan: Starter
   - Update `REDIS_HOST` in backend env vars

5. **Deploy**
   - Render auto-deploys on push to connected branch
   - Or click "Manual Deploy"

### Option 2: Using Render Blueprint

1. **Create Blueprint**
   - Go to Render Dashboard → Blueprints
   - Click "New Blueprint"
   - Connect repository
   - Render will detect `render.yaml`

2. **Review Configuration**
   - Review services in `render.yaml`
   - Adjust plans and settings as needed

3. **Deploy**
   - Click "Apply"
   - Render creates all services automatically

### WebSocket Configuration

Render supports WebSocket out of the box. Ensure:
- `WS_PORT` is set in environment variables
- Health check path is `/health`
- Sticky sessions enabled (for multiple instances)

## Smart Contract Deployment

### Prerequisites

1. Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Create deployment script:
```bash
mkdir -p Backend/script
```

### Create Deployment Script

Create `Backend/script/Deploy.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {Droppio} from "../Droppio.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        Droppio droppio = new Droppio();

        vm.stopBroadcast();
    }
}
```

### Deploy to Base Sepolia (Testnet)

1. **Get Sepolia ETH**
   - Use [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)

2. **Deploy Contract**
```bash
cd Backend
forge script script/Deploy.sol:DeployScript \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

3. **Save Contract Address**
   - Copy deployed address
   - Update environment variables

### Deploy to Base Mainnet (Production)

1. **Verify Funds**
   - Ensure deployer wallet has ETH on Base Mainnet

2. **Deploy Contract**
```bash
cd Backend
forge script script/Deploy.sol:DeployScript \
  --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

3. **Update Environment Variables**
   - Update `DROPPIO_CONTRACT_ADDRESS` in all environments
   - Update frontend `NEXT_PUBLIC_CONTRACT_ADDRESS`

## CI/CD Setup

### GitHub Secrets Configuration

Add the following secrets in GitHub Settings → Secrets:

#### Frontend Secrets
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `NEXT_PUBLIC_API_URL_TESTNET` - Backend testnet URL
- `NEXT_PUBLIC_WS_URL_TESTNET` - WebSocket testnet URL
- `NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET` - Base Sepolia contract address
- `NEXT_PUBLIC_BASE_RPC_URL_TESTNET` - Base Sepolia RPC URL
- `NEXT_PUBLIC_API_URL_PRODUCTION` - Backend production URL
- `NEXT_PUBLIC_WS_URL_PRODUCTION` - WebSocket production URL
- `NEXT_PUBLIC_CONTRACT_ADDRESS_PRODUCTION` - Base Mainnet contract address
- `NEXT_PUBLIC_BASE_RPC_URL_PRODUCTION` - Base Mainnet RPC URL

#### Backend Secrets
- `RENDER_API_KEY` - Render API key
- `RENDER_SERVICE_ID_TESTNET` - Render testnet service ID
- `RENDER_SERVICE_ID_PRODUCTION` - Render production service ID

#### Contract Secrets
- `DEPLOYER_PRIVATE_KEY_TESTNET` - Testnet deployer private key
- `DEPLOYER_PRIVATE_KEY_PRODUCTION` - Production deployer private key
- `BASE_SEPOLIA_RPC_URL` - Base Sepolia RPC URL
- `BASE_MAINNET_RPC_URL` - Base Mainnet RPC URL
- `BASESCAN_API_KEY` - BaseScan API key for verification

#### Optional Notifications
- `SLACK_WEBHOOK_URL` - Slack webhook for notifications

### Workflow Behavior

- **Frontend**: Deploys on push to `main` (production) or `develop` (testnet)
- **Backend**: Deploys on push to `main` (production) or `develop` (testnet)
- **Contracts**: Deploys on push to `main` (mainnet) or `develop` (sepolia), or manual dispatch

## Scaling WebSocket Server

### Current Architecture (MVP)

- Single backend instance
- In-memory connection storage
- Direct WebSocket connections

### Scaling Strategy

#### Phase 1: Multiple Instances with Sticky Sessions

1. **Enable Sticky Sessions**
   - Render: Enable sticky sessions in service settings
   - Load balancer routes same client to same instance

2. **Connection Affinity**
   - Use session cookies or IP-based routing
   - Ensures WebSocket connections stay on same instance

#### Phase 2: Redis Pub/Sub (Post-MVP)

1. **Architecture**
   ```
   Blockchain Event → Backend Instance 1 → Redis Pub/Sub
                                              ↓
                                    All Backend Instances
                                              ↓
                                    Connected WebSocket Clients
   ```

2. **Implementation**
   - Publish events to Redis channel: `creator:{creatorId}`
   - Each instance subscribes to relevant channels
   - Distribute events to connected clients

3. **Benefits**
   - Horizontal scaling
   - No sticky sessions needed
   - Event distribution across instances

### Monitoring Connections

1. **Metrics to Track**
   - Active WebSocket connections per instance
   - Connection rate (connections/second)
   - Disconnection rate
   - Event latency (blockchain → client)

2. **Implementation**
   - Add metrics endpoint: `GET /metrics`
   - Use Prometheus or similar
   - Dashboard with Grafana

## Monitoring & Logging

### Backend Logging

1. **Structured Logging**
   - Use existing logger utility
   - Log levels: `error`, `warn`, `info`, `debug`
   - Include request IDs for tracing

2. **Log Aggregation**
   - Render: Built-in log viewer
   - Or use external service (Datadog, LogRocket)

### Health Checks

1. **HTTP Health Check**
   - Endpoint: `GET /health`
   - Returns: `{ status: 'ok', timestamp: '...' }`
   - Used by Render for auto-restart

2. **WebSocket Health Check**
   - Ping/pong mechanism
   - Monitor connection health
   - Auto-reconnect on failure

### Error Tracking

1. **Error Monitoring**
   - Use Sentry or similar
   - Track unhandled errors
   - Alert on critical failures

2. **Transaction Monitoring**
   - Monitor blockchain listener
   - Track failed transactions
   - Alert on contract errors

## Best Practices

1. **Security**
   - Never commit secrets to repository
   - Use environment variables for all secrets
   - Rotate secrets regularly
   - Use different keys for testnet/production

2. **Deployment**
   - Test on testnet first
   - Use feature flags for gradual rollouts
   - Monitor metrics after deployment
   - Have rollback plan ready

3. **Scaling**
   - Start with single instance
   - Monitor metrics before scaling
   - Scale horizontally when needed
   - Use Redis Pub/Sub for event distribution

4. **Monitoring**
   - Set up alerts for critical errors
   - Monitor WebSocket connection health
   - Track blockchain event processing
   - Monitor database performance

## Troubleshooting

### Frontend Issues

- **Build fails**: Check Node.js version (20+)
- **Environment variables not loading**: Verify Vercel env vars are set
- **API calls fail**: Check CORS settings and API URL

### Backend Issues

- **WebSocket not connecting**: Verify WS_PORT and firewall rules
- **Redis connection fails**: Check REDIS_HOST and credentials
- **Blockchain listener not working**: Verify RPC URL and contract address

### Contract Issues

- **Deployment fails**: Check deployer has enough ETH
- **Verification fails**: Verify BaseScan API key
- **Contract not found**: Check contract address in env vars

## Support

For deployment issues:
1. Check GitHub Actions logs
2. Review Render/Vercel logs
3. Verify environment variables
4. Check contract deployment on BaseScan

