import { getSanityPreviewOrigins } from "./origin-helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.vlogizdrogi.pl";
const REPORT_ENDPOINT = "/api/csp-report";
const REPORTING_GROUP = "csp-endpoint";
const ENABLE_VERCEL_LIVE =
  process.env.VERCEL === "1" || process.env.ENABLE_VERCEL_LIVE === "true";
const ENABLE_VERCEL_ANALYTICS =
  process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === "true" ||
  process.env.VERCEL === "1";
const SANITY_PREVIEW_ORIGINS = getSanityPreviewOrigins();

export const buildContentSecurityPolicy = () => {
  const scriptSrc = [
    "'self'",
    "https://cdn.sanity.io",
    "https://vitals.vercel-insights.com",
    "'unsafe-inline'",
    "'unsafe-eval'",
  ];

  const styleSrc = ["'self'", "'unsafe-inline'"];
  const connectSrc = [
    "'self'",
    "https://cdn.sanity.io",
    "https://*.sanity.io",
    "wss://*.sanity.io",
    "https://connect.mailerlite.com",
    "https://vitals.vercel-insights.com",
    "https://www.youtube.com",
    "https://*.youtube.com",
    "https://*.googlevideo.com",
    "https://i.ytimg.com",
    "https://s.ytimg.com",
  ];
  const frameSrc = [
    "'self'",
    "https://www.youtube.com",
    "https://www.youtube-nocookie.com",
    "https://*.youtube.com",
    ...SANITY_PREVIEW_ORIGINS,
  ];
  const childSrc = [...frameSrc];
  const frameAncestors = ["'self'", ...SANITY_PREVIEW_ORIGINS];

  if (ENABLE_VERCEL_LIVE) {
    scriptSrc.push("https://vercel.live");
    connectSrc.push("https://vercel.live");
  }

  if (ENABLE_VERCEL_ANALYTICS) {
    scriptSrc.push("https://va.vercel-scripts.com");
    connectSrc.push("https://va.vercel-scripts.com");
  }

  connectSrc.push(...SANITY_PREVIEW_ORIGINS);

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "script-src-attr 'none'",
    `style-src ${styleSrc.join(" ")}`,
    "font-src 'self' data:",
    "img-src 'self' data: blob: https://cdn.sanity.io https://img.youtube.com https://i.ytimg.com https://s.ytimg.com https://yt3.ggpht.com",
    `connect-src ${connectSrc.join(" ")}`,
    `frame-src ${frameSrc.join(" ")}`,
    `child-src ${childSrc.join(" ")}`,
    "media-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://*.youtube.com https://*.googlevideo.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${frameAncestors.join(" ")}`,
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
    "report-uri /api/csp-report",
    "report-to csp-endpoint",
  ].join("; ");
};

export const permissionsPolicyHeader = [
  'accelerometer=(self "https://www.youtube.com")',
  'autoplay=(self "https://www.youtube.com")',
  'camera=()',
  'clipboard-read=()',
  'clipboard-write=(self "https://www.youtube.com")',
  'display-capture=()',
  'encrypted-media=(self "https://www.youtube.com")',
  'fullscreen=(self "https://www.youtube.com")',
  'geolocation=()',
  'gyroscope=(self "https://www.youtube.com")',
  'magnetometer=()',
  'microphone=()',
  'payment=()',
  'usb=()',
].join(", ");

export const reportToHeader = JSON.stringify({
  group: REPORTING_GROUP,
  max_age: 10886400,
  endpoints: [{ url: `${SITE_URL}${REPORT_ENDPOINT}` }],
  include_subdomains: true,
});

export const reportingEndpointsHeader = `${REPORTING_GROUP}="${SITE_URL}${REPORT_ENDPOINT}"`;

export const securityReporting = {
  SITE_URL,
  REPORT_ENDPOINT,
  REPORTING_GROUP,
};

