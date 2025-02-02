import { type Connection, type PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"

export async function sendSolPayment(
  connection: Connection,
  amount: number,
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
): Promise<string> {
  try {
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

    // This function doesn't sign or send the transaction.
    // It returns the transaction for the wallet to sign and send.
    return transaction.serialize({ requireAllSignatures: false }).toString("base64")
  } catch (error) {
    console.error("Error creating SOL payment transaction:", error)
    throw new Error("Failed to create SOL payment transaction")
  }
}

