import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      {
        source: '/documentation',
        destination: '/docs',
        permanent: true,
      },
      {
        source: '/documentation/:path*',
        destination: '/docs/:path*',
        permanent: true,
      },
      {
        source: '/guide',
        destination: '/how-to-play',
        permanent: true,
      },
      {
        source: '/howtoplay',
        destination: '/how-to-play',
        permanent: true,
      },
      {
        source: '/docs/cat-battles',
        destination: '/docs/cat-battle',
        permanent: true,
      },
      {
        source: '/docs/gameplay-overview',
        destination: '/docs/game-overview',
        permanent: true,
      },
      {
        source: '/docs/wallet-and-access',
        destination: '/docs/access',
        permanent: true,
      },
      {
        source: '/docs/world-and-activities',
        destination: '/docs/activities',
        permanent: true,
      },
      {
        source: '/docs/materials-and-rarities',
        destination: '/docs/materials',
        permanent: true,
      },
      {
        source: '/docs/cats',
        destination: '/docs/cat',
        permanent: true,
      },
      {
        source: '/docs/time-and-utc',
        destination: '/docs/utc',
        permanent: true,
      },
      {
        source: '/docs/currency',
        destination: '/docs/economy',
        permanent: true,
      },
      {
        source: '/docs/token',
        destination: '/docs/fable',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
