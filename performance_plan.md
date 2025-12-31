# Performance Optimization Plan

This document outlines strategies to enhance the performance of the Droppio application, making it faster and smoother.

## 1. Immediate Fixes (Already Applied)

- **Optimized Polling Hook:** The `usePolling` hook now buffers callbacks, preventing unnecessary interval resets and re-renders when using inline functions.
- **Query Caching:** Configured `React Query` with a default `staleTime` of 60 seconds to prevent aggressive refetching of data.

---

## 2. Frontend Optimizations

### Rendering & State
- **Virtualize Long Lists:**
  - **Target:** Chat messages, Tip history.
  - **Action:** Use `react-window` or `react-virtuoso` to render only visible items. This significantly reduces DOM nodes and improves scrolling performance.
  - *Current Status:* Generic mapping is used.

- **Dynamic Imports (Code Splitting):**
  - **Target:** Heavy components like `WalletConnect`, complex Modals, or the Stream Player.
  - **Action:** Use `next/dynamic` to load these components only when needed.
  ```typescript
  const WalletConnect = dynamic(() => import('@/components/auth/wallet-connect'), { ssr: false });
  ```

### Assets & Images
- **Font Loading:** Ensure fonts in `layout.tsx` use `display: swap` (already done) and are preloaded.
- **Image Optimization:** Continue using `next/image`. For user uploads (avatars), ensure the backend serves resized versions (thumbnails) rather than full-resolution images.

---

## 3. Backend & Database (Supabase)

### Database Queries
- **Select Specific Columns:**
  - **Problem:** Many queries currently use `.select('*')`.
  - **Fix:** Select only needed fields, e.g., `.select('id, username, avatar_url')`. This reduces payload size and parsing time.
  - **Target:** `tip.model.ts`, `user.model.ts`.

- **Indexing:**
  - **Action:** Ensure foreign keys and frequently queried columns are indexed.
  - **Targets:**
    - `tips.creator_id`
    - `tips.stream_id`
    - `users.username`
    - `users.wallet_address`

### Caching strategy
- **Redis / Server Cache:**
  - Cache public profiles and stream status.
  - Cache "Active Stream" lookups, as these are high-frequency read operations.

---

## 4. Real-Time & Network

### WebSockets vs. Polling
- **Strategy:** Prioritize WebSockets for "live" data (chat, stream status).
- **Fallback:** Polling is now optimized but should have a longer interval (e.g., 10-30s) if sockets are active.
- **Action:** Ensure the WebSocket connection is stable (Heartbeat/Ping) so clients don't fall back to polling unnecessarily.

### RPC Provider
- **Critical:** The current setup uses public RPC endpoints for Base Sepolia in `providers.tsx`.
- **Action:** Register for a dedicated RPC provider (e.g., Alchemy, Infura, or QuickNode) to avoid rate limits and slow response times during network congestion.

---

## 5. Monitoring
- **Vercel Analytics:** Already installed. Check the "Vercel Speed Insights" dashboard to identify real-user bottlenecks (LCP, CLS, FID).
