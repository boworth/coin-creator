"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFormContext } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Upload, X, CheckCircle, Search, ExternalLink } from "lucide-react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { Label } from "@/components/ui/label"
import { useMembership } from "@/contexts/membership-context"
import { Membership } from "@/components/membership"
import { TokenService } from "@/services/token-service"
import { ErrorBoundary } from "react-error-boundary"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { TokenCreationParams } from '@/services/token-service'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

const formSchema = z.object({
  tokenName: z.string()
    .min(1, "Token name is required")
    .max(30, "Token name must not be longer than 30 characters")
    .regex(/^[a-zA-Z0-9\s]+$/, "Token name can only contain letters, numbers, and spaces"),
  tokenSymbol: z
    .string()
    .min(1, "Token symbol is required")
    .max(10, "Token symbol must not be longer than 10 characters")
    .regex(/^[A-Z0-9]+$/, "Token symbol must be uppercase letters and numbers only"),
  decimals: z.number().min(0).max(9),
  supply: z.number().positive("Supply must be greater than 0"),
  description: z.string().optional(),
  logo: z.any().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  revokeMintAuthority: z.boolean().default(false),
  revokeFreezeAuthority: z.boolean().default(false),
})

const formatLargeNumber = (num: number) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009")
}

// Add this type if not already present
type PreviewImage = {
  src: string;
  file?: File;
};

// Add these types at the top of the file
interface ImageCropModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    onCropComplete: (croppedImage: File) => void;
    form: any;
}

// Update the createImage helper function
function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new window.Image(); // Use window.Image instead of Image
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous'); // Add this for CORS
        image.src = url;
    });
}

// Update the getCroppedImg function
async function getCroppedImg(
    imageSrc: string,
    pixelCrop: PixelCrop,
    fileName: string,
    imageRef: HTMLImageElement
): Promise<File> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    // Get scale factors between displayed image and natural size
    const scaleX = image.naturalWidth / imageRef.width;
    const scaleY = image.naturalHeight / imageRef.height;

    // Apply scaling to crop coordinates
    const actualCrop = {
        x: pixelCrop.x * scaleX,
        y: pixelCrop.y * scaleY,
        width: pixelCrop.width * scaleX,
        height: pixelCrop.height * scaleY
    };

    canvas.width = actualCrop.width;
    canvas.height = actualCrop.height;

    ctx.drawImage(
        image,
        actualCrop.x,
        actualCrop.y,
        actualCrop.width,
        actualCrop.height,
        0,
        0,
        actualCrop.width,
        actualCrop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                const file = new File([blob], fileName, {
                    type: 'image/png',
                    lastModified: Date.now(),
                });
                resolve(file);
            },
            'image/png',
            1
        );
    });
}

// Update the LoadingDots component
const LoadingDots = () => (
  <span className="loading-dots inline-block w-[24px] text-left">
    <style jsx>{`
      .loading-dots {
        text-align: left;
      }
      .loading-dots::after {
        content: '';
        animation: dots 1.30s steps(5, end) infinite;
        text-align: left;
      }

      @keyframes dots {
        0%, 20% { content: ''; margin-left: 0; }
        40% { content: '.'; margin-left: 0; }
        60% { content: '..'; margin-left: 0; }
        80%, 100% { content: '...'; margin-left: 0; }
      }
    `}</style>
  </span>
);

/**
 * TokenCreator Component
 * 
 * Main component for token creation interface.
 * Handles form state, image processing, and interaction with TokenService.
 * 
 * @component
 */
