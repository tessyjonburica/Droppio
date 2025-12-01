import { ethers } from 'ethers';

export interface SignatureVerificationResult {
  isValid: boolean;
  address: string | null;
}

export const verifyWalletSignature = async (
  message: string,
  signature: string,
  expectedAddress: string
): Promise<SignatureVerificationResult> => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();

    return {
      isValid,
      address: isValid ? recoveredAddress : null,
    };
  } catch (error) {
    return {
      isValid: false,
      address: null,
    };
  }
};

