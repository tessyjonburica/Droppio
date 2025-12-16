# Droppio Frontend - Debug Report & Fixes

## Issues Detected

### 1. **CRITICAL: Login Form Bug**
- **Location**: `components/auth/login-form.tsx:52`
- **Issue**: References `response.user.displayName` but `response` variable doesn't exist
- **Impact**: Login will crash after successful authentication
- **Fix**: Store login response and use it for redirect logic

### 2. **CRITICAL: Field Name Mismatch**
- **Location**: Multiple files
- **Issue**: Backend returns `display_name` (snake_case) but store uses `displayName` (camelCase)
- **Impact**: User data not properly synced between backend and frontend
- **Fix**: Normalize field names in auth service

### 3. **CRITICAL: Tip Service Requires Auth**
- **Location**: `services/tip.service.ts`
- **Issue**: Tip sending requires authentication, but viewers should NOT need to login
- **Impact**: Viewers cannot tip without logging in (violates requirements)
- **Fix**: Make tip endpoint work without auth token (backend should handle this)

### 4. **HIGH: WebSocket Hook Dependency Issue**
- **Location**: `hooks/use-websocket.ts:77`
- **Issue**: `reconnectAttempts` in dependency array causes infinite reconnection loops
- **Impact**: WebSocket connections may reconnect infinitely
- **Fix**: Remove from dependencies, use ref instead

### 5. **HIGH: Overlay URL Hardcoded**
- **Location**: `app/dashboard/page.tsx:56`
- **Issue**: Uses `window.location.origin` instead of `https://dropp.io`
- **Impact**: Overlay URL incorrect in production
- **Fix**: Use environment variable or constant

### 6. **MEDIUM: Auto-login Not Implemented**
- **Location**: `hooks/use-auth.ts:15-19`
- **Issue**: Auto-login logic is commented out/empty
- **Impact**: Users must manually login even if wallet is connected
- **Fix**: Implement auto-login on wallet connect

### 7. **MEDIUM: Missing Error Boundaries**
- **Location**: Multiple components
- **Issue**: No error boundaries for failed API calls
- **Impact**: App crashes on errors instead of graceful handling
- **Fix**: Add error boundaries and better error handling

### 8. **MEDIUM: SSR/CSR Hydration Issues**
- **Location**: Components using `window` or browser APIs
- **Issue**: Potential hydration mismatches
- **Impact**: React hydration errors
- **Fix**: Ensure proper client-side checks

### 9. **LOW: Unused Imports**
- **Location**: Multiple files
- **Issue**: Some unused imports detected
- **Impact**: Larger bundle size
- **Fix**: Remove unused imports

### 10. **LOW: Inconsistent Error Handling**
- **Location**: Multiple services
- **Issue**: Some errors not properly handled
- **Impact**: Poor user experience
- **Fix**: Standardize error handling

---

## Fixes Applied

See individual file changes below.

