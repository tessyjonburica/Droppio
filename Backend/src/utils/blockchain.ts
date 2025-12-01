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

// USDC contract ABI (minimal - only what we need)
const USDC_ABI = [
  'function decimals() view returns (uint8)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

// Verify transaction with USDC Base contract
export const verifyUSDCTransaction = async (
  txHash: string,
  expectedAmount: string,
  fromAddress: string
): Promise<boolean> => {
  try {
    const providerInstance = getProvider();
    const receipt = await providerInstance.getTransactionReceipt(txHash);

    if (!receipt) {
      return false;
    }

    if (receipt.status !== 1) {
      return false;
    }

    // Get transaction details
    const tx = await providerInstance.getTransaction(txHash);
    if (!tx) {
      return false;
    }

    // Verify transaction is from expected address
    if (tx.from?.toLowerCase() !== fromAddress.toLowerCase()) {
      return false;
    }

    // Parse logs to find USDC transfer
    const usdcContract = new ethers.Contract(USDC_BASE_ADDRESS, USDC_ABI, providerInstance);
    const decimals = await usdcContract.decimals();

    // Check if transaction was to USDC contract or involved USDC transfer
    let usdcTransferred = false;
    let actualAmount = BigInt(0);

    if (receipt.logs) {
      const transferInterface = new ethers.Interface([
        'event Transfer(address indexed from, address indexed to, uint256 value)',
      ]);

      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === USDC_BASE_ADDRESS) {
          try {
            const parsedLog = transferInterface.parseLog(log);
            if (parsedLog && parsedLog.name === 'Transfer') {
              usdcTransferred = true;
              actualAmount = parsedLog.args.value as bigint;

              // Verify from address matches
              if (parsedLog.args.from.toLowerCase() !== fromAddress.toLowerCase()) {
                return false;
              }

              break;
            }
          } catch {
            // Not a transfer event, continue
          }
        }
      }
    }

    if (!usdcTransferred) {
      return false;
    }

    // Convert expected amount to BigInt (6 decimals for USDC)
    const expectedAmountBigInt = ethers.parseUnits(expectedAmount, decimals);

    // Verify amount matches (allow small tolerance for gas fees if applicable)
    return actualAmount >= expectedAmountBigInt;
  } catch (error) {
    return false;
  }
};

// Parse USDC amount (handle 6 decimal places)
export const parseUSDCAmount = (amount: string): string => {
  try {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) {
      throw new Error('Invalid amount');
    }
    // USDC has 6 decimals
    return ethers.parseUnits(amount, 6).toString();
  } catch {
    throw new Error('Invalid USDC amount format');
  }
};

// Format USDC amount for display
export const formatUSDCAmount = (amount: bigint | string): string => {
  try {
    const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;
    // USDC has 6 decimals
    return ethers.formatUnits(amountBigInt, 6);
  } catch {
    return '0';
  }
};
