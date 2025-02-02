import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";

/**
 * RECEIVER_ADDRESS - The default Solana address to receive payments.
 * Replace this with your actual receiver address.
 */
export const RECEIVER_ADDRESS = "EnterYourReceiverAddressHere";

/**
 * sendSolPayment
 *
 * Sends SOL from the connected wallet to a receiver address.
 *
 * @param wallet - The wallet context state.
 * @param connection - The Solana network connection.
 * @param amount - The amount of SOL to send.
 * @param receiverAddress - (Optional) The receiver's public key. Defaults to RECEIVER_ADDRESS.
 * @returns The transaction signature.
 */
export async function sendSolPayment(
  wallet: WalletContextState,
  connection: Connection,
  amount: number,
  receiverAddress: string = RECEIVER_ADDRESS
): Promise<string> {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const lamports = Math.round(amount * LAMPORTS_PER_SOL);
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: new PublicKey(receiverAddress),
      lamports,
    })
  );

  const signature = await wallet.sendTransaction(transaction, connection);
  return signature;
} 