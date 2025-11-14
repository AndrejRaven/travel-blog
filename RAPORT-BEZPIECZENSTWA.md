# Raport Bezpieczeństwa - Nasz Blog

**Data analizy:** 2025-01-27  
**Wersja projektu:** Next.js 15.4.2  
**Typ projektu:** Blog podróżniczy z Sanity CMS

---

## Executive Summary

Przeprowadzono kompleksową analizę bezpieczeństwa projektu Next.js blog. Zidentyfikowano **15 problemów bezpieczeństwa** w trzech kategoriach priorytetów:

- **Krytyczne (5):** Wymagają natychmiastowej naprawy
- **Wysokie (5):** Wymagają naprawy w najbliższym czasie
- **Średnie (5):** Wymagają naprawy w planowanym terminie

Dodatkowo zidentyfikowano **12 podatności w zależnościach** (10 moderate, 2 low).

---

## 1. Problemy Krytyczne (Priorytet 1)

### 1.1 Middleware wyłączony ⚠️ KRYTYCZNE

**Lokalizacja:** `travel-blog/middleware.ts.disabled`

**Opis problemu:**
Middleware odpowiedzialny za ochronę routes `/admin/*` jest wyłączony (plik ma rozszerzenie `.disabled`). Oznacza to, że wszystkie admin routes są dostępne bez weryfikacji tokenu JWT na poziomie middleware.

**Ryzyko:**

- Nieautoryzowany dostęp do panelu administracyjnego
- Możliwość manipulacji komentarzami bez logowania
- Brak ochrony przed atakami na endpointy admin

**Dowód:**

```4:5:travel-blog/middleware.ts.disabled
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
```

**Rekomendacja:**

1. Aktywować middleware: `middleware.ts.disabled` → `middleware.ts`
2. Usunąć fallback dla JWT_SECRET
3. Dodać walidację zmiennych środowiskowych przy starcie aplikacji

**Kod naprawczy:**

```typescript
// travel-blog/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Wymuszenie zmiennej środowiskowej - brak fallbacku
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("admin-token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }

      return NextResponse.next();
    } catch (error) {
      console.error("Middleware auth error:", error);
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/komentarze/:path*", "/admin/((?!login$).*)"],
};
```

---

### 1.2 Brak autoryzacji w API routes komentarzy admin ⚠️ KRYTYCZNE

**Lokalizacja:**

- `travel-blog/app/api/comments/admin/route.ts`
- `travel-blog/app/api/comments/[id]/route.ts`
- `travel-blog/app/api/comments/[id]/status/route.ts`
- `travel-blog/app/api/comments/bulk-status/route.ts`

**Opis problemu:**
Wszystkie endpointy API do zarządzania komentarzami (pobieranie, usuwanie, zmiana statusu) nie mają weryfikacji uprawnień administratora. Każdy może wywołać te endpointy bez autoryzacji.

**Ryzyko:**

- Nieautoryzowany dostęp do wszystkich komentarzy (w tym IP, email)
- Możliwość usuwania komentarzy przez nieuprawnione osoby
- Możliwość zmiany statusu komentarzy (approve/reject/spam)
- Naruszenie prywatności użytkowników (dostęp do emaili, IP)

**Dowód:**

```6:28:travel-blog/app/api/comments/admin/route.ts
export async function GET() {
  try {
    // Pobierz wszystkie komentarze z informacjami o postach
    const comments = await client.fetch(`
      *[_type == "comment"] | order(createdAt desc) {
        _id,
        author,
        content,
        createdAt,
        status,
        parentComment,
        ipAddress,
        userAgent,
        "post": post->{_id, title}
      }
    `);

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Błąd podczas pobierania komentarzy:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
```

**Rekomendacja:**
Dodać `requireAdmin()` na początku każdego handlera w tych plikach.

**Kod naprawczy:**

```typescript
// travel-blog/app/api/comments/admin/route.ts
import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Weryfikacja uprawnień admin
    await requireAdmin();

    const comments = await client.fetch(`
      *[_type == "comment"] | order(createdAt desc) {
        _id,
        author,
        content,
        createdAt,
        status,
        parentComment,
        ipAddress,
        userAgent,
        "post": post->{_id, title}
      }
    `);

    return NextResponse.json({ comments });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Błąd podczas pobierania komentarzy:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
```

