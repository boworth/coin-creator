/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Optimized for container deployments
  images: {
    domains: [
      // Add your image domains here
      'your-cdn-domain.com',
    ],
    formats: ['image/avif', 'image/webp'],
  },
  poweredByHeader: false, // Security best practice
  compress: true,
  reactStrictMode: true,
  swcMinify: true,
  // Add content security policies
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        'rpc-websockets': require.resolve('rpc-websockets'),
      }
    }
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
      layers: true
    }
    return config
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  }
}

module.exports = nextConfig 