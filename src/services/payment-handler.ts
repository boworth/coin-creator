import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";

// Default devnet treasury address - replace with your actual treasury address in .env.local
const DEFAULT_TREASURY = "11111111111111111111111111111111";

if (!process.env.NEXT_PUBLIC_TREASURY_WALLET) {
    console.warn("Treasury wallet address not found in environment variables, using default address");
}

export const TREASURY_WALLET = new PublicKey(
    process.env.NEXT_PUBLIC_TREASURY_WALLET || DEFAULT_TREASURY
);

// Fee structure
const FEES = {
    BASE_FEE: 0.05,      // SOL - for token creation features and burn
    METADATA_FEE: 0.1    // SOL - for metadata updates
} as const;

export class PaymentHandler {
    private connection: Connection;
    private wallet: WalletContextState;
    private static MINIMAL_FEE = 0.000001; // Minimal fee for members

    constructor(connection: Connection, wallet: WalletContextState) {
        this.connection = connection;
        this.wallet = wallet;
    }

    private async checkMembershipStatus(): Promise<boolean> {
        if (!this.wallet.publicKey) return false;

        try {
            const response = await fetch(
                `/api/membership/status?wallet=${this.wallet.publicKey.toString()}`
            );
            const data = await response.json();
            return data.active === true;
        } catch (error) {
            console.error("Error checking membership status:", error);
            return false;
        }
    }

    async createPaymentInstruction(amount: number): Promise<TransactionInstruction> {
        if (!this.wallet.publicKey) {
            throw new Error("Wallet not connected");
        }

        const hasMembership = await this.checkMembershipStatus();
        const finalAmount = hasMembership ? PaymentHandler.MINIMAL_FEE : amount;
        
        return SystemProgram.transfer({
            fromPubkey: this.wallet.publicKey,
            toPubkey: TREASURY_WALLET,
            lamports: Math.round(finalAmount * 1e9), // Convert SOL to lamports
        });
    }

    // For premium features (token creation)
    async createFeaturePaymentInstruction(features: number): Promise<TransactionInstruction> {
        const totalFee = features * FEES.BASE_FEE;
        return this.createPaymentInstruction(totalFee);
    }

    // For burn operations
    async createFixedFeeInstruction(): Promise<TransactionInstruction> {
        return this.createPaymentInstruction(FEES.BASE_FEE);
    }

    // For metadata updates
    async createMetadataFeeInstruction(): Promise<TransactionInstruction> {
        return this.createPaymentInstruction(FEES.METADATA_FEE);
    }
} 