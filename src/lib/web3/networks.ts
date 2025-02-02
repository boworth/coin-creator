/**
 * This module provides a basic stub for network-related information.
 * Adjust the definitions as needed for your use case.
 */

export interface Network {
  id: string;
  name: string;
}

export const NETWORKS: Network[] = [
  { id: "mainnet", name: "Mainnet" },
  { id: "testnet", name: "Testnet" },
  { id: "devnet", name: "Devnet" },
]; 