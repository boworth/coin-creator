import { Connection, PublicKey } from "@solana/web3.js"
import { WalletContextState } from "@solana/wallet-adapter-react"
import { TokenTestBench } from "@/testbench/token-test-bench"
import { MetadataTestBench } from "@/testbench/metadata-test-bench"
import { Metaplex } from "@metaplex-foundation/js"
import { walletAdapterIdentity } from "@metaplex-foundation/js"
import { Keypair, Transaction, sendAndConfirmTransaction, TransactionMessage, VersionedTransaction, ComputeBudgetProgram } from "@solana/web3.js"
import { getAssociatedTokenAddress, createInitializeMintInstruction, createAssociatedTokenAccountInstruction } from "@solana/spl-token"
import { createCreateMetadataAccountV3Instruction } from "@metaplex-foundation/mpl-token-metadata"
import { TokenBurnTestBench } from "@/testbench/token-burn-test-bench"
import { PaymentHandler } from "./payment-handler"

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/**
 * TokenService Class
 * 
 * Provides high-level token management functionality for the Solana blockchain.
 * Handles token creation, metadata management, and authority controls.
 * 
 * @class TokenService
 */
export interface TokenCreationParams {
  /** Token name (max 30 characters) */
  tokenName: string
  /** Token symbol (max 10 characters, uppercase) */
  tokenSymbol: string
  /** Number of decimal places (0-9) */
  decimals: number
  /** Initial token supply */
  initialSupply: number
  /** Optional token description */
  description?: string
  /** Optional token logo file */
  logo?: File
  /** Optional banner image file */
  bannerImage?: File
  /** Whether to revoke mint authority */
  revokeMintAuthority?: boolean
  /** Whether to revoke freeze authority */
  revokeFreezeAuthority?: boolean
  /** Whether to lock metadata */
  lockMetadata?: boolean
  /** Optional logo URL */
  logoUrl?: string
}

export interface MetadataUpdateParams {
  mintAddress: string;
  name?: string;
  symbol?: string;
  description?: string;
  logo?: File;
  properties?: {
    links?: Record<string, string>;
  };
  makeImmutable?: boolean;
}

export interface BurnTokenParams {
  mintAddress: string
  amount: number
}

export interface TokenMetadata {
  name: string
  symbol: string
  uri: string
}

export interface TokenBurnResult {
    success: boolean;
    error?: string;
    signature?: string;
    burnedAmount?: number;
    decimals?: number;
}

export interface TokenCreationResult {
    success: boolean;
    mintAddress: string;
    signature: string;
    verifications: {
        mintAuthorityRevoked?: boolean;
        freezeAuthorityRevoked?: boolean;
    };
    error?: string;
}

export class TokenService {
  private tokenBench: TokenTestBench
  private metadataBench: MetadataTestBench
  private connection: Connection
  private wallet: WalletContextState
  private tokenBurnBench: TokenBurnTestBench
  private paymentHandler: PaymentHandler

  /**
   * Creates a new TokenService instance
   * 
   * @param connection - Solana connection instance
   * @param wallet - Connected wallet instance
   */
  constructor(connection: Connection, wallet: WalletContextState) {
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    this.connection = connection;
    this.wallet = wallet;
    this.tokenBench = new TokenTestBench(connection, wallet);
    this.metadataBench = new MetadataTestBench(connection, wallet);
    this.tokenBurnBench = new TokenBurnTestBench(connection, wallet);
    this.paymentHandler = new PaymentHandler(connection, wallet);
  }

