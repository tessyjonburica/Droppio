// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Droppio
 * @notice Minimal ETH tipping contract for Droppio platform
 * @dev Accepts ETH tips and allows creators to withdraw their earnings
 * @dev Backend handles: creator onboarding, profiles, tipping history, stream sessions,
 *      analytics, authentication, overlay tokens, WebSocket real-time display
 * @dev Contract only handles: ETH balance tracking and withdrawals
 */
contract Droppio {
    // Mapping to store creator balances (only on-chain state)
    mapping(address => uint256) public balances;

    /**
     * @notice Emitted when a tip is sent to a creator
     * @param from Address sending the tip
     * @param to Address receiving the tip (creator)
     * @param amount Amount of ETH tipped
     * @param sessionId Session ID for backend reference (not stored on-chain)
     */
    event TipSent(
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes32 sessionId
    );

    /**
     * @notice Emitted when a creator withdraws their earnings
     * @param creator Address withdrawing funds
     * @param amount Amount of ETH withdrawn
     */
    event Withdraw(address indexed creator, uint256 amount);

    /**
     * @notice Send a tip to a creator
     * @param to Address of the creator receiving the tip
     * @dev Generates session ID for backend reference (not stored on-chain)
     * @dev Reverts if:
     *      - `to` is the zero address
     *      - `msg.value` is zero
     */
    function tip(address payable to) external payable {
        // Check: Reject zero address
        require(to != address(0), "Droppio: invalid recipient");

        // Check: Reject zero-value tips
        require(msg.value > 0, "Droppio: tip amount must be greater than zero");

        // Generate session ID for backend reference (not stored on-chain)
        bytes32 sessionId = keccak256(abi.encodePacked(msg.sender, block.timestamp));

        // Effect: Update balance before any interactions
        balances[to] += msg.value;

        // Event: Log the tip with session ID for backend sync
        emit TipSent(msg.sender, to, msg.value, sessionId);
    }

    /**
     * @notice Withdraw all accumulated earnings for the caller
     * @dev Reverts if:
     *      - Caller has zero balance
     *      - ETH transfer fails
     * @dev Uses Checks-Effects-Interactions pattern:
     *      1. Check balance > 0
     *      2. Effect: Reset balance to 0 (prevents reentrancy)
     *      3. Interaction: Transfer ETH
     */
    function withdraw() external {
        // Check: Reject zero balance
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Droppio: no balance to withdraw");

        // Effect: Clear balance before external call (prevents reentrancy)
        balances[msg.sender] = 0;

        // Interaction: Transfer ETH using .call (gas-efficient, safe)
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Droppio: transfer failed");

        // Event: Log the withdrawal for backend analytics
        emit Withdraw(msg.sender, amount);
    }

    /**
     * @notice Receive ETH directly (fallback for direct transfers)
     * @dev Reverts all direct ETH transfers to prevent accidental deposits
     */
    receive() external payable {
        revert("Droppio: use tip() function");
    }

    /**
     * @notice Fallback function
     * @dev Reverts all calls to undefined functions
     */
    fallback() external payable {
        revert("Droppio: function not found");
    }
}
