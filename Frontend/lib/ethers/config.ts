// Base Chain Configuration
// Contract address and chain settings

import { base } from 'wagmi/chains';

export const BASE_CHAIN = base;

export const BASE_CHAIN_ID = base.id; // 8453

// Contract address - set via environment variable
export const DROPPIO_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as `0x${string}`;

// Validate contract address format
if (!DROPPIO_CONTRACT_ADDRESS.startsWith('0x') || DROPPIO_CONTRACT_ADDRESS.length !== 42) {
  console.warn(
    `Invalid contract address format: ${DROPPIO_CONTRACT_ADDRESS}. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local`
  );
}