```typescript
// travel-blog/app/api/comments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/sanity";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Weryfikacja uprawnień admin
    await requireAdmin();

    const { id } = await params;
    // ... reszta kodu
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ... reszta obsługi błędów
  }
}
```

Analogicznie dla:

- `travel-blog/app/api/comments/[id]/status/route.ts` - PATCH handler
- `travel-blog/app/api/comments/bulk-status/route.ts` - PATCH handler

---

### 1.3 JWT_SECRET z fallbackiem do wartości domyślnej ⚠️ KRYTYCZNE

**Lokalizacja:**

- `travel-blog/lib/auth.ts:4`
- `travel-blog/middleware.ts.disabled:5`

**Opis problemu:**
Kod używa hardcoded fallback dla JWT_SECRET: `"your-secret-key-change-this-in-production"`. Jeśli zmienna środowiskowa nie jest ustawiona, aplikacja używa tego samego sekretu, który może być znany atakującym.

**Ryzyko:**

- Możliwość podrobienia tokenów JWT jeśli sekret jest znany
- Nieautoryzowany dostęp do panelu administracyjnego
- Kompromitacja wszystkich sesji administratorów

**Dowód:**

```4:4:travel-blog/lib/auth.ts
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
```

**Rekomendacja:**
Usunąć wszystkie fallbacki i wymusić ustawienie zmiennych środowiskowych.

**Kod naprawczy:**

```typescript
// travel-blog/lib/auth.ts
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

// Wymuszenie zmiennej środowiskowej - brak fallbacku
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required. Please set it in your environment variables."
  );
}

// ... reszta kodu
```

Dodatkowo, utworzyć plik walidacji zmiennych środowiskowych:

```typescript
// travel-blog/lib/env-validation.ts
export function validateEnvVars() {
  const required = [
    "JWT_SECRET",
    "ADMIN_USERNAME",
    "ADMIN_PASSWORD",
    "NEXT_PUBLIC_SANITY_PROJECT_ID",
    "SANITY_VIEWER_TOKEN",
  ];

  const missing: string[] = [];

  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        `Please set them in your .env.local file or deployment environment.`
    );
  }
}

// Wywołać przy starcie aplikacji (w next.config.ts lub osobny plik)
```

---

### 1.4 Brak nagłówków bezpieczeństwa HTTP ⚠️ KRYTYCZNE

**Lokalizacja:** `travel-blog/next.config.ts`

**Opis problemu:**
Aplikacja nie ustawia kluczowych nagłówków bezpieczeństwa HTTP, które chronią przed różnymi atakami:

- Content-Security-Policy (CSP) - ochrona przed XSS
- X-Frame-Options - ochrona przed clickjacking
- X-Content-Type-Options - ochrona przed MIME sniffing
- Referrer-Policy - kontrola referrer
- Strict-Transport-Security (HSTS) - wymuszenie HTTPS

**Ryzyko:**

- Podatność na ataki XSS
- Możliwość osadzenia strony w iframe (clickjacking)
- MIME type confusion attacks
- Wyciek informacji przez referrer

**Dowód:**

```14:35:travel-blog/next.config.ts
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
```

**Rekomendacja:**
Dodać wszystkie wymagane nagłówki bezpieczeństwa.

**Kod naprawczy:**

