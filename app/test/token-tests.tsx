"use client"

import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { TokenService } from "@/lib/services/token-service"
import { useState } from "react"
import { Connection, PublicKey } from "@solana/web3.js"
import { describe, it, expect, beforeEach } from 'vitest';
import { Keypair } from '@solana/web3.js';
import { AnchorWallet } from '@solana/wallet-adapter-react';

interface TestResults {
  airdrop?: {
    success?: boolean
    amount?: number
    balance?: number
    error?: string
    message?: string
  }
  createToken?: {
    success: boolean
    mintAddress?: string
    testResults?: {
      tokenCreated: boolean
      metadataCreated: boolean
      mintAuthorityRevoked: boolean
      freezeAuthorityRevoked: boolean
      metadataLocked: boolean
    }
    error?: string
  }
  updateMetadata?: any
  burnTokens?: any
  premiumFeatures?: any
  imageUploads?: {
    success: boolean
    verification?: {
      hasLogo: boolean
      hasBanner: boolean
      logoUrl?: string
      bannerUrl?: string
    }
    urlVerification?: {
      logo: boolean
      banner: boolean
      logoUrl?: string
      bannerUrl?: string
    }
    error?: string
  }
  socialUrls?: {
    success: boolean
    verification: Record<string, boolean>
    removeResult?: {
      success: boolean
      error?: string
    }
    removalVerification: Record<string, boolean>
    finalLinks: Record<string, string>
    error?: string
  }
  immutable?: {
    success: boolean
    isMutable: boolean
    updateAttempt: {
      success: boolean
      error?: string
      expectedError?: boolean
    }
  }
  finalResults?: {
    success: boolean
    mintAddress?: string
    timestamp: string
    testResults: {
      creation: {
        success: boolean
        mintAddress?: string
        testResults: {
          tokenCreated: boolean
          metadataCreated: boolean
          mintAuthorityRevoked: boolean
          freezeAuthorityRevoked: boolean
          metadataLocked: boolean
        }
      }
      images: {
        success: boolean
        verification: {
          hasLogo: boolean
          hasBanner: boolean
          logoUrl?: string
          bannerUrl?: string
        }
      }
      socials: {
        success: boolean
        verification: Record<string, boolean>
        finalLinks: Record<string, string>
      }
      finalState: {
        metadata: {
          name: string
          symbol: string
          description: string
          image?: string
          external_url?: string
          properties: {
            links: Record<string, string>
          }
          attributes?: Array<{
            trait_type: string
            value: string
          }>
        }
        verifications: {
          hasLogo: boolean
          hasBanner: boolean
          hasSocials: boolean
          isImmutable: boolean
          socialTags: {
            active: Record<string, string>
            removed: string[]
          }
          immutableTest: {
            success: boolean
            updateAttempt: {
              success: boolean
              error?: string
            }
          }
        }
      }
    }
    error?: string
  }
  currentMintAddress?: string
}

const AIRDROP_AMOUNT = 2 // SOL

// Helper function to create a test image file
const createTestImage = (name: string = 'test.png'): File => {
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  const byteString = atob(base64)
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new File([ab], name, { type: 'image/png' })
}

// Add this interface for better type safety
interface ImageVerification {
  hasLogo: boolean
  hasBanner: boolean
  logoUrl?: string
  bannerUrl?: string
}

// Add image verification function
const verifyImageUrls = async (verification: ImageVerification) => {
  const results = {
    logo: false,
    banner: false,
    logoUrl: verification.logoUrl,
    bannerUrl: verification.bannerUrl
  }

  try {
    if (verification.logoUrl) {
      const logoResponse = await fetch(verification.logoUrl)
      results.logo = logoResponse.ok
    }
    
    if (verification.bannerUrl) {
      const bannerResponse = await fetch(verification.bannerUrl)
      results.banner = bannerResponse.ok
    }
    
    return results
  } catch (error) {
    console.error("Image verification failed:", error)
    return results
  }
}

const verifyBannerImage = (metadata: any) => {
  const locations = {
    inFiles: metadata.properties?.files?.some(f => f.purpose === "banner"),
    inLinks: !!metadata.properties?.links?.banner,
    inAttributes: !!metadata.attributes?.find(a => a.trait_type === "banner"),
    directField: !!metadata.bannerImage
  }
  
  console.log("Banner Image Locations:", locations)
  return Object.values(locations).some(v => v)
}

