const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.vlogizdrogi.pl";
const REPORT_ENDPOINT = "/api/csp-report";
const REPORTING_GROUP = "csp-endpoint";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const buildContentSecurityPolicy = () => {
  const scriptSrc = [
    "'self'",
    "https://cdn.sanity.io",
    "'nonce-__CSP_NONCE__'",
    "'strict-dynamic'",
    "https://vitals.vercel-insights.com",
  ];

  const styleSrc = ["'self'", "'nonce-__CSP_NONCE__'"];

  if (!IS_PRODUCTION) {
    scriptSrc.push("'unsafe-inline'", "'unsafe-eval'");
    styleSrc.push("'unsafe-inline'");
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "script-src-attr 'none'",
    `style-src ${styleSrc.join(" ")}`,
    "font-src 'self' data:",
    "img-src 'self' data: blob: https://cdn.sanity.io https://img.youtube.com https://i.ytimg.com",
    "connect-src 'self' https://cdn.sanity.io https://*.sanity.io https://connect.mailerlite.com https://vitals.vercel-insights.com",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
    "child-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
    "media-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
    "report-uri /api/csp-report",
    "report-to csp-endpoint",
  ].join("; ");
};

export const permissionsPolicyHeader = [
  'accelerometer=()',
  'autoplay=(self "https://www.youtube.com")',
  'camera=()',
  'clipboard-read=()',
  'clipboard-write=()',
  'display-capture=()',
  'encrypted-media=(self "https://www.youtube.com")',
  'fullscreen=(self "https://www.youtube.com")',
  'geolocation=()',
  'gyroscope=()',
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