```typescript
// travel-blog/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: "",
        pathname: "/images/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-inline/unsafe-eval dla theme script - do poprawy
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://cdn.sanity.io https:",
              "font-src 'self' data:",
              "connect-src 'self' https://cdn.sanity.io https://*.sanity.io https://connect.mailerlite.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          {
            key: "Permissions-Policy",
            value: [
              "autoplay=*",
              "encrypted-media=*",
              "fullscreen=*",
              "accelerometer=*",
              "gyroscope=*",
              "clipboard-write=*",
              "clipboard-read=*",
            ].join(", "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Uwaga:** CSP wymaga dostosowania do rzeczywistych potrzeb aplikacji. `unsafe-inline` i `unsafe-eval` powinny być usunięte po refaktoryzacji kodu theme script.

---

### 1.5 Użycie `dangerouslySetInnerHTML` bez sanitizacji ⚠️ KRYTYCZNE

**Lokalizacja:**

- `travel-blog/app/layout.tsx:60-78`
- `travel-blog/app/page.tsx:233, 237`
- `travel-blog/app/[superCategory]/[mainCategory]/[category]/[slug]/page.tsx:453, 457, 461`
- `travel-blog/components/sections/SupportSection.tsx:95`

**Opis problemu:**
Kod używa `dangerouslySetInnerHTML` w kilku miejscach bez odpowiedniej sanitizacji. W szczególności w `layout.tsx` jest używany do wstrzykiwania skryptu JavaScript, który może być podatny na XSS jeśli dane pochodzą z zewnętrznego źródła.

**Ryzyko:**

- Ataki XSS (Cross-Site Scripting)
- Wykonanie złośliwego kodu JavaScript
- Kradzież sesji i danych użytkowników

**Dowód:**

```60:78:travel-blog/app/layout.tsx
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') ||
                    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  // Fallback do light theme jeśli localStorage nie jest dostępny
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
```

**Rekomendacja:**

1. Dla skryptu theme w `layout.tsx` - przenieść do osobnego pliku `.js` i zaimportować
2. Dla JSON-LD - użyć biblioteki do sanitizacji lub walidacji JSON
3. Dla SVG w SupportSection - sanitizować SVG przed renderowaniem

**Kod naprawczy:**

1. **Theme script - przenieść do osobnego pliku:**

```typescript
// travel-blog/scripts/theme-init.js
(function () {
  try {
    const theme =
      localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch (e) {
    document.documentElement.classList.remove("dark");
  }
})();
```

```typescript
// travel-blog/app/layout.tsx
// Usunąć dangerouslySetInnerHTML i dodać:
<Script src="/scripts/theme-init.js" strategy="beforeInteractive" />
```

2. **JSON-LD - użyć walidacji:**

```typescript
// Funkcja pomocnicza do bezpiecznego renderowania JSON-LD
function safeJsonLd(data: unknown) {
  try {
    // Walidacja że to obiekt JSON
    const json = JSON.stringify(data);
    // Sprawdzenie że nie zawiera <script> tagów
    if (json.includes("<script") || json.includes("</script>")) {
      console.error("JSON-LD contains script tags");
      return null;
    }
    return json;
  } catch (e) {
    console.error("Invalid JSON-LD data", e);
    return null;
  }
}

// Użycie:
{
  safeJsonLd(articleJsonLd) && (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd)! }}
    />
  );
}
```

3. **SVG w SupportSection - sanitizować:**

```typescript
// travel-blog/lib/svg-sanitizer.ts
import DOMPurify from "isomorphic-dompurify";

export function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ALLOWED_TAGS: [
      "svg",
      "path",
      "circle",
      "rect",
      "line",
      "polyline",
      "polygon",
      "g",
    ],
    ALLOWED_ATTR: [
      "d",
      "fill",
      "stroke",
      "stroke-width",
      "viewBox",
      "width",
      "height",
      "x",
      "y",
      "cx",
      "cy",
      "r",
    ],
  });
}
```

---

## 2. Problemy Wysokie (Priorytet 2)

### 2.1 Brak rate limitingu ⚠️ WYSOKIE

**Lokalizacja:** Wszystkie API routes

**Opis problemu:**
Endpointy API nie mają ograniczeń częstotliwości żądań (rate limiting). To pozwala na:

- Spamowanie komentarzy
- Brute force ataki na endpoint logowania
- Spamowanie newslettera
- DoS (Denial of Service) ataki

**Ryzyko:**

- Przeciążenie serwera
- Spam w komentarzach i newsletterze
- Możliwość złamania hasła przez brute force
- Wysokie koszty infrastruktury

**Rekomendacja:**
Zaimplementować rate limiting używając biblioteki `@upstash/ratelimit` lub podobnej.

**Kod naprawczy:**

```typescript
// travel-blog/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Dla różnych endpointów różne limity
export const commentRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "5 m"), // 5 requestów na 5 minut
  analytics: true,
});

export const authRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 prób logowania na 15 minut
  analytics: true,
});

export const newsletterRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 h"), // 3 zapisy na godzinę
  analytics: true,
});

