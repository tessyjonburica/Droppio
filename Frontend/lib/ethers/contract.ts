// Droppio Contract Factory
// Centralized contract instantiation using Ethers v6

import { Contract, BrowserProvider } from 'ethers';
import { DROPPIO_ABI } from './abi';
import { DROPPIO_CONTRACT_ADDRESS } from './config';

/**
 * Get Droppio contract instance from browser provider
 * Uses the connected wallet's provider (via window.ethereum)
 */
export function getDroppioContract(provider: BrowserProvider): Contract {
  return new Contract(DROPPIO_CONTRACT_ADDRESS, DROPPIO_ABI, provider);
}

/**
 * Get Droppio contract instance with signer
 * Allows sending transactions
 */
export async function getDroppioContractWithSigner(provider: BrowserProvider): Promise<Contract> {
  const signer = await provider.getSigner();
  return new Contract(DROPPIO_CONTRACT_ADDRESS, DROPPIO_ABI, signer);
}

