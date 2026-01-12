# Droppio API Reference

Base URL: `http://localhost:3001/api` (Local)

---

## 🔐 Authentication

### POST `/auth/login`
Authenticates a user via wallet signature.
- **Body:**
  ```json
  {
    "walletAddress": "string",
    "role": "streamer" | "viewer",
    "message": "string",
    "signature": "string"
  }
  ```
- **Response:** `200 OK` with JWT access and refresh tokens.

---

## 👤 Users

### GET `/users/me` (Protected)
Gets the current authenticated user's profile.

### POST `/users/onboard` (Protected)
Completes the initial profile setup.
- **Body:**
  ```json
  {
    "displayName": "string",
    "platform": "twitch" | "youtube" | "kick" | "tiktok",
    "payoutWallet": "string",
    "avatarUrl": "string"
  }
  ```

---

## 🎥 Streams

### POST `/streams/start` (Protected)
Starts a new stream session.
- **Body:**
  ```json
  {
    "platform": "string",
    "streamKey": "string"
  }
  ```

### POST `/streams/end` (Protected)
Ends the current active stream session.

---

## 💰 Tips

### POST `/tips/send`
Submits a tip for processing and triggers alerts.
- **Body:**
  ```json
  {
    "streamId": "uuid" (optional for offline),
    "creatorId": "uuid" (required for offline),
    "amountUsdc": "string",
    "txHash": "string",
    "message": "string",
    "signature": "string"
  }
  ```

---

## 📽️ Overlay

### GET `/overlay/:streamerId/config`
Fetches the visual configuration for the OBS overlay.

### PATCH `/overlay/:streamerId/config` (Protected)
Updates overlay colors, sounds, and animations.
