import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Sprawdź czy to route admin (ale nie login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("admin-token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      // Sprawdź czy token nie wygasł
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }

      // Token jest ważny, kontynuuj
      return NextResponse.next();
    } catch (error) {
      console.error("Middleware auth error:", error);
      // Token jest nieprawidłowy, przekieruj do logowania
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/komentarze/:path*",
    "/admin/((?!login$).*)",
  ],
};
