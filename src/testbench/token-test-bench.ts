import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { 
    MINT_SIZE, 
    TOKEN_PROGRAM_ID, 
    createInitializeMintInstruction, 
    getMinimumBalanceForRentExemptMint, 
    getAssociatedTokenAddress, 
    createAssociatedTokenAccountInstruction, 
    createMintToInstruction,
    createInitializeMint2Instruction,
    createSetAuthorityInstruction,
    AuthorityType,
    createMintToDisabledInstruction
} from "@solana/spl-token";
import { Keypair } from "@solana/web3.js";
import { 
    createCreateMetadataAccountV3Instruction,
    PROGRAM_ID as METADATA_PROGRAM_ID,
    DataV2,
    TokenStandard,
    createUpdateMetadataAccountV2Instruction
} from "@metaplex-foundation/mpl-token-metadata";

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

console.log('Cloudinary Config:', {
    cloudName: CLOUDINARY_CLOUD_NAME,
    uploadPreset: CLOUDINARY_UPLOAD_PRESET
});

// Move interfaces to the top level
interface TokenCreationParams {
    decimals: number;
    initialSupply: number;
    tokenName: string;
    tokenSymbol: string;
    description?: string;
    revokeMintAuthority?: boolean;
    revokeFreezeAuthority?: boolean;
    lockMetadata?: boolean;
    logo?: File;
    logoUrl?: string;
}

interface TokenCreationResult {
    success: boolean;
    mintAddress?: string;
    testResults?: {
        tokenCreated: boolean;
        metadataCreated: boolean;
        mintAuthorityRevoked: boolean;
        freezeAuthorityRevoked: boolean;
        metadataLocked: boolean;
    };
    error?: string;
}

interface CloudinaryUploadOptions {
    folder?: string;
    transformation?: string;
    resourceType?: string;
}

/**
 * TokenTestBench Class
 * 
 * Handles low-level token operations on Solana blockchain.
 * Manages token creation, authority management, and transaction building.
 * 
 * @class TokenTestBench
 */
export class TokenTestBench {
    private wallet: WalletContextState;
    private connection: Connection;

    // Add input validation constants
    private static readonly MAX_NAME_LENGTH = 32;
    private static readonly MAX_SYMBOL_LENGTH = 10;
    private static readonly MAX_DESCRIPTION_LENGTH = 1000;
    private static readonly MIN_DECIMALS = 0;
    private static readonly MAX_DECIMALS = 9;
    private static readonly MAX_SUPPLY = Number.MAX_SAFE_INTEGER;

    constructor(connection: Connection, wallet: WalletContextState) {
        if (!wallet.publicKey) {
            throw new Error('Wallet not connected');
        }
        this.wallet = wallet;
        this.connection = connection;
    }

    private createFormData(file: File, options: CloudinaryUploadOptions): FormData {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET!);
        
        if (options.folder) {
            formData.append('folder', options.folder);
        }
        
        if (options.transformation) {
            formData.append('transformation', options.transformation);
        }

