import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  async headers() {
    return [
      {
        // Zastosuj nagłówki do wszystkich ścieżek
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: [
              'autoplay=*',
              'encrypted-media=*',
              'fullscreen=*',
              'accelerometer=*',
              'gyroscope=*',
              'clipboard-write=*',
              'clipboard-read=*',
            ].join(', '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