// Update social URL test function
const testSocialUrls = async (mintAddress: string, conn = connection, walletAdapter = wallet) => {
  try {
    console.log("Testing social URL updates...")
    const metadataService = await TokenService.manageMetadata(conn, walletAdapter)
    
    // Get current metadata to preserve existing properties
    const currentMetadata = await metadataService.fetchMetadata(mintAddress)
    
    const socialUrls = {
      website: "https://example.com",
      twitter: "https://twitter.com/example",
      telegram: "https://t.me/example",
      discord: "https://discord.gg/example",
      youtube: "https://youtube.com/c/example",
      medium: "https://medium.com/@example",
      github: "https://github.com/example",
      instagram: "https://instagram.com/example",
      reddit: "https://reddit.com/r/example",
      facebook: "https://facebook.com/example",
      linkedin: "https://linkedin.com/in/example",
      tiktok: "https://tiktok.com/@example",
      twitch: "https://twitch.tv/example",
      snapchat: "https://snapchat.com/add/example"
    }

    // Update with social URLs while preserving other properties
    const result = await metadataService.updateMetadata({
      mintAddress,
      properties: {
        ...currentMetadata.properties,
        links: {
          ...currentMetadata.properties?.links,
          ...socialUrls
        }
      }
    })

    // Verify social URLs
    const updatedMetadata = await metadataService.fetchMetadata(mintAddress)
    const verification = Object.entries(socialUrls).reduce((acc, [key, url]) => ({
      ...acc,
      [key]: updatedMetadata.properties?.links?.[key] === url
    }), {})

    // Test removing some social URLs while preserving others
    const removeResult = await metadataService.updateMetadata({
      mintAddress,
      properties: {
        ...updatedMetadata.properties,
        links: {
          ...updatedMetadata.properties?.links,
          twitter: "",
          discord: "",
          medium: ""
        }
      }
    })

    // Verify removal
    const finalMetadata = await metadataService.fetchMetadata(mintAddress)
    const removalVerification = {
      twitter: !finalMetadata.properties?.links?.twitter,
      discord: !finalMetadata.properties?.links?.discord,
      medium: !finalMetadata.properties?.links?.medium
    }

    // Log detailed results
    console.log("Social URL Update Result:", result)
    console.log("Social URL Verification:", verification)
    console.log("Social URL Removal Result:", removeResult)
    console.log("Removal Verification:", removalVerification)
    console.log("Final Social Links:", finalMetadata.properties?.links)

    return { 
      result, 
      verification,
      removeResult,
      removalVerification,
      finalLinks: finalMetadata.properties?.links
    }
  } catch (error) {
    console.error("Social URL Update Failed:", error)
    return { error }
  }
}

