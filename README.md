# 💧 Droppio | The Decentralized Tipping Platform

Droppio is a high-performance, real-time Web3 tipping platform that allows creators to receive direct ETH tips from viewers with instant alerts and zero-middleman fees.

![Droppio Banner](https://img.shields.io/badge/Web3-Creator_Economy-blueviolet)
![Tech Stack](https://img.shields.io/badge/Next.js-Express-Solidity-blue)

---

## 🚀 Overview

Droppio bridges the gap between traditional streaming and Web3. It provides a seamless "Event Bridge" between on-chain transactions and off-chain streaming alerts (OBS/Streamlabs).

- **For Creators:** Connect wallet, set up an overlay, and receive tips instantly with real-time visual alerts on stream.
- **For Viewers:** Support creators directly using ETH. No platform accounts required—just a wallet.

---

## 🏗️ Technical Architecture

Droppio uses a hybrid architecture designed for speed and reliability:

- **Smart Contract (Ethereum/L2):** Handles the trustless movement of funds.
- **Backend (Node.js/Express):** Monitors the blockchain and broadcasts events via WebSockets.
- **Frontend (Next.js):** Provides the dashboard for creators and the tipping interface for viewers.
- **Real-time Layer (WebSockets/Redis):** Ensures 0ms-latency alerts for the OBS overlay.

### High-Level Data Flow:
1. **Viewer** sends ETH via `Droppio.sol`.
2. **Blockchain Listener** (Backend) detects the `TipSent` event.
3. **WebSocket Server** broadcasts the event to the **Creator's Overlay**.
4. **Overlay (OBS)** displays an animation and plays a sound instantly.

---

## 📁 Project Structure

```bash
Droppio/
├── Backend/          # Node.js + Express + WebSocket + Solidity
│   ├── src/          # API, Services, Models, Ws-Handlers
│   ├── Droppio.sol   # Core Smart Contract
│   └── database/     # Supabase schemas
├── Frontend/         # Next.js 15 Application
│   ├── app/          # Pages (Dashboard, Overlay, Tipping)
│   ├── components/   # UI Library
│   └── services/     # API/Contract logic
└── docs/             # (Optional) Detailed documentation
```

---

## 🛠️ Getting Started

### Prerequisites
- Node.js >= 18.x
- PostgreSQL/Supabase account
- Redis instance
- An Ethereum Wallet (MetaMask, etc.)

### 1. Backend Setup
```bash
cd Backend
npm install
# Copy .env.example to .env and fill in your credentials
npm run dev
```

### 2. Frontend Setup
```bash
cd Frontend
npm install
# Copy .env.example to .env.local and fill in your credentials
npm run dev
```

---

## 🎬 User Guides

### For Creators
1. **Login:** Connect your wallet at `/login`.
2. **Onboard:** Set your display name and streaming platform.
3. **Overlay:** Copy your "Overlay URL" from the dashboard.
4. **OBS Setup:**
   - Add a "Browser Source" in OBS.
   - Paste the Overlay URL.
   - Set width to `1920` and height to `1080`.
5. **Go Live:** Start your stream and receive tips!

### For Viewers
1. **Find Creator:** Go to `droppio.xyz/tip/{username}`.
2. **Connect Wallet:** Click "Connect Wallet".
3. **Tip:** Enter the amount and click "Send Tip".
4. **Verify:** Watch the alert pop up on the creator's stream!

---

## 📄 Documentation Index

For more detailed information, please refer to:

- [Whitepaper.md](./Whitepaper.md) - Project vision and economics.
- [CREATOR_AND_VIEWER_FLOWS.md](./CREATOR_AND_VIEWER_FLOWS.md) - Detailed step-by-step journeys.
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guide to production deployment.
- [ENV_VARIABLES.md](./ENV_VARIABLES.md) - Configuration reference.
- [WEBSOCKET_EVENT_BRIDGE.md](./Backend/WEBSOCKET_EVENT_BRIDGE.md) - How real-time alerts work.

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.
