import { TokenCreator } from "@/components/token-creator"
import { AnimatedDescription } from "@/components/animated-description"
import { ErrorBoundary } from "react-error-boundary"
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Token | Solana Token Creator',
  description: 'Create and mint your own SPL Token without coding on Solana blockchain.'
}

export default function TokenCreatorPage() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <div className="min-h-screen">
        <main className="container py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl font-bold text-center">Solana Token Creator</h1>
            <div className="h-12 mb-4">
              <AnimatedDescription
                text="Easily create and mint your own SPL Token without coding. Customize with metadata, supply, and add logo. Try it out on Solana mainnet."
                speed={30}
              />
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <TokenCreator />
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}

