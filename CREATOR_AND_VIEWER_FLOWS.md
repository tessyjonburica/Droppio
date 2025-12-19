# Creator and Viewer Flows

Complete documentation of user journeys for creators and viewers on Droppio.

---

## 🎬 CREATOR FLOW

### Step 1: Initial Login & Authentication

**Frontend:** `/login`
- Creator connects wallet (MetaMask, WalletConnect, etc.)
- System generates a message to sign
- Creator signs message with wallet
- Frontend sends to backend: `POST /api/auth/login`
  ```json
  {
    "walletAddress": "0x...",
    "role": "streamer",
    "message": "Sign this message...",
    "signature": "0x..."
  }
  ```

**Backend:** `auth.service.ts`
- Verifies wallet signature using `verifyWalletSignature()`
- Finds or creates user in database
- If user doesn't exist, creates new user with role "Creator"
- Generates JWT tokens:
  - Access token (15 min expiry)
  - Refresh token (7 days expiry)
- Stores refresh token in Redis
- Returns tokens and user info

**Result:** Creator is authenticated, tokens stored in frontend state

---

### Step 2: Creator Onboarding

**Frontend:** `/onboard`
- Redirects to onboarding if user exists but has no `displayName`
- Creator fills form:
  - Display Name (required)
  - Avatar URL (optional)
  - Streaming Platform (optional: Twitch, YouTube, Kick, TikTok)
  - Payout Wallet (optional)
- Submits: `POST /api/users/onboard`

**Backend:** `user.controller.ts` → `user.service.ts`
- Validates wallet address matches authenticated user
- Updates user profile in database
- Sets `display_name`, `avatar_url`, `platform`, `payout_wallet`

**Result:** Creator profile is complete, redirected to `/dashboard`

---

### Step 3: Creator Dashboard

**Frontend:** `/dashboard`
- Displays:
  - Balance card (earnings)
  - Stream status (live/offline)
  - WebSocket connection status
  - Overlay URL generator
  - Recent tips feed
  - Stream history
  - Settings links

**Key Features:**
- **Overlay URL:** Generated as `/overlay/{creatorId}?token={accessToken}`
- **WebSocket Connection:** Connects to `ws://localhost:3001/ws/streamer/{creatorId}`
  - Authenticated with JWT token
  - Receives real-time tip notifications
  - Shows connection status

**Result:** Creator can see dashboard, copy overlay URL, view tips

---

### Step 4: Start Stream

**Frontend:** `/dashboard/stream`
- Creator selects platform (Twitch, YouTube, Kick, TikTok)
- Enters stream key
- Clicks "Start Stream"
- Calls: `POST /api/streams/start`

**Backend:** `stream.controller.ts` → `stream.service.ts`
- Validates creator is authenticated and has role "streamer"
- Checks no active stream exists for this creator
- Creates new stream record in database:
  - `streamer_id`, `platform`, `stream_key`, `is_live = true`
- Emits WebSocket event to viewer channel: `stream_started`
- Returns stream object

**WebSocket Event:** `viewerWsHelpers.broadcastStreamStarted()`
- Broadcasts to all viewers connected to this stream
- Event: `{ type: 'stream_started', data: { streamId, streamer, platform } }`

**Result:** Stream is live, viewers can see it's active

---

### Step 5: Receive Tips (Real-Time)

**When a viewer sends a tip:**

**Backend:** `tip.service.ts`
- After tip is processed, emits two WebSocket events:

1. **To Streamer Channel:** `streamerWsHelpers.notifyTipReceived()`
   - Event: `{ type: 'tip_received', data: { tipId, amount, viewer, timestamp } }`
   - Sent to creator's dashboard WebSocket connection

2. **To Overlay Channel:** `overlayWsHelpers.notifyTipEvent()`
   - Event: `{ type: 'tip_event', data: { tipId, amount, viewer, timestamp } }`
   - Sent to overlay WebSocket connection (for OBS overlay)

**Frontend Dashboard:**
- Receives `tip_received` event via WebSocket
- Shows toast notification: "New tip received! {amount} USDC from {viewer}"
- Adds tip to recent tips list
- Updates balance (if applicable)

**Overlay Page:**
- Receives `tip_event` event via WebSocket
- Triggers animated tip alert
- Plays sound notification
- Displays tip animation for 5 seconds

**Result:** Creator sees tip in dashboard and overlay shows animated alert

---

### Step 6: End Stream