// Funkcja pomocnicza do użycia w API routes
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  return { success, limit, remaining, reset };
}
```

```typescript
// Przykład użycia w travel-blog/app/api/comments/route.ts
import { checkRateLimit, commentRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded
      ? forwarded.split(",")[0]
      : request.headers.get("x-real-ip") || "unknown";

    const rateLimitResult = await checkRateLimit(ipAddress, commentRateLimit);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Zbyt wiele żądań. Spróbuj ponownie później.",
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "Retry-After": Math.ceil(
              (rateLimitResult.reset - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // ... reszta kodu
  } catch (error) {
    // ...
  }
}
```

---

### 2.2 Brak sanitizacji HTML w komentarzach ⚠️ WYSOKIE

**Lokalizacja:**

- `travel-blog/app/api/comments/route.ts`
- `travel-blog/components/ui/CommentsSection.tsx:277`

**Opis problemu:**
Komentarze są zapisywane i wyświetlane bez sanitizacji HTML. Chociaż React automatycznie escapuje tekst, jeśli w przyszłości będzie możliwość formatowania (markdown, HTML), może to prowadzić do XSS.

**Ryzyko:**

- Ataki XSS jeśli komentarze będą renderowane jako HTML
- Możliwość wstrzyknięcia złośliwego kodu JavaScript

**Dowód:**

```277:279:travel-blog/components/ui/CommentsSection.tsx
      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
        {comment.content}
      </div>
```

**Rekomendacja:**

1. Sanitizować komentarze przed zapisem
2. Escapować HTML przy wyświetlaniu (React robi to automatycznie, ale warto to potwierdzić)
3. Jeśli w przyszłości będzie markdown - użyć bezpiecznej biblioteki

**Kod naprawczy:**

```typescript
// travel-blog/lib/sanitize.ts
import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizuje tekst komentarza - usuwa wszystkie tagi HTML
 * Jeśli w przyszłości będzie markdown, użyć bezpiecznej biblioteki
 */
export function sanitizeComment(content: string): string {
  // Usuń wszystkie tagi HTML - komentarze są tylko tekstem
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [], // Brak dozwolonych tagów - tylko tekst
    ALLOWED_ATTR: [],
  }).trim();
}
```

```typescript
// travel-blog/app/api/comments/route.ts
import { sanitizeComment } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { author, content, postId, parentComment } = body;

    // ... walidacja ...

    // Sanitizuj treść komentarza
    const sanitizedContent = sanitizeComment(content);

    // Sprawdź długość po sanitizacji
    if (sanitizedContent.length < 10) {
      return NextResponse.json({
        error: 'Komentarz musi mieć przynajmniej 10 znaków'
      }, { status: 400 });
    }

    // ... reszta kodu z użyciem sanitizedContent zamiast content
  }
}
```

---

### 2.3 Hardcoded wartości w kodzie ⚠️ WYSOKIE

**Lokalizacja:** `travel-blog/lib/sanity.ts:4-5`

**Opis problemu:**
Sanity project ID i dataset są hardcoded w kodzie zamiast używać zmiennych środowiskowych.

**Ryzyko:**

- Trudność w zarządzaniu różnymi środowiskami (dev, staging, prod)
- Możliwość przypadkowego użycia niewłaściwego projektu
- Brak elastyczności konfiguracji

**Dowód:**

```4:5:travel-blog/lib/sanity.ts
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "k5fsny25";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
```

**Rekomendacja:**
Usunąć fallbacki i wymusić ustawienie zmiennych środowiskowych.

**Kod naprawczy:**

```typescript
// travel-blog/lib/sanity.ts
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";

if (!projectId) {
  throw new Error(
    "NEXT_PUBLIC_SANITY_PROJECT_ID environment variable is required"
  );
}

if (!dataset) {
  throw new Error(
    "NEXT_PUBLIC_SANITY_DATASET environment variable is required"
  );
}

// ... reszta kodu
```

---

### 2.4 Brak walidacji path traversal w downloads ⚠️ WYSOKIE

**Lokalizacja:** `travel-blog/app/api/downloads/[filename]/route.ts`

**Opis problemu:**
Endpoint pobierania plików nie waliduje ścieżek przed dostępem. Możliwe jest użycie `../` do dostępu do plików spoza dozwolonego katalogu (path traversal).

**Ryzyko:**

- Dostęp do wrażliwych plików systemowych
- Wyciek danych konfiguracyjnych
- Możliwość odczytu plików `.env`

**Dowód:**

```13:13:travel-blog/app/api/downloads/[filename]/route.ts
    const fileIdOrName = decodeURIComponent(resolvedParams.filename);
