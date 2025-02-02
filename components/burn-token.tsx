"use client"

import { FC, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TokenService } from '../src/services/token-service';
import { PublicKey } from '@solana/web3.js';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useMembership } from '@/contexts/membership-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Link } from 'react-router-dom';

interface BurnTokenProps {
    onBurnComplete?: () => void;
}

export const BurnToken: FC<BurnTokenProps> = ({ onBurnComplete }) => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [tokenAddress, setTokenAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { isActive } = useMembership();
    const [usdValue, setUsdValue] = useState<number | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    useEffect(() => {
        const fetchUsdValue = async () => {
            try {
                const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
                const data = await response.json();
                const solToUsd = data.solana.usd;
                setUsdValue(0.05 * solToUsd);
            } catch (error) {
                console.error("Failed to fetch USD value:", error);
            }
        };

        fetchUsdValue();
    }, []);

    const handleBurn = async () => {
        if (!wallet.publicKey || !tokenAddress) return;
        
        setLoading(true);
        setError(null);
        try {
            const tokenService = new TokenService(connection, wallet);
            const result = await tokenService.burnTokens(new PublicKey(tokenAddress), Number(amount));
            
            if (result.success) {
                onBurnComplete?.();
                setShowConfirmDialog(false);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error burning tokens:', error);
            setError(error instanceof Error ? error.message : 'Failed to burn tokens');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                    <Input
                        placeholder="Enter token address"
                        value={tokenAddress}
                        onChange={(e) => setTokenAddress(e.target.value)}
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Amount to burn"
                        className="w-full"
                    />
                </div>

                {error && (
                    <div className="text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="font-semibold">Service Fee</h3>
                            <p className="text-sm text-muted-foreground">Required to burn tokens</p>
                        </div>
                        <div className="text-right">
                            {!isActive && (
                                <>
                                    <div className="text-2xl font-bold">
                                        0.05 SOL
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {usdValue ? `≈ $${usdValue.toFixed(2)} USD` : "Fetching USD value..."}
                                    </div>
                                </>
                            )}
                            {isActive && (
                                <div className="text-2xl font-bold text-green-600">
                                    Free
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <AlertDialogTrigger asChild>
                        <Button
                            className="w-full py-6 text-xl font-semibold bg-red-500 hover:bg-red-600 text-white"
                            variant="destructive"
                            disabled={loading || !amount || !tokenAddress || !wallet.publicKey}
                        >
                            {loading ? 'Burning...' : 'Burn Tokens'}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Token Burn</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to burn {amount} tokens? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleBurn}
                                className="bg-red-500 hover:bg-red-600 text-base font-semibold"
                            >
                                Yes, burn tokens
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
};

