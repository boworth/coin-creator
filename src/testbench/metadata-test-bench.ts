import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { 
    Metaplex, 
    walletAdapterIdentity,
    toMetaplexFile,
    MetaplexFile,
} from "@metaplex-foundation/js";
import { 
    PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUpdateMetadataAccountV2Instruction } from "@metaplex-foundation/mpl-token-metadata";

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

interface MetadataUpdateParams {
    mintAddress: string;
    name?: string;
    symbol?: string;
    description?: string;
    logo?: File;
    logoUrl?: string;
    bannerImage?: File;
    bannerImageUrl?: string;
    youtubePreview?: string;
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    youtube?: string;
    medium?: string;
    github?: string;
    instagram?: string;
    reddit?: string;
    facebook?: string;
    properties?: {
        links?: Record<string, string>;
        files?: Array<{
            uri: string;
            type: string;
            purpose?: string;
        }>;
    };
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
    makeImmutable?: boolean;
}

interface MetadataUpdateResult {
    success: boolean;
    error?: string;
    updates?: {
        name?: boolean;
        symbol?: boolean;
        description?: boolean;
        image?: boolean;
        banner?: boolean;
        socials?: boolean;
    };
    metadata?: any;
}

interface CloudinaryUploadResponse {
    secure_url: string;
    // Add other fields as needed
}

export class MetadataTestBench {
    private wallet: WalletContextState;
    private connection: Connection;
    private metaplex: Metaplex;

    constructor(connection: Connection, wallet: WalletContextState, metaplex?: Metaplex) {
        if (!wallet.publicKey) {
            throw new Error('Wallet not connected');
        }
        this.wallet = wallet;
        this.connection = connection;
        // Initialize Metaplex if not provided
        this.metaplex = metaplex || Metaplex.make(connection).use(walletAdapterIdentity(wallet));
    }