```

**Rekomendacja:**
Walidować i normalizować ścieżki, używać whitelist dozwolonych wartości.

**Kod naprawczy:**

```typescript
// travel-blog/app/api/downloads/[filename]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readOnlyClient } from "@/lib/sanity";
import path from "path";

export const dynamic = "force-dynamic";

// Funkcja do walidacji i normalizacji nazwy pliku
function validateFilename(filename: string): string | null {
  // Decode URI component
  const decoded = decodeURIComponent(filename);

  // Sprawdź czy zawiera niebezpieczne znaki
  if (
    decoded.includes("..") ||
    decoded.includes("/") ||
    decoded.includes("\\")
  ) {
    return null; // Path traversal attempt
  }

  // Sprawdź długość
  if (decoded.length > 255) {
    return null; // Za długa nazwa
  }

  // Sprawdź czy zawiera tylko dozwolone znaki (opcjonalnie)
  // const allowedPattern = /^[a-zA-Z0-9._-]+$/;
  // if (!allowedPattern.test(decoded)) {
  //   return null;
  // }

  return decoded;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const resolvedParams = await params;

    // Waliduj nazwę pliku
    const fileIdOrName = validateFilename(resolvedParams.filename);
    if (!fileIdOrName) {
      return NextResponse.json(
        { error: "Nieprawidłowa nazwa pliku" },
        { status: 400 }
      );
    }

    // ... reszta kodu
  } catch (error) {
    // ...
  }
}
```

---

### 2.5 Brak CSRF protection ⚠️ WYSOKIE

**Lokalizacja:** Wszystkie API routes z operacjami modyfikującymi dane

**Opis problemu:**
API endpoints nie mają ochrony przed CSRF (Cross-Site Request Forgery). Atakujący może wykonać żądania modyfikujące dane w imieniu zalogowanego użytkownika.

**Ryzyko:**

- Nieautoryzowane modyfikacje danych
- Możliwość zmiany statusu komentarzy przez atakującego
- Możliwość usunięcia komentarzy

**Rekomendacja:**
Zaimplementować tokeny CSRF dla operacji modyfikujących dane.

**Kod naprawczy:**

```typescript
// travel-blog/lib/csrf.ts
import { cookies } from "next/headers";
import crypto from "crypto";

const CSRF_SECRET =
  process.env.CSRF_SECRET || crypto.randomBytes(32).toString("hex");
const CSRF_TOKEN_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

export async function generateCsrfToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const cookieStore = await cookies();

  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 godziny
    path: "/",
  });

  return token;
}

export async function verifyCsrfToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return false;
  }

  return cookieToken === headerToken;
}
```

```typescript
// Przykład użycia w API route
import { verifyCsrfToken } from "@/lib/csrf";

export async function PATCH(request: NextRequest) {
  // Weryfikuj CSRF tylko dla operacji modyfikujących
  if (!(await verifyCsrfToken(request))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  // ... reszta kodu
}
```

---

## 3. Problemy Średnie (Priorytet 3)

### 3.1 Brak walidacji długości dla niektórych pól ⚠️ ŚREDNIE

**Lokalizacja:**

- `travel-blog/app/api/comments/route.ts`
- `travel-blog/app/api/newsletter/subscribe/route.ts`

**Opis problemu:**
Niektóre pola mają ograniczoną walidację długości:

- Email jest sprawdzany tylko czy nie przekracza 255 znaków, ale brakuje walidacji minimalnej długości (np. minimum 5 znaków: `a@b.c`)
- Newsletter endpoint nie waliduje długości emaila w ogóle
- Brak walidacji formatu emaila w newsletter (tylko sprawdzenie czy to string)

**Ryzyko:**

- Możliwość zapisania nieprawidłowych danych
- Potencjalne problemy z bazą danych przy bardzo długich wartościach
- Możliwość wykorzystania błędów walidacji do ataków

**Dowód:**

```7:14:travel-blog/app/api/newsletter/subscribe/route.ts
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Adres e-mail jest wymagany." },
        { status: 400 }
      );
    }
