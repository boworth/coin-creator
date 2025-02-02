import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { TREASURY_WALLET } from "./payment-handler";
import stripe from '@/lib/stripe'

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

/**
 * MembershipService provides helper methods to work with membership functionality.
 */
export class MembershipService {
    connection: Connection;
    wallet: WalletContextState;

    constructor(connection: Connection, wallet: WalletContextState) {
        this.connection = connection;
        this.wallet = wallet;
    }

    async purchaseWithSol(planId: string): Promise<{ success: boolean; signature?: string; error?: string }> {
        try {
            if (!this.wallet.publicKey) {
                throw new Error("Wallet not connected");
            }

            // Find the plan
            const plan = MEMBERSHIP_PLANS.find(p => p.id === planId);
            if (!plan) {
                throw new Error("Invalid plan selected");
            }

            // Get latest blockhash
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('finalized');

            // Create transaction
            const transaction = new Transaction();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = this.wallet.publicKey;

            // Create payment instruction
            const paymentInstruction = SystemProgram.transfer({
                fromPubkey: this.wallet.publicKey,
                toPubkey: TREASURY_WALLET,
                lamports: Math.round(plan.solPrice * 1e9), // Ensure proper rounding
            });

            transaction.add(paymentInstruction);

            // Send transaction
            const signature = await this.wallet.sendTransaction(transaction, this.connection, {
                skipPreflight: true
            });

            // Wait for confirmation with a longer timeout
            const confirmation = await this.connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            }, 'confirmed');

            if (confirmation.value.err) {
                throw new Error(`Transaction failed: ${confirmation.value.err}`);
            }

            // Update membership status
            await this.updateMembershipStatus(planId, this.wallet.publicKey.toString());

            return {
                success: true,
                signature: signature.toString()
            };

        } catch (error) {
            console.error("Error purchasing membership with SOL:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to purchase membership"
            };
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

    static async checkStripeSession(sessionId: string): Promise<{ payment_status: string }> {
        const response = await fetch(`/api/check-session?session_id=${sessionId}`)
        if (!response.ok) {
            throw new Error('Failed to verify payment session')
        }
        return response.json()
    }

    // Example method: Get membership status (dummy implementation)
    async getStatus() {
        // Replace this with your actual logic.
        return {
            isActive: true,
            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,  // expires in 30 days
        };
    }
}

export async function checkStripeSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session;
}

export default {
  checkStripeSession,
  // Add other methods here if needed.
}; 