import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface DCABreakdownProps {
  isVisible: boolean
  totalInvested: number
  tokensAcquired: number
  averageBuyPrice: number
  timeElapsed: number
  transactions: number
  totalGasPaid: number
  solToBeReturned: number
}

export function DCABreakdown({
  isVisible,
  totalInvested,
  tokensAcquired,
  averageBuyPrice,
  timeElapsed,
  transactions,
  totalGasPaid,
  solToBeReturned,
}: DCABreakdownProps) {
  const [solToUsd, setSolToUsd] = useState<number | null>(null)

  useEffect(() => {
    const fetchSolToUsd = async () => {
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd")
        const data = await response.json()
        setSolToUsd(data.solana.usd)
      } catch (error) {
        console.error("Error fetching SOL to USD price:", error)
      }
    }
    fetchSolToUsd()
  }, [])

  if (!isVisible) return null

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  }

  const formatSOL = (value: number) => `${value.toFixed(4)} SOL`
  const formatUSD = (value: number) => `$${(value * (solToUsd || 0)).toFixed(2)}`

  const handleRetrieveTokens = () => {
    // Implement token retrieval logic here
    console.log("Retrieving tokens...")
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>DCA Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Invested</p>
            <p className="text-2xl font-bold">{formatSOL(totalInvested)}</p>
            <p className="text-xs text-muted-foreground">{formatUSD(totalInvested)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tokens Acquired</p>
            <p className="text-2xl font-bold">{tokensAcquired.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Average Buy Price</p>
            <p className="text-2xl font-bold">{formatSOL(averageBuyPrice)}</p>
            <p className="text-xs text-muted-foreground">{formatUSD(averageBuyPrice)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Time Elapsed</p>
            <p className="text-2xl font-bold">{formatTime(timeElapsed)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
            <p className="text-2xl font-bold">{transactions}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Gas Paid</p>
            <p className="text-2xl font-bold">{formatSOL(totalGasPaid)}</p>
            <p className="text-xs text-muted-foreground">{formatUSD(totalGasPaid)}</p>
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-4 items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">SOL to be Returned</p>
              <p className="text-2xl font-bold">{formatSOL(solToBeReturned)}</p>
              <p className="text-xs text-muted-foreground">{formatUSD(solToBeReturned)}</p>
            </div>
            <div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleRetrieveTokens}
                  className="w-full py-2 text-sm font-semibold text-white transition-all duration-300 ease-out overflow-hidden create-token-btn"
                >
                  <span className="relative z-10">Retrieve Tokens</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

