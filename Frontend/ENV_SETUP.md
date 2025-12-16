# Environment Setup Instructions

## Frontend Environment Variables

Since `.env.local` files are gitignored, you need to create it manually.

**Create** `Frontend/.env.local` with this content:

```env
# Droppio Frontend - Environment Variables
# Development Configuration

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Blockchain Configuration
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org

# App URL (for overlay links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Quick Setup Command

Run this in PowerShell from the Frontend directory:

```powershell
@"
# Droppio Frontend - Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_APP_URL=http://localhost:3000
"@ | Out-File -FilePath .env.local -Encoding utf8
```

Or manually create the file in `Frontend/.env.local` with the content above.