```

**Rekomendacja:**
Rozszerzyć walidację wszystkich pól wejściowych z użyciem wspólnej funkcji walidacji.

**Kod naprawczy:**

```typescript
// travel-blog/lib/validation.ts
export function validateEmail(email: string): {
  valid: boolean;
  error?: string;
} {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email jest wymagany" };
  }

  const trimmed = email.trim();

  // Minimalna długość (a@b.c = 5 znaków)
  if (trimmed.length < 5) {
    return { valid: false, error: "Email jest za krótki" };
  }

  // Maksymalna długość (RFC 5321)
  if (trimmed.length > 254) {
    return { valid: false, error: "Email jest za długi" };
  }

  // Walidacja formatu
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Nieprawidłowy format email" };
  }

  return { valid: true };
}
```

```typescript
// travel-blog/app/api/newsletter/subscribe/route.ts
import { validateEmail } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { success: false, message: emailValidation.error },
        { status: 400 }
      );
    }

    // ... reszta kodu
  }
}
```

---

### 3.2 Debug logging w production ⚠️ ŚREDNIE

**Lokalizacja:** `travel-blog/app/api/admin/auth/route.ts`

**Opis problemu:**
Kod loguje szczegółowe informacje w development mode. Chociaż jest warunek `NODE_ENV !== 'production'`, warto upewnić się, że:

1. W production nie loguje się żadnych wrażliwych danych
2. Logowanie błędów nie ujawnia struktury systemu
3. Używane są odpowiednie poziomy logowania

**Ryzyko:**

- Wyciek informacji o strukturze systemu przez logi
- Możliwość identyfikacji użytkowników przez logi
- Problemy z compliance (GDPR) jeśli logowane są dane osobowe

**Dowód:**

```81:90:travel-blog/app/api/admin/auth/route.ts
      if (process.env.NODE_ENV !== 'production') {
        console.log('[AUTH DEBUG] Login attempt failed:', {
          inputUsernameLength: trimmedInputUsername.length,
          inputPasswordLength: trimmedInputPassword.length,
          envUsernameLength: envUsername.length,
          envPasswordLength: envPassword.length,
          usernameMatch,
          passwordMatch
        });
      }
```

**Rekomendacja:**
Użyć biblioteki logowania z poziomami (info, warn, error) i upewnić się, że w production logowane są tylko błędy bez wrażliwych danych.

**Kod naprawczy:**

```typescript
// travel-blog/lib/logger.ts
type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private isDevelopment = process.env.NODE_ENV !== "production";

  private log(level: LogLevel, message: string, data?: unknown) {
    if (level === "debug" && !this.isDevelopment) {
      return; // Nie loguj debug w production
    }

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case "error":
        console.error(logMessage, data);
        break;
      case "warn":
        console.warn(logMessage, data);
        break;
      case "info":
        if (this.isDevelopment) {
          console.log(logMessage, data);
        }
        break;
      case "debug":
        if (this.isDevelopment) {
          console.log(logMessage, data);
        }
        break;
    }
  }

  debug(message: string, data?: unknown) {
    this.log("debug", message, data);
  }

  info(message: string, data?: unknown) {
    this.log("info", message, data);
  }

  warn(message: string, data?: unknown) {
    this.log("warn", message, data);
  }

  error(message: string, error?: unknown) {
    // Nie loguj pełnych błędów w production - tylko podstawowe info
    const safeError = this.isDevelopment
      ? error
      : error instanceof Error
      ? { message: error.message, name: error.name }
      : "Unknown error";

    this.log("error", message, safeError);
  }
}

export const logger = new Logger();
```

```typescript
// Przykład użycia w travel-blog/app/api/admin/auth/route.ts
import { logger } from "@/lib/logger";

