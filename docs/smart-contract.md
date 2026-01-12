# Droppio Smart Contract Documentation

The Droppio smart contract (`Droppio.sol`) is a minimal, secure ETH tipping and withdrawal system. It is designed to be the on-chain "ledger" for the platform while off-chain services handle the UI and real-time alerts.

---

## 📄 Contract Overview

- **License:** MIT
- **Solidity Version:** ^0.8.20
- **Primary Function:** ETH Tipping & Balance Tracking.

---

## 🛠️ Core Functions

### `tip(address payable to)` (External, Payable)
Sends ETH to a creator.
- **Parameters:** `to` - The recipient creator's wallet address.
- **Logic:**
  1. Rejects zero-address recipients.
  2. Rejects zero-value tips.
  3. Increments the `balances[to]` mapping.
  4. Emits `TipSent` event with a generated `sessionId`.
- **Note:** The `sessionId` is used by the backend to index the tip but is not stored on-chain to save gas.

### `withdraw()` (External)
Allows a creator to withdraw their accumulated ETH.
- **Logic:**
  1. Checks if `balances[msg.sender]` > 0.
  2. **Security:** Resets balance to 0 *before* transferring (Prevents Reentrancy).
  3. Transfers ETH to the caller via `.call`.
  4. Emits `Withdraw` event.

---

## 📊 State Variables

### `mapping(address => uint256) public balances`
Stores the total withdrawable ETH for every creator address.

---

## 🔔 Events

### `TipSent(address indexed from, address indexed to, uint256 amount, bytes32 sessionId)`
Emitted when someone tips a creator. The backend listens for this event to trigger live overlays.

### `Withdraw(address indexed creator, uint256 amount)`
Emitted when a creator pulls their funds.

---

## 🛡️ Security Features

1.  **Checks-Effects-Interactions (CEI):** The withdrawal function follows this pattern strictly to be immune to reentrancy attacks.
2.  **Pull over Push:** Creators "pull" their earnings instead of receiving them automatically at the time of tip. This prevents "Gas Griefing" and makes the tipping transaction cheaper and safer for the viewer.
3.  **No Fallback Deposits:** The `receive()` and `fallback()` functions explicitly revert. This prevents users from accidentally losing ETH by sending it directly to the contract without calling the `tip()` function.
