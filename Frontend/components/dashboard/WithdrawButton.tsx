'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider, formatEther } from 'ethers';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getDroppioContractWithSigner, getDroppioContract } from '@/lib/ethers/contract';
import { Wallet, Loader2 } from 'lucide-react';

export function WithdrawButton() {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();
    const { toast } = useToast();
    const [balance, setBalance] = useState<string>('0');
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    // Check contract balance on mount and periodically
    useEffect(() => {
        const checkBalance = async () => {
            if (!address || !isConnected) {
                setIsChecking(false);
                return;
            }

            try {
                if (!window.ethereum) return;
                const provider = new BrowserProvider(window.ethereum);
                const contract = getDroppioContract(provider);

                const contractBalance = await contract.balances(address);
                setBalance(formatEther(contractBalance));
            } catch (error: any) {
                // If the error is due to No internet or RPC error, log silently
                if (!window.navigator.onLine) return;

                // Specific check for CALL_EXCEPTION or revert which might happen if contract is not on this network
                if (error.code === 'CALL_EXCEPTION' || error.message?.includes('missing revert data')) {
                    console.warn('Contract balance check failed: Contract may not be deployed on this network or address is invalid.');
                } else {
                    console.error('Failed to check balance:', error?.message || error);
                }
            } finally {
                setIsChecking(false);
            }
        };

        checkBalance();
        const interval = setInterval(checkBalance, 10000); // Check every 10 seconds

        return () => clearInterval(interval);
    }, [address, isConnected]);

    const handleWithdraw = async () => {
        if (!isConnected || !address || !walletClient) {
            toast({
                title: 'Wallet not connected',
                description: 'Please connect your wallet to withdraw',
                variant: 'destructive',
            });
            return;
        }

        if (parseFloat(balance) <= 0) {
            toast({
                title: 'No balance',
                description: 'You have no ETH to withdraw from the contract',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            const provider = new BrowserProvider(walletClient.transport);
            const contract = await getDroppioContractWithSigner(provider);

            // Call withdraw function
            const tx = await contract.withdraw();

            toast({
                title: 'Withdrawal initiated',
                description: 'Waiting for confirmation...',
            });

            // Wait for confirmation
            await tx.wait(1);

            toast({
                title: 'Withdrawal successful!',
                description: `${balance} ETH has been transferred to your wallet`,
            });

            // Immediately check balance again to update UI
            try {
                const provider = new BrowserProvider(window.ethereum!);
                const contract = getDroppioContract(provider);
                const contractBalance = await contract.balances(address);
                setBalance(formatEther(contractBalance));
            } catch (error) {
                console.error('Failed to refresh balance:', error);
                setBalance('0');
            }
        } catch (error: any) {
            console.error('Withdrawal error:', error);

            let errorMessage = 'Failed to withdraw. Please try again.';
            if (error.message?.includes('user rejected')) {
                errorMessage = 'Transaction rejected by user';
            } else if (error.message?.includes('no balance')) {
                errorMessage = 'No balance to withdraw';
            }

            toast({
                title: 'Withdrawal failed',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isConnected) {
        return null;
    }

    const hasBalance = parseFloat(balance) > 0;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">Contract Balance</p>
                    <p className="text-xs text-muted-foreground">
                        {isChecking ? 'Checking...' : `${balance} ETH available`}
                    </p>
                </div>
                <Button
                    onClick={handleWithdraw}
                    disabled={isLoading || !hasBalance || isChecking}
                    variant={hasBalance ? 'default' : 'secondary'}
                    className="gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Withdrawing...
                        </>
                    ) : (
                        <>
                            <Wallet className="h-4 w-4" />
                            Withdraw
                        </>
                    )}
                </Button>
            </div>
            {hasBalance && (
                <p className="text-xs text-muted-foreground">
                    Click withdraw to transfer your accumulated tips to your wallet
                </p>
            )}
        </div>
    );
}
