import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { TREASURY_WALLET } from "./payment-handler";
import { stripe } from '@/lib/stripe'

export interface MembershipPlan {
    id: string;
    name: string;
    solPrice: number;
    usdPrice: number;
    duration: number; // in days
}

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
    {
        id: 'weekly',
        name: 'Weekly',
        solPrice: 1,
        usdPrice: 49,
        duration: 7
    },
    {
        id: 'monthly',
        name: 'Monthly',
        solPrice: 3,
        usdPrice: 849,
        duration: 30
    }
];

// Default to a known address or throw an error if env var is missing
export const RECEIVER_ADDRESS = new PublicKey(
    TREASURY_WALLET || 
    // You should replace this with your actual fallback address
    "11111111111111111111111111111111"
);

export class MembershipService {
    constructor(
        private connection: Connection,
        private wallet: WalletContextState
    ) {}

    async purchaseWithSol(plan: "weekly" | "monthly") {
        try {
            if (!this.wallet.publicKey || !this.wallet.signTransaction) {
                throw new Error("Wallet not connected");
            }

            // Verify receiver address is set
            if (!TREASURY_WALLET || RECEIVER_ADDRESS.equals(new PublicKey("11111111111111111111111111111111"))) {
                throw new Error("Treasury wallet not configured. Please contact support.");
            }

            const amount = plan === "weekly" ? 1 : 3 // SOL amount

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: this.wallet.publicKey,
                    toPubkey: RECEIVER_ADDRESS,
                    lamports: amount * 1_000_000_000, // Convert SOL to lamports
                })
            );

            const { blockhash } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = this.wallet.publicKey;

            const signedTx = await this.wallet.signTransaction(transaction);
            const txId = await this.connection.sendRawTransaction(signedTx.serialize());
            await this.connection.confirmTransaction(txId);

            return { success: true, signature: txId };
        } catch (error) {
            console.error("Error in purchaseWithSol:", error);
            return { success: false, error: error instanceof Error ? error.message : "Transaction failed" };
        }
    }

    private async updateMembershipStatus(planId: string, walletAddress: string) {
        console.log("Updating membership status:", { planId, walletAddress });
        try {
            const response = await fetch('/api/membership/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planId,
                    walletAddress,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `Failed to update membership status: ${
                        errorData.error || response.statusText
                    }`
                );
            }

            const data = await response.json();
            console.log("Membership updated successfully:", data);
            return data;
        } catch (error) {
            console.error("Error in updateMembershipStatus:", error);
            throw error;
        }
    }

    // Update the static method to use the API endpoint
    static async activateMembershipForWallet(
        walletAddress: PublicKey,
        duration: number
    ): Promise<void> {
        try {
            // Convert duration from milliseconds to days
            const durationInDays = Math.floor(duration / (24 * 60 * 60 * 1000))
            
            // Determine plan ID based on duration
            const planId = durationInDays === 7 ? 'weekly' : 'monthly'
            
            console.log(`Activating membership via API for ${walletAddress.toString()} with plan ${planId}`)
            
            const response = await fetch('/api/membership/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planId,
                    walletAddress: walletAddress.toString(),
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(
                    `Failed to update membership status: ${
                        errorData.error || response.statusText
                    }`
                )
            }

            const data = await response.json()
            console.log("Membership updated successfully:", data)
            return data
        } catch (error) {
            console.error('Error activating membership:', error)
            throw error
        }
    }

    // DELETE THIS ENTIRE METHOD
    // async checkStripeSession(sessionId: string) {
    //     // Method implementation removed
    // }
}

export async function checkStripeSession(sessionId: string) {
    try {
        const response = await fetch(`/api/check-session?sessionId=${sessionId}`)
        if (!response.ok) {
            throw new Error('Failed to check session status')
        }
        return await response.json()
    } catch (error) {
        console.error('Error checking session:', error)
        throw error
    }
} 