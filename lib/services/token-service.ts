import { MetadataTestBench } from "@/testbench/metadata-test-bench"
import { TokenTestBench } from "@/testbench/token-test-bench"
import { TokenBurnTestBench } from "@/testbench/token-burn-test-bench"
import { Connection, PublicKey } from "@solana/web3.js"
import { WalletContextState } from "@solana/wallet-adapter-react"
import { Metaplex } from "@metaplex-foundation/js"
import { walletAdapterIdentity } from "@metaplex-foundation/js"

export class TokenService {
  private static getMetaplex(connection: Connection, wallet: WalletContextState) {
    return Metaplex.make(connection)
      .use(walletAdapterIdentity(wallet))
  }

  static async createToken(connection: Connection, wallet: WalletContextState) {
    const mx = this.getMetaplex(connection, wallet)
    return new TokenTestBench(connection, wallet, mx)
  }

  static async manageMetadata(connection: Connection, wallet: WalletContextState) {
    const mx = this.getMetaplex(connection, wallet)
    return new MetadataTestBench(connection, wallet, mx)
  }

  static async burnTokens(connection: Connection, wallet: WalletContextState) {
    const mx = this.getMetaplex(connection, wallet)
    return new TokenBurnTestBench(connection, wallet, mx)
  }
} 