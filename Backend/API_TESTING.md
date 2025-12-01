# API Testing Guide

Complete testing guide for all Droppio Backend API endpoints.

## Prerequisites

1. Backend server running on `http://localhost:5000`
2. Redis/Memurai running
3. Supabase database configured
4. Postman, Thunder Client, or curl installed

---

## Test Plan

### 1. Health Check (No Auth Required)

**GET** `/health`

```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

---

### 2. Authentication Endpoints

#### 2.1 Login (POST /api/auth/login)

**Endpoint:** `POST /api/auth/login`

**Body:**
```json
{
  "walletAddress": "0x1234567890123456789012345678901234567890",
  "signature": "0x...",
  "message": "Sign in to Droppio",
  "role": "viewer"
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234567890123456789012345678901234567890",
    "signature": "0x...",
    "message": "Sign in to Droppio",
    "role": "viewer"
  }'
```

**Expected Response (200):**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "...",
    "walletAddress": "0x...",
    "role": "viewer",
    "displayName": null,
    "avatarUrl": null
  }
}
```

**Save the `accessToken` and `refreshToken` for subsequent requests!**

---

#### 2.2 Refresh Token (POST /api/auth/refresh)

**Endpoint:** `POST /api/auth/refresh`

**Body:**
```json
{
  "refreshToken": "your_refresh_token_here"
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

**Expected Response (200):**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

#### 2.3 Logout (POST /api/auth/logout)

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer your_access_token_here
```

**Body:**
```json
{
  "refreshToken": "your_refresh_token_here"
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token_here" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

**Expected Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### 3. User Endpoints

#### 3.1 Onboard User (POST /api/users/onboard)

**Endpoint:** `POST /api/users/onboard`

**Headers:**
```
Authorization: Bearer your_access_token_here
```

**Body:**
```json
{
  "role": "streamer",
  "displayName": "My Streamer Name",
  "avatarUrl": "https://example.com/avatar.jpg",
  "platform": "twitch",
  "payoutWallet": "0x1234567890123456789012345678901234567890"
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:5000/api/users/onboard \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token_here" \
  -d '{
    "role": "streamer",
    "displayName": "My Streamer Name",
    "avatarUrl": "https://example.com/avatar.jpg",
    "platform": "twitch",
    "payoutWallet": "0x1234567890123456789012345678901234567890"
  }'
