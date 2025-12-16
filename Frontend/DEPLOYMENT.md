# Droppio Frontend - Deployment Guide

## Vercel Deployment

### Prerequisites

1. Vercel account
2. GitHub repository connected
3. Environment variables configured

### Environment Variables

Set these in Vercel dashboard:

```env
NEXT_PUBLIC_API_URL=https://api.droppio.xyz
NEXT_PUBLIC_WS_URL=wss://ws.droppio.xyz
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_CONTRACT_ADDRESS=<your_contract_address>
```

### Deployment Steps

1. **Connect Repository**
   - Go to Vercel dashboard
   - Import your GitHub repository
   - Select the `Frontend` directory as root

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Set Domains**
   - Primary: `droppio.xyz`
   - Add custom domains in Vercel dashboard

4. **Deploy**
   - Push to `main` branch triggers automatic deployment
   - Or deploy manually from Vercel dashboard

### Post-Deployment

1. **Verify Routes**
   - `https://droppio.xyz` - Home
   - `https://droppio.xyz/creator/[username]` - Creator profiles
   - `https://droppio.xyz/tip/[username]` - Tipping pages
   - `https://droppio.xyz/overlay/[streamerId]?token=XYZ` - Overlay

2. **Test WebSocket**
   - Verify WebSocket connections work in production
   - Check polling fallback if WebSocket fails

3. **SEO Verification**
   - Test Open Graph tags
   - Verify Twitter Cards
   - Check metadata for creator pages

## Sound Files

Add tip notification sound to:
```
Frontend/public/sounds/tip-sound.mp3
```

Recommended:
- Format: MP3
- Duration: 1-2 seconds
- Volume: Moderate (not too loud)
- Style: Pleasant notification sound

## Performance Optimization

- ✅ Image optimization enabled
- ✅ Code splitting automatic
- ✅ Static generation where possible
- ✅ WebSocket with auto-reconnect
- ✅ Polling fallback for reliability

## Monitoring

Monitor:
- WebSocket connection rates
- API response times
- Error rates
- Page load times

Use Vercel Analytics for:
- Real-time performance
- Core Web Vitals
- User analytics

