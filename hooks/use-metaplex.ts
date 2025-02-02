"use client"

import { Metaplex } from "@metaplex-foundation/js"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useMemo } from "react"

export const useMetaplex = () => {
  const { connection } = useConnection()
  const wallet = useWallet()

  const mx = useMemo(() => {
    return Metaplex.make(connection)
      .use(walletAdapterIdentity(wallet))
  }, [connection, wallet])

  return mx
} 