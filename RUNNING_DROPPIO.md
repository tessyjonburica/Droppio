# 🚀 Droppio is Starting!

## Status

Both servers are starting in the background:

### Backend Server
- **Port**: 5000
- **Status**: Starting...
- **API**: http://localhost:5000/api
- **WebSocket**: ws://localhost:3001

### Frontend Server
- **Port**: 3000
- **Status**: Starting...
- **URL**: http://localhost:3000

## What's Happening

1. ✅ **Environment file created**: `Frontend/.env.local`
2. ✅ **Backend server starting**: Running `npm run dev` in background
3. ✅ **Frontend server starting**: Running `npm run dev` in background

## Access Your Application

Once the servers are ready (usually 10-30 seconds):

1. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

2. **You should see**:
   - Droppio homepage
   - "Connect Wallet" button
   - Login options

## Testing the Application

### Quick Test Flow:

1. **Connect Wallet**
   - Click "Connect Wallet"
   - Approve connection in MetaMask

2. **Login as Creator**
   - Click "Login" → Select "Streamer"
   - Sign the message with your wallet
   - Complete onboarding form

3. **Access Dashboard**
   - View your creator dashboard
   - See overlay URL
   - Check real-time connection status

## Troubleshooting

### If servers don't start:

1. **Check if ports are in use**:
   ```powershell
   netstat -ano | findstr ":5000"
   netstat -ano | findstr ":3000"
   ```

2. **Check server logs**:
   - Look at the terminal windows where servers are running
   - Check for error messages

3. **Verify environment variables**:
   - Backend: Check `Backend/.env` exists
   - Frontend: Check `Frontend/.env.local` exists

### Common Issues:

- **Backend not starting**: Check if Redis is running
- **Frontend not starting**: Check if Node.js version is 18+
- **Wallet not connecting**: Ensure MetaMask is installed

## Server Management

### To Stop Servers:
- Press `Ctrl+C` in the terminal windows where servers are running
- Or close the terminal windows

### To Restart Servers:
```powershell
# Backend
cd Backend
npm run dev

# Frontend (new terminal)
cd Frontend
npm run dev
```

## Next Steps

1. ✅ Wait for servers to fully start (10-30 seconds)
2. ✅ Open http://localhost:3000 in browser
3. ✅ Test the application
4. ✅ Verify all features work

---

**Droppio is ready to use!** 🎉

