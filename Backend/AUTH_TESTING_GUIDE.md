# Auth Endpoints Testing Guide

This guide will help you test all authentication endpoints for the Droppio backend.

## Prerequisites

1. Backend server running on `http://localhost:5000`
2. A wallet (MetaMask or similar) OR a private key for testing
3. Node.js installed (for the test script)

---

## Option 1: Using the Test Script (Recommended)

### Step 1: Run the Test Script

```bash
cd Backend
node test-auth.js
```

The script will guide you through:
1. Setting up your wallet (private key or address)
2. Signing a message
3. Testing login endpoint
4. Testing refresh token endpoint
5. Testing logout endpoint

### What the Script Does

- **With Private Key**: Automatically signs messages for you
- **With Wallet Address**: Prompts you to sign with MetaMask, then paste the signature
- Tests all three auth endpoints in sequence
- Shows you the tokens for further testing

---

## Option 2: Manual Testing with curl/Postman

### Step 1: Get a Wallet Signature

You need to sign a message with your wallet. Here are your options:

#### Option A: Use MetaMask Browser Extension

1. Open your browser with MetaMask installed
2. Open browser console (F12)
3. Run this code:

```javascript
// Connect to MetaMask
const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
const account = accounts[0];

// Message to sign
const message = "Sign in to Droppio";

// Sign the message
const signature = await ethereum.request({
  method: 'personal_sign',
  params: [message, account]
});

console.log('Wallet Address:', account);
console.log('Signature:', signature);
console.log('Message:', message);
```

Copy the wallet address, signature, and message.

#### Option B: Use ethers.js in Node.js

Create a file `sign-message.js`:

```javascript
const { ethers } = require('ethers');

// Your private key (for testing only - never commit this!)
const privateKey = '0x...your_private_key_here...';
const wallet = new ethers.Wallet(privateKey);

const message = 'Sign in to Droppio';

async function sign() {
  const signature = await wallet.signMessage(message);
  console.log('Wallet Address:', wallet.address);
  console.log('Message:', message);
  console.log('Signature:', signature);
}

sign();
```

Run it:
```bash
node sign-message.js
```

---

### Step 2: Test Login Endpoint

**Endpoint:** `POST /api/auth/login`

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0xYOUR_WALLET_ADDRESS",
    "signature": "0xYOUR_SIGNATURE",
    "message": "Sign in to Droppio",
    "role": "viewer"
  }'
```

**Expected Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "walletAddress": "0x...",
    "role": "viewer",
    "displayName": null,
    "avatarUrl": null
  }
}
```

**Save the `accessToken` and `refreshToken`!**

---

### Step 3: Test Refresh Token Endpoint

**Endpoint:** `POST /api/auth/refresh`

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

**Expected Response (200):**
```json
{
  "accessToken": "new_access_token_here",
  "refreshToken": "new_refresh_token_here"
}
```

**Note:** The old refresh token is invalidated (rotation).

---

### Step 4: Test Logout Endpoint

**Endpoint:** `POST /api/auth/logout`

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

**Expected Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Note:** Both tokens are blacklisted in Redis after logout.

---

## Testing Error Cases

### 1. Invalid Signature

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234567890123456789012345678901234567890",
    "signature": "0xINVALID_SIGNATURE",
    "message": "Sign in to Droppio",
    "role": "viewer"
  }'
```

**Expected Response (400):**
```json
{
  "error": "Invalid wallet signature"
}
```

---

### 2. Missing Token

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "some_token"
  }'
```

**Expected Response (401):**
```json
{
  "error": "No token provided"
}
```

---

### 3. Invalid Refresh Token

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "invalid_token"
  }'
```

**Expected Response (401):**
```json
{
  "error": "Invalid or expired refresh token"
}
```

---

### 4. Blacklisted Token (After Logout)

After logging out, try using the old access token:

**Request:**
```bash
curl -X GET http://localhost:5000/api/users/me \
  -H "Authorization: Bearer BLACKLISTED_TOKEN"
```

**Expected Response (401):**
```json
{
  "error": "Token has been revoked"
}
```

---

## Quick Test Checklist

- [ ] Health endpoint works
- [ ] Can generate wallet signature
- [ ] Login with valid signature returns tokens
- [ ] Login with invalid signature returns error
- [ ] Refresh token works and rotates old token
- [ ] Invalid refresh token returns error
- [ ] Logout blacklists tokens
- [ ] Blacklisted token cannot be used

---

## Common Issues

### Issue: "Invalid wallet signature"
- **Solution:** Make sure the message, signature, and wallet address all match
- The message must be exactly the same as what was signed
- The signature must be from the same wallet address

### Issue: "No token provided"
- **Solution:** Make sure you're including the `Authorization: Bearer TOKEN` header

### Issue: "Token has been revoked"
- **Solution:** Token was blacklisted (after logout). Get a new token via login

### Issue: "Connection refused"
- **Solution:** Make sure the backend server is running on port 5000

---

## Next Steps

After testing auth endpoints:
1. Use the access token to test protected endpoints
2. Test user endpoints (GET /api/users/me)
3. Test stream endpoints (if streamer)
4. Test tip endpoints (if viewer)

---

## Security Notes

⚠️ **Important:**
- Never commit private keys to git
- Use test wallets for development
- Tokens expire after 15 minutes (access) or 7 days (refresh)
- Always validate signatures on the backend (already done)