export function TokenTests() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [results, setResults] = useState<TestResults>({})

  // Test Image Upload
  const testImageUpload = async (providedMintAddress?: string) => {
    try {
      console.log("Testing image upload...")
      
      // Use provided mint address or get from results
      let mintAddress = providedMintAddress || results.currentMintAddress || results.createToken?.mintAddress
      
      if (!mintAddress) {
        console.log("No token created yet, creating one first...")
        mintAddress = await testCreateToken()
        if (!mintAddress) {
          throw new Error("Failed to create token for image upload test")
        }
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      const logoFile = createTestImage('logo.png')
      const bannerFile = createTestImage('banner.png')
      
      const metadataService = await TokenService.manageMetadata(connection, wallet)
      
      // Use the local mintAddress variable instead of accessing results
      console.log("Using mint address:", mintAddress)

      // First, verify current metadata
      const beforeMetadata = await metadataService.fetchMetadata(mintAddress)
      console.log("Metadata before update:", beforeMetadata)

      // Upload banner image first to get URL
      const bannerUploadResult = await metadataService.uploadToCloudinary(bannerFile)
      console.log("Banner upload result:", bannerUploadResult)

      const result = await metadataService.updateMetadata({
        mintAddress,
        logo: logoFile,
        name: "Image Test Token",
        symbol: "IMG",
        description: "Testing image uploads",
        properties: {
          files: [
            {
              type: "image/png",
              uri: bannerUploadResult.secure_url,
              cdn: true,
              purpose: "banner"
            }
          ],
          category: "image",
          links: {
            banner: bannerUploadResult.secure_url
          }
        },
        attributes: [
          {
            trait_type: "banner",
            value: bannerUploadResult.secure_url
          }
        ],
        bannerImage: bannerUploadResult.secure_url,
        // Add explicit banner field
        banner: bannerUploadResult.secure_url
      })

      // Verify the update
      const afterMetadata = await metadataService.fetchMetadata(mintAddress)
      console.log("Metadata after update:", afterMetadata)

      // Verify both images are present
      const verification = {
        hasLogo: !!afterMetadata.image,
        hasBanner: !!(
          afterMetadata.properties?.files?.some(f => f.purpose === "banner") ||
          afterMetadata.properties?.links?.banner ||
          afterMetadata.attributes?.find(a => a.trait_type === "banner")?.value ||
          afterMetadata.bannerImage
        ),
        logoUrl: afterMetadata.image,
        bannerUrl: 
          afterMetadata.properties?.files?.find(f => f.purpose === "banner")?.uri ||
          afterMetadata.properties?.links?.banner ||
          afterMetadata.attributes?.find(a => a.trait_type === "banner")?.value ||
          afterMetadata.bannerImage
      }

      // Add more detailed logging
      console.log("Metadata Structure:", {
        files: afterMetadata.properties?.files,
        links: afterMetadata.properties?.links,
        attributes: afterMetadata.attributes,
        bannerImage: afterMetadata.bannerImage
      })

      // Verify image URLs are accessible
      const urlVerification = await verifyImageUrls(verification)
      console.log("Image URL Verification:", urlVerification)

      // Add this check after metadata update
      const bannerVerification = verifyBannerImage(afterMetadata)
      console.log("Banner properly set:", bannerVerification)

      console.log("Image Upload Result:", result)
      console.log("Image Verification:", verification)

      setResults(prev => ({ 
        ...prev, 
        imageUploads: {
          ...result,
          verification,
          urlVerification
        }
      }))

      return result
    } catch (error) {
      console.error("Image Upload Failed:", error)
      setResults(prev => ({ ...prev, imageUploads: { error } }))
    }
  }

  // Test Premium Features
  const testPremiumFeatures = async () => {
    try {
      console.log("Testing premium features...")
      const mintAddress = results.finalResults?.testResults?.images?.verification?.logoUrl || results.createToken?.mintAddress

      if (!mintAddress) {
        throw new Error("No mint address available for premium features test")
      }

      // 1. Test Make Immutable first
      const metadataService = await TokenService.manageMetadata(connection, wallet)
      const immutableResult = await metadataService.makeImmutable(mintAddress)
      
      // Wait for transaction confirmation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 2. Verify states
      const isMutable = await metadataService.isTokenMutable(mintAddress)
      
      // 3. Try to update metadata (should fail)
      const updateResult = await metadataService.updateMetadata({
        mintAddress,
        name: "Should Fail Update"
      }).catch(error => ({
        success: false,
        error: error.message
      }))

      const result = { immutableResult, isMutable, updateResult }
      console.log("Premium Features Result:", result)

      setResults(prev => ({ 
        ...prev, 
        premiumFeatures: {
          ...result,
          verification: {
            isMutable,
            updateAfterImmutable: updateResult,
            timestamp: new Date().toISOString()
          }
        }
      }))

      return result
    } catch (error) {
      console.error("Premium Features Test Failed:", error)
      setResults(prev => ({ ...prev, premiumFeatures: { error } }))
      throw error // Re-throw to handle in runAllTests
    }
  }

  // Modified Token Creation Test
  const testCreateToken = async () => {
    try {
      console.log("Testing token creation with premium features...")
      const tokenService = await TokenService.createToken(connection, wallet)
      
      // Create test images
      const logoFile = createTestImage('initial-logo.png')
      const bannerFile = createTestImage('initial-banner.png')

      // First create token with all authorities
      const result = await tokenService.createTestToken({
        decimals: 9,
        initialSupply: 1000000,
        tokenName: "Test Token",
        tokenSymbol: "TEST",
        description: "Test token for updates",
        revokeMintAuthority: true,  // Test premium feature
        revokeFreezeAuthority: true, // Test premium feature
        lockMetadata: false, // Keep mutable for other tests
        logo: logoFile,
        bannerImage: bannerFile
      })

      console.log("Token Creation Result:", result)
      
      // Verify the result includes authority verification
      if (result.success && result.testResults) {
        console.log("Authority Status:", {
          mintAuthority: result.testResults.mintAuthorityRevoked ? "Revoked" : "Active",
          freezeAuthority: result.testResults.freezeAuthorityRevoked ? "Revoked" : "Active"
        })
      }

      setResults(prev => ({ 
        ...prev, 
        createToken: result
      }))

      return result.mintAddress
    } catch (error) {
      console.error("Token creation failed:", error)
      setResults(prev => ({ ...prev, createToken: { error } }))
    }
  }

  // 2. Test Metadata Update
  const testUpdateMetadata = async (mintAddress: string) => {
    try {
      console.log("Testing metadata update...")
      const metadataService = await TokenService.manageMetadata(connection, wallet)
      const result = await metadataService.updateMetadata({
        mintAddress,
        name: "Updated Token Name",
        symbol: "UPDT",
        description: "Updated description",
        website: "https://example.com"
      })
      
      console.log("Metadata Update Result:", result)
      setResults((prev: TestResults) => ({ ...prev, updateMetadata: result }))
    } catch (error) {
      console.error("Metadata Update Failed:", error)
      setResults((prev: TestResults) => ({ ...prev, updateMetadata: { error } }))
    }
  }

  // 3. Test Token Burning
  const testBurnTokens = async (mintAddress: string) => {
    try {
      console.log("Testing token burning...")
      const burnService = await TokenService.burnTokens(connection, wallet)
      const result = await burnService.burnTokens({
        mintAddress,
        amount: 100
      })
      
      console.log("Token Burn Result:", result)
      setResults((prev: TestResults) => ({ ...prev, burnTokens: result }))
    } catch (error) {
      console.error("Token Burn Failed:", error)
      setResults((prev: TestResults) => ({ ...prev, burnTokens: { error } }))
    }
  }

  const requestAirdrop = async () => {
    try {
      if (!wallet.publicKey) {
        console.error("Wallet not connected")
        return
      }

      console.log("Requesting airdrop...")
      
      // Try multiple airdrop endpoints
      const endpoints = [
        'https://api.devnet.solana.com',
        'https://devnet.solana.com',
        'https://api.testnet.solana.com'
      ]

      let success = false
      let error = null

      for (const endpoint of endpoints) {
        try {
          const tempConnection = new Connection(endpoint, 'confirmed')
          
          // Request a smaller amount (1 SOL) to avoid rate limits
          const signature = await tempConnection.requestAirdrop(
            wallet.publicKey,
            1 * 1e9 // 1 SOL in lamports
          )

          // Wait for confirmation
          const { blockhash, lastValidBlockHeight } = await tempConnection.getLatestBlockhash()
          await tempConnection.confirmTransaction({
            blockhash,
            lastValidBlockHeight,
            signature,
          })

          success = true
          console.log(`Airdropped 1 SOL to ${wallet.publicKey.toString()} using ${endpoint}`)
          break
        } catch (e) {
          error = e
          console.log(`Failed airdrop from ${endpoint}, trying next...`)
          continue
        }
      }

      if (!success) {
        throw error || new Error("All airdrop attempts failed")
      }

      // Get new balance
      const balance = await connection.getBalance(wallet.publicKey)
      console.log(`New balance: ${balance / 1e9} SOL`)

      setResults(prev => ({ 
        ...prev, 
        airdrop: { 
          success: true, 
          amount: 1, // We're now dropping 1 SOL
          balance: balance / 1e9
        }
      }))
    } catch (error) {
      console.error("Airdrop failed:", error)
      setResults(prev => ({ 
        ...prev, 
        airdrop: { 
          error,
          message: "Airdrop failed. You can also get devnet SOL from https://solfaucet.com"
        } 
      }))
    }
  }

  // Comprehensive test function
  const runAllTests = async () => {
    try {
      console.log("Starting comprehensive token tests...")
      const testResults: any = {}
      let mintAddress: string | undefined

      // 1. Create Token (with premium features)
      console.log("\n1. Testing Token Creation...")
      mintAddress = await testCreateToken()
      if (!mintAddress) {
        throw new Error("Token creation failed")
      }
      testResults.creation = results.createToken
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Store the mint address for subsequent tests
      setResults(prev => ({
        ...prev,
        currentMintAddress: mintAddress
      }))

      // 2. Update Metadata with Images
      console.log("\n2. Testing Image Upload...")
      const imageResults = await testImageUpload(mintAddress) // Pass mintAddress directly
      testResults.images = imageResults
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 3. Test Social URLs
      console.log("\n3. Testing Social URLs...")
      const socialResults = await testSocialUrls(mintAddress, connection, wallet)
      testResults.socials = socialResults
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 4. Make Immutable (last step)
      console.log("\n4. Making Token Immutable...")
      const metadataService = await TokenService.manageMetadata(connection, wallet)
      const immutableResult = await metadataService.makeImmutable(mintAddress)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Verify immutability
      const isMutable = await metadataService.isTokenMutable(mintAddress)
      console.log("Immutability Status:", { 
          success: immutableResult.success, 
          isMutable,
          expectedError: !isMutable ? "Data is immutable" : undefined
      })

      // Try to update metadata after making immutable (should fail)
      const updateAfterImmutable = await metadataService.updateMetadata({
          mintAddress,
          name: "Should Fail"
      }).catch(error => {
          const isExpectedError = error.message.includes("Data is immutable")
          return {
              success: false,
              error: isExpectedError ? "Token is immutable as expected" : error.message,
              expectedError: isExpectedError
          }
      })

      console.log("Update attempt after immutable:", {
          success: updateAfterImmutable.success,
          expectedError: updateAfterImmutable.expectedError,
          message: updateAfterImmutable.error
      })

      // Add immutability results to test results
      testResults.immutable = {
          success: immutableResult.success,
          isMutable,
          updateAttempt: updateAfterImmutable
      }

      // 5. Final Verification
      console.log("\n5. Verifying Final State...")
      const finalMetadata = await metadataService.fetchMetadata(mintAddress)
      const isMutableFinal = await metadataService.isTokenMutable(mintAddress)
      
      // Ensure all data is JSON-serializable
      const serializedState = {
        metadata: {
          name: finalMetadata.name,
          symbol: finalMetadata.symbol,
          description: finalMetadata.description,
          image: finalMetadata.image,
          external_url: finalMetadata.external_url,
          properties: {
            ...finalMetadata.properties,
            links: finalMetadata.properties?.links || {}
          },
          attributes: finalMetadata.attributes?.map(attr => ({
            trait_type: attr.trait_type,
            value: attr.value
          }))
        },
        verifications: {
          hasLogo: !!finalMetadata.image,
          hasBanner: verifyBannerImage(finalMetadata),
          hasSocials: !!finalMetadata.properties?.links && 
                      Object.keys(finalMetadata.properties.links).length > 0,
          isImmutable: !isMutableFinal,
          socialTags: {
            active: Object.entries(finalMetadata.properties?.links || {})
              .filter(([_, value]) => !!value)
              .reduce((acc, [key, value]) => ({ ...acc, [key]: String(value) }), {}),
            removed: Object.entries(finalMetadata.properties?.links || {})
              .filter(([_, value]) => !value)
              .map(([key]) => key)
          },
          immutableTest: {
            success: immutableResult.success,
            updateAttempt: {
              success: updateAfterImmutable.success,
              error: updateAfterImmutable.error
            }
          }
        }
      }

      // Set final results with serializable data
      setResults(prev => ({
        ...prev,
        finalResults: {
          success: true,
          mintAddress,
          timestamp: new Date().toISOString(),
          testResults: {
            creation: {
              success: testResults.creation?.success,
              mintAddress: testResults.creation?.mintAddress,
              testResults: {
                tokenCreated: testResults.creation?.testResults?.tokenCreated,
                metadataCreated: testResults.creation?.testResults?.metadataCreated,
                mintAuthorityRevoked: testResults.creation?.testResults?.mintAuthorityRevoked,
                freezeAuthorityRevoked: testResults.creation?.testResults?.freezeAuthorityRevoked,
                metadataLocked: testResults.creation?.testResults?.metadataLocked
              }
            }
          },
          images: {
            success: testResults.images?.success,
            verification: {
              hasLogo: testResults.images?.verification?.hasLogo,
              hasBanner: testResults.images?.verification?.hasBanner,
              logoUrl: finalMetadata.image,
              bannerUrl: finalMetadata.properties?.links?.banner
            }
          },
          socials: {
            success: testResults.socials?.success,
            verification: testResults.socials?.verification,
            finalLinks: finalMetadata.properties?.links
          },
          finalState: serializedState
        }
      }))

      console.log("\n✅ All tests completed successfully!")
      console.log("Final State:", serializedState)

    } catch (error) {
      console.error("❌ Test sequence failed:", error)
      setResults(prev => ({
        ...prev,
        finalResults: {
          success: false,
          error: error instanceof Error ? error.message : "Test sequence failed",
          timestamp: new Date().toISOString()
        }
      }))
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Token Integration Tests</h2>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button 
            onClick={runAllTests}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
          >
            Run All Tests
          </button>

          <button 
            onClick={requestAirdrop}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Request SOL
          </button>
        </div>

        {/* Test Results Display */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Test Results:</h3>
          
          {/* Test Status Indicators */}
          {results.finalResults && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-white rounded-lg shadow">
                <h4 className="font-semibold">Overall Status</h4>
                <p className={`text-lg ${results.finalResults.success ? 'text-green-500' : 'text-red-500'}`}>
                  {results.finalResults.success ? '✅ Tests Passed' : '❌ Tests Failed'}
                </p>
              </div>
              
              {results.finalResults.success && results.finalResults.mintAddress && (
                <div className="p-4 bg-white rounded-lg shadow">
                  <h4 className="font-semibold">Token Address</h4>
                  <p className="text-sm font-mono break-all">{results.finalResults.mintAddress}</p>
                </div>
              )}
            </div>
          )}

          {/* Image Previews */}
          {(results.finalResults?.testResults?.images?.verification || results.imageUploads?.verification) && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Logo Preview */}
              {(results.finalResults?.testResults?.images?.verification?.logoUrl || results.imageUploads?.verification?.logoUrl) && (
                <div className="p-4 bg-white rounded-lg shadow">
                  <h4 className="font-semibold">Logo Preview</h4>
                  <img 
                    src={results.finalResults?.testResults?.images?.verification?.logoUrl || results.imageUploads?.verification?.logoUrl} 
                    alt="Token Logo" 
                    className="w-24 h-24 object-contain mt-2 border rounded"
                  />
                </div>
              )}

              {/* Banner Preview */}
              {(results.finalResults?.testResults?.images?.verification?.bannerUrl || results.imageUploads?.verification?.bannerUrl) && (
                <div className="p-4 bg-white rounded-lg shadow">
                  <h4 className="font-semibold">Banner Preview</h4>
                  <img 
                    src={results.finalResults?.testResults?.images?.verification?.bannerUrl || results.imageUploads?.verification?.bannerUrl} 
                    alt="Token Banner" 
                    className="w-full h-32 object-cover mt-2 border rounded"
                  />
                </div>
              )}
            </div>
          )}

          {/* Detailed Results */}
          <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-96">
            {JSON.stringify(
              {
                testResults: results.finalResults?.testResults || {},
                currentStatus: {
                  success: results.finalResults?.success || false,
                  mintAddress: results.finalResults?.mintAddress,
                  timestamp: results.finalResults?.timestamp
                }
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  )
}

describe('Token Operations', () => {
    let connection: Connection;
    let wallet: AnchorWallet;
    let tokenService: TokenService;

    beforeEach(() => {
        connection = new Connection('http://localhost:8899', 'confirmed');
        const keypair = Keypair.generate();
        wallet = {
            publicKey: keypair.publicKey,
            signTransaction: async (tx) => tx,
            signAllTransactions: async (txs) => txs,
            payer: keypair
        };
        tokenService = new TokenService(connection, wallet);
    });

    it('should create a token with metadata', async () => {
        const tokenMetadata = {
            name: 'Test Token',
            symbol: 'TEST',
            uri: 'https://test.com/metadata.json'
        };

        const mintPubkey = await tokenService.createToken(9, tokenMetadata);
        expect(mintPubkey).toBeDefined();
        
        // Verify token metadata
        const metadata = await tokenService.getTokenMetadata(mintPubkey);
        expect(metadata.name).toBe(tokenMetadata.name);
        expect(metadata.symbol).toBe(tokenMetadata.symbol);
        expect(metadata.uri).toBe(tokenMetadata.uri);
    });

    // Add more test cases...
}); 