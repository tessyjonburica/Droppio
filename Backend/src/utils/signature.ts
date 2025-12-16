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
    // ethers.verifyMessage automatically handles Ethereum message prefix
    const recoveredAddress = ethers.verifyMessage(message, signature);
    const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();

    if (!isValid) {
      console.error('Signature verification failed:', {
        recovered: recoveredAddress,
        expected: expectedAddress,
      });
    }

    return {
      isValid,
      address: isValid ? recoveredAddress : null,
    };
  } catch (error) {
    console.error('Signature verification error:', error);
    return {
      isValid: false,
      address: null,
    };
  }
};

