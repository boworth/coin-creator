"use client"

import { Metaplex, walletAdapterIdentity, guestIdentity } from "@metaplex-foundation/js"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { clusterApiUrl, Connection } from "@solana/web3.js"
import { useMemo, useCallback, createContext, useContext } from "react"

// Import wallet adapter CSS
require("@solana/wallet-adapter-react-ui/styles.css")

// Create Metaplex context
const MetaplexContext = createContext<Metaplex | null>(null)

export function useMetaplex() {
  const context = useContext(MetaplexContext)
  if (!context) {
    throw new Error('useMetaplex must be used within a MetaplexProvider')
  }
  return context
}

function MetaplexProvider({ connection, children }: { connection: Connection; children: React.ReactNode }) {
  const { wallet } = useWallet()
  
  const mx = useMemo(() => {
    const base = Metaplex.make(connection)
    return wallet?.adapter 
      ? base.use(walletAdapterIdentity(wallet.adapter))
      : base.use(guestIdentity()) // Add default identity if needed
  }, [connection, wallet])

  return (
    <MetaplexContext.Provider value={mx}>
      {children}
    </MetaplexContext.Provider>
  )
}

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

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={true}
        onError={onError}
        localStorageKey="wallet-type"
      >
        <WalletModalProvider>
          <MetaplexProvider connection={connection}>
            {children}
          </MetaplexProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

