import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

// Porównaj hasła w sposób odporny na timing attacks
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");

  return crypto.timingSafeEqual(bufferA, bufferB);
}

// Funkcja do pobierania i walidacji zmiennych środowiskowych
const getEnvVars = () => {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const secret = process.env.JWT_SECRET?.trim();

  // Debug logging w development
  logger.debug("Environment variables check", {
    hasUsername: !!username,
    hasPassword: !!password,
    hasSecret: !!secret,
    usernameLength: username?.length || 0,
    // NIE loguj passwordLength, secretLength - wrażliwe dane
  });

  return { username, password, secret };
};

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded
      ? forwarded.split(",")[0]
      : request.headers.get("x-real-ip") || "unknown";

    const rateLimitResult = checkRateLimit(
      `auth:${ipAddress}`,
      rateLimitConfigs.auth
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          message: "Zbyt wiele prób logowania. Spróbuj ponownie później.",
          type: "rate_limit_error",
          retryAfter: Math.ceil(
            (rateLimitResult.reset - Date.now()) / 1000
          ),
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

    const { username: inputUsername, password: inputPassword } = await request.json();
    const { username: envUsername, password: envPassword, secret: jwtSecret } = getEnvVars();

    // Walidacja zmiennych środowiskowych
    if (!envUsername || !envPassword || !jwtSecret) {
      const missingVars = [];
      if (!envUsername) missingVars.push('ADMIN_USERNAME');
      if (!envPassword) missingVars.push('ADMIN_PASSWORD');
      if (!jwtSecret) missingVars.push('JWT_SECRET');

      logger.error("Missing environment variables", { missingVars });
      
      return NextResponse.json(
        { 
          message: "Błąd konfiguracji serwera",
          details: `Brakujące zmienne środowiskowe: ${missingVars.join(', ')}`,
          type: "config_error"
        },
        { status: 500 }
      );
    }

    // Walidacja danych wejściowych
    if (!inputUsername || !inputPassword) {
      const missingFields = [];
      if (!inputUsername) missingFields.push('nazwa użytkownika');
      if (!inputPassword) missingFields.push('hasło');

      logger.debug("Missing input fields", { missingFields });

      return NextResponse.json(
        { 
          message: "Wszystkie pola są wymagane",
          details: `Brakuje: ${missingFields.join(', ')}`,
          type: "validation_error"
        },
        { status: 400 }
      );
    }

    // Trim input values
    const trimmedInputUsername = inputUsername.trim();
    const trimmedInputPassword = inputPassword.trim();

    // Sprawdź dane logowania z szczegółowym feedbackiem
    const usernameMatch = trimmedInputUsername === envUsername;
    const passwordMatch = secureCompare(trimmedInputPassword, envPassword);

    if (!usernameMatch || !passwordMatch) {
      // Loguj w development dla debugowania (bez danych wrażliwych)
      logger.debug("Login attempt failed", {
        inputUsernameLength: trimmedInputUsername.length,
        // NIE loguj passwordLength, envPasswordLength, usernameMatch, passwordMatch - wrażliwe dane
      });

      // Zwróć szczegółowy komunikat o błędzie
      const message = "Nieprawidłowe dane logowania";
      let details = "";

      if (!usernameMatch && !passwordMatch) {
        details = "Nieprawidłowa nazwa użytkownika i hasło";
      } else if (!usernameMatch) {
        details = "Nieprawidłowa nazwa użytkownika";
      } else {
        details = "Nieprawidłowe hasło";
      }

      return NextResponse.json(
        { 
          message,
          details,
          type: "auth_error",
          fields: {
            username: !usernameMatch,
            password: !passwordMatch
          }
        },
        { status: 401 }
      );
    }

    // Utwórz JWT token
    try {
      const secret = new TextEncoder().encode(jwtSecret);
      const token = await new SignJWT({ 
        username: envUsername,
        role: "admin",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(secret);

      // Utwórz response z cookie
      const response = NextResponse.json({ success: true });
      
      // Ustaw cookie z tokenem
      response.cookies.set("admin-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60, // 24 godziny
        path: "/",
      });

      logger.debug("Login successful", { username: envUsername });

      return response;
    } catch (jwtError) {
      logger.error("JWT token creation failed", jwtError);
      return NextResponse.json(
        { 
          message: "Błąd podczas tworzenia sesji",
          details: "Nie udało się wygenerować tokenu uwierzytelniającego",
          type: "jwt_error"
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Unexpected error during login", error);
    return NextResponse.json(
      { 
        message: "Wystąpił błąd podczas logowania",
        details: error instanceof Error ? error.message : "Nieoczekiwany błąd serwera",
        type: "server_error"
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Utwórz response i usuń cookie z tokenem
    const response = NextResponse.json({ success: true });
    response.cookies.delete("admin-token");

    return response;
  } catch (error) {
    logger.error("Logout error", error);
    return NextResponse.json(
      { message: "Wystąpił błąd podczas wylogowania" },
      { status: 500 }
    );
  }
}