**Frontend:** `/dashboard`
- Creator clicks "End Stream" button
- Calls: `POST /api/streams/end`

**Backend:** `stream.service.ts`
- Validates stream belongs to creator
- Updates stream: `is_live = false`, sets `ended_at`
- Emits WebSocket event: `viewerWsHelpers.broadcastStreamEnded()`
- Event: `{ type: 'stream_ended', data: { streamId, timestamp } }`

**Result:** Stream is ended, viewers notified, tipping disabled

---

### Step 7: Overlay Setup (OBS Integration)

**Frontend:** `/dashboard`
- Creator copies overlay URL: `/overlay/{creatorId}?token={accessToken}`
- Adds as Browser Source in OBS:
  1. Add Source → Browser Source
  2. URL: `https://droppio.xyz/overlay/{creatorId}?token={accessToken}`
  3. Width: 1920, Height: 1080
  4. Custom CSS: `body { background-color: rgba(0,0,0,0); }`

**Overlay Page:** `/overlay/{streamerId}?token={token}`
- Validates token
- Connects to WebSocket: `ws://localhost:3001/ws/overlay/{streamerId}?token={token}`
- Listens for `tip_event` events
- Displays animated tip alerts on screen

**Result:** Overlay is live in OBS, shows tip alerts during stream

---

## 👁️ VIEWER FLOW
### Step 1: Discover Creator (Landing Page)

**Frontend:** `/creator/{username}` or `/tip/{username}`
- Viewer visits creator profile page
- Sees creator info:
  - Display name, avatar
  - Platform (Twitch, YouTube, etc.)
  - Live status indicator
- Can view recent tips

**Backend:** `creator.service.ts`
- Fetches creator by username
- Returns creator profile

**Result:** Viewer sees creator profile

---

### Step 2: Check Stream Status

**Frontend:** `/tip/{username}`
- Automatically checks for active stream
- Calls: `GET /api/streams/active/{streamer_id}`
- If stream is active:
  - Shows "Live" indicator
  - Enables tipping
  - Connects to WebSocket: `ws://localhost:3001/ws/viewer/{streamId}`
- If no stream:
  - Shows "Offline"
  - Disables tipping

**WebSocket Connection:**
- Connects to viewer channel (no authentication required)
- Receives events:
  - `stream_started` - Stream went live
  - `stream_ended` - Stream ended
- Polling fallback: Checks every 5-10 seconds if WebSocket disconnected

**Result:** Viewer knows if creator is live

---

### Step 3: Connect Wallet (Optional for Viewing, Required for Tipping)

**Frontend:** `/tip/{username}`
- Viewer clicks "Connect Wallet"
- Connects via Wagmi (MetaMask, WalletConnect, etc.)
- Wallet address is stored in frontend state

**Note:** Wallet connection is only required when sending a tip, not for viewing

**Result:** Wallet connected, ready to tip

---

### Step 4: Send Tip

**Frontend:** `/tip/{username}`
- Viewer enters tip amount (USDC)
- Clicks "Send Tip"
- Process:
  1. **Generate Signature:**
     - Creates message: `generateMessage(walletAddress, timestamp)`
     - Signs message with wallet: `signer.signMessage(message)`
  
  2. **Simulate Transaction (MVP):**
     - Generates mock transaction hash
     - In production: Would interact with smart contract
  
  3. **Send Tip to Backend:**
     - `POST /api/tips/send`
     ```json
     {
       "streamId": "...",
       "amountUsdc": "10.00",
       "signature": "0x...",
       "message": "...",
       "txHash": "0x..."
     }
     ```

**Backend:** `tip.controller.ts` → `tip.service.ts`
1. **Verify Signature:**
   - Validates wallet signature matches viewer address
   
2. **Validate Stream:**
   - Checks stream exists and is live
   - Verifies `is_live = true`
   
3. **Verify Transaction:**
   - Calls `verifyUSDCTransaction(txHash, amount, walletAddress)`
   - Validates transaction on blockchain
   - Checks amount matches
   - Verifies transaction is from correct address
   
4. **Create Tip Record:**
   - Saves tip to database:
     - `stream_id`, `viewer_id`, `amount_usdc`, `tx_hash`, `created_at`
   
5. **Emit WebSocket Events:**
   - To streamer: `tip_received` event
   - To overlay: `tip_event` event

