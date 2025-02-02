import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { 
    Metaplex, 
    walletAdapterIdentity,
} from "@metaplex-foundation/js";
import { createBurnCheckedInstruction, getAssociatedTokenAddress } from "@solana/spl-token";

interface TokenBurnParams {
    mintAddress: string;
    amount: number;
}

interface TokenBurnResult {
    success: boolean;
    error?: string;
    signature?: string;
    burnedAmount?: number;
    decimals?: number;
}

interface TokenInfo {
    decimals: number;
    symbol?: string;
    name?: string;
}

export class TokenBurnTestBench {
    private wallet: WalletContextState;
    private connection: Connection;
    private metaplex: Metaplex;

    constructor(connection: Connection, wallet: WalletContextState) {
        if (!wallet.publicKey) {
            throw new Error('Wallet not connected');
        }
        this.wallet = wallet;
        this.connection = connection;
        this.metaplex = Metaplex.make(connection)
            .use(walletAdapterIdentity(wallet));
    }

    private async getTokenInfo(mintAddress: string): Promise<TokenInfo> {
        try {
            // First try to get token info directly from the chain
            const mint = new PublicKey(mintAddress);
            const mintInfo = await this.connection.getParsedAccountInfo(mint);

            if (!mintInfo.value || !mintInfo.value.data || typeof mintInfo.value.data !== 'object') {
                throw new Error('Invalid token address');
            }

            const parsedData = mintInfo.value.data;
            if ('parsed' in parsedData && parsedData.parsed.type === 'mint') {
                return {
                    decimals: parsedData.parsed.info.decimals,
                    // Add other fields if available in parsed data
                };
            }

            throw new Error('Invalid token mint account');
        } catch (error) {
            console.error('Failed to fetch token info:', error);
            throw new Error('Failed to get token information');
        }
    }

    async getTokenBalance(mintAddress: string): Promise<{ amount: number, decimals: number }> {
        try {
            const mint = new PublicKey(mintAddress);
            const tokenInfo = await this.getTokenInfo(mintAddress);
            
            // Get token account
            const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
                this.wallet.publicKey!,
                { mint: mint }
            );

            if (tokenAccounts.value.length === 0) {
                throw new Error('No tokens found for this address in your wallet');
            }

            const balance = Number(tokenAccounts.value[0].account.data.parsed.info.tokenAmount.amount);
            const amount = balance / Math.pow(10, tokenInfo.decimals);

            return { 
                amount, 
                decimals: tokenInfo.decimals 
            };
        } catch (error) {
            console.error('Failed to get token balance:', error);
            throw error;
        }
    }

    async burnTokens(params: { mintAddress: string, amount: number }): Promise<TransactionInstruction> {
        if (!this.wallet.publicKey) {
            throw new Error("Wallet not connected");
        }

        const mintPubkey = new PublicKey(params.mintAddress);
        
        // Get token info for decimals
        const tokenInfo = await this.getTokenInfo(params.mintAddress);
        
        // Convert amount to raw amount with decimals
        const rawAmount = params.amount * Math.pow(10, tokenInfo.decimals);

        // Get the token account
        const associatedTokenAccount = await getAssociatedTokenAddress(
            mintPubkey,
            this.wallet.publicKey
        );

        // Verify balance
        const { amount: currentAmount } = await this.getTokenBalance(params.mintAddress);
        if (currentAmount < params.amount) {
            throw new Error(`Insufficient token balance. You have ${currentAmount} tokens`);
        }

        // Create burn instruction
        const burnInstruction = createBurnCheckedInstruction(
            associatedTokenAccount,    // Token account to burn from
            mintPubkey,               // Mint account
            this.wallet.publicKey,    // Owner of token account
            Math.round(rawAmount),    // Amount to burn (rounded to avoid floating point issues)
            tokenInfo.decimals        // Use actual token decimals
        );

        return burnInstruction;
    }
} 