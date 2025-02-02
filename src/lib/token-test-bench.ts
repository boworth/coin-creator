import { Connection, Keypair, PublicKey } from "@solana/web3.js"
import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js"
import type { SplTokenAmount } from "@metaplex-foundation/js"
import { WalletContextState } from "@solana/wallet-adapter-react"

export class TokenTestBench {
  private metaplex: Metaplex
  private connection: Connection
  private wallet: WalletContextState

  constructor(connection: Connection, wallet: WalletContextState, metaplex: Metaplex) {
    this.connection = connection
    this.wallet = wallet
    this.metaplex = metaplex.use(walletAdapterIdentity(wallet))
  }

  async createToken(metadata: {
    name: string
    symbol: string
    uri: string
    decimals: number
    initialSupply: number
  }) {
    return this.metaplex.tokens().createTokenWithMint({
      decimals: metadata.decimals,
      initialSupply: BigInt(metadata.initialSupply) as unknown as SplTokenAmount,
    })
  }
} 