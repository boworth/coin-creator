import { type Connection, type PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"

export async function sendSolPayment(
  connection: Connection,
  amount: number,
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
): Promise<Transaction> {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: amount * LAMPORTS_PER_SOL,
    }),
  )

  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = fromPubkey

  return transaction
}

export const RECEIVER_ADDRESS = process.env.NEXT_PUBLIC_RECEIVER_WALLET_ADDRESS || ""

