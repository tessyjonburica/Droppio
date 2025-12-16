export function generateMessage(walletAddress: string, timestamp: number): string {
  return `Droppio wants you to sign in with your Ethereum account:\n${walletAddress}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nTimestamp: ${timestamp}`;
}

