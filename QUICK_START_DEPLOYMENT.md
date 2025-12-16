# Quick Start Deployment Guide

Get Droppio deployed in 30 minutes.

## Prerequisites Checklist

- [ ] GitHub repository with code
- [ ] Vercel account
- [ ] Render account
- [ ] Supabase project
- [ ] Base Sepolia testnet access
- [ ] Deployer wallet with testnet ETH

## Step 1: Configure GitHub Secrets (5 min)

Go to: `Settings → Secrets and variables → Actions`

### Frontend Secrets
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
NEXT_PUBLIC_API_URL_TESTNET=https://api-testnet.droppio.xyz
NEXT_PUBLIC_WS_URL_TESTNET=wss://ws-testnet.droppio.xyz
NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET=0x... (will set after contract deploy)
NEXT_PUBLIC_BASE_RPC_URL_TESTNET=https://sepolia.base.org
```

### Backend Secrets
```
RENDER_API_KEY=your_render_api_key
RENDER_SERVICE_ID_TESTNET=will_set_after_creating_service
RENDER_SERVICE_ID_PRODUCTION=will_set_after_creating_service
```

### Contract Secrets
```
DEPLOYER_PRIVATE_KEY_TESTNET=0x... (without 0x prefix)
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key
```

## Step 2: Deploy Smart Contract (10 min)

### Install Foundry
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Deploy to Base Sepolia
```bash
cd Backend
forge script script/Deploy.sol:DeployScript \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

### Save Contract Address
Copy the deployed address and update:
- GitHub Secret: `NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET`
- Backend env var: `DROPPIO_CONTRACT_ADDRESS`

## Step 3: Deploy Backend (10 min)

### Option A: Using Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Name**: `droppio-backend-testnet`
   - **Root Directory**: `Backend`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
5. Add all environment variables (see `ENV_VARIABLES.md`)
6. Create Redis instance
7. Deploy

### Option B: Using Render Blueprint

1. Go to Render Dashboard → Blueprints
2. Click "New Blueprint"
3. Connect repository
4. Render detects `render.yaml`
5. Review and apply

### Save Service ID
Copy Render service ID and update GitHub Secret: `RENDER_SERVICE_ID_TESTNET`

## Step 4: Deploy Frontend (5 min)

### Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import GitHub repository
4. Configure:
   - **Root Directory**: `Frontend`
   - **Framework**: Next.js
5. Add environment variables (see `ENV_VARIABLES.md`)
6. Deploy

### Save Project IDs
Copy Vercel IDs and update GitHub Secrets:
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Step 5: Verify Deployment

### Check Backend
```bash
curl https://api-testnet.droppio.xyz/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Check Frontend
Visit: `https://your-project.vercel.app`
- Should load without errors
- Wallet connection should work

### Check WebSocket
```bash
wscat -c wss://ws-testnet.droppio.xyz/ws/overlay/{creatorId}?token={token}
# Should connect successfully
```

## Step 6: Enable CI/CD

### Push to GitHub
```bash
git add .
git commit -m "Setup deployment pipeline"
git push origin develop
```

### Verify GitHub Actions
1. Go to GitHub → Actions
2. Verify workflows run successfully
3. Check deployments complete

## Troubleshooting

### Backend won't start
- Check environment variables are set
- Verify Redis connection
- Check logs in Render dashboard

### Frontend build fails
- Verify all `NEXT_PUBLIC_` variables are set
- Check Node.js version (20+)
- Review build logs in Vercel

### Contract deployment fails
- Verify deployer has ETH
- Check RPC URL is correct
- Verify private key format (no 0x prefix)

## Next Steps

1. **Test on Testnet**: Verify all functionality works
2. **Monitor**: Set up monitoring and alerts
3. **Production**: Deploy to mainnet when ready
4. **Scale**: Follow `SCALING_GUIDE.md` when needed

## Resources

- [Full Deployment Guide](./DEPLOYMENT.md)
- [Environment Variables](./ENV_VARIABLES.md)
- [Scaling Guide](./SCALING_GUIDE.md)
- [Backend README](./Backend/README.md)
- [Frontend README](./Frontend/README.md)

