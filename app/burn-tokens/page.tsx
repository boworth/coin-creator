import { BurnToken } from "@/components/burn-token"
import { AnimatedDescription } from "@/components/animated-description"

export default function BurnTokensPage() {
  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-center">Burn Tokens</h1>
        <div className="h-12 mb-4">
          <AnimatedDescription
            text="Reduce the supply of your Solana token by burning a specified amount. Enter your token address and the number of tokens to burn."
            speed={30}
          />
        </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg mt-6">
          <BurnToken />
        </div>
      </div>
    </div>
  )
}

