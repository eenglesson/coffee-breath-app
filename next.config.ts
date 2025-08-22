import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable static optimization where possible
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Enable compression
  compress: true,

  // Optimize for production
  poweredByHeader: false,
};

export default nextConfig;
