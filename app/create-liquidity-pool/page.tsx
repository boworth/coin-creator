import { LiquidityPoolCreator } from "@/components/liquidity-pool-creator"
import { AnimatedDescription } from "@/components/animated-description"

export default function CreateLiquidityPoolPage() {
  return (
    <div className="container py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-center">Create Raydium V3 Liquidity Pool</h1>
        <div className="h-12 mb-4">
          <AnimatedDescription
            text="Create and manage a new Raydium V3 liquidity pool for your Solana token. Pair your token with SOL, USDC, USDT, or RAY, set custom fee tiers, and easily add or remove liquidity."
            speed={30}
          />
          <p className="text-sm text-center text-muted-foreground mt-2">
            <a
              href="https://docs.raydium.io/raydium-v3/introduction"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Learn more about Raydium V3
            </a>
          </p>
        </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg mt-6">
          <LiquidityPoolCreator />
        </div>
      </div>
    </div>
  )
}

