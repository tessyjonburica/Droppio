import { ethers } from 'ethers';
import { env } from '../config/env';

// USDC Base contract address
export const USDC_BASE_ADDRESS = env.USDC_BASE_CONTRACT_ADDRESS.toLowerCase();

let provider: ethers.JsonRpcProvider | null = null;

// Ethers provider for Base network
export const getProvider = (): ethers.JsonRpcProvider => {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(env.BASE_RPC_URL, parseInt(env.CHAIN_ID, 10));
  }
  return provider;
};

// Verify Native ETH transaction on Base
export const verifyETHTransaction = async (
  txHash: string,
  expectedAmount: string,
  fromAddress: string,
  expectedToAddress: string
): Promise<boolean> => {
  try {
    const providerInstance = getProvider();

    // Retry mechanism for receipt (RPC nodes/indexers might be slightly behind)
    let receipt = null;
    let tx = null;
    let retries = 3;

    while (retries > 0 && (!receipt || !tx)) {
      [receipt, tx] = await Promise.all([
        providerInstance.getTransactionReceipt(txHash),
        providerInstance.getTransaction(txHash),
      ]);

      if (!receipt || !tx) {
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        }
      }
    }

    if (!receipt || !tx) {
      return false;
    }

    // Check if transaction was successful
    if (receipt.status !== 1) {
      return false;
    }

    // Verify transaction is from expected address
    if (tx.from.toLowerCase() !== fromAddress.toLowerCase()) {
      return false;
    }

    // Verify transaction is to expected address (Creator's wallet)
    if (!tx.to || tx.to.toLowerCase() !== expectedToAddress.toLowerCase()) {
      return false;
    }

    // Convert expected amount (ETH) to Wei
    const expectedAmountWei = ethers.parseEther(expectedAmount);

    // Verify value sent (Native ETH)
    // We check if tx.value is exactly what was expected
    // Note: tx.value is a bigint
    if (tx.value < expectedAmountWei) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('ETH Verification error:', error);
    return false;
  }
};

// Parse ETH amount (Native currency)
export const parseETHAmount = (amount: string): string => {
  try {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) {
      throw new Error('Invalid amount');
    }
    return ethers.parseEther(amount).toString();
  } catch {
    throw new Error('Invalid ETH amount format');
  }
};

// Format ETH amount for display
export const formatETHAmount = (amount: bigint | string): string => {
  try {
    const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;
    return ethers.formatEther(amountBigInt);
  } catch {
    return '0';
  }
};

