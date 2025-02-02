"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { useMembership } from "@/contexts/membership-context"
import { AlertCircle, HelpCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BasicAnalyticsWidgets } from "@/components/basic-analytics-widgets"
import { DexscreenerChart } from "@/components/dexscreener-chart"
import { Switch } from "@/components/ui/switch"
import { DCABreakdown } from "@/components/dca-breakdown"
import { TermsOfService } from "@/components/terms-of-service"

// Estimated average Solana transaction fee in SOL
const ESTIMATED_SOL_FEE = 0.000005

export default function SmartDCAApp() {
  const { isActive } = useMembership()
  const router = useRouter()
  const [contractAddress, setContractAddress] = useState("")
  const [amount, setAmount] = useState(10)
  const [speed, setSpeed] = useState(50)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [marketCap, setMarketCap] = useState<number | null>(null)
  const [isMarketcapOptimized, setIsMarketcapOptimized] = useState(true)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [runningAnalytics, setRunningAnalytics] = useState({
    totalInvested: 0,
    tokensAcquired: 0,
    averageBuyPrice: 0,
    timeElapsed: 0,
    transactions: 0,
  })
  const [finalAnalytics, setFinalAnalytics] = useState({
    totalInvested: 0,
    tokensAcquired: 0,
    averageBuyPrice: 0,
    timeElapsed: 0,
    transactions: 0,
  })
  const [totalGasPaid, setTotalGasPaid] = useState(0)
  const [solToBeReturned, setSolToBeReturned] = useState(0)
  const [showTerms, setShowTerms] = useState(true)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isActive) {
      router.push("/membership")
    }
  }, [isActive, router])

  useEffect(() => {
    const fetchMarketCap = async () => {
      if (!contractAddress) {
        setMarketCap(null)
        return
      }

      try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`)
        const data = await response.json()

        if (data.pairs && data.pairs.length > 0) {
          const marketCapUsd = Number.parseFloat(data.pairs[0].fdv)
          setMarketCap(marketCapUsd)
        } else {
          setMarketCap(null)
        }
      } catch (error) {
        console.error("Error fetching market cap:", error)
        setMarketCap(null)
      }
    }

    fetchMarketCap()
  }, [contractAddress])

  const handleStart = () => {
    setIsRunning(true)
    setShowBreakdown(false)
    startTimeRef.current = Date.now()
    let invested = 0
    let tokens = 0
    let transactions = 0

    intervalRef.current = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          handleStop()
          return 100
        }

        const transactionAmount = amount * 0.01
        invested += transactionAmount
        const tokenPrice = (Math.random() * 0.1 + 0.9) * 0.001
        const tokensAcquired = transactionAmount / tokenPrice
        tokens += tokensAcquired
        transactions++

        setRunningAnalytics({
          totalInvested: invested,
          tokensAcquired: tokens,
          averageBuyPrice: invested / tokens,
          timeElapsed: Math.floor((Date.now() - (startTimeRef.current || 0)) / 1000),
          transactions: transactions,
        })

        return prevProgress + 1
      })
    }, 1000)
  }

  const handleStop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setIsRunning(false)
    setProgress(0)
    setShowBreakdown(true)
    setFinalAnalytics({ ...runningAnalytics })
    const totalGasPaid = runningAnalytics.transactions * ESTIMATED_SOL_FEE
    const solToBeReturned = amount - amount * 0.05 - runningAnalytics.totalInvested - totalGasPaid
    setTotalGasPaid(totalGasPaid)
    setSolToBeReturned(solToBeReturned)
    setRunningAnalytics({
      totalInvested: 0,
      tokensAcquired: 0,
      averageBuyPrice: 0,
      timeElapsed: 0,
      transactions: 0,
    })
    startTimeRef.current = null
  }

  const handleRetrieveTokens = () => {
    // Implement token retrieval logic here
    console.log("Retrieving tokens...")
    // You can add more logic here, such as updating state or calling a smart contract
  }

  const handleAcceptTerms = () => {
    setShowTerms(false)
    setTermsAccepted(true)
  }

  if (!isActive) {
    return null
  }

  if (!termsAccepted) {
    return <TermsOfService isOpen={showTerms} onAccept={handleAcceptTerms} />
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl mb-12 text-center text-gray-900">
        SmartDCA<span className="text-blue-600">.ai</span>
      </h1>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configure Your DCA Strategy</CardTitle>
              <CardDescription>Set up your Dollar Cost Averaging plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="contractAddress" className="text-sm font-semibold">
                    Token Contract Address
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="contractAddress"
                      value={contractAddress}
                      onChange={(e) => setContractAddress(e.target.value)}
                      placeholder="Enter token address"
                      className="flex-grow"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-500" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs p-2 text-xs bg-white/80 backdrop-blur-sm">
                          <p>Enter the Solana contract address of the token you want to accumulate.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div>
                  <Label htmlFor="amount" className="text-sm font-semibold">
                    Investment Amount (SOL)
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      min={0}
                      className="flex-grow"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-500" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs p-2 text-xs bg-white/80 backdrop-blur-sm">
                          <p>Enter the total amount of SOL you want to invest. Suggested minimum: 10 SOL</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Suggested minimum: 10 SOL</p>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Deployment Speed</Label>
                    <Switch checked={isMarketcapOptimized} onCheckedChange={setIsMarketcapOptimized} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-700">
                      {isMarketcapOptimized ? "Marketcap Optimized" : "Manual"}
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-500" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs p-2 text-xs bg-white/80 backdrop-blur-sm">
                          {isMarketcapOptimized ? (
                            <p>
                              AI-driven speed adjustment based on market cap and liquidity. The algorithm automatically
                              optimizes your investment strategy for the current market conditions.
                            </p>
                          ) : (
                            <p>
                              Manually set the speed of your investment deployment. Slower speeds may reduce market
                              impact, while faster speeds can capitalize on short-term opportunities.
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {!isMarketcapOptimized && (
                    <div className="mt-4">
                      <div className="flex items-center space-x-2">
                        <Slider
                          value={[speed]}
                          onValueChange={(value) => setSpeed(value[0])}
                          max={100}
                          step={1}
                          className="flex-grow"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Slower</span>
                        <span>Faster</span>
                      </div>
                    </div>
                  )}
                </div>
                {isRunning && (
                  <div>
                    <Label className="text-sm font-semibold">DCA Progress</Label>
                    <Progress value={progress} className="w-full" />
                    <p className="text-xs text-gray-500 mt-1">
                      {progress}% complete. Estimated time: {Math.ceil((100 - progress) / 10)} min
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Commission: 5% ({(amount * 0.05).toFixed(2)} SOL)</p>
                  {isRunning ? (
                    <Button onClick={handleStop} variant="destructive" className="w-full">
                      Stop DCA
                    </Button>
                  ) : (
                    <Button onClick={handleStart} disabled={!contractAddress || amount <= 0} className="w-full">
                      Start DCA
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <DCABreakdown
            isVisible={showBreakdown}
            {...finalAnalytics}
            totalGasPaid={totalGasPaid}
            solToBeReturned={solToBeReturned}
            onRetrieveTokens={handleRetrieveTokens}
          />
        </div>
        <div className="w-full lg:w-2/3 space-y-6">
          <BasicAnalyticsWidgets {...runningAnalytics} marketCap={marketCap} />
          <DexscreenerChart contractAddress={contractAddress} />
        </div>
      </div>
      <Alert className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important Notice</AlertTitle>
        <AlertDescription>
          SmartDCA.ai is designed for legitimate Dollar Cost Averaging strategies in low liquidity markets. It is not
          intended for price manipulation or any fraudulent trading practices. Users are responsible for ensuring their
          use of SmartDCA.ai complies with all applicable laws and regulations.
        </AlertDescription>
      </Alert>
    </div>
  )
}

