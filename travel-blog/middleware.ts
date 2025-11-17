import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  buildContentSecurityPolicy,
  permissionsPolicyHeader,
  reportToHeader,
  reportingEndpointsHeader,
} from "./lib/security-headers";
import { getAllowedOrigin } from "./lib/origin";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const ADMIN_PATH = "/admin";
const ADMIN_LOGIN_PATH = "/admin/login";

const createNonce = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const withSecurityHeaders = (
  response: NextResponse,
  nonce: string,
  csp: string
) => {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Permissions-Policy", permissionsPolicyHeader);
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Embedder-Policy", "credentialless");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Report-To", reportToHeader);
  response.headers.set("Reporting-Endpoints", reportingEndpointsHeader);
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return response;
};

const applyCorsHeaders = (response: NextResponse, origin: string | null) => {
  if (!origin) {
    return response;
  }

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.append("Vary", "Origin");
  return response;
};

export async function middleware(request: NextRequest) {
  const nonce = createNonce();
  const csp = buildContentSecurityPolicy().replace(/__CSP_NONCE__/g, nonce);
  const modifiedHeaders = new Headers(request.headers);
  modifiedHeaders.set("x-csp-nonce", nonce);
  modifiedHeaders.set("content-security-policy", csp);

  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api");
  const origin = request.headers.get("origin");
  const allowedOrigin = getAllowedOrigin(origin);

  if (isApiRoute && request.method === "OPTIONS") {
    if (!origin || !allowedOrigin) {
      return withSecurityHeaders(
        new NextResponse(null, { status: 403 }),
        nonce,
        csp
      );
    }

    const preflight = new NextResponse(null, { status: 204 });
    applyCorsHeaders(preflight, allowedOrigin);
    preflight.headers.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    preflight.headers.set(
      "Access-Control-Allow-Headers",
      request.headers.get("access-control-request-headers") || "Content-Type"
    );
    preflight.headers.set("Access-Control-Max-Age", "600");
    return withSecurityHeaders(preflight, nonce, csp);
  }

  if (isApiRoute && origin && !allowedOrigin) {
    return withSecurityHeaders(
      NextResponse.json({ error: "Origin not allowed" }, { status: 403 }),
      nonce,
      csp
    );
  }
  let response: NextResponse;

  if (pathname.startsWith(ADMIN_PATH) && pathname !== ADMIN_LOGIN_PATH) {
    const token = request.cookies.get("admin-token")?.value;

    if (!token) {
      return withSecurityHeaders(
        NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url)),
        nonce,
        csp
      );
    }

    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return withSecurityHeaders(
          NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url)),
          nonce,
          csp
        );
      }
    } catch (error) {
      console.error("Middleware auth error:", error);
      return withSecurityHeaders(
        NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url)),
        nonce,
        csp
      );
    }
  }

  response = NextResponse.next({
    request: {
      headers: modifiedHeaders,
    },
  });

  if (isApiRoute && allowedOrigin) {
    applyCorsHeaders(response, allowedOrigin);
  }

  return withSecurityHeaders(response, nonce, csp);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)",
  ],
};