```

**Expected Response (200):**
```json
{
  "user": {
    "id": "...",
    "wallet_address": "0x...",
    "role": "streamer",
    "display_name": "My Streamer Name",
    "avatar_url": "https://example.com/avatar.jpg",
    "platform": "twitch",
    "payout_wallet": "0x...",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

---

#### 3.2 Get Profile (GET /api/users/me)

**Endpoint:** `GET /api/users/me`

**Headers:**
```
Authorization: Bearer your_access_token_here
```

**Test with curl:**
```bash
curl -X GET http://localhost:5000/api/users/me \
  -H "Authorization: Bearer your_access_token_here"
```

**Expected Response (200):**
```json
{
  "user": {
    "id": "...",
    "wallet_address": "0x...",
    "role": "viewer",
    "display_name": null,
    "avatar_url": null,
    "platform": null,
    "payout_wallet": null,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

---

### 4. Stream Endpoints

#### 4.1 Start Stream (POST /api/streams/start)

**Endpoint:** `POST /api/streams/start`

**Headers:**
```
Authorization: Bearer your_access_token_here (must be streamer role)
```

**Body:**
```json
{
  "platform": "twitch",
  "streamKey": "your_stream_key_here"
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:5000/api/streams/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token_here" \
  -d '{
    "platform": "twitch",
    "streamKey": "your_stream_key_here"
  }'
```

**Expected Response (201):**
```json
{
  "stream": {
    "id": "...",
    "streamer_id": "...",
    "platform": "twitch",
    "stream_key": "your_stream_key_here",
    "is_live": true,
    "created_at": "...",
    "ended_at": null
  }
}
```

**Save the stream `id` for subsequent requests!**

---

#### 4.2 End Stream (POST /api/streams/end)

**Endpoint:** `POST /api/streams/end`

**Headers:**
```
Authorization: Bearer your_access_token_here (must be streamer role)
```

**Body:**
```json
{
  "streamId": "your_stream_id_here"
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:5000/api/streams/end \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token_here" \
  -d '{
    "streamId": "your_stream_id_here"
  }'
```

**Expected Response (200):**
```json
{
  "stream": {
    "id": "...",
    "streamer_id": "...",
    "platform": "twitch",
    "stream_key": "...",
    "is_live": false,
    "created_at": "...",
    "ended_at": "..."
  }
}
```

---

#### 4.3 Get Stream (GET /api/streams/:id)

**Endpoint:** `GET /api/streams/:id`

**Test with curl:**
```bash
curl -X GET http://localhost:5000/api/streams/your_stream_id_here
```

**Expected Response (200):**
```json
{
  "stream": {
    "id": "...",
    "streamer_id": "...",
    "platform": "twitch",
    "stream_key": "...",
    "is_live": true,
    "created_at": "...",
    "ended_at": null,
    "streamer": {
      "id": "...",
      "display_name": "...",
      "avatar_url": "..."
    }
  }
}
```

---

#### 4.4 Get Active Stream (GET /api/streams/active/:streamer_id)

**Endpoint:** `GET /api/streams/active/:streamer_id`

**Test with curl:**
```bash
curl -X GET http://localhost:5000/api/streams/active/your_streamer_id_here
```

**Expected Response (200):**
```json
{
  "stream": {
    "id": "...",
    "streamer_id": "...",
    "platform": "twitch",
    "stream_key": "...",
    "is_live": true,
    "created_at": "...",
    "ended_at": null,
    "streamer": {
      "id": "...",
      "display_name": "...",
      "avatar_url": "..."
    }
  }
}
```

**Or 404 if no active stream:**
```json
{
  "error": "No active stream found"
}
```

---

### 5. Tip Endpoints

#### 5.1 Send Tip (POST /api/tips/send)

**Endpoint:** `POST /api/tips/send`

**Headers:**
```
Authorization: Bearer your_access_token_here (must be viewer role)
```

**Body:**
```json
{
  "streamId": "your_stream_id_here",
  "amountUsdc": "10.5",
  "signature": "0x...",
  "message": "Tip message",
  "txHash": "0x1234567890abcdef..."
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:5000/api/tips/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token_here" \
  -d '{
    "streamId": "your_stream_id_here",
    "amountUsdc": "10.5",
    "signature": "0x...",
    "message": "Tip message",
    "txHash": "0x1234567890abcdef..."
  }'
```

**Expected Response (201):**
```json
{
  "tip": {
    "id": "...",
    "stream_id": "...",
    "viewer_id": "...",
    "amount_usdc": "10.5",
    "tx_hash": "0x...",
    "created_at": "...",
    "viewer": {
      "id": "...",
      "wallet_address": "0x...",
      "display_name": "..."
    }
  }
}
```

---

### 6. Overlay Endpoints

#### 6.1 Get Overlay Config (GET /api/overlay/:streamer_id/config)

**Endpoint:** `GET /api/overlay/:streamer_id/config`

**Headers:**
```
Authorization: Bearer your_access_token_here
```

**Test with curl:**
```bash
curl -X GET http://localhost:5000/api/overlay/your_streamer_id_here/config \
  -H "Authorization: Bearer your_access_token_here"
```

**Expected Response (200):**
```json
{
  "overlay": {
    "id": "...",
    "streamer_id": "...",
    "theme": {},
    "alert_settings": {
      "enabled": true,
      "soundEnabled": false,
      "minAmount": "0",
      "showDuration": 5000
    },
    "created_at": "...",
    "updated_at": "..."
  }
}
```

---

#### 6.2 Update Overlay Config (PATCH /api/overlay/:streamer_id/config)

**Endpoint:** `PATCH /api/overlay/:streamer_id/config`

**Headers:**
```
Authorization: Bearer your_access_token_here (must be streamer role and owner)
```

**Body:**
```json
{
  "theme": {
    "primaryColor": "#FF0000",
    "secondaryColor": "#00FF00",
    "fontFamily": "Arial",
    "fontSize": 16,
    "animationStyle": "slide"
  },
  "alertSettings": {
    "enabled": true,
    "soundEnabled": true,
    "minAmount": "5.0",
    "showDuration": 3000
  }
}
```

**Test with curl:**
```bash
curl -X PATCH http://localhost:5000/api/overlay/your_streamer_id_here/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token_here" \
  -d '{
    "theme": {
      "primaryColor": "#FF0000",
      "secondaryColor": "#00FF00"
    },
    "alertSettings": {
      "enabled": true,
      "soundEnabled": true
    }
  }'
```

**Expected Response (200):**
```json
{
  "overlay": {
    "id": "...",
    "streamer_id": "...",
    "theme": {
      "primaryColor": "#FF0000",
      "secondaryColor": "#00FF00"
    },
    "alert_settings": {
      "enabled": true,
      "soundEnabled": true
    },
    "created_at": "...",
    "updated_at": "..."
  }
}
```

---

## Testing Order

1. **Health Check** - Verify server is running
2. **Login** - Get access token (use real wallet signature)
3. **Get Profile** - Verify authentication works
4. **Onboard** - Set up user profile
5. **Start Stream** - Create a stream (if streamer)
6. **Get Stream** - Verify stream was created
7. **Send Tip** - Send a tip (if viewer with live stream)
8. **Get Overlay** - Get overlay config
9. **Update Overlay** - Update overlay config (if streamer)
10. **End Stream** - End the stream
11. **Refresh Token** - Test token refresh
12. **Logout** - Test logout

---

## Common Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [...]
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```
or
```json
{
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "..." // only in development
}
```

---

## Testing Tips

1. **Use real wallet signatures** - For login and tip sending, you'll need actual wallet signatures
2. **Save tokens** - Copy access tokens and refresh tokens for authenticated requests
3. **Test error cases** - Try invalid data, missing fields, expired tokens
4. **Check Redis** - Verify tokens are stored/blacklisted in Redis
5. **Check Database** - Verify data is saved correctly in Supabase

---

## Next Steps

After testing all endpoints:
1. Document any issues found
2. Verify WebSocket connections work
3. Test complete user flows
4. Set up automated tests

