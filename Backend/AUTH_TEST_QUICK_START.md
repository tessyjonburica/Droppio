# Quick Start: Testing Auth Endpoints

## Quick Method - Use Browser Console with MetaMask

### Step 1: Open Browser Console

1. Open your browser (Chrome/Edge with MetaMask installed)
2. Press `F12` to open Developer Tools
3. Go to the Console tab
4. Make sure you're on a page where MetaMask can connect (like localhost)

### Step 2: Sign a Message

Paste this code in the console:

```javascript
// Connect to MetaMask and get account
const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
const account = accounts[0];
console.log('Connected wallet:', account);

// Message to sign
const message = "Sign in to Droppio";
console.log('Message to sign:', message);

// Sign the message
const signature = await ethereum.request({
  method: 'personal_sign',
  params: [message, account]
});

console.log('\n✅ Copy these values:');
console.log('Wallet Address:', account);
console.log('Signature:', signature);
console.log('Message:', message);
```

**Copy the wallet address, signature, and message!**

### Step 3: Test Login

Use curl or Postman to test:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "PASTE_WALLET_ADDRESS_HERE",
    "signature": "PASTE_SIGNATURE_HERE",
    "message": "Sign in to Droppio",
    "role": "viewer"
  }'
```

**Save the accessToken and refreshToken from the response!**

### Step 4: Test Refresh Token

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "PASTE_REFRESH_TOKEN_HERE"
  }'
```

### Step 5: Test Logout

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PASTE_ACCESS_TOKEN_HERE" \
  -d '{
    "refreshToken": "PASTE_REFRESH_TOKEN_HERE"
  }'
```

---

## Alternative: Use the Test Script

If you have Node.js 18+:

```bash
cd Backend
node test-auth.js
```

The script will guide you through everything!

