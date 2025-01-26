/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    forceSwcTransforms: true
  },
  async headers() {
    return [
      {
        source: '/auth/callback',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/auth/callback',
        destination: '/auth/callback',
      },
    ];
  },
};

module.exports = nextConfig;
