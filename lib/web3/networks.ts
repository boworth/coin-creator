export const NETWORKS = [
  { id: "mainnet", name: "Mainnet", endpoint: "https://api.mainnet-beta.solana.com" },
  { id: "testnet", name: "Testnet", endpoint: "https://api.testnet.solana.com" },
  { id: "devnet", name: "Devnet", endpoint: "https://api.devnet.solana.com" },
] as const

export type Network = (typeof NETWORKS)[number]