  /**
   * Creates a new token with specified parameters
   * 
   * @param params - Token creation parameters including name, symbol, supply, etc.
   * @returns Promise resolving to token creation result
   * @throws Error if wallet is not connected or creation fails
   */
  async createToken(params: TokenCreationParams): Promise<TokenCreationResult> {
    try {
        if (!this.wallet.publicKey) {
            throw new Error("Wallet not connected");
        }

        // Upload logo to Cloudinary if provided
        let logoUrl = params.logoUrl;
        if (params.logo instanceof File) {
            try {
                logoUrl = await this.uploadToCloudinary(params.logo);
                console.log("Uploaded logo URL:", logoUrl);
            } catch (error) {
                console.error("Logo upload failed:", error);
                throw error;
            }
        }

        // Create and upload metadata JSON
        const metadata = {
            name: params.tokenName,
            symbol: params.tokenSymbol,
            description: params.description || '',
            image: logoUrl || '',
            properties: {
                files: [{
                    uri: logoUrl || '',
                    type: "image/png"
                }]
            }
        };

        // Upload metadata to Cloudinary
        const metadataJson = JSON.stringify(metadata);
        const metadataBlob = new Blob([metadataJson], { type: 'application/json' });
        const metadataFile = new File([metadataBlob], 'metadata.json');
        
        const metadataUrl = await this.uploadToCloudinary(metadataFile);
        console.log("Metadata URL:", metadataUrl);

        // Get token creation instructions with the metadata URL
        const { instructions, mintAddress, mintKeypair } = await this.tokenBench.createTokenInstructions({
            ...params,
            logoUrl: metadataUrl // Use metadata URL instead of logo URL
        });

        // Get latest blockhash
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('finalized');

        // Create transaction
        const transaction = new Transaction();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = this.wallet.publicKey;

        // Add token instructions first
        if (Array.isArray(instructions)) {
            transaction.add(...instructions);
        } else {
            transaction.add(instructions);
        }

        // Count premium features
        const premiumFeatureCount = [
            params.revokeMintAuthority,
            params.revokeFreezeAuthority
        ].filter(Boolean).length;

        // Add payment instruction at the end if needed
        if (premiumFeatureCount > 0) {
            const paymentInstruction = await this.paymentHandler.createFeaturePaymentInstruction(premiumFeatureCount);
            transaction.add(paymentInstruction);
        }

        // Sign with mint keypair
        const properMintKeypair = Keypair.fromSecretKey(mintKeypair.secretKey);
        transaction.sign(properMintKeypair);

        // Send transaction
        const signature = await this.wallet.sendTransaction(transaction, this.connection, {
            skipPreflight: true
        });

        // Wait for confirmation
        await this.connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        });

