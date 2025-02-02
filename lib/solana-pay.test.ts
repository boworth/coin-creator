import { Connection, PublicKey, Transaction } from "@solana/web3.js"
import { sendSolPayment } from "./solana-pay"

// Mock the Connection class
jest.mock("@solana/web3.js", () => {
  const original = jest.requireActual("@solana/web3.js")
  return {
    ...original,
    Connection: jest.fn().mockImplementation(() => ({
      getLatestBlockhash: jest.fn().mockResolvedValue({ blockhash: "mocked-blockhash" }),
    })),
  }
})

describe("sendSolPayment", () => {
  it("should create a valid SOL payment transaction", async () => {
    const connection = new Connection("http://localhost:8899")
    const amount = 1
    const fromPubkey = new PublicKey("11111111111111111111111111111111")
    const toPubkey = new PublicKey("22222222222222222222222222222222")

    const result = await sendSolPayment(connection, amount, fromPubkey, toPubkey)

    expect(result).toBeTruthy()
    expect(typeof result).toBe("string")

    // Deserialize and check the transaction
    const transaction = Transaction.from(Buffer.from(result, "base64"))
    expect(transaction.instructions.length).toBe(1)
    expect(transaction.recentBlockhash).toBe("mocked-blockhash")
    expect(transaction.feePayer?.equals(fromPubkey)).toBe(true)
  })

  it("should throw an error when connection fails", async () => {
    const connection = new Connection("http://localhost:8899")
    jest.spyOn(connection, "getLatestBlockhash").mockRejectedValue(new Error("Connection failed"))

    const amount = 1
    const fromPubkey = new PublicKey("11111111111111111111111111111111")
    const toPubkey = new PublicKey("22222222222222222222222222222222")

    await expect(sendSolPayment(connection, amount, fromPubkey, toPubkey)).rejects.toThrow(
      "Failed to create SOL payment transaction",
    )
  })
})