// Zamiast console.log użyj:
logger.debug("Login attempt failed", {
  inputUsernameLength: trimmedInputUsername.length,
  // NIE loguj passwordLength, envPasswordLength, usernameMatch, passwordMatch
});
```

---

### 3.3 Brak walidacji typów dla Sanity queries ⚠️ ŚREDNIE

**Lokalizacja:**

- `travel-blog/lib/sanity.ts`
- `travel-blog/lib/queries/`
- `travel-blog/app/api/comments/route.ts`

**Opis problemu:**
Groq queries używają parametrów, ale brakuje runtime walidacji typów i wartości. Sanity ma wbudowaną ochronę przed injection przez parametryzowane zapytania, ale warto:

1. Walidować typy parametrów przed użyciem w query
2. Sprawdzać czy parametry nie zawierają niebezpiecznych wartości
3. Upewnić się, że wszystkie user inputs są parametryzowane (nie interpolowane)

**Ryzyko:**

- Możliwość błędów runtime przy nieprawidłowych parametrach
- Potencjalne problemy z wydajnością przy bardzo długich parametrach
- Trudność w debugowaniu błędów zapytań

**Dowód:**

```34:44:travel-blog/app/api/comments/route.ts
    const comments = await readOnlyClient.fetch(`
      *[_type == "comment" && post._ref == $postId] | order(createdAt asc) {
        _id,
        author,
        content,
        createdAt,
        status,
        parentComment,
        "post": post->{_id, title}
      }
    `, { postId });