**WebSocket Events:**
- **Streamer Channel:** Receives notification in dashboard
- **Overlay Channel:** Triggers animated alert in OBS overlay
- **Viewer Channel:** Could broadcast to other viewers (future feature)

**Frontend:**
- Shows success toast: "Tip sent! You sent {amount} USDC"
- Adds tip to recent tips list
- Clears amount input

**Result:** Tip is sent, creator receives notification, overlay shows alert

---

### Step 5: View Recent Tips

**Frontend:** `/tip/{username}`
- Displays list of recent tips for active stream
- Shows:
  - Viewer name/address
  - Tip amount
  - Time ago (e.g., "2 minutes ago")
- Updates in real-time via WebSocket or polling

**Backend:** `tip.service.ts`
- Tips are stored in database with:
  - `viewer_id`, `stream_id`, `amount_usdc`, `tx_hash`, `created_at`
- Can be queried by stream ID

**Result:** Viewer sees tip history

---

## 🔄 REAL-TIME FLOW DIAGRAM

```
┌─────────────┐
│   Viewer    │
│  Sends Tip  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Backend API    │
│  POST /tips/send│
└──────┬──────────┘
       │
       ├─► Verify Signature
       ├─► Verify Transaction
       ├─► Save to Database
       │
       ├─► WebSocket: Streamer Channel
       │   └─► Creator Dashboard (shows notification)
       │
       └─► WebSocket: Overlay Channel
           └─► OBS Overlay (shows animated alert)
```

---

## 🔐 AUTHENTICATION FLOW

### Creator Authentication
1. Connect wallet
2. Sign message
3. Backend verifies signature
4. Returns JWT tokens (access + refresh)
5. Access token used for API calls
6. Refresh token used to get new access token

### WebSocket Authentication
- **Streamer Channel:** Requires JWT access token in Authorization header
- **Overlay Channel:** Requires token in query param or Authorization header
- **Viewer Channel:** No authentication required (public)

---

## 📊 DATA FLOW SUMMARY

### Creator Journey:
```
Login → Onboard → Dashboard → Start Stream → Receive Tips → End Stream
         ↓
    Overlay Setup (OBS)
```

### Viewer Journey:
```
Discover Creator → Check Stream Status → Connect Wallet → Send Tip → View Tips
```

### Real-Time Events:
- **Stream Started:** Broadcast to all viewers
- **Stream Ended:** Broadcast to all viewers
- **Tip Received:** Sent to creator dashboard
- **Tip Event:** Sent to overlay (OBS)

---

## 🎯 KEY ENDPOINTS

### Creator Endpoints:
- `POST /api/auth/login` - Login with wallet
- `POST /api/users/onboard` - Complete profile
- `GET /api/users/me` - Get profile
- `POST /api/streams/start` - Start stream
- `POST /api/streams/end` - End stream
- `GET /api/streams/active/:streamer_id` - Get active stream
- `GET /api/overlay/:streamer_id/config` - Get overlay config
- `PATCH /api/overlay/:streamer_id/config` - Update overlay config

### Viewer Endpoints:
- `GET /api/streams/active/:streamer_id` - Check if stream is live
- `POST /api/tips/send` - Send tip
- `GET /api/creator/:username` - Get creator profile

### WebSocket Channels:
- `ws://localhost:3001/ws/streamer/:streamerId` - Creator channel (authenticated)
- `ws://localhost:3001/ws/viewer/:streamId` - Viewer channel (public)
- `ws://localhost:3001/ws/overlay/:streamerId?token=...` - Overlay channel (token-based)

---

## 🔄 STATE MANAGEMENT

### Frontend (Zustand):
- `auth-store.ts` - Stores:
  - Access token
  - Refresh token
  - User info (id, walletAddress, role, displayName, avatarUrl)

### Backend (Redis):
- Refresh tokens (7-day TTL)
- Blacklisted tokens
- WebSocket connection tracking (in-memory for MVP)

---

## 📝 NOTES

1. **MVP Limitations:**
   - Transaction verification is simplified (mock txHash in MVP)
   - WebSocket connections stored in-memory (single instance)
   - No horizontal scaling for WebSocket yet

2. **Future Enhancements:**
   - Redis Pub/Sub for WebSocket scaling
   - Real blockchain transaction integration
   - Tip history pagination
   - Analytics dashboard
   - Withdrawal functionality

3. **Security:**
   - All wallet signatures verified
   - JWT tokens with short expiry
   - Refresh token rotation
   - Token blacklisting on logout
   - Overlay token validation
