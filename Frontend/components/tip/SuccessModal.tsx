'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: string;
    creatorName: string;
    txHash?: string;
}

export function SuccessModal({ isOpen, onClose, amount, creatorName, txHash }: SuccessModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <div className="flex flex-col items-center justify-center space-y-6 py-8">
                    {/* Success Icon with Animation */}
                    <div className="relative">
                        <div className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-75"></div>
                        <div className="relative rounded-full bg-green-100 p-4">
                            <CheckCircle2 className="h-16 w-16 text-green-600" />
                        </div>
                    </div>

                    {/* Success Message */}
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-green-600 flex items-center justify-center gap-2">
                            <Sparkles className="h-6 w-6" />
                            Tip Sent Successfully!
                            <Sparkles className="h-6 w-6" />
                        </h2>
                        <p className="text-muted-foreground">
                            You sent <span className="font-bold text-primary">{amount} ETH</span> to{' '}
                            <span className="font-bold">{creatorName}</span>
                        </p>
                    </div>

                    {/* Transaction Hash (if available) */}
                    {txHash && (
                        <div className="w-full bg-muted rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                            <p className="text-xs font-mono break-all">{txHash}</p>
                        </div>
                    )}

                    {/* Celebration Message */}
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                            🎉 Your support means the world to {creatorName}!
                        </p>
                        <p className="text-xs text-muted-foreground">
                            The transaction has been confirmed on the blockchain.
                        </p>
                    </div>

                    {/* Close Button */}
                    <Button onClick={onClose} className="w-full">
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
