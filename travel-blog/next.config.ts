import type { NextConfig } from "next";
import {
  buildContentSecurityPolicy,
  permissionsPolicyHeader,
  reportToHeader,
} from "./lib/security-headers";

const enableCrossOriginIsolation =
  process.env.NEXT_PUBLIC_ENABLE_CROSS_ORIGIN_ISOLATION === "true" ||
  process.env.ENABLE_COEP === "true";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    deviceSizes: [640, 768, 1024, 1280, 1440, 1920],
    imageSizes: [160, 320, 480, 640],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: "",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        port: "",
        pathname: "/vi/**",
      },
    ],
  },
  async headers() {
    const baseHeaders = [
      {
        key: "X-DNS-Prefetch-Control",
        value: "on",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      // frame-ancestors CSP (see lib/security-headers) controls embedding so Sanity preview can iframe the site.
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: permissionsPolicyHeader,
      },
      {
        key: "Content-Security-Policy",
        value: buildContentSecurityPolicy(),
      },
      {
        key: "Report-To",
        value: reportToHeader,
      },
    ];

    if (enableCrossOriginIsolation) {
      baseHeaders.push(
        {
          key: "Cross-Origin-Opener-Policy",
          value: "same-origin",
        },
        {
          key: "Cross-Origin-Embedder-Policy",
          value: "credentialless",
        },
        {
          key: "Cross-Origin-Resource-Policy",
          value: "same-origin",
        }
      );
    }

    return [
      {
        source: "/:path*",
        headers: baseHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "vlogizdrogi.pl",
          },
        ],
        destination: "https://www.vlogizdrogi.pl/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
