"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface DexscreenerChartProps {
  contractAddress: string
}

export function DexscreenerChart({ contractAddress }: DexscreenerChartProps) {
  const [chartUrl, setChartUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDexscreenerData = async () => {
      if (!contractAddress) {
        setChartUrl(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()

        if (data.pairs && data.pairs.length > 0) {
          setChartUrl(`https://dexscreener.com/solana/${data.pairs[0].pairAddress}?embed=1&theme=dark&trades=0&info=0`)
        } else {
          setError("No trading pairs found for this token")
        }
      } catch (err) {
        setError("Failed to fetch chart data")
        console.error("Error fetching Dexscreener data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDexscreenerData()
  }, [contractAddress])

  if (isLoading) {
    return (
      <Card className="h-[600px] relative overflow-hidden">
        <CardContent className="p-0 h-full flex items-center justify-center">
          <Skeleton className="w-full h-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-[600px] relative overflow-hidden">
        <CardContent className="p-4 h-full flex items-center justify-center">
          <p className="text-center text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!chartUrl) {
    return (
      <Card className="h-[600px] relative overflow-hidden">
        <CardContent className="p-4 h-full flex items-center justify-center">
          <p className="text-center text-gray-500">Enter a valid contract address to view the chart</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-blue-500 rounded-lg filter blur-xl opacity-30 animate-pulse"></div>
      <Card className="h-[600px] relative overflow-hidden z-10">
        <CardContent className="p-0 h-full">
          <iframe src={chartUrl} className="w-full h-full rounded-lg" frameBorder="0" allowFullScreen />
        </CardContent>
      </Card>
    </div>
  )
}

