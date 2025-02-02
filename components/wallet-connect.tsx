"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useEffect, useState } from "react"

export function WalletConnect() {
  const { connected, connecting, disconnecting } = useWallet()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => {
      // Cleanup on unmount
      setMounted(false)
    }
  }, [])

  // Handle connection status changes
  useEffect(() => {
    if (connecting) {
      console.log('Connecting to wallet...')
    }
    if (disconnecting) {
      console.log('Disconnecting from wallet...')
    }
    if (connected) {
      console.log('Wallet connected')
    }
  }, [connecting, disconnecting, connected])

  if (!mounted) return null

  return (
    <div className="wallet-connect">
      <WalletMultiButton />
    </div>
  )
}

