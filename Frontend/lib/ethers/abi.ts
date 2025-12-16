// Droppio Contract ABI
// Type-safe ABI definition for Ethers v6

export const DROPPIO_ABI = [
  {
    inputs: [
      {
        internalType: 'address payable',
        name: 'to',
        type: 'address',
      },
    ],
    name: 'tip',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'sessionId',
        type: 'bytes32',
      },
    ],
    name: 'TipSent',
    type: 'event',
  },
] as const;

// Type exports for contract interaction
export type DroppioContract = {
  tip: (to: string, overrides?: { value: bigint }) => Promise<{ hash: string; wait: () => Promise<any> }>;
};