export function TokenCreator() {
  const { toast } = useToast()
  const { isActive } = useMembership()
  const [isCreating, setIsCreating] = useState(false)
  const { connection } = useConnection()
  const wallet = useWallet()
  const [useLogoUrl, setUseLogoUrl] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [tempImage, setTempImage] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 0,
    height: 0,
    x: 0,
    y: 0
  })
  const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [createdToken, setCreatedToken] = useState<{
    mintAddress: string;
    signature: string;
    verifications?: {
      mintAuthorityRevoked?: boolean;
      freezeAuthorityRevoked?: boolean;
    };
  } | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tokenName: "",
      tokenSymbol: "",
      decimals: 9,
      supply: 1000000000,
      description: "",
      logoUrl: "",
      revokeMintAuthority: false,
      revokeFreezeAuthority: false,
    },
    mode: "onChange",
  })

  const tokenName = form.watch("tokenName")
  const tokenSymbol = form.watch("tokenSymbol")

  const isButtonDisabled = () => {
    const hasRequiredFields = Boolean(tokenName && tokenSymbol)
    const notSubmitting = !isCreating
    const isWalletConnected = Boolean(wallet.connected)
    
    return !(hasRequiredFields && notSubmitting && isWalletConnected)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsCreating(true)
      console.log("Starting token creation with values:", values)

      // Check wallet connection
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error("Please connect your wallet first")
      }

      // Create token service instance
      const service = new TokenService(connection, wallet)
      
      // Map form values to TokenCreationParams
      const params: TokenCreationParams = {
        tokenName: values.tokenName,
        tokenSymbol: values.tokenSymbol,
        decimals: values.decimals,
        initialSupply: values.supply,
        description: values.description || undefined,
        logo: values.logo,
        // Map premium features explicitly
        revokeMintAuthority: Boolean(values.revokeMintAuthority),
        revokeFreezeAuthority: Boolean(values.revokeFreezeAuthority),
      }

      console.log("Premium features state:", {
        revokeMintAuthority: params.revokeMintAuthority,
        revokeFreezeAuthority: params.revokeFreezeAuthority,
      })

      // Show pending toast
      toast({
        title: "Creating Token",
        description: "Please approve the transaction in your wallet",
      })

      const result = await service.createToken(params)
      console.log("Token creation result:", result)

      if (result.success) {
        // Set the created token details
        setCreatedToken({
          mintAddress: result.mintAddress,
          signature: result.signature,
          verifications: result.verifications
        });
        // Show the success dialog
        setShowSuccessDialog(true);
      } else {
        throw new Error(result.error || "Token creation failed")
      }
    } catch (error) {
      console.error("Token creation error:", error)
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCropComplete = (croppedFile: File) => {
    setLogoFile(croppedFile);
    form.setValue('logo', croppedFile);
    const previewUrl = URL.createObjectURL(croppedFile);
    setPreviewImage({ src: previewUrl });
    setTempImage(null);
    setCropModalOpen(false);
  };

  const SuccessDialog = () => (
    <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-green-600">
            Token Created Successfully! 🎉
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Mint Address:</span>
              <code className="text-xs bg-background p-1 rounded">
                {createdToken?.mintAddress}
              </code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Transaction:</span>
              <code className="text-xs bg-background p-1 rounded">
                {createdToken?.signature.slice(0, 8)}...{createdToken?.signature.slice(-8)}
              </code>
            </div>
            {createdToken?.verifications && (
              <div className="space-y-1 mt-2">
                {createdToken.verifications.mintAuthorityRevoked && (
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mint Authority Revoked
                  </div>
                )}
                {createdToken.verifications.freezeAuthorityRevoked && (
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Freeze Authority Revoked
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Button
              className="w-full"
              variant="outline"
              asChild
            >
              <Link
                href={`https://explorer.solana.com/address/${createdToken?.mintAddress}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Search className="mr-2 h-4 w-4" />
                View Token on Explorer
              </Link>
            </Button>
            <Button
              className="w-full"
              variant="outline"
              asChild
            >
              <Link
                href={`https://explorer.solana.com/tx/${createdToken?.signature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Transaction
              </Link>
            </Button>
          </div>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button
            variant="secondary"
            onClick={() => {
              setShowSuccessDialog(false);
              // Reset form if needed
              form.reset();
              setPreviewImage(null);
              setLogoFile(null);
            }}
          >
            Create Another Token
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <ErrorBoundary fallback={<div>Error in Token Creator</div>}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Token Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault()
                  console.log("Form submission started")
                  
                  try {
                    // Get form values
                    const values = form.getValues()
                    console.log("Form values:", values)
                    
                    // Validate form with detailed error logging
                    const validationResult = await form.trigger(undefined, { shouldFocus: true })
                    const errors = form.formState.errors
                    console.log("Validation errors:", errors)
                    
                    // Filter out logoUrl validation error if it's empty
                    const relevantErrors = Object.entries(errors).filter(([field, error]) => {
                      if (field === 'logoUrl' && !values.logoUrl) return false
                      return true
                    })
                    
                    if (relevantErrors.length > 0) {
                      console.log("Form validation failed with errors:", relevantErrors)
                      // Show validation errors to user
                      relevantErrors.forEach(([field, error]) => {
                        toast({
                          variant: "destructive",
                          title: `Invalid ${field}`,
                          description: (error as { message?: string })?.message || "Invalid field value"
                        })
                      })
                      return
                    }
                    
                    // Call onSubmit if validation passes
                    await onSubmit(values)
                  } catch (error) {
                    console.error("Form submission error:", error)
                    toast({
                      variant: "destructive",
                      title: "Submission Error",
                      description: error instanceof Error ? error.message : "An error occurred"
                    })
                  }
                }} 
                className="space-y-6"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="tokenName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My awesome token" {...field} />
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
                        <FormLabel>Token Symbol</FormLabel>
                        <FormControl>
                          <Input placeholder="AWESOME" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="decimals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Decimals</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Change the number of decimals for your token</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="supply"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supply</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\s/g, "")
                            const numValue = Number.parseInt(value, 10)
                            if (!isNaN(numValue)) {
                              field.onChange(numValue)
                              e.target.value = formatLargeNumber(numValue)
                            }
                          }}
                          value={formatLargeNumber(field.value)}
                        />
                      </FormControl>
                      <FormDescription>The initial number of available tokens that will be created</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={useLogoUrl ? "logoUrl" : "logo"}
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Logo</FormLabel>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-24 h-24 bg-muted rounded-lg overflow-hidden">
                          {(!useLogoUrl && (previewImage?.src || logoFile)) ? (
                            <img
                                src={previewImage?.src || (logoFile ? URL.createObjectURL(logoFile) : '')}
                                alt="Token logo preview"
                                className="w-full h-full object-cover"
                            />
                          ) : (
                            <Upload className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Switch 
                                id="use-logo-url" 
                                checked={useLogoUrl} 
                                onCheckedChange={setUseLogoUrl} 
                              />
                              <label htmlFor="use-logo-url">Enter logo URL</label>
                            </div>
                          </FormControl>
                          {useLogoUrl ? (
                            <Input 
                              placeholder="https://" 
                              {...field} 
                              onChange={onChange} 
                              value={value as string} 
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <Input
                                  type="file"
                                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > MAX_FILE_SIZE) {
                                        toast({
                                          title: "Error",
                                          description: "File size must be less than 5MB",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      const imageUrl = URL.createObjectURL(file);
                                      setTempImage(imageUrl);
                                      setCropModalOpen(true);
                                    }
                                  }}
                                  className="hidden"
                                  id="logo-upload"
                                  {...field}
                                  value=""
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full text-left font-normal"
                                  onClick={() => document.getElementById('logo-upload')?.click()}
                                >
                                  {logoFile ? logoFile.name : "Choose file"}
                                </Button>
                              </div>
                              {logoFile && (
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => {
                                    setLogoFile(null);
                                    setPreviewImage(null);
                                    form.setValue('logo', undefined);
                                    if (previewImage?.src) {
                                        URL.revokeObjectURL(previewImage.src);
                                    }
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <FormDescription>Add logo for your token (will be cropped to square)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Here you can briefly describe your token" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Premium Features</h3>
                  <PremiumFeature
                    title="Revoke Mint Authority"
                    description="Prevent additional token supply to increase investors trust"
                    name="revokeMintAuthority"
                    isMembershipActive={isActive}
                  />
                  <PremiumFeature
                    title="Revoke Freeze Authority"
                    description="Prevent token freezing"
                    name="revokeFreezeAuthority"
                    isMembershipActive={isActive}
                  />
                </div>
                <Button
                  type="submit"
                  className={`w-full py-6 text-xl font-semibold text-white transition-all duration-300 ease-out overflow-hidden ${
                    isButtonDisabled() ? "bg-gray-400 cursor-not-allowed" : "create-token-btn"
                  }`}
                  disabled={isButtonDisabled()}
                >
                  <span className="relative z-10">
                    {!wallet.connected 
                      ? "Connect Wallet to Create Token"
                      : isCreating 
                        ? <span>Creating Token<LoadingDots /></span>
                        : "Create Token"}
                  </span>
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => {
          setCropModalOpen(false)
          setTempImage(null)
          form.setValue('logo', undefined)
        }}
        imageUrl={tempImage || ''}
        onCropComplete={handleCropComplete}
        form={form}
      />
      <SuccessDialog />
    </ErrorBoundary>
  )
}

/**
 * ImageCropModal Component
 * 
 * Handles image cropping functionality for token logos.
 * Maintains 1:1 aspect ratio and provides preview.
 * 
 * @component
 */
function ImageCropModal({ isOpen, onClose, imageUrl, onCropComplete, form }: ImageCropModalProps) {
    const imgRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>({ 
        unit: '%',
        width: 100,
        height: 100,
        x: 0,
        y: 0
    });
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const { toast } = useToast();

    // Add back the onImageLoad handler with proper 1:1 initialization
    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const size = Math.min(width, height);
        const x = (width - size) / 2;
        const y = (height - size) / 2;

        // Calculate the percentage values for the crop
        const cropPercentage = {
            unit: '%',
            width: (size / width) * 100,
            height: (size / height) * 100,
            x: (x / width) * 100,
            y: (y / height) * 100
        } as Crop;

        // Set both percentage-based crop and pixel-based completedCrop
        setCrop(cropPercentage);
        setCompletedCrop({
            unit: 'px',
            width: size,
            height: size,
            x: x,
            y: y
        });
    }, []);

    const handleCropComplete = useCallback(async () => {
        if (!completedCrop || !imgRef.current) {
            toast({
                title: "Error",
                description: "Please create a valid crop before proceeding",
                variant: "destructive",
            });
            return;
        }

        try {
            const croppedFile = await getCroppedImg(
                imageUrl,
                completedCrop,
                'token-logo.png',
                imgRef.current
            );
            onCropComplete(croppedFile);
        } catch (error) {
            console.error('Error cropping image:', error);
            toast({
                title: "Error",
                description: "Failed to crop image",
                variant: "destructive",
            });
        }
    }, [completedCrop, imageUrl, onCropComplete, toast]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Crop Logo Image</DialogTitle>
                    <DialogDescription>
                        Create a square crop for your token logo
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={1}
                        circularCrop={false}
                        minWidth={50}
                        keepSelection
                        ruleOfThirds
                    >
                        <img
                            ref={imgRef}
                            src={imageUrl}
                            alt="Crop preview"
                            style={{ maxWidth: '100%' }}
                            onLoad={onImageLoad}
                            crossOrigin="anonymous"
                        />
                    </ReactCrop>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => handleCropComplete()}
                        disabled={!completedCrop?.width || !completedCrop?.height}
                    >
                        Apply Crop
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * PremiumFeature Component
 * 
 * Renders premium feature toggle with description and pricing.
 * Handles membership status and feature activation.
 * 
 * @component
 */
function PremiumFeature({
  title,
  description,
  name,
  isMembershipActive,
}: {
  title: string
  description: string
  name: "revokeMintAuthority" | "revokeFreezeAuthority"
  isMembershipActive: boolean
}) {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <motion.div
          className={`flex flex-col rounded-lg border p-4 transition-all duration-300 ease-in-out ${
            field.value ? "bg-gradient-to-r from-blue-50 to-blue-100" : "bg-white hover:bg-blue-50/50"
          }`}
          style={{
            boxShadow: field.value
              ? "0 0 15px 2px rgba(59, 130, 246, 0.3)"
              : "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <FormLabel className="text-base font-semibold">{title}</FormLabel>
              <FormDescription className="text-sm">{description}</FormDescription>
            </div>
            <div className="flex flex-col items-end">
              <FormControl>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Switch 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                </motion.div>
              </FormControl>
              <div className="mt-1 text-sm font-mono text-gray-600">
                {isMembershipActive ? <span className="text-green-600">Free</span> : "Fee: 0.05 SOL"}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    />
  )
}

