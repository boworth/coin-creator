"use client"

import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { clusterApiUrl, Connection } from "@solana/web3.js"
import { useMemo, useCallback } from "react"

// Import wallet adapter CSS
require("@solana/wallet-adapter-react-ui/styles.css")

export function WalletProviders({ children }: { children: React.ReactNode }) {
  // Can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  
  // Initialize connection
  const connection = useMemo(
    () => new Connection(endpoint, 'confirmed'),
    [endpoint]
  )

  // Handle connection errors
  const onError = useCallback(
    (error: Error) => {
      console.error(error)
    },
    []
  )

  // Let WalletProvider use standard adapters
  const wallets = useMemo(
    () => [], // Empty array since we're using standard adapters
    []
  )

  // Initialize Metaplex
  const mx = useMemo(() => {
    return Metaplex.make(connection)
      .use(walletAdapterIdentity())
  }, [connection])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={true}
        onError={onError}
        localStorageKey="wallet-type"
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

