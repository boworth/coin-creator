/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }
    config.experiments = { ...config.experiments, topLevelAwait: true, bigIntLiteral: true }
    return config
  },
  env: {
    NEXT_PUBLIC_RECEIVER_WALLET_ADDRESS: process.env.NEXT_PUBLIC_RECEIVER_WALLET_ADDRESS,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
}

module.exports = nextConfig

