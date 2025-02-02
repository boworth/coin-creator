import { TokenTests } from "./token-tests"

export default function Page() {
  return (
    <div className="container mx-auto py-8">
      <TokenTests />
    </div>
  )
}

// Add metadata
export const metadata = {
  title: 'Token Tests',
  description: 'Test page for Solana token operations',
} 