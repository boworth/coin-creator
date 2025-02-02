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
 * Token Test Bench stub.
 * Replace with your actual implementation.
 */
export class TokenTestBench {
    constructor(connection: any, wallet: any) { }

    async createTokenInstructions(params: any) {
        // Return dummy instructions, mint address, and mint keypair.
        return {
            instructions: [],
            mintAddress: "dummy-mint-address",
            mintKeypair: {
                publicKey: { toString: () => "dummy-public-key" },
                secretKey: new Uint8Array([]),
            },
        };
    }
}

interface TokenTestResult {
    mint: string;
    metadata: string;
    uri: string;
} 
