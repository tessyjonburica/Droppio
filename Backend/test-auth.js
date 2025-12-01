/**
 * Test script for Droppio Auth Endpoints
 * This script helps you generate wallet signatures and test authentication
 * 
 * Usage: node test-auth.js
 */

const { ethers } = require('ethers');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const BASE_URL = 'http://localhost:5000';

// Helper function to ask questions
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function signMessage(wallet, message) {
  try {
    const signature = await wallet.signMessage(message);
    return signature;
  } catch (error) {
    console.error('Error signing message:', error.message);
    return null;
  }
}

async function testLogin(walletAddress, signature, message, role) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        signature,
        message,
        role: role || 'viewer',
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ Login successful!');
      console.log('Access Token:', data.accessToken.substring(0, 50) + '...');
      console.log('Refresh Token:', data.refreshToken.substring(0, 50) + '...');
      console.log('User:', JSON.stringify(data.user, null, 2));
      return data;
    } else {
      console.log('\n❌ Login failed!');
      console.log('Status:', response.status);
      console.log('Error:', data.error || data);
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

async function testRefresh(refreshToken) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ Token refresh successful!');
      console.log('New Access Token:', data.accessToken.substring(0, 50) + '...');
      console.log('New Refresh Token:', data.refreshToken.substring(0, 50) + '...');
      return data;
    } else {
      console.log('\n❌ Token refresh failed!');
      console.log('Status:', response.status);
      console.log('Error:', data.error || data);
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

async function testLogout(accessToken, refreshToken) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ Logout successful!');
      console.log('Message:', data.message);
      return true;
    } else {
      console.log('\n❌ Logout failed!');
      console.log('Status:', response.status);
      console.log('Error:', data.error || data);
      return false;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('Droppio Auth Endpoints Test Script');
  console.log('========================================\n');

  // Step 1: Get wallet private key or address
  console.log('Step 1: Wallet Setup');
  console.log('You can either:');
  console.log('  1. Enter a private key (for automatic signing)');
  console.log('  2. Enter a wallet address (for manual signing with MetaMask)\n');
  
  const option = await question('Choose option (1 or 2): ');
  
  let wallet;
  let walletAddress;
  
  if (option === '1') {
    const privateKey = await question('Enter private key (0x...): ');
    try {
      wallet = new ethers.Wallet(privateKey);
      walletAddress = wallet.address;
      console.log('✅ Wallet loaded:', walletAddress);
    } catch (error) {
      console.error('❌ Invalid private key:', error.message);
      rl.close();
      return;
    }
  } else {
    walletAddress = await question('Enter wallet address (0x...): ');
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      console.error('❌ Invalid wallet address format');
      rl.close();
      return;
    }
    console.log('✅ Wallet address:', walletAddress);
    console.log('⚠️  You will need to sign the message manually with MetaMask');
  }

  // Step 2: Choose message
  const message = await question('\nEnter message to sign (or press Enter for default): ') || 'Sign in to Droppio';
  console.log('Message:', message);

  // Step 3: Get signature
  let signature;
  
  if (wallet) {
    // Auto-sign with private key
    console.log('\nSigning message...');
    signature = await signMessage(wallet, message);
    if (!signature) {
      rl.close();
      return;
    }
    console.log('✅ Signature generated:', signature.substring(0, 50) + '...');
  } else {
    // Manual signing
    console.log('\n⚠️  Manual Signing Required');
    console.log('Please sign the following message with MetaMask:');
    console.log('Message:', message);
    signature = await question('Paste the signature here (0x...): ');
    if (!signature || !signature.startsWith('0x')) {
      console.error('❌ Invalid signature format');
      rl.close();
      return;
    }
  }

  // Step 4: Choose role
  const role = await question('\nEnter role (viewer/streamer) or press Enter for viewer: ') || 'viewer';
  if (!['viewer', 'streamer'].includes(role)) {
    console.error('❌ Invalid role. Must be "viewer" or "streamer"');
    rl.close();
    return;
  }

  // Step 5: Test login
  console.log('\n========================================');
  console.log('Testing Login Endpoint');
  console.log('========================================');
  const loginResult = await testLogin(walletAddress, signature, message, role);

  if (!loginResult) {
    console.log('\n❌ Login test failed. Cannot continue with other tests.');
    rl.close();
    return;
  }

  const { accessToken, refreshToken } = loginResult;

  // Step 6: Test refresh
  const testRefreshNow = await question('\nTest refresh token? (y/n): ');
  if (testRefreshNow.toLowerCase() === 'y') {
    console.log('\n========================================');
    console.log('Testing Refresh Token Endpoint');
    console.log('========================================');
    const refreshResult = await testRefresh(refreshToken);
    
    if (refreshResult) {
      // Ask if they want to test logout with new tokens
      const testLogoutWithNew = await question('\nTest logout with new tokens? (y/n): ');
      if (testLogoutWithNew.toLowerCase() === 'y') {
        console.log('\n========================================');
        console.log('Testing Logout Endpoint (with new tokens)');
        console.log('========================================');
        await testLogout(refreshResult.accessToken, refreshResult.refreshToken);
      }
    }
  }

  // Step 7: Test logout with original tokens
  const testLogoutNow = await question('\nTest logout with original tokens? (y/n): ');
  if (testLogoutNow.toLowerCase() === 'y') {
    console.log('\n========================================');
    console.log('Testing Logout Endpoint');
    console.log('========================================');
    await testLogout(accessToken, refreshToken);
  }

  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log('✅ Tests completed!');
  console.log('\nYour tokens for further testing:');
  console.log('Access Token:', accessToken);
  console.log('Refresh Token:', refreshToken);
  console.log('\nUse these tokens to test other endpoints that require authentication.');

  rl.close();
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ or install node-fetch');
  process.exit(1);
}

main().catch(console.error);