        return {
            success: true,
            mintAddress,
            signature: signature.toString(),
            verifications: {
                mintAuthorityRevoked: params.revokeMintAuthority,
                freezeAuthorityRevoked: params.revokeFreezeAuthority
            }
        };
    } catch (error) {
        console.error('Error in createToken:', error);
        return {
            success: false,
            mintAddress: "",
            signature: "",
            verifications: {},
            error: error instanceof Error ? error.message : "Token creation failed"
        };
    }
  }

  async burnTokens(mintAddress: PublicKey, amount: number): Promise<TokenBurnResult> {
    try {
        if (!this.wallet.publicKey) {
            throw new Error("Wallet not connected");
        }

        // Get latest blockhash
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('finalized');

        // Create transaction
        const transaction = new Transaction();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = this.wallet.publicKey;

        // Add payment instruction
        const paymentInstruction = await this.paymentHandler.createFixedFeeInstruction();
        transaction.add(paymentInstruction);

        // Get and add burn instruction
        const burnInstruction = await this.tokenBurnBench.burnTokens({
            mintAddress: mintAddress.toString(),
            amount
        });
        transaction.add(burnInstruction);

        // Send transaction with skipPreflight like other operations
        const signature = await this.wallet.sendTransaction(transaction, this.connection, {
            skipPreflight: true,
            preflightCommitment: 'confirmed'
        });

        // Wait for confirmation
        await this.connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        }, 'confirmed');

        return {
            success: true,
            signature: signature.toString(),
            burnedAmount: amount
        };
    } catch (error) {
        console.error("Error in burnTokens:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to burn tokens"
        };
    }
  }

  async updateMetadata(params: MetadataUpdateParams) {
    try {
        if (!this.wallet.publicKey) {
            throw new Error("Wallet not connected");
        }

        // Validate mint address first
        try {
            const mintInfo = await this.connection.getAccountInfo(new PublicKey(params.mintAddress));
            if (!mintInfo) {
                throw new Error("Token mint not found");
            }
            
            // Verify metadata authority
            const metaplex = new Metaplex(this.connection).use(walletAdapterIdentity(this.wallet));
            const nft = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(params.mintAddress) });
            
            if (!nft.updateAuthorityAddress.equals(this.wallet.publicKey)) {
                throw new Error("You don't have authority to update this token's metadata");
            }

            if (mintInfo.data.length !== 82) {
                throw new Error("Invalid mint address - not a token mint");
            }
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Invalid mint address or mint not found");
        }

        // Get latest blockhash
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');

        // Create transaction
        const transaction = new Transaction();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = this.wallet.publicKey;

        // Add compute budget instructions
        const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
            units: 1000000
        });
        transaction.add(computeBudgetIx);

        // Add payment instruction first
        const paymentInstruction = await this.paymentHandler.createMetadataFeeInstruction();
        transaction.add(paymentInstruction);

        // Get and add metadata update instruction
        const updateInstruction = await this.metadataBench.updateMetadata(params);
        transaction.add(updateInstruction);

        try {
            // Send transaction
            const signature = await this.wallet.sendTransaction(transaction, this.connection, {
                skipPreflight: true,
                maxRetries: 5,
                preflightCommitment: 'confirmed'
            });

            // Wait for confirmation
            const confirmation = await this.connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            }, 'confirmed');

            if (confirmation.value.err) {
                const errorStr = JSON.stringify(confirmation.value.err);
                console.error("Transaction error:", errorStr);
                throw new Error(`Transaction failed: ${errorStr}`);
            }

            return {
                success: true,
                signature: signature.toString()
            };
        } catch (txError) {
            console.error("Transaction error details:", txError);
            throw new Error(txError instanceof Error ? txError.message : "Transaction failed");
        }
    } catch (error) {
        console.error('Metadata update failed:', error);
        throw error;
    }
  }

  async makeImmutable(mintAddress: string) {
    return this.metadataBench.makeImmutable(new PublicKey(mintAddress))
  }

  async getTokenMetadata(mintAddress: PublicKey): Promise<any> {
    try {
        const metaplex = Metaplex.make(this.connection).use(walletAdapterIdentity(this.wallet));
        const nft = await metaplex.nfts().findByMint({ mintAddress });
        
        // Get the off-chain metadata
        let offChainMetadata: any = {};
        if (nft.uri) {
            try {
                const response = await fetch(nft.uri);
                if (response.ok) {
                    offChainMetadata = await response.json() as any;
                }
            } catch (error) {
                console.error('Failed to fetch off-chain metadata:', error);
            }
        }

        console.log('Fetched metadata:', {
            onChain: {
                name: nft.name,
                symbol: nft.symbol,
                uri: nft.uri
            },
            offChain: offChainMetadata
        });
        
        return {
            name: nft.name,
            symbol: nft.symbol,
            description: offChainMetadata.description || '',
            image: offChainMetadata.image,
            properties: offChainMetadata.properties || {},
            isMutable: nft.isMutable,
            // Include raw data for debugging
            raw: {
                onChain: nft,
                offChain: offChainMetadata
            }
        };
    } catch (error) {
        console.error('Failed to fetch token metadata:', error);
        throw new Error('Failed to fetch token metadata');
    }
  }

  private async uploadToCloudinary(file: File): Promise<string> {
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
        throw new Error('Cloudinary configuration is missing');
    }

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

        let uploadUrl;
        let resourceType;

        // Determine the correct endpoint and resource type based on file type
        if (file.type.startsWith('image/')) {
            uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
            formData.append('folder', 'token-logos');
            resourceType = 'image';
        } else {
            uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload`;
            formData.append('folder', 'token-metadata');
            resourceType = 'raw';
        }

        // Add resource type to form data
        formData.append('resource_type', resourceType);

        console.log('Uploading file:', {
            type: file.type,
            name: file.name,
            size: file.size,
            resourceType,
            uploadUrl
        });

        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Cloudinary error details:', {
                status: response.status,
                statusText: response.statusText,
                errorData
            });
            throw new Error(errorData.error?.message || 'Failed to upload to Cloudinary');
        }

        const data = await response.json();
        console.log('Cloudinary upload success:', data);
        return data.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload to Cloudinary');
    }
  }
}

/**
 * Token Service
 * 
 * This is a stub implementation.
 * Replace or expand these functions as needed.
 */

/**
 * Creates a token with the provided data.
 * @param data - token data
 * @returns a dummy token
 */
export const createToken = (data: any) => {
  // Implement your token creation logic here
  return { token: "dummy-token", ...data };
};

/**
 * Updates metadata for an existing token.
 * @param tokenId - the ID of the token to update
 * @param metadata - metadata to merge/update
 * @returns success flag
 */
export const updateTokenMetadata = (tokenId: string, metadata: any) => {
  // Implement your token metadata update logic here
  return { success: true, tokenId, metadata };
}; 