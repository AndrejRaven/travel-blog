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
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-inline/unsafe-eval dla theme script - do poprawy
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://cdn.sanity.io https://img.youtube.com https:",
              "font-src 'self' data:",
              "connect-src 'self' https://cdn.sanity.io https://*.sanity.io https://connect.mailerlite.com https://*.vercel-insights.com",
              "frame-src https://www.youtube.com https://youtube.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
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