    private async uploadToCloudinary(file: File): Promise<CloudinaryUploadResponse> {
        if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
            throw new Error('Cloudinary configuration is missing');
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
            formData.append('folder', 'token-assets');

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error('Failed to upload to Cloudinary');
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to upload to Cloudinary:', error);
            throw error;
        }
    }

    private async findMetadataAccount(mintAddress: PublicKey): Promise<PublicKey> {
        const [metadataAddress] = PublicKey.findProgramAddressSync(
            [
                Buffer.from('metadata'),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mintAddress.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        );
        return metadataAddress;
    }

    private prepareMetadata(params: MetadataUpdateParams, currentMetadata: any): any {
        console.log('Preparing metadata update:', {
            current: currentMetadata,
            updates: params
        });

        // Create a clean copy of existing properties to avoid mutation
        const existingProperties = JSON.parse(JSON.stringify(currentMetadata.properties || {}));
        
        // Handle banner image first
        let bannerUrl = currentMetadata.properties?.links?.banner || currentMetadata.properties?.banner;
        if (params.bannerImage) {
            bannerUrl = params.bannerImage;
        }

        // Get the current image URL
        const imageUrl = currentMetadata.image || currentMetadata.properties?.links?.image;

        // Get existing files
        const existingFiles = currentMetadata.properties?.files || [];

        const mergedProperties = {
            ...existingProperties,
            // Only merge new properties if provided
            ...(params.properties || {}),
            files: [
                // Keep existing files that aren't banner or image
                ...existingFiles.filter(file => {
                    const keep = file.purpose !== 'banner' && file.uri !== imageUrl;
                    return keep;
                }),
                // Keep the image file if it exists
                ...(imageUrl ? [{
                    uri: imageUrl,
                    type: "image/png",
                    purpose: "logo"
                }] : []),
                // Add banner if exists
                ...(bannerUrl ? [{
                    uri: bannerUrl,
                    type: "image/png",
                    purpose: "banner"
                }] : [])
            ],
            links: {
                // Keep all existing links except banner
                ...(Object.entries(existingProperties.links || {})
                    .filter(([key]) => !['banner'].includes(key))
                    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})),
                // Only add new social links if provided
                ...(params.properties?.links || {}),
                // Add banner if exists
                ...(bannerUrl ? { banner: bannerUrl } : {})
            }
        };

        // Prepare the final metadata, preserving existing values if no updates provided
        const finalMetadata = {
            name: params.name ?? currentMetadata.name,
            symbol: params.symbol ?? currentMetadata.symbol,
            description: params.description ?? currentMetadata.description,
            image: imageUrl,
            banner: bannerUrl,
            external_url: params.website ?? currentMetadata.external_url,
            properties: mergedProperties,
            attributes: params.attributes ?? currentMetadata.attributes
        };

        console.log('Metadata update:', {
            original: {
                name: currentMetadata.name,
                symbol: currentMetadata.symbol,
                description: currentMetadata.description
            },
            updates: {
                name: params.name,
                symbol: params.symbol,
                description: params.description
            },
            final: {
                name: finalMetadata.name,
                symbol: finalMetadata.symbol,
                description: finalMetadata.description
            }
        });

        return finalMetadata;
    }

    private async uploadMetadataToCloudinary(metadata: any): Promise<string> {
        console.log('Starting Cloudinary upload with metadata:', metadata);

        // Verify image is present before upload
        if (!metadata.image) {
            console.warn('No image found in metadata before upload');
        }

        try {
            // Create metadata file with pretty printing for better debugging
            const metadataBlob = new Blob(
                [JSON.stringify(metadata, null, 2)], 
                { type: 'application/json' }
            );
            const metadataFile = new File([metadataBlob], 'metadata.json', { type: 'application/json' });
            
            const formData = new FormData();
            formData.append('file', metadataFile);
            formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
            formData.append('folder', 'token-metadata');

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error('Failed to upload metadata');
            }

            const data = await response.json();
            
            // Verify the uploaded metadata
            try {
                const verifyResponse = await fetch(data.secure_url);
                const uploadedMetadata = await verifyResponse.json();
                console.log('Verified uploaded metadata:', uploadedMetadata);
            } catch (error) {
                console.error('Failed to verify uploaded metadata:', error);
            }

            return data.secure_url;
        } catch (error) {
            console.error('Failed to upload metadata to Cloudinary:', error);
            throw error;
        }
    }

    private async uploadToArweave(metadata: any): Promise<{ url: string }> {
        try {
            console.log('Uploading metadata to Arweave:', metadata);
            
            // Create a deep copy to prevent mutations
            const metadataCopy = JSON.parse(JSON.stringify(metadata));
            
            // First upload to Cloudinary as temporary storage
            const metadataUrl = await this.uploadMetadataToCloudinary(metadataCopy);
            
            console.log('Uploaded metadata URL:', metadataUrl);
            
            // Verify the upload
            try {
                const verifyResponse = await fetch(metadataUrl);
                const uploadedMetadata = await verifyResponse.json();
                console.log('Verified uploaded metadata:', uploadedMetadata);
                
                // Check if image was preserved
                if (metadata.image !== uploadedMetadata.image) {
                    console.error('Image mismatch after upload:', {
                        original: metadata.image,
                        uploaded: uploadedMetadata.image
                    });
                }
            } catch (error) {
                console.error('Failed to verify metadata after upload:', error);
            }
            
            return { url: metadataUrl };
        } catch (error) {
            console.error('Failed to upload metadata:', error);
            throw error;
        }
    }

    private async updateOnChainMetadata(mintAddress: PublicKey, uri: string): Promise<string> {
        try {
            const { response } = await this.metaplex.nfts().update({
                nftOrSft: await this.metaplex.nfts().findByMint({ mintAddress }),
                uri: uri
            });

            await this.connection.confirmTransaction(response.signature);
            return response.signature;
        } catch (error) {
            console.error('Failed to update on-chain metadata:', error);
            throw error;
        }
    }

    async updateMetadata(params: MetadataUpdateParams): Promise<TransactionInstruction> {
        if (!this.wallet.publicKey) {
            throw new Error('Wallet not connected');
        }

        const mintPubkey = new PublicKey(params.mintAddress);

        // Find metadata account PDA
        const [metadataAddress] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mintPubkey.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        );

        // Upload new image if provided
        let imageUrl = '';
        if (params.logo) {
            try {
                imageUrl = await this.uploadToCloudinary(params.logo);
            } catch (error) {
                console.warn('Image upload failed:', error);
            }
        }

        // Create metadata
        const metadata = {
            name: params.name || '',
            symbol: params.symbol || '',
            uri: imageUrl || '',
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null
        };

        // Create update instruction
        const updateInstruction = createUpdateMetadataAccountV2Instruction(
            {
                metadata: metadataAddress,
                updateAuthority: this.wallet.publicKey,
            },
            {
                updateMetadataAccountArgsV2: {
                    data: metadata,
                    updateAuthority: params.makeImmutable ? null : this.wallet.publicKey,
                    primarySaleHappened: null,
                    isMutable: !params.makeImmutable,
                }
            }
        );

        return updateInstruction;
    }

    async fetchMetadata(mintAddress: string): Promise<any> {
        try {
            const mint = new PublicKey(mintAddress);
            // Use findByMint from the initialized Metaplex instance
            const nft = await this.metaplex.nfts().findByMint({
                mintAddress: mint,
            });

            console.log('Fetched NFT:', nft);

            // Fetch off-chain metadata
            let currentMetadata = {};
            if (nft.uri) {
                try {
                    const response = await fetch(nft.uri);
                    if (response.ok) {
                        currentMetadata = await response.json();
                        console.log('Fetched off-chain metadata:', currentMetadata);
                    }
                } catch (error) {
                    console.warn('Failed to fetch off-chain metadata:', error);
                }
            }

            // Return merged metadata
            return {
                name: nft.name,
                symbol: nft.symbol,
                description: nft.json?.description || currentMetadata.description || '',
                image: nft.json?.image || currentMetadata.image,
                properties: currentMetadata.properties || {}
            };
        } catch (error) {
            console.error('Failed to fetch metadata:', error);
            throw error;
        }
    }

    async makeImmutable(mintAddress: string): Promise<{ success: boolean; error?: string }> {
        try {
            if (!this.wallet.publicKey) {
                throw new Error('Wallet not connected');
            }

            const mint = new PublicKey(mintAddress);
            
            // Find NFT
            const nft = await this.metaplex.nfts().findByMint({
                mintAddress: mint,
            });

            // Make metadata immutable
            const { response } = await this.metaplex.nfts().update({
                nftOrSft: nft,
                isMutable: false,
            });

            await this.connection.confirmTransaction(response.signature);

            return { success: true };
        } catch (error) {
            console.error('Failed to make token immutable:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to make token immutable'
            };
        }
    }

    // Also add a helper method to check mutability
    async isTokenMutable(mintAddress: string): Promise<boolean> {
        try {
            const mint = new PublicKey(mintAddress);
            const nft = await this.metaplex.nfts().findByMint({
                mintAddress: mint,
            });
            return nft.isMutable;
        } catch (error) {
            console.error('Failed to check token mutability:', error);
            throw error;
        }
    }
} 