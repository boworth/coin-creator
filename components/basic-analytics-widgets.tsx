"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface BasicAnalyticsWidgetsProps {
  totalInvested: number
  tokensAcquired: number
  averageBuyPrice: number
  timeElapsed: number
  transactions: number
  marketCap: number | null
}

export function BasicAnalyticsWidgets({
  totalInvested,
  tokensAcquired,
  averageBuyPrice,
  timeElapsed,
  transactions,
  marketCap,
}: BasicAnalyticsWidgetsProps) {
  const [solToUsd, setSolToUsd] = useState<number | null>(null)

  useEffect(() => {
    const fetchSolToUsd = async () => {
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd")
        const data = await response.json()
        setSolToUsd(data.solana.usd)
      } catch (error) {
        console.error("Error fetching SOL to USD price:", error)
        setSolToUsd(null)
      }
    }
    fetchSolToUsd()
    const interval = setInterval(fetchSolToUsd, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  }

  const marketCapPosition = marketCap ? (totalInvested * (solToUsd ?? 0)) / marketCap : null
  const positionValueSol = totalInvested * (1 + (marketCapPosition ?? 0))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Invested</div>
          <div className="text-2xl font-bold">{totalInvested.toFixed(2)} SOL</div>
          <div className="text-xs text-muted-foreground">
            ≈ {solToUsd ? formatUSD(totalInvested * solToUsd) : "---"}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Tokens Acquired</div>
          <div className="text-2xl font-bold">{tokensAcquired.toLocaleString()}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Average Buy Price</div>
          <div className="text-2xl font-bold">{averageBuyPrice.toFixed(6)} SOL</div>
          <div className="text-xs text-muted-foreground">
            ≈ {solToUsd ? formatUSD(averageBuyPrice * solToUsd) : "---"}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Time Elapsed</div>
          <div className="text-2xl font-bold">{formatTime(timeElapsed)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Transactions</div>
          <div className="text-2xl font-bold">{transactions}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Market Cap</div>
          <div className="text-2xl font-bold">{marketCap ? formatUSD(marketCap) : "N/A"}</div>
          <div className="text-xs text-muted-foreground">
            Position: {marketCapPosition ? (marketCapPosition * 100).toFixed(4) : "N/A"}%
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

