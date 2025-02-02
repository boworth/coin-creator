"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"

export function WalletConnect() {
  const { connected } = useWallet()

  return (
    <div className="flex items-center space-x-4">
      <WalletMultiButton />
    </div>
  )
}

