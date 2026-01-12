# Droppio Troubleshooting Guide

Common issues and solutions for the Droppio platform.

---

## 🦊 Wallet Issues

### "Login failed: wallet not available"
- **Cause:** No Web3 provider (like MetaMask) detected in the browser.
- **Solution:** 
  - Ensure MetaMask or another compatible wallet extension is installed.
  - If on mobile, use the MetaMask/Phantom in-app browser.
  - Refresh the page and try again.

### "Signature rejected"
- **Cause:** User clicked "Cancel" or "Reject" on the signing request.
- **Solution:** Click "Connect" again and approve the signature request in your wallet.

---

## 🛠️ Backend & Database

### "Database permission denied"
- **Cause:** Supabase RLS (Row Level Security) policies or incorrect API keys.
- **Solution:** 
  - Run the `database/schema-simple.sql` in your Supabase SQL editor.
  - Double-check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `Backend/.env`.

### "Redis connection refused"
- **Cause:** Redis server is not running or incorrect host/port.
- **Solution:** 
  - Ensure Redis is installed and running (`redis-cli ping` should return `PONG`).
  - Check `REDIS_URL` in your `.env` file.

---

## 🛰️ Real-Time & Overlay

### "Overlay not showing alerts"
- **Cause:** WebSocket disconnection or invalid token.
- **Solution:** 
  - Ensure the Backend server is running.
  - Check the OBS Browser Source for errors (Right-click -> Interact).
  - Refresh the Overlay URL in the Creator Dashboard to generate a new token.
  - Verify `NEXT_PUBLIC_WS_URL` is set correctly in `Frontend/.env.local`.

### "Transactions not detected"
- **Cause:** The `blockchain-listener` service is not reaching the RPC provider.
- **Solution:** 
  - Check `RPC_URL` in `Backend/.env`.
  - Ensure the smart contract address matches `DROPPIO_CONTRACT_ADDRESS`.
  - Verify the network (e.g., Sepolia vs Mainnet) matches your wallet and contract.
