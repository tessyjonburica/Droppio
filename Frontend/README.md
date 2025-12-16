# Droppio Frontend

Production-grade Next.js frontend for the Droppio wallet-based streaming platform.

## Tech Stack

- **Next.js 14** - App Router with Server Components
- **TypeScript** - Strict type safety
- **TailwindCSS** - Utility-first styling
- **shadcn/ui** - Accessible UI components
- **Framer Motion** - Smooth animations
- **Wagmi** - Wallet integration
- **Ethers.js** - Blockchain interactions
- **Zustand** - Global state management
- **Axios** - API client with auto-refresh

## Branding

- **Name**: droppio
- **Logo Font**: Pacifico
- **Short Mark**: d.
- **Header Font**: Pacifico
- **Body Font**: Inter
- **Colors**:
  - Primary: `#0F9E99`
  - White: `#FFFFFF`
  - Soft Mint: `#EFFBFB`

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the `Frontend` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Production URLs
NEXT_PUBLIC_API_URL=https://api.droppio.xyz
NEXT_PUBLIC_WS_URL=wss://ws.droppio.xyz

# Blockchain Configuration
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_CONTRACT_ADDRESS=
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel

The project is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

**Domains:**
- `droppio.xyz`
- `droppio.xyz/creator/[username]`
- `droppio.xyz/tip/[username]`

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
Frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with SEO
│   ├── page.tsx            # Home page
│   ├── login/              # Login page
│   ├── onboard/            # Creator onboarding
│   ├── dashboard/          # Creator dashboard
│   ├── tip/[username]/      # Tipping page (dynamic)
│   ├── creator/[username]/  # Creator profile (dynamic)
│   └── overlay/[streamerId]/ # Overlay page
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── auth/               # Authentication components
│   ├── brand/              # Brand components
│   └── layout/             # Layout components
├── hooks/                  # Custom React hooks
│   ├── use-auth.ts
│   ├── use-websocket.ts
│   ├── use-overlay-websocket.ts
│   └── use-polling.ts
├── services/               # API services
│   ├── api.ts
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── stream.service.ts
│   ├── tip.service.ts
│   ├── overlay.service.ts
│   └── creator.service.ts
├── store/                  # Zustand stores
│   └── auth-store.ts
├── types/                  # TypeScript types
│   └── index.ts
└── utils/                  # Utility functions
    └── signature.ts
```

## Features

### Overlay System

- **Route**: `/overlay/[streamerId]?token=XYZ`
- **Security**: Token-based authentication
- **Features**:
  - Animated tip alerts (slide, bounce, fade)
  - Configurable themes
  - Sound notifications
  - Real-time WebSocket updates
  - Polling fallback

### Real-Time Engine

- **WebSocket Channels**:
  - Streamer: `/ws/streamer/{streamerId}`
  - Viewer: `/ws/viewer/{streamId}`
  - Overlay: `/ws/overlay/{streamerId}`
- **Polling Fallback**: Automatic 5-10s polling when WebSocket disconnected
- **Auto-reconnect**: Exponential backoff

### SEO & Metadata

- Dynamic metadata for creator profiles
- Open Graph images
- Twitter Card support
- Optimized for search engines

## Development

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npx tsc --noEmit
```

## Code Quality

- **Strict TypeScript**: Enabled with no unused variables/parameters
- **ESLint**: Next.js recommended rules
- **Backend Sync**: All services match backend DTOs
- **Clean Code**: No deprecated packages, minimal dependencies

## Notes

- All routes are internal (single Next.js app)
- Production-ready codebase
- Optimized for Vercel deployment
- Image optimization enabled
- SEO-friendly structure
