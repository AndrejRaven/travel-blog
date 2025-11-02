import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: undefined, // Explicitly disable static export to allow API routes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/images/**',
      },
    ],
  },
};

export default nextConfig;
