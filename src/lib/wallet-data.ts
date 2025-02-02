// Add a Wallet interface and include an "id" property in each wallet object.
export interface Wallet {
  id: string;
  name: string;
  icon: string;
}

// Example wallet data. You can adjust this to your needs.
export const WALLETS: Wallet[] = [
  {
    id: "phantom",
    name: "Phantom",
    icon: "/icons/phantom.svg",
  },
  {
    id: "solflare",
    name: "Solflare",
    icon: "/icons/solflare.svg",
  },
  // Add more wallet definitions if needed.
]; 