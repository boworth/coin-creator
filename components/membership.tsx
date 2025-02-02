"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { loadStripe } from "@stripe/stripe-js"
import { useMembership } from "@/contexts/membership-context"
import { Check, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PaymentChoiceDialog } from "@/components/payment-choice-dialog"
import { motion } from "framer-motion"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { Connection, PublicKey } from "@solana/web3.js"
import { Spinner } from "@/components/ui/spinner"
import { membershipOptions } from "@/lib/membership-options"
import { MembershipService } from "@/services/membership-service"

type MembershipOption = keyof typeof membershipOptions;

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const LoadingDots = ({ className }: { className?: string }) => (
  <span className={`loading-dots inline-block w-[24px] text-left ${className}`}>
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

export const Membership = () => {
  const { isActive, timeRemaining = 0, isLoading, activateMembership } = useMembership()
  const [selectedOption, setSelectedOption] = useState<MembershipOption>("monthly")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const { toast } = useToast()
  const walletContext = useWallet()
  const { connection } = useConnection()
  const membershipService = new MembershipService(
    connection,
    walletContext
  )
  const [isActivating, setIsActivating] = useState(false)

  const handleMembershipActivation = () => {
    setIsPaymentDialogOpen(true)
  }

  const handlePaymentChoice = async (method: "sol" | "stripe") => {
    if (method === "stripe") {
      if (!walletContext.publicKey) {
        toast({
          title: "Error",
          description: "Please connect your wallet first",
          variant: "destructive",
        })
        return
      }

      console.log('Payment details:', {
        priceId: membershipOptions[selectedOption].stripePriceId,
        walletAddress: walletContext.publicKey.toBase58(),
        selectedOption,
      })

      setIsActivating(true)
      
      try {
        const stripe = await stripePromise
        const response = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            priceId: membershipOptions[selectedOption].stripePriceId,
            walletAddress: walletContext.publicKey.toBase58(),
          }),
        })
        const session = await response.json()
        if (session.error) {
          toast({
            title: "Payment Error",
            description: session.error.message,
            variant: "destructive",
          })
        } else {
          const result = await stripe!.redirectToCheckout({
            sessionId: session.id,
          })
          if (result.error) {
            toast({
              title: "Payment Error",
              description: result.error.message,
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        console.error("Error activating membership:", error)
        toast({
          title: "Error",
          description: "Failed to activate membership. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsActivating(false)
      }
    } else {
      setIsActivating(true)
      
      try {
        const result = await membershipService.purchaseWithSol(selectedOption)
        if (result.success) {
          const plan = membershipOptions[selectedOption]
          if (!plan) {
            throw new Error("Invalid plan selected")
          }

          activateMembership(plan.duration)
          
          toast({
            title: "Membership Activated",
            description: `Your ${selectedOption} membership is now active. All service fees are waived and SmartDCA.ai is now accessible!`,
            variant: "default",
          })

          setIsPaymentDialogOpen(false)
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to activate membership",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error activating membership:", error)
        toast({
          title: "Error",
          description: "Failed to activate membership. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsActivating(false)
      }
    }
  }

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const days = Math.floor(seconds / (24 * 60 * 60))
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((seconds % (60 * 60)) / 60)
    const remainingSeconds = seconds % 60
    return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`
  }

  const MembershipCard = ({ type }: { type: MembershipOption }) => (
    <Card 
        className={`w-full cursor-pointer transition-all duration-200 hover:border-primary/50 relative ${
            selectedOption === type ? "border-2 border-black" : ""
        }`}
        onClick={() => setSelectedOption(type)}
    >
        <div className={`relative ${selectedOption === type ? "z-10" : ""}`}>
            <CardHeader>
                <CardTitle>{type === "weekly" ? "Weekly" : "Monthly"} Membership</CardTitle>
                <CardDescription>
                    {type === "weekly" ? "7 days of premium benefits" : "30 days of premium benefits"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold mb-2 flex items-center">
                    {membershipOptions[type].solPrice} SOL
                    {type === "monthly" && (
                        <span className="text-base text-gray-500 ml-2 relative">
                            <span className="absolute left-0 top-1/2 w-full border-t-2 border-gray-500"></span>
                            {membershipOptions[type].originalSolPrice} SOL
                        </span>
                    )}
                </div>
                <div className="text-muted-foreground flex items-center">
                    ${membershipOptions[type].usdPrice}
                    {type === "monthly" && (
                        <span className="text-sm text-gray-500 ml-2 relative">
                            <span className="absolute left-0 top-1/2 w-full border-t-2 border-gray-500"></span>$
                            {membershipOptions[type].originalUsdPrice}
                        </span>
                    )}
                </div>
                {type === "monthly" && (
                    <Badge variant="secondary" className="mt-2">
                        Best Value
                    </Badge>
                )}
                <ul className="mt-4 space-y-2 text-sm">
                    <li className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        No service fees
                    </li>
                    <li className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        Access to SmartDCA.ai
                    </li>
                    <li className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        Premium support
                    </li>
                </ul>
            </CardContent>
        </div>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Loading Membership Status...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center p-4">
              <Spinner />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isActive ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Premium Membership
              <Badge variant="secondary">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium">Membership active</p>
              <p className="text-2xl font-bold">{formatTime(timeRemaining)}</p>
              <p className="text-sm text-muted-foreground">Time remaining</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <MembershipCard type="weekly" />
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <MembershipCard type="monthly" />
            </motion.div>
          </div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Did you know?</AlertTitle>
            <AlertDescription>
              On average, users spend 0.2 SOL in service fees to launch a token. Our monthly plan could save you money
              if you're planning multiple launches or updates! Plus, you get access to SmartDCA.ai for optimized token
              accumulation.
            </AlertDescription>
          </Alert>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleMembershipActivation}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-all duration-300 ease-out"
            >
              Activate {selectedOption === "weekly" ? "Weekly" : "Monthly"} Membership
            </Button>
          </motion.div>
        </>
      )}
      <PaymentChoiceDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        onActivate={handlePaymentChoice}
        solPrice={membershipOptions[selectedOption].solPrice}
        usdPrice={membershipOptions[selectedOption].usdPrice}
        isActivating={isActivating}
        LoadingDots={() => <LoadingDots />}
        priceId={membershipOptions[selectedOption].stripePriceId!}
        walletAddress={walletContext.publicKey?.toBase58() || ''}
        isWalletConnected={walletContext.connected}
      />
    </div>
  )
}

