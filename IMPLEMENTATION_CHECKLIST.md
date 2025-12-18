# Implementation Checklist - Complete Flow

**Priority Legend:**
- 🔴 **CRITICAL** - Blocks core functionality
- 🟡 **HIGH** - Important for user experience
- 🟢 **MEDIUM** - Nice to have, polish
- ⚪ **LOW** - Future enhancement

---

## 🔴 CRITICAL - Offline Tipping Support

### Backend Changes

#### 1. Update Tip Service to Support Offline Tipping
**File:** `Backend/src/services/tip.service.ts`

**Current Issue:** 
- Line 29-37: Requires `streamId` and checks `stream.is_live = true`
- This blocks offline tipping completely

**What to Change:**
- Make `streamId` optional in `SendTipInput` type
- If `streamId` provided → validate stream exists (but don't require `is_live`)
- If `streamId` NOT provided → create offline tip (requires `creatorId` instead)
- Only send overlay WebSocket event if stream exists AND `is_live = true`
- Always send streamer WebSocket event (for dashboard notification)

**New Logic:**
```typescript
// If streamId provided, validate it exists (but allow offline streams)
// If no streamId, require creatorId and create offline tip
// Overlay alerts ONLY if stream.is_live === true
// Streamer dashboard notification ALWAYS
```

**Files to Modify:**
- `Backend/src/types/tip.ts` - Update `SendTipInput` to make `streamId` optional, add `creatorId?`
- `Backend/src/services/tip.service.ts` - Refactor `sendTip` method
- `Backend/src/models/tip.model.ts` - Update `create` to handle `creator_id` directly (not just via stream)
- `Backend/src/routes/tip.routes.ts` - Update validation schema to make `streamId` optional

---

#### 2. Update Tip Model to Support Creator-Based Tips
**File:** `Backend/src/models/tip.model.ts`

**What to Change:**
- Modify `create` method to accept `creatorId` directly (not just via stream)
- Update database insert to handle `creator_id` when `stream_id` is null
- Ensure schema supports `creator_id` as foreign key (check `schema-simple.sql`)

**Check Database Schema:**
- Verify `tips` table has `creator_id` column
- Verify foreign key relationship exists
- If missing, add migration

---

#### 3. Update Tip Routes Validation
**File:** `Backend/src/routes/tip.routes.ts`

**What to Change:**
- Make `streamId` optional in `sendTipSchema`
- Add `creatorId` as optional field
- Add validation: either `streamId` OR `creatorId` must be provided
- Update route to handle both cases

---

### Frontend Changes

#### 4. Update Tip Page to Allow Offline Tipping
**File:** `Frontend/app/tip/[username]/page.tsx`

**Current Issue:**
- Line 122-128: Disables tipping when `!activeStream`
- Line 250: Input disabled when `!activeStream`

**What to Change:**
- Remove requirement for `activeStream` to enable tipping
- Allow tipping even when creator is offline
- Show different UI state: "Live" vs "Offline" but both allow tipping
- Update button text: "Tip {Creator}" (not "Send Tip" only when live)

**Logic:**
```typescript
// Tipping always enabled
// If activeStream exists → show "Live" badge
// If no activeStream → show "Offline" badge
// Both states allow tipping
```

---

#### 5. Update Tip Service Frontend
**File:** `Frontend/services/tip.service.ts`

**What to Change:**
- Update `SendTipInput` interface to make `streamId` optional
- Add `creatorId` as optional field
- Update `sendTip` to send either `streamId` OR `creatorId` (not both)

---

#### 6. Update Tip Page to Send Creator ID
**File:** `Frontend/app/tip/[username]/page.tsx`

**What to Change:**
- When sending tip, if `activeStream` exists → send `streamId`
- If no `activeStream` → send `creatorId` instead
- Ensure creator data is loaded before allowing tip submission

---

## 🔴 CRITICAL - Overlay Only Shows Alerts When Live

### Backend Changes

#### 7. Update Overlay WebSocket to Check Stream Status
**File:** `Backend/src/services/tip.service.ts`

**What to Change:**
- In `sendTip` method, before calling `overlayWsHelpers.notifyTipEvent`:
  - Check if stream exists AND `is_live === true`
  - Only send overlay event if both conditions met
  - Always send streamer dashboard event (regardless of live status)

**Logic:**
```typescript
// Always notify streamer dashboard
streamerWsHelpers.notifyTipReceived(...)

// Only notify overlay if stream is live
if (stream && stream.is_live) {
  overlayWsHelpers.notifyTipEvent(...)
}
```

---

## 🔴 CRITICAL - Discovery/Landing Page

### Backend Changes

#### 8. Create Search Creators Endpoint
**File:** `Backend/src/routes/user.routes.ts` (or create `creator.routes.ts`)

**New Endpoint:** `GET /api/creators/search?q={query}`

**What to Implement:**
- Search by:
  - Display name (partial match)
  - Wallet address (exact match)
  - Platform handle (if stored)
- Return array of creator profiles
- Include: id, display_name, avatar_url, platform, wallet_address

**Files to Create/Modify:**
- `Backend/src/controllers/creator.controller.ts` - New controller
- `Backend/src/services/creator.service.ts` - Search logic
- `Backend/src/models/user.model.ts` - Add search method
- `Backend/src/routes/creator.routes.ts` - New routes file

---

#### 9. Create Get Creator by Username Endpoint
**File:** `Backend/src/routes/user.routes.ts` or `creator.routes.ts`

**New Endpoint:** `GET /api/creators/by-username/:username`

**What to Implement:**
- Find creator by `display_name` (case-insensitive, exact or partial match)
- Return full creator profile
- Include: id, display_name, avatar_url, platform, payout_wallet, bio (if exists)

**Files to Modify:**
- `Backend/src/controllers/creator.controller.ts`
- `Backend/src/services/creator.service.ts`
- `Backend/src/models/user.model.ts` - Add `findByDisplayName` method

---

#### 10. Create Featured Creators Endpoint
**File:** `Backend/src/routes/creator.routes.ts`

**New Endpoint:** `GET /api/creators/featured`

**What to Implement:**
- Return list of featured creators (e.g., top 10 by total tips received)
- Include: id, display_name, avatar_url, platform, total_tips (aggregated)
- Order by total tips descending

**Files to Modify:**
- `Backend/src/controllers/creator.controller.ts`
- `Backend/src/services/creator.service.ts`
- `Backend/src/models/user.model.ts` - Add aggregation query

---

### Frontend Changes

#### 11. Build Discovery/Landing Page
**File:** `Frontend/app/page.tsx`

**What to Implement:**
- Hero section with search bar
- Search functionality:
  - Search by username, wallet, or platform handle
  - Real-time search results (debounced)
  - Link to creator profile on click
- Featured creators section:
  - Grid of creator cards
  - Show avatar, name, platform
  - Link to `/creator/{username}`
- "How it works" section
- Call-to-action buttons

**New Components Needed:**
- `Frontend/components/discovery/search-bar.tsx`
- `Frontend/components/discovery/creator-card.tsx`
- `Frontend/components/discovery/featured-creators.tsx`

**Services:**
- `Frontend/services/creator.service.ts` - Add `searchCreators` and `getFeaturedCreators` methods

---

## 🔴 CRITICAL - Creator Profile Page

### Backend Changes

#### 12. Ensure Get Creator by Username Works
**Same as #9 above** - This endpoint is needed for profile page

---

### Frontend Changes

#### 13. Fix Creator Profile Page Data Loading
**File:** `Frontend/app/creator/[username]/page.tsx`

**Current Issue:**
- Line 26: `// TODO: Load creator by username from backend`
- Creator state never loaded → shows placeholder

**What to Change:**
- Add `useEffect` to load creator on mount
- Call `creatorService.getByUsername(username)`
- Show loading state while fetching
- Show error state if creator not found
- Display actual creator data (name, avatar, platform, bio)
- Show live status badge if active stream exists
- Add prominent "Tip {Creator}" button linking to `/tip/{username}`

---

## 🔴 CRITICAL - Profile Settings Update

### Backend Changes

#### 14. Create Update Profile Endpoint
**File:** `Backend/src/routes/user.routes.ts`

**New Endpoint:** `PATCH /api/users/me`

**What to Implement:**
- Update: display_name, avatar_url, platform, payout_wallet, bio (new field)
- Require authentication
- Validate input
- Return updated user

**Files to Modify:**
- `Backend/src/controllers/user.controller.ts` - Add `updateProfile` method
- `Backend/src/services/user.service.ts` - Add `updateProfile` method (or use existing `updateStreamerProfile`)
- `Backend/src/models/user.model.ts` - Ensure update method supports all fields
- `Backend/src/types/user.ts` - Add `bio` field to User type

---

#### 15. Add Bio Field to Database Schema
**File:** `Backend/database/schema-simple.sql` or migration

**What to Add:**
- Add `bio` column to `users` table (TEXT, nullable)
- Create migration if needed

---

### Frontend Changes

#### 16. Fix Settings Page to Actually Save
**File:** `Frontend/app/dashboard/settings/page.tsx`

**Current Issue:**
- Line 36: `// TODO: Implement update profile endpoint`
- Line 27: `// TODO: Load platform and payout wallet from user profile`

**What to Change:**
- Load existing profile data on mount (call `userService.getMe()`)
- Pre-populate form fields with existing data
- Implement `handleSave` to call `userService.updateProfile()`
- Show success/error toasts
- Add `bio` field to form

**Service Update:**
- `Frontend/services/user.service.ts` - Add `updateProfile` method

---

## 🟡 HIGH - Overlay Settings Actually Work

### Backend Changes

#### 17. Ensure Overlay Config is Returned Correctly
**File:** `Backend/src/services/overlay.service.ts`

**What to Verify:**
- `getConfig` returns theme and alert_settings
- `updateConfig` saves correctly
- Data structure matches frontend expectations

---

### Frontend Changes

#### 18. Make Overlay Page Read Settings
**File:** `Frontend/app/overlay/[streamerId]/page.tsx`

**Current Issue:**
- Line 17: `const theme: OverlayTheme = 'default';` (hardcoded)
- Line 18: `const soundEnabled = true;` (hardcoded)

**What to Change:**
- On mount, fetch overlay config: `overlayService.getConfig(streamerId)`
- Use `overlay.theme` instead of hardcoded 'default'
- Use `overlay.alert_settings.soundEnabled` instead of hardcoded `true`
- Use `overlay.alert_settings.showDuration` for animation duration
- Use `overlay.alert_settings.minAmount` to filter tips below threshold

**Files to Modify:**
- `Frontend/app/overlay/[streamerId]/page.tsx`
- `Frontend/app/overlay/[streamerId]/components/TipAnimation.tsx` - Use theme from props

---

## 🟡 HIGH - Cumulative Tips Display

### Backend Changes

#### 19. Create Get Total Tips Endpoint
**File:** `Backend/src/routes/user.routes.ts` or `creator.routes.ts`

**New Endpoint:** `GET /api/creators/:creatorId/total-tips`

**What to Implement:**
- Aggregate all tips for creator (sum of `amount_usdc`)
- Return: `{ totalTips: string, totalTipsCount: number }`
- Include tips from all streams + offline tips

**Files to Modify:**
- `Backend/src/controllers/user.controller.ts` or `creator.controller.ts`
- `Backend/src/services/user.service.ts` or `creator.service.ts`
- `Backend/src/models/tip.model.ts` - Add `getTotalByCreatorId` method

---

### Frontend Changes

#### 20. Display Total Tips on Dashboard
**File:** `Frontend/app/dashboard/page.tsx`

**Current Issue:**
- Line 106: Shows hardcoded `0 ETH`

**What to Change:**
- On mount, fetch total tips: `creatorService.getTotalTips(user.id)`
- Display actual total (format as ETH or USDC)
- Show loading state while fetching
- Update when new tips received (via WebSocket)

**Service Update:**
- `Frontend/services/creator.service.ts` - Add `getTotalTips` method

---

## 🟡 HIGH - Real Blockchain Transaction

### Frontend Changes

#### 21. Replace Mock Transaction with Real Contract Call
**File:** `Frontend/app/tip/[username]/page.tsx`

**Current Issue:**
- Line 156: `const txHash = '0x${Math.random()...}'` (mock)

**What to Change:**
- Use Wagmi/Ethers to interact with Droppio contract
- Call contract `tip(address payable to)` function
- Pass creator's wallet address
- Send ETH amount (convert USDC input to ETH if needed)
- Wait for transaction confirmation
- Use actual `txHash` from transaction receipt
- Handle transaction errors (user rejection, insufficient funds, etc.)

**Files to Modify:**
- `Frontend/app/tip/[username]/page.tsx`
- `Frontend/lib/ethers/contract.ts` - Ensure contract ABI and address are correct

**Note:** This requires contract address in env vars and proper network setup

---

## 🟡 HIGH - Get Tips by Stream Endpoint

### Backend Changes

#### 22. Create Get Tips by Stream Endpoint
**File:** `Backend/src/routes/tip.routes.ts`

**New Endpoint:** `GET /api/tips/stream/:streamId`

**What to Implement:**
- Return all tips for a stream
- Include viewer info (join with users table)
- Order by `created_at` descending
- Limit to recent N tips (e.g., 50)

**Files to Modify:**
- `Backend/src/controllers/tip.controller.ts` - Add `getTipsByStream` method
- `Backend/src/services/tip.service.ts` - Add `getTipsByStream` method
- `Backend/src/models/tip.model.ts` - `findByStreamId` already exists, but may need to join with users

---

### Frontend Changes

#### 23. Fix Tip History Loading
**File:** `Frontend/app/tip/[username]/page.tsx`

**Current Issue:**
- Line 69: Calls `tipService.getTipsByStream` but endpoint may not exist
- Falls back to empty array silently

**What to Change:**
- Ensure endpoint exists (see #22)
- Handle errors gracefully
- Show loading state
- Display tips in list

---

## 🟢 MEDIUM - Bio Field Support

### Backend Changes

#### 24. Add Bio to User Model
**File:** `Backend/src/models/user.model.ts`

**What to Verify:**
- `onboard` method accepts `bio` field
- `updateStreamerProfile` accepts `bio` field
- Database schema has `bio` column

---

### Frontend Changes

#### 25. Add Bio Field to Forms
**Files:**
- `Frontend/app/onboard/page.tsx` - Add bio textarea (optional)
- `Frontend/app/dashboard/settings/page.tsx` - Add bio textarea
- `Frontend/app/creator/[username]/page.tsx` - Display bio if exists

---

## 🟢 MEDIUM - Tip History for Creator

### Backend Changes

#### 26. Create Get Tips by Creator Endpoint
**File:** `Backend/src/routes/tip.routes.ts` or `creator.routes.ts`

**New Endpoint:** `GET /api/creators/:creatorId/tips`

**What to Implement:**
- Return all tips received by creator (all streams + offline)
- Include viewer info
- Order by `created_at` descending
- Support pagination (limit/offset)

---

### Frontend Changes

#### 27. Display Full Tip History on Dashboard
**File:** `Frontend/app/dashboard/page.tsx`

**What to Change:**
- Replace "Stream History" placeholder with actual tip history
- Load tips via `creatorService.getTips(user.id)`
- Show pagination if needed
- Display: viewer name, amount, timestamp, stream (if applicable)

---

## 🟢 MEDIUM - Better Error Handling

### Frontend Changes

#### 28. Add Error Boundaries
**Files:**
- Create `Frontend/components/error-boundary.tsx`
- Wrap main app sections in error boundaries
- Show user-friendly error messages

#### 29. Improve Loading States
**Files:**
- Add skeleton loaders to all data-fetching pages
- Show spinners during API calls
- Disable buttons during submission

#### 30. Better Empty States
**Files:**
- Add empty state components with helpful messages
- Show illustrations/icons
- Add call-to-action buttons

---

## ⚪ LOW - Future Enhancements

- Analytics dashboard
- Withdrawal functionality
- Tip notifications (email/push)
- Creator verification badges
- Multi-platform support enhancements
- Dark mode
- Internationalization

---

## 📋 Implementation Order (Recommended)

### Phase 1: Critical Offline Tipping (Must Do First)
1. ✅ #1 - Update Tip Service Backend
2. ✅ #2 - Update Tip Model
3. ✅ #3 - Update Tip Routes
4. ✅ #4 - Update Tip Page Frontend
5. ✅ #5 - Update Tip Service Frontend
6. ✅ #6 - Update Tip Page to Send Creator ID
7. ✅ #7 - Overlay Only Shows Alerts When Live

### Phase 2: Discovery & Profile (Core UX)
8. ✅ #8 - Search Creators Endpoint
9. ✅ #9 - Get Creator by Username
10. ✅ #10 - Featured Creators Endpoint
11. ✅ #11 - Build Discovery/Landing Page
12. ✅ #13 - Fix Creator Profile Page

### Phase 3: Profile Management
14. ✅ #14 - Update Profile Endpoint
15. ✅ #15 - Add Bio Field to Schema
16. ✅ #16 - Fix Settings Page

### Phase 4: Polish & Features
17. ✅ #18 - Make Overlay Settings Work
18. ✅ #19 - Total Tips Endpoint
19. ✅ #20 - Display Total Tips
20. ✅ #21 - Real Blockchain Transaction
21. ✅ #22 - Get Tips by Stream
22. ✅ #23 - Fix Tip History Loading

### Phase 5: Nice to Have
24. ✅ #24-27 - Bio, Tip History, Error Handling

---

## 🎯 Quick Win Checklist

**Can be done in 1-2 hours each:**
- [ ] #7 - Overlay only shows alerts when live (backend logic change)
- [ ] #13 - Fix creator profile page (frontend data loading)
- [ ] #16 - Fix settings page (frontend + backend endpoint)
- [ ] #18 - Make overlay settings work (frontend config loading)

**Medium effort (2-4 hours each):**
- [ ] #1-6 - Offline tipping support (backend + frontend changes)
- [ ] #8-11 - Discovery page (new endpoints + new page)
- [ ] #19-20 - Total tips display

**Larger effort (4+ hours):**
- [ ] #21 - Real blockchain transaction (contract integration)

---

## ✅ Testing Checklist

After each phase, test:
- [ ] Creator can receive tips when offline
- [ ] Creator can receive tips when live
- [ ] Overlay shows alerts ONLY when live
- [ ] Overlay stops showing alerts when stream ends
- [ ] Tipping still works after stream ends
- [ ] Discovery page search works
- [ ] Creator profile page loads correctly
- [ ] Settings page saves changes
- [ ] Overlay settings affect overlay appearance
- [ ] Total tips display correctly
- [ ] Real blockchain transactions work

---

**Total Estimated Time:** 
- Phase 1: 8-12 hours
- Phase 2: 6-8 hours  
- Phase 3: 4-6 hours
- Phase 4: 8-12 hours
- Phase 5: 4-6 hours

**Total: 30-44 hours of development work**
