import type { NextConfig } from 'next';

// Environment: apps/admin/.env.local is a symlink to the repository root
// .env.local (see supabase/README.md), so the hosted Supabase project is
// configured exactly once and Next's own env loading picks it up in every
// mode, including the Turbopack dev server.

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // The operations console must never be indexed.
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default nextConfig;