```

**Rekomendacja:**
Dodać runtime walidację parametrów zapytań przed użyciem.

**Kod naprawczy:**

```typescript
// travel-blog/lib/sanity-validation.ts
export function validateSanityId(id: string): boolean {
  // Sanity IDs mają określony format
  if (!id || typeof id !== "string") {
    return false;
  }

  // Sprawdź długość (Sanity IDs są zwykle 20-40 znaków)
  if (id.length < 10 || id.length > 100) {
    return false;
  }

  // Sprawdź czy nie zawiera niebezpiecznych znaków
  if (/[<>\"'%;()&+]/.test(id)) {
    return false;
  }

  return true;
}

export function validateSanityParams(params: Record<string, unknown>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      errors.push(`Parameter ${key} is null or undefined`);
      continue;
    }

    // Walidacja ID
    if (key.endsWith("Id") || key.endsWith("_id") || key === "id") {
      if (typeof value !== "string" || !validateSanityId(value)) {
        errors.push(`Parameter ${key} is not a valid Sanity ID`);
      }
    }

    // Walidacja stringów
    if (typeof value === "string") {
      if (value.length > 1000) {
        errors.push(`Parameter ${key} is too long (max 1000 characters)`);
      }
    }

    // Walidacja arrayów
    if (Array.isArray(value)) {
      if (value.length > 100) {
        errors.push(`Parameter ${key} array is too long (max 100 items)`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

```typescript
// Przykład użycia
import { validateSanityParams } from "@/lib/sanity-validation";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json({ error: "Brak ID posta" }, { status: 400 });
  }

  // Waliduj parametry przed użyciem
  const validation = validateSanityParams({ postId });
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Nieprawidłowe parametry", details: validation.errors },
      { status: 400 }
    );
  }

  // Teraz bezpiecznie użyj w query
  const comments = await readOnlyClient.fetch(
    `
    *[_type == "comment" && post._ref == $postId] | order(createdAt asc) {
      // ...
    }
  `,
    { postId }
  );
}
```

---

### 3.4 Brak ochrony przed timing attacks

**Lokalizacja:** `travel-blog/app/api/admin/auth/route.ts:76-77`

**Opis problemu:**
Porównywanie haseł używa prostego `===`, co może ujawniać informacje przez timing attacks.

**Rekomendacja:**
Użyć `crypto.timingSafeEqual()` dla porównań haseł.

**Kod naprawczy:**

```typescript
import crypto from "crypto";

// Porównaj hasła w sposób odporny na timing attacks
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");

  return crypto.timingSafeEqual(bufferA, bufferB);
}

// Użycie:
const passwordMatch = secureCompare(trimmedInputPassword, envPassword);
```

---

### 3.5 Brak monitoringu i alertów

**Opis problemu:**
Brak systemu monitoringu i alertów dla podejrzanych aktywności (nieudane logowania, rate limiting, błędy autoryzacji).

**Rekomendacja:**
Zaimplementować logowanie podejrzanych aktywności i alerty (np. przez Sentry, LogRocket, lub własne rozwiązanie).

---

## 4. Podatności w Zależnościach

### 4.1 Next.js - 3 podatności moderate

**Wersja:** 15.4.2  
**Zalecana wersja:** 15.5.6

**Podatności:**

1. **GHSA-g5qg-72qw-gw5v** - Cache Key Confusion for Image Optimization API Routes (CVSS 6.2)
2. **GHSA-xv57-4mr9-wg8v** - Content Injection Vulnerability for Image Optimization (CVSS 4.3)
3. **GHSA-4342-x723-ch2f** - Improper Middleware Redirect Handling Leads to SSRF (CVSS 6.5)

**Rekomendacja:**

```bash
npm update next@15.5.6
```

### 4.2 next-sanity i zależności - 7 podatności moderate

**Wersja:** 9.12.3  
**Zalecana wersja:** 0.8.5 (breaking change - wymaga migracji)

**Podatności:**

- @sanity/ui - DOM Clobbering przez react-refractor/prismjs
- next-sanity - zależne od @sanity/ui

**Rekomendacja:**
Sprawdzić czy aktualizacja jest możliwa bez breaking changes. Jeśli nie, monitorować i czekać na poprawkę w nowszej wersji.

### 4.3 Inne podatności

- **@eslint/plugin-kit** - ReDoS (low)
- **min-document** - Prototype pollution (low)
- **vite** - Path traversal (moderate, tylko w dev dependencies)

**Rekomendacja:**

```bash
npm audit fix
```

---

## 5. Checklist Wdrożenia Poprawek

### Faza 1: Krytyczne (Natychmiast)

- [ ] Aktywować middleware (`middleware.ts.disabled` → `middleware.ts`)
- [ ] Usunąć fallbacki dla JWT_SECRET w `lib/auth.ts` i middleware
- [ ] Dodać `requireAdmin()` do wszystkich admin API routes:
  - [ ] `/api/comments/admin/route.ts`
  - [ ] `/api/comments/[id]/route.ts` (DELETE)
  - [ ] `/api/comments/[id]/status/route.ts` (PATCH)
  - [ ] `/api/comments/bulk-status/route.ts` (PATCH)
- [ ] Dodać nagłówki bezpieczeństwa HTTP w `next.config.ts`
- [ ] Przenieść theme script z `dangerouslySetInnerHTML` do osobnego pliku
- [ ] Dodać sanitizację dla JSON-LD i SVG
- [ ] Utworzyć plik walidacji zmiennych środowiskowych
- [ ] Zaktualizować Next.js do wersji 15.5.6

### Faza 2: Wysokie (W najbliższym czasie)

- [ ] Zaimplementować rate limiting dla:
  - [ ] `/api/comments`
  - [ ] `/api/admin/auth`
  - [ ] `/api/newsletter/subscribe`
- [ ] Dodać sanitizację komentarzy przed zapisem
- [ ] Usunąć hardcoded wartości z `lib/sanity.ts`
- [ ] Dodać walidację path traversal w `/api/downloads/[filename]`
- [ ] Zaimplementować CSRF protection dla operacji modyfikujących

### Faza 3: Średnie (Planowane)

- [ ] Rozszerzyć walidację wszystkich pól wejściowych
- [ ] Poprawić logowanie (poziomy, brak wrażliwych danych)
- [ ] Dodać runtime walidację parametrów Sanity queries
- [ ] Zaimplementować `crypto.timingSafeEqual()` dla porównań haseł
- [ ] Dodać monitoring i alerty dla podejrzanych aktywności
- [ ] Zaktualizować next-sanity gdy będzie dostępna bezpieczna wersja

---

## 6. Rekomendacje Ogólne

1. **Regularne audyty bezpieczeństwa** - przeprowadzać co 3-6 miesięcy
2. **Automatyczne skanowanie zależności** - używać Dependabot lub Snyk
3. **Code review** - wszystkie zmiany związane z bezpieczeństwem powinny być reviewowane
4. **Penetration testing** - rozważyć profesjonalny pentest przed produkcją
5. **Security headers monitoring** - używać narzędzi jak securityheaders.com
6. **Backup i disaster recovery** - upewnić się, że są procedury backupu

---

## 7. Kontakt i Wsparcie

W razie pytań dotyczących raportu lub potrzebie wsparcia w implementacji poprawek, proszę o kontakt z zespołem security.

---

**Koniec raportu**
