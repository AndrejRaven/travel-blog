import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { createServerClient } from "@supabase/ssr";
import {
  buildContentSecurityPolicy,
  permissionsPolicyHeader,
  reportToHeader,
  reportingEndpointsHeader,
} from "./lib/security-headers";
import { getAllowedOrigin } from "./lib/origin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Odświeża sesję Supabase i zapisuje zaktualizowane tokeny w cookies response.
 * Dzięki temu Route Handlers i kolejne żądania widzą aktualną sesję (brak 401 przy wygasłym tokenie).
 */
async function updateSupabaseSession(request: NextRequest, response: NextResponse) {
  if (!supabaseUrl || !supabaseAnonKey) return;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const ADMIN_PATH = "/admin";
const ADMIN_LOGIN_PATH = "/admin/login";
const ENABLE_CROSS_ORIGIN_ISOLATION =
  process.env.NEXT_PUBLIC_ENABLE_CROSS_ORIGIN_ISOLATION === "true" ||
  process.env.ENABLE_COEP === "true";

const withSecurityHeaders = (response: NextResponse, csp: string) => {
  response.headers.set("Content-Security-Policy", csp);
  // frame-ancestors in CSP controls embedding so Sanity preview can iframe the app.
  response.headers.set("Permissions-Policy", permissionsPolicyHeader);
  if (ENABLE_CROSS_ORIGIN_ISOLATION) {
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Embedder-Policy", "credentialless");
    response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  } else {
    response.headers.delete("Cross-Origin-Opener-Policy");
    response.headers.delete("Cross-Origin-Embedder-Policy");
    response.headers.delete("Cross-Origin-Resource-Policy");
  }
  response.headers.set("Report-To", reportToHeader);
  response.headers.set("Reporting-Endpoints", reportingEndpointsHeader);
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("X-Content-Type-Options", "nosniff");
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
  const csp = buildContentSecurityPolicy();

  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api");
  const origin = request.headers.get("origin");
  const allowedOrigin = getAllowedOrigin(origin);

  if (isApiRoute && request.method === "OPTIONS") {
    // W development pozwól na localhost nawet jeśli nie jest na liście dozwolonych
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));
    const originToUse = allowedOrigin || (isDevelopment && isLocalhost ? origin : null);
    
    if (!origin || !originToUse) {
      return withSecurityHeaders(new NextResponse(null, { status: 403 }), csp);
    }

    const preflight = new NextResponse(null, { status: 204 });
    applyCorsHeaders(preflight, originToUse);
    preflight.headers.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    preflight.headers.set(
      "Access-Control-Allow-Headers",
      request.headers.get("access-control-request-headers") || "Content-Type"
    );
    preflight.headers.set("Access-Control-Max-Age", "600");
    return withSecurityHeaders(preflight, csp);
  }

  // Dla API routes: jeśli jest origin, musi być dozwolony
  // Ale pozwalamy na same-origin requests (brak origin header) w development
  if (isApiRoute && origin && !allowedOrigin) {
    // W development, jeśli origin to localhost, pozwól na request (może być problem z normalizacją)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));
    
    if (!isDevelopment || !isLocalhost) {
      return withSecurityHeaders(
        NextResponse.json({ error: "Origin not allowed" }, { status: 403 }),
        csp
      );
    }
  }
  let response: NextResponse;

  if (pathname.startsWith(ADMIN_PATH) && pathname !== ADMIN_LOGIN_PATH) {
    const token = request.cookies.get("admin-token")?.value;

    if (!token) {
      return withSecurityHeaders(
        NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url)),
        csp
      );
    }

    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return withSecurityHeaders(
          NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url)),
          csp
        );
      }
    } catch (error) {
      console.error("Middleware auth error:", error);
      return withSecurityHeaders(
        NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url)),
        csp
      );
    }
  }

  response = NextResponse.next();

  // Odśwież sesję Supabase tylko na ścieżkach wymagających auth – nie blokuj TTFB na stronach publicznych
  const needsSupabaseSession =
    isApiRoute ||
    pathname.startsWith("/profil") ||
    pathname.startsWith("/portfel-podrozniczy") ||
    pathname.startsWith("/logowanie") ||
    pathname.startsWith("/rejestracja");
  if (needsSupabaseSession) {
    await updateSupabaseSession(request, response);
  }

  if (isApiRoute && allowedOrigin) {
    applyCorsHeaders(response, allowedOrigin);
  }

  return withSecurityHeaders(response, csp);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)",
  ],
};


