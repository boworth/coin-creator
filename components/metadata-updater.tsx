"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"
import { useMembership } from "@/contexts/membership-context"
import { TokenService, MetadataUpdateParams } from "@/src/services/token-service"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { Connection, PublicKey, WalletContextState } from "@solana/web3.js"
import { AnchorWallet } from "@solana/wallet-adapter-wallets"
import { Upload, X } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { motion } from "framer-motion"
import { Alert, AlertCircle, AlertDescription, AlertTitle, AlertClassName } from "@/components/ui/alert"
import { Check } from "lucide-react"
import Link from "next/link"

const urlSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    if (!value) return "";
    // If URL doesn't start with http:// or https://, add https://
    if (!value.match(/^https?:\/\//)) {
      return `https://${value}`;
    }
    return value;
  })
  .refine(
    (value) => {
      if (!value) return true; // Empty strings are valid
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    {
      message: "Please enter a valid URL"
    }
  );

const formSchema = z.object({
  tokenAddress: z.string().min(32, "Invalid token address").max(44, "Invalid token address"),
  tokenName: z.string().min(1, "Token name is required").max(30, "Token name must not be longer than 30 characters"),
  tokenSymbol: z
    .string()
    .min(1, "Token symbol is required")
    .max(10, "Token symbol must not be longer than 10 characters"),
  description: z.string().optional(),
  youtubePreview: urlSchema,
  coverImage: z.any().optional(),
  coverImageUrl: urlSchema,
  useCoverImageUrl: z.boolean().default(false),
  website: urlSchema,
  twitter: urlSchema,
  telegram: urlSchema,
  discord: urlSchema,
  youtube: urlSchema,
  medium: urlSchema,
  github: urlSchema,
  instagram: urlSchema,
  reddit: urlSchema,
  facebook: urlSchema,
})

export function MetadataUpdater() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentMetadata, setCurrentMetadata] = useState<any>(null)
  const [usdValue, setUsdValue] = useState<number | null>(null)
  const { isActive } = useMembership()
  const { connection } = useConnection()
  const wallet = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingLogo, setExistingLogo] = useState<string | null>(null)
  const [makeImmutable, setMakeImmutable] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tokenAddress: "",
      tokenName: "",
      tokenSymbol: "",
      description: "",
      youtubePreview: "",
      useCoverImageUrl: false,
      coverImageUrl: "",
      website: "",
      twitter: "",
      telegram: "",
      discord: "",
      youtube: "",
      medium: "",
      github: "",
      instagram: "",
      reddit: "",
      facebook: "",
    },
  })

  const coverImage = form.watch("coverImage")
  const useCoverImageUrl = form.watch("useCoverImageUrl")
  const tokenAddress = form.watch("tokenAddress")

  const fetchMetadata = async (address: string, connection: Connection, wallet: WalletContextState) => {
    try {
      const service = new TokenService(connection, wallet as AnchorWallet)
      const metadata = await service.getTokenMetadata(new PublicKey(address))
      return metadata
    } catch (error) {
      console.error('Failed to fetch metadata:', error)
      throw error
    }
  }

  const loadMetadata = async () => {
    if (!tokenAddress || tokenAddress.length < 32) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      const metadata = await fetchMetadata(tokenAddress, connection, wallet)
      // Get logo from either root image field or links
      const logo = metadata.image || metadata.properties?.links?.image
      console.log('Current logo URL:', logo)
      setExistingLogo(logo)
      console.log('Fetched updated metadata:', metadata)
      
      // Update form with current metadata
      form.reset({
        ...form.getValues(), // Keep other form values
        tokenName: metadata.name || '',
        tokenSymbol: metadata.symbol || '',
        description: metadata.description || '',
      })
      
      // Force a refresh of the current metadata display
      setCurrentMetadata(null) // Clear first to force re-render
      setTimeout(() => {
        setCurrentMetadata(metadata) // Set after a brief delay
      }, 100)

    } catch (error) {
      console.error('Failed to load metadata:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (tokenAddress && tokenAddress.length >= 32) {
      loadMetadata()
    }
  }, [tokenAddress, connection, wallet])

  useEffect(() => {
    const fetchUsdValue = async () => {
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd")
        const data = await response.json()
        const solToUsd = data.solana.usd
        setUsdValue(0.1 * solToUsd)
      } catch (error) {
        console.error("Failed to fetch USD value:", error)
      }
    }

    fetchUsdValue()
  }, [])

  const handleUpdate = async (values: MetadataUpdateParams) => {
    setIsLoading(true)
    setError(null)
    try {
      const service = new TokenService(connection, wallet)
      const result = await service.updateMetadata(values)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update metadata')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update metadata')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!wallet.publicKey) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
        const service = new TokenService(connection, wallet as AnchorWallet);
        await service.updateMetadata({
            mintAddress: data.tokenAddress,
            name: data.tokenName || undefined,
            symbol: data.tokenSymbol || undefined,
            description: data.description || undefined,
            logo: data.logo?.[0],
            properties: {
                links: {
                    website: data.website || "",
                    twitter: data.twitter || "",
                    telegram: data.telegram || "",
                    discord: data.discord || "",
                    youtube: data.youtube || "",
                    medium: data.medium || "",
                    github: data.github || "",
                    instagram: data.instagram || "",
                    reddit: data.reddit || "",
                    facebook: data.facebook || "",
                }
            },
            makeImmutable: makeImmutable
        });

    } catch (error) {
        console.error("Metadata update failed:", error);
        
        // Handle specific error cases
        let errorMessage = "Failed to update metadata. Please try again.";
        
        if (error instanceof Error) {
            if (error.message.includes("authority")) {
                errorMessage = "You don't have permission to update this token's metadata. Only the token creator can modify it.";
            } else if (error.message.includes("mint not found")) {
                errorMessage = "Token not found. Please check the address and try again.";
            } else if (error.message.includes("Invalid mint address")) {
                errorMessage = "Invalid token address. Please check and try again.";
            }
        }
    } finally {
        setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Token Metadata</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="tokenAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Address</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter token mint address" 
                        {...field} 
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={() => {
                          if (tokenAddress) {
                            loadMetadata()
                          }
                        }}
                        disabled={isLoading || !tokenAddress || tokenAddress.length < 32}
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          "Fetch"
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isLoading ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : currentMetadata ? (
              <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                <h3 className="font-semibold mb-4">Current Metadata</h3>
                {!currentMetadata.isMutable && (
                  <div className="bg-yellow-100 border-yellow-400 text-yellow-700 p-4 rounded-lg mb-4">
                    ⚠️ This token's metadata is permanently immutable and cannot be modified
                  </div>
                )}
                <div className="flex flex-col gap-6">
                  {/* Cover Image Preview */}
                  {(currentMetadata.properties?.links?.banner || currentMetadata.properties?.banner) && (
                    <div className="w-full h-48 relative rounded-lg overflow-hidden border">
                      <Image
                        src={currentMetadata.properties?.links?.banner || currentMetadata.properties?.banner}
                        alt="Token cover image"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="flex gap-6">
                    {/* Logo Preview Section */}
                    <div className="flex-shrink-0">
                      {currentMetadata.image && (
                        <div className="relative w-48 h-48 rounded-lg overflow-hidden border">
                          <Image
                            src={currentMetadata.image}
                            alt="Current token logo"
                            width={192}
                            height={192}
                            className="rounded-lg object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {/* Metadata Details Section */}
                    <div className="flex-grow grid gap-2 text-sm">
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <span className="font-medium">Name:</span>
                        <span>{currentMetadata.name}</span>
                      </div>
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <span className="font-medium">Symbol:</span>
                        <span>{currentMetadata.symbol}</span>
                      </div>
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <span className="font-medium">Description:</span>
                        <span className="break-words">{currentMetadata.description}</span>
                      </div>
                      {currentMetadata.properties?.links && (
                        <div className="grid grid-cols-[100px_1fr] gap-2">
                          <span className="font-medium">Links:</span>
                          <div className="space-y-1">
                            {Object.entries(currentMetadata.properties.links).map(([key, value]) => (
                              key !== 'banner' && (
                                <div key={key} className="text-xs">
                                  {key}: {value as string}
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Basic metadata fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <FormField
                control={form.control}
                name="tokenName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Token Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter new token name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tokenSymbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Token Symbol</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter new token symbol" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter new token description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Token page settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Token Page Settings</h3>

              <FormField
                control={form.control}
                name="youtubePreview"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Featured Video</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://www.youtube.com/embed/..." 
                        {...field} 
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormDescription>
                      Use a YouTube embed URL (e.g., https://www.youtube.com/embed/VIDEO_ID)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={useCoverImageUrl ? "coverImageUrl" : "coverImage"}
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Cover Image</FormLabel>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-24 h-24 bg-muted rounded-lg overflow-hidden">
                        {coverImage && !useCoverImageUrl ? (
                          <Image
                            src={URL.createObjectURL(coverImage)}
                            alt="Cover image preview"
                            width={96}
                            height={96}
                            className="object-cover"
                          />
                        ) : (
                          <Upload className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={useCoverImageUrl} 
                              onCheckedChange={(checked) => {
                                form.setValue("useCoverImageUrl", checked)
                                if (checked) {
                                  form.setValue("coverImage", undefined)
                                } else {
                                  form.setValue("coverImageUrl", "")
                                }
                              }}
                            />
                            <label>Enter cover image URL</label>
                          </div>
                        </FormControl>
                        {useCoverImageUrl ? (
                          <Input
                            placeholder="https://"
                            {...field}
                            onChange={onChange}
                            value={(value as string) || ""}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    onChange(file)
                                  }
                                }}
                                className="hidden"
                                id="cover-image-upload"
                                {...field}
                                value=""
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full text-left font-normal"
                                onClick={() => document.getElementById('cover-image-upload')?.click()}
                              >
                                {coverImage ? (coverImage as File).name : "Choose file"}
                              </Button>
                            </div>
                            {coverImage && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="icon" 
                                onClick={() => onChange(undefined)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Social links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Social Links</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="example.com" 
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="twitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="twitter.com/yourusername" 
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telegram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telegram</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="t.me/yourchannel" 
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discord"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discord</FormLabel>
                      <FormControl>
                        <Input placeholder="https://discord.gg/..." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="youtube"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube Channel</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://youtube.com/@yourchannel" 
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medium"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medium</FormLabel>
                      <FormControl>
                        <Input placeholder="https://medium.com/..." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="github"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GitHub</FormLabel>
                      <FormControl>
                        <Input placeholder="https://github.com/..." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <Input placeholder="https://instagram.com/..." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reddit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reddit</FormLabel>
                      <FormControl>
                        <Input placeholder="https://reddit.com/..." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facebook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook</FormLabel>
                      <FormControl>
                        <Input placeholder="https://facebook.com/..." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold">Service Fee</h3>
                  <p className="text-sm text-muted-foreground">Required to update token metadata</p>
                </div>
                <div className="text-right">
                  {!isActive && (
                    <>
                      <div className="text-2xl font-bold">
                        0.1 SOL
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

            <ImmutableFeature 
              value={makeImmutable} 
              onChange={setMakeImmutable}
            />

            <Button 
              type="submit" 
              className="w-full py-6 text-xl font-semibold" 
              disabled={isUpdating || isLoading || !form.getValues().tokenAddress}
            >
              {isLoading ? "Updating Metadata..." : "Update Metadata"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function ImmutableFeature({ 
  value: makeImmutable, 
  onChange: setMakeImmutable 
}: { 
  value: boolean; 
  onChange: (value: boolean) => void;
}) {
  const [showDialog, setShowDialog] = useState(false);

  const handleSwitchChange = (checked: boolean) => {
    if (checked) {
      // Only show dialog when turning on
      setShowDialog(true);
    } else {
      // Directly turn off without dialog
      setMakeImmutable(false);
    }
  };

  return (
    <motion.div
      className={`flex flex-col rounded-lg border p-4 transition-all duration-300 ease-in-out ${
        makeImmutable ? "bg-gradient-to-r from-blue-50 to-blue-100" : "bg-white hover:bg-blue-50/50"
      }`}
      style={{
        boxShadow: makeImmutable
          ? "0 0 15px 2px rgba(59, 130, 246, 0.3)"
          : "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <FormLabel className="text-base font-semibold">Make Token Immutable</FormLabel>
          <FormDescription className="text-sm">
            Once enabled, the token's metadata can never be modified again
          </FormDescription>
        </div>
        <div className="flex flex-col items-end">
          <FormControl>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Switch 
                checked={makeImmutable} 
                onCheckedChange={handleSwitchChange}
              />
            </motion.div>
          </FormControl>
          <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Once you make the token immutable, 
                  you will never be able to update its metadata again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setShowDialog(false);
                  setMakeImmutable(false);
                }}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  setMakeImmutable(true);
                  setShowDialog(false);
                }}>
                  Yes, make immutable
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </motion.div>
  )
}