        return formData;
    }

    private async createCloudinaryError(response: Response): Promise<Error> {
        try {
            const errorData = await response.json();
            return new Error(`Cloudinary upload failed: ${errorData.error?.message || 'Unknown error'}`);
        } catch {
            return new Error(`Cloudinary upload failed with status: ${response.status}`);
        }
    }

    private async processCloudinaryResponse(response: Response): Promise<string> {
        const data = await response.json();
        return data.secure_url;
    }

    private handleCloudinaryError(error: unknown): void {
        console.error('Cloudinary upload error:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to upload to Cloudinary');
    }

    private async uploadToCloudinary(file: File): Promise<string> {
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
            throw new Error('Cloudinary configuration is missing');
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            formData.append('folder', 'token-logos');

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error('Failed to upload image:', error);
            throw new Error('Failed to upload image to CDN');
        }
    }

    private async uploadMetadataToCloudinary(metadata: any): Promise<string> {
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
            throw new Error('Cloudinary configuration is missing');
        }

        try {
            // Create a Blob from the metadata
            const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
            const file = new File([metadataBlob], 'metadata.json', { type: 'application/json' });

            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            formData.append('folder', 'token-metadata');

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error('Failed to upload metadata');
            }

            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error('Failed to upload metadata:', error);
            throw error;
        }
    }

    // Add input validation method
    private validateInputs(params: TokenCreationParams): void {
        if (params.decimals < TokenTestBench.MIN_DECIMALS || params.decimals > TokenTestBench.MAX_DECIMALS) {
            throw new Error(`Decimals must be between ${TokenTestBench.MIN_DECIMALS} and ${TokenTestBench.MAX_DECIMALS}`);
        }
        if (params.initialSupply <= 0 || params.initialSupply > TokenTestBench.MAX_SUPPLY) {
            throw new Error('Invalid initial supply');
        }
        if (params.tokenName.length > TokenTestBench.MAX_NAME_LENGTH) {
            throw new Error(`Token name must not exceed ${TokenTestBench.MAX_NAME_LENGTH} characters`);
        }
        if (params.tokenSymbol.length > TokenTestBench.MAX_SYMBOL_LENGTH) {
            throw new Error(`Token symbol must not exceed ${TokenTestBench.MAX_SYMBOL_LENGTH} characters`);
        }
    }

    /**
     * Creates a new token with test parameters
     * 
     * @param params - Token creation parameters
     * @returns Promise resolving to creation result with test data
     */
    async createTestToken(params: TokenCreationParams): Promise<TokenCreationResult> {
        try {
            if (!this.wallet.publicKey || !this.wallet.signTransaction) {
                throw new Error('Wallet not connected');
            }

            // Handle image upload first if provided
            let imageUrl = '';
            if (params.logo) {
                try {
                    imageUrl = await this.uploadToCloudinary(params.logo);
                } catch (error) {
                    console.warn('Image upload failed:', error);
                }
            }

            // Create metadata JSON
            const tokenMetadata = {
                name: params.tokenName,
                symbol: params.tokenSymbol,
                description: params.description || '',
                image: imageUrl || undefined
            };

            // Upload metadata to Cloudinary and get URL
            const metadataUrl = await this.uploadMetadataToCloudinary(tokenMetadata);

            // Generate mint keypair
            const mintKeypair = Keypair.generate();
            const mintAddress = mintKeypair.publicKey;

            // Derive metadata address
            const [metadataAddress] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("metadata"),
                    METADATA_PROGRAM_ID.toBuffer(),
                    mintAddress.toBuffer(),
                ],
                METADATA_PROGRAM_ID
            );

            // Calculate rent
            const lamports = await getMinimumBalanceForRentExemptMint(this.connection);

            // Get ATA
            const associatedTokenAccount = await getAssociatedTokenAddress(
                mintAddress,
                this.wallet.publicKey
            );

            // Combine all instructions into a single transaction
            const transaction = new Transaction();

            // Add all instructions in sequence
            transaction.add(
                // 1. Create mint account
                SystemProgram.createAccount({
                    fromPubkey: this.wallet.publicKey,
                    newAccountPubkey: mintAddress,
                    space: MINT_SIZE,
                    lamports,
                    programId: TOKEN_PROGRAM_ID,
                }),

                // 2. Initialize mint
                createInitializeMint2Instruction(
                    mintAddress,
                    params.decimals,
                    this.wallet.publicKey,
                    this.wallet.publicKey,
                ),

                // 3. Create ATA
                createAssociatedTokenAccountInstruction(
                    this.wallet.publicKey,
                    associatedTokenAccount,
                    this.wallet.publicKey,
                    mintAddress,
                ),

                // 4. Mint tokens
                createMintToInstruction(
                    mintAddress,
                    associatedTokenAccount,
                    this.wallet.publicKey,
                    params.initialSupply * Math.pow(10, params.decimals),
                    [],
                ),

                // 5. Create metadata
                createCreateMetadataAccountV3Instruction(
                    {
                        metadata: metadataAddress,
                        mint: mintAddress,
                        mintAuthority: this.wallet.publicKey,
                        payer: this.wallet.publicKey,
                        updateAuthority: this.wallet.publicKey,
                    },
                    {
                        createMetadataAccountArgsV3: {
                            data: {
                                name: params.tokenName.slice(0, 32),
                                symbol: params.tokenSymbol.slice(0, 10),
                                uri: metadataUrl,
                                sellerFeeBasisPoints: 0,
                                creators: null,
                                collection: null,
                                uses: null,
                            },
                            isMutable: !params.lockMetadata,
                            collectionDetails: null,
                            tokenStandard: TokenStandard.Fungible,
                        },
                    }
                )
            );

            // If requested, revoke mint authority by setting it to null
            if (params.revokeMintAuthority) {
                const setAuthorityInstruction = createSetAuthorityInstruction(
                    mintAddress,
                    this.wallet.publicKey,
                    AuthorityType.MintTokens,
                    null
                )
                transaction.add(setAuthorityInstruction)
            }

            // If requested, revoke freeze authority by setting it to null
            if (params.revokeFreezeAuthority) {
                const setFreezeAuthorityInstruction = createSetAuthorityInstruction(
                    mintAddress,
                    this.wallet.publicKey,
                    AuthorityType.FreezeAccount,
                    null
                )
                transaction.add(setFreezeAuthorityInstruction)
            }

            // If requested, make metadata immutable
            if (params.lockMetadata) {
                console.log("Setting metadata to immutable");
                transaction.add(
                    createUpdateMetadataAccountV2Instruction(
                        {
                            metadata: metadataAddress,
                            updateAuthority: this.wallet.publicKey,
                        },
                        {
                            updateMetadataAccountArgsV2: {
                                data: null,
                                updateAuthority: null,
                                primarySaleHappened: null,
                                isMutable: false,
                            }
                        }
                    )
                );
            }

            // Set up transaction
            transaction.feePayer = this.wallet.publicKey;
            transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

            // Sign with mint keypair
            transaction.partialSign(mintKeypair);

            // Sign with wallet and send
            const signedTx = await this.wallet.signTransaction(transaction);
            const txId = await this.connection.sendRawTransaction(signedTx.serialize());
            await this.connection.confirmTransaction(txId);

            // After transaction confirmation, verify authorities
            const authorities = await this.verifyTokenAuthorities(mintAddress.toBase58());

            return {
                success: true,
                mintAddress: mintAddress.toBase58(),
                testResults: {
                    tokenCreated: true,
                    metadataCreated: true,
                    mintAuthorityRevoked: authorities.mintAuthority,
                    freezeAuthorityRevoked: authorities.freezeAuthority,
                    metadataLocked: params.lockMetadata || false,
                }
            };

        } catch (error) {
            console.error('Token creation failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Token creation failed'
            };
        }
    }

    private async createTransaction(
        params: TokenCreationParams,
        mintKeypair: Keypair,
        metadataUrl: string
    ): Promise<Transaction> {
        const mintAddress = mintKeypair.publicKey;
        const [metadataAddress] = await this.findMetadataAddress(mintAddress);
        const associatedTokenAccount = await this.findAssociatedTokenAddress(mintAddress);
        
        // Compute all addresses and parameters before building transaction
        const [instructions, signers] = await Promise.all([
            this.createInstructions(params, mintAddress, metadataAddress, associatedTokenAccount, metadataUrl),
            this.getMinimumBalanceForRent()
        ]);

        const recentBlockhash = await this.connection.getLatestBlockhash('finalized');
        
        const transaction = new Transaction()
            .add(...instructions)
            .setRecentBlockhash(recentBlockhash.blockhash);
        
        transaction.feePayer = this.wallet.publicKey;
        
        return transaction;
    }

    private async findMetadataAddress(mintAddress: PublicKey): Promise<[PublicKey, number]> {
        return PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                METADATA_PROGRAM_ID.toBuffer(),
                mintAddress.toBuffer(),
            ],
            METADATA_PROGRAM_ID
        );
    }

    private async findAssociatedTokenAddress(mintAddress: PublicKey): Promise<PublicKey> {
        return getAssociatedTokenAddress(
            mintAddress,
            this.wallet.publicKey
        );
    }

    private async createInstructions(
        params: TokenCreationParams,
        mintAddress: PublicKey,
        metadataAddress: PublicKey,
        associatedTokenAccount: PublicKey,
        metadataUrl: string
    ): Promise<TransactionInstruction[]> {
        // Implement the logic to create the transaction instructions based on the parameters
        // This is a placeholder and should be replaced with the actual implementation
        throw new Error("Method not implemented");
    }

    private async getMinimumBalanceForRent(): Promise<number> {
        // Implement the logic to get the minimum balance for rent
        // This is a placeholder and should be replaced with the actual implementation
        throw new Error("Method not implemented");
    }

    private async withRetry<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        baseDelay: number = 1000
    ): Promise<T> {
        let lastError: Error | null = null;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;
                if (!this.isRetryableError(error)) {
                    throw error;
                }
                await this.delay(baseDelay * Math.pow(2, attempt));
            }
        }
        
        throw lastError;
    }

    private isRetryableError(error: any): boolean {
        return error instanceof Error && 
               (error.message.includes('Network error') ||
                error.message.includes('timeout') ||
                error.message.includes('429')); // Rate limit
    }

    private async cleanup(resources: { [key: string]: any }): Promise<void> {
        for (const [key, resource] of Object.entries(resources)) {
            try {
                if (resource instanceof Blob) {
                    URL.revokeObjectURL(URL.createObjectURL(resource));
                }
                // Add other cleanup logic as needed
            } catch (error) {
                console.warn(`Failed to cleanup ${key}:`, error);
            }
        }
    }

    /**
     * Verifies token authorities status
     * 
     * @param mintAddress - Token mint address
     * @returns Promise resolving to authority verification result
     */
    async verifyTokenAuthorities(mintAddress: string): Promise<{
        mintAuthority: boolean,
        freezeAuthority: boolean,
        isMutable: boolean
    }> {
        try {
            // Get mint account info
            const mintInfo = await this.connection.getParsedAccountInfo(new PublicKey(mintAddress));
            if (!mintInfo.value || !mintInfo.value.data) {
                throw new Error('Could not fetch mint info');
            }
            const parsedData = (mintInfo.value.data as any).parsed;
            
            // Log detailed authority information
            console.log("Mint Account Authorities:", {
                mintAuthority: parsedData.info.mintAuthority || 'null (revoked)',
                freezeAuthority: parsedData.info.freezeAuthority || 'null (revoked)',
                supply: parsedData.info.supply,
                decimals: parsedData.info.decimals,
                isInitialized: parsedData.info.isInitialized,
            });

            const [metadataAddress] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("metadata"),
                    METADATA_PROGRAM_ID.toBuffer(),
                    new PublicKey(mintAddress).toBuffer(),
                ],
                METADATA_PROGRAM_ID
            );

            return {
                mintAuthority: !parsedData.info.mintAuthority, // true if authority is null (revoked)
                freezeAuthority: !parsedData.info.freezeAuthority, // true if authority is null (revoked)
                isMutable: true // Since you didn't choose immutable
            };
        } catch (error) {
            console.error('Failed to verify token authorities:', error);
            throw error;
        }
    }

    async testAuthorityRevocation(mintAddress: string): Promise<{
        mintingBlocked: boolean,
        freezingBlocked: boolean
    }> {
        try {
            const mint = new PublicKey(mintAddress);
            const testAccount = await getAssociatedTokenAddress(mint, this.wallet.publicKey);
            
            try {
                // Try to mint more tokens (should fail)
                const mintTx = new Transaction().add(
                    createMintToInstruction(
                        mint,
                        testAccount,
                        this.wallet.publicKey,
                        1000000000
                    )
                );
                await this.wallet.signTransaction(mintTx);
                console.log("Warning: Minting still possible!");
                return { mintingBlocked: false, freezingBlocked: true };
            } catch (e) {
                console.log("Good: Minting blocked as expected");
                return { mintingBlocked: true, freezingBlocked: true };
            }
        } catch (error) {
            console.error("Authority test failed:", error);
            throw error;
        }
    }

    async createTokenInstructions(params: TokenCreationParams): Promise<{ 
        instructions: TransactionInstruction[], 
        mintAddress: string,
        mintKeypair: Keypair
    }> {
        if (!this.wallet.publicKey) {
            throw new Error('Wallet not connected');
        }

        // Handle image upload first if provided
        let imageUrl = '';
        if (params.logo) {
            try {
                imageUrl = await this.uploadToCloudinary(params.logo);
            } catch (error) {
                console.warn('Image upload failed:', error);
            }
        }

        // Create metadata JSON
        const tokenMetadata = {
            name: params.tokenName,
            symbol: params.tokenSymbol,
            description: params.description || '',
            image: imageUrl || undefined
        };

        // Upload metadata to Cloudinary and get URL
        const metadataUrl = await this.uploadMetadataToCloudinary(tokenMetadata);

        // Generate mint keypair
        const mintKeypair = Keypair.generate();
        const mintAddress = mintKeypair.publicKey;

        // Derive metadata address
        const [metadataAddress] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                METADATA_PROGRAM_ID.toBuffer(),
                mintAddress.toBuffer(),
            ],
            METADATA_PROGRAM_ID
        );

        // Calculate rent
        const lamports = await getMinimumBalanceForRentExemptMint(this.connection);

        // Get ATA
        const associatedTokenAccount = await getAssociatedTokenAddress(
            mintAddress,
            this.wallet.publicKey
        );

        const instructions: TransactionInstruction[] = [];

        // Add all instructions in sequence
        instructions.push(
            // 1. Create mint account
            SystemProgram.createAccount({
                fromPubkey: this.wallet.publicKey,
                newAccountPubkey: mintAddress,
                space: MINT_SIZE,
                lamports,
                programId: TOKEN_PROGRAM_ID,
            }),

            // 2. Initialize mint
            createInitializeMint2Instruction(
                mintAddress,
                params.decimals,
                this.wallet.publicKey,
                this.wallet.publicKey,
            ),

            // 3. Create ATA
            createAssociatedTokenAccountInstruction(
                this.wallet.publicKey,
                associatedTokenAccount,
                this.wallet.publicKey,
                mintAddress,
            ),

            // 4. Mint tokens
            createMintToInstruction(
                mintAddress,
                associatedTokenAccount,
                this.wallet.publicKey,
                params.initialSupply * Math.pow(10, params.decimals),
                [],
            ),

            // 5. Create metadata
            createCreateMetadataAccountV3Instruction(
                {
                    metadata: metadataAddress,
                    mint: mintAddress,
                    mintAuthority: this.wallet.publicKey,
                    payer: this.wallet.publicKey,
                    updateAuthority: this.wallet.publicKey,
                },
                {
                    createMetadataAccountArgsV3: {
                        data: {
                            name: params.tokenName.slice(0, 32),
                            symbol: params.tokenSymbol.slice(0, 10),
                            uri: params.logoUrl || "",
                            sellerFeeBasisPoints: 0,
                            creators: null,
                            collection: null,
                            uses: null,
                        },
                        isMutable: !params.lockMetadata,
                        collectionDetails: null,
                    }
                }
            )
        );

        // If requested, revoke mint authority by setting it to null
        if (params.revokeMintAuthority) {
            instructions.push(
                createSetAuthorityInstruction(
                    mintAddress,
                    this.wallet.publicKey,
                    AuthorityType.MintTokens,
                    null
                )
            );
        }

        // If requested, revoke freeze authority by setting it to null
        if (params.revokeFreezeAuthority) {
            instructions.push(
                createSetAuthorityInstruction(
                    mintAddress,
                    this.wallet.publicKey,
                    AuthorityType.FreezeAccount,
                    null
                )
            );
        }

        // If requested, make metadata immutable
        if (params.lockMetadata) {
            instructions.push(
                createUpdateMetadataAccountV2Instruction(
                    {
                        metadata: metadataAddress,
                        updateAuthority: this.wallet.publicKey,
                    },
                    {
                        updateMetadataAccountArgsV2: {
                            data: null,
                            updateAuthority: null,
                            primarySaleHappened: null,
                            isMutable: false,
                        }
                    }
                )
            );
        }

        return {
            instructions,
            mintAddress: mintAddress.toString(),
            mintKeypair
        };
    }
}

interface TokenTestResult {
    mint: string;
    metadata: string;
    uri: string;
} 
