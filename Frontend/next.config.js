/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['droppio.xyz', 'api.droppio.xyz'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/:path*`,
      },
    ];
  },
  // Webpack configuration to fix wagmi/MetaMask SDK warnings
  webpack: (config) => {
    // Fix for @react-native-async-storage/async-storage (MetaMask SDK)
    // This is a React Native package that's incorrectly imported in web builds
    // We tell webpack to ignore it since it's not needed for web
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    };

    return config;
  },
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  // SEO
  generateEtags: true,
};

module.exports = nextConfig;
