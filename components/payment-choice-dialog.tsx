"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { Wallet, CreditCard } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { loadStripe } from "@stripe/stripe-js"
import { useSearchParams } from 'next/navigation'
import membershipService from '@/services/membership-service'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

interface PaymentChoiceDialogProps {
  isOpen: boolean
  onClose: () => void
  onActivate: (method: "sol" | "stripe") => void
  solPrice: number
  usdPrice: number
  isActivating: boolean
  LoadingDots: () => JSX.Element
  priceId: string
  walletAddress: string
  isWalletConnected: boolean
}

const Spinner = ({ className }: { className?: string }) => (
  <div className={`absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50 rounded-lg ${className}`}>
    <span className="spinner">
      <style jsx>{`
        .spinner {
          width: 68px;  /* Increased from 45px by ~50% */
          height: 68px; /* Increased from 45px by ~50% */
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3px;    /* Increased from 2px to maintain proportions */
        }
        
        .spinner > div {
          background-color: #3b82f6;
          animation: grid-animation 1.2s linear infinite;
        }
        
        .spinner > div:nth-child(1) { animation-delay: 0s; }
        .spinner > div:nth-child(2) { animation-delay: 0.1s; }
        .spinner > div:nth-child(3) { animation-delay: 0.2s; }
        .spinner > div:nth-child(4) { animation-delay: 0.3s; }
        .spinner > div:nth-child(5) { animation-delay: 0.4s; }
        .spinner > div:nth-child(6) { animation-delay: 0.5s; }
        .spinner > div:nth-child(7) { animation-delay: 0.6s; }
        .spinner > div:nth-child(8) { animation-delay: 0.7s; }
        .spinner > div:nth-child(9) { animation-delay: 0.8s; }

        @keyframes grid-animation {
          0%, 70%, 100% { 
            transform: scale3D(1, 1, 1);
            opacity: 0.8;
          }
          35% {
            transform: scale3D(0, 0, 1);
            opacity: 0.2;
          }
        }
      `}</style>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </span>
  </div>
);

// Use these test cards in Stripe's test mode:
const TEST_CARDS = [
  '4242 4242 4242 4242', // Successful payment
  '4000 0000 0000 3220', // 3D Secure required
  '4000 0000 0000 9995'  // Always declines
]

export function PaymentChoiceDialog({ 
  isOpen, 
  onClose, 
  onActivate, 
  solPrice, 
  usdPrice, 
  isActivating, 
  LoadingDots,
  priceId,
  walletAddress,
  isWalletConnected,
}: PaymentChoiceDialogProps) {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<"sol" | "stripe">("sol")
  const searchParams = useSearchParams()
  const sessionId = searchParams?.get('session_id')
  const [isMembershipActive, setIsMembershipActive] = useState(false)

  useEffect(() => {
    const validateSession = async () => {
      if (sessionId) {
        try {
          const session = await membershipService.checkStripeSession(sessionId)
          if (session.payment_status === 'paid') {
            setIsMembershipActive(true)
            // Optional: Trigger a global state update or refresh
          }
        } catch (error) {
          console.error('Session validation failed:', error)
        }
      }
    }
    
    validateSession()
  }, [sessionId])

  const handleStripePayment = async () => {
    try {
      setIsProcessing(true)
      
      // Add validation
      if (!priceId) {
        throw new Error('Price ID is missing')
      }
      if (!walletAddress) {
        throw new Error('Wallet address is missing')
      }

      console.log('Initiating payment with:', {
        priceId,
        selectedMethod,
        walletAddress,
        env: {
          weeklyPriceId: process.env.NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID,
          monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
        }
      })
      
      // 1. Validate session creation
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          walletAddress
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const session = await response.json()

      // 2. Validate session data
      if (!session?.id) {
        throw new Error("Invalid session data received")
      }

      // 3. Initialize Stripe
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error("Failed to initialize Stripe")
      }

      // 4. Redirect to checkout with error handling
      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
      })

      if (error) {
        throw new Error(error.message)
      }

    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Payment processing failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Modify the onActivate handler
  const handlePayment = async (method: "sol" | "stripe") => {
    if (method === "stripe") {
      await handleStripePayment()
    } else {
      onActivate(method)
    }
  }

  const PaymentButton = ({
    method,
    icon,
    label,
    price,
    originalPrice,
  }: {
    method: "sol" | "stripe"
    icon: React.ReactNode
    label: string
    price: string | number
    originalPrice?: string | number
  }) => (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full">
      <Button
        variant="outline"
        className={`w-full py-6 px-4 flex items-center justify-between ${
          selectedMethod === method
            ? "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-500"
            : "hover:bg-blue-50/50"
        }`}
        onClick={() => setSelectedMethod(method)}
      >
        <div className="flex items-center">
          {icon}
          <span className="ml-2 font-semibold">{label}</span>
        </div>
        <div className="flex items-center">
          <span className="font-bold">{price}</span>
          {originalPrice && (
            <span className="text-sm text-gray-500 ml-2 relative">
              <span className="absolute left-0 top-1/2 w-full border-t-2 border-gray-500"></span>
              {originalPrice}
            </span>
          )}
        </div>
      </Button>
    </motion.div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] relative fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
        {(isActivating || isProcessing) && <Spinner className="opacity-50" />}
        <div className={isActivating || isProcessing ? 'opacity-50 pointer-events-none' : ''}>
          <DialogHeader>
            <DialogTitle>Choose Payment Method</DialogTitle>
            <DialogDescription>Select how you'd like to pay for your membership</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <PaymentButton
              method="sol"
              icon={<Wallet className="h-5 w-5" />}
              label="Pay with SOL"
              price={`${solPrice} SOL`}
              originalPrice={solPrice === 3 ? "4 SOL" : undefined}
            />
            <PaymentButton
              method="stripe"
              icon={<CreditCard className="h-5 w-5" />}
              label="Pay with Card"
              price={`$${usdPrice}`}
              originalPrice={usdPrice === 849 ? "$1200" : undefined}
            />
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={onClose} disabled={isActivating || isProcessing}>
              Cancel
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => {
                  if (!isWalletConnected) {
                    toast({
                      title: "Wallet Required",
                      description: "Please connect your wallet to continue with the payment",
                      variant: "destructive",
                    })
                    return
                  }
                  handlePayment(selectedMethod)
                }}
                disabled={isActivating || isProcessing || (selectedMethod === "stripe" && !isWalletConnected)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-out"
              >
                {!isWalletConnected ? (
                  "Connect Wallet"
                ) : isProcessing ? (
                  <span className="flex items-center">
                    Processing<LoadingDots />
                  </span>
                ) : (
                  `Pay with ${selectedMethod === "sol" ? "SOL" : "Card"}`
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

