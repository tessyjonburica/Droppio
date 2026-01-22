'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider, formatEther } from 'ethers';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getDroppioContractWithSigner, getDroppioContract } from '@/lib/ethers/contract';
import { Wallet, Loader2, ArrowRight, LayoutGrid } from 'lucide-react';

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
                if (!window.navigator.onLine) return;
                if (error.code === 'CALL_EXCEPTION' || error.message?.includes('missing revert data')) {
                    console.warn('Contract balance check failed');
                } else {
                    console.error('Failed to check balance:', error?.message || error);
                }
            } finally {
                setIsChecking(false);
            }
        };

        checkBalance();
        const interval = setInterval(checkBalance, 10000);
        return () => clearInterval(interval);
    }, [address, isConnected]);

    const handleWithdraw = async () => {
        if (!isConnected || !address || !walletClient) return;

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
            const tx = await contract.withdraw();
            toast({ title: 'Withdrawal initiated', description: 'Waiting for confirmation...' });
            await tx.wait(1);
            toast({ title: 'Withdrawal successful!', description: `${balance} ETH transferred to your wallet` });

            // Refresh balance
            const contractBalance = await (getDroppioContract(new BrowserProvider(window.ethereum!))).balances(address);
            setBalance(formatEther(contractBalance));
        } catch (error: any) {
            console.error('Withdrawal error:', error);
            const errorMessage = error.message?.includes('user rejected') ? 'Transaction rejected' : 'Withdrawal failed';
            toast({ title: 'Withdrawal failed', description: errorMessage, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isConnected) return null;

    const hasBalance = parseFloat(balance) > 0;

    return (
        <Button
            onClick={handleWithdraw}
            disabled={isLoading || !hasBalance || isChecking}
            className="h-14 sm:h-16 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] gap-3 flex items-center"
        >
            {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
                <LayoutGrid className="h-6 w-6" />
            )}
            Withdraw
        </Button>
    );
}
