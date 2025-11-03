import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

export const dynamic = 'force-dynamic';

// Funkcja do pobierania i walidacji zmiennych środowiskowych
const getEnvVars = () => {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const secret = process.env.JWT_SECRET?.trim();

  // Debug logging w development
  if (process.env.NODE_ENV !== 'production') {
    console.log('[AUTH DEBUG] Environment variables check:', {
      hasUsername: !!username,
      hasPassword: !!password,
      hasSecret: !!secret,
      usernameLength: username?.length || 0,
      passwordLength: password?.length || 0,
      secretLength: secret?.length || 0,
    });
  }

  return { username, password, secret };
};

export async function POST(request: NextRequest) {
  try {
    const { username: inputUsername, password: inputPassword } = await request.json();
    const { username: envUsername, password: envPassword, secret: jwtSecret } = getEnvVars();

    // Walidacja zmiennych środowiskowych
    if (!envUsername || !envPassword || !jwtSecret) {
      const missingVars = [];
      if (!envUsername) missingVars.push('ADMIN_USERNAME');
      if (!envPassword) missingVars.push('ADMIN_PASSWORD');
      if (!jwtSecret) missingVars.push('JWT_SECRET');

      console.error('[AUTH ERROR] Missing environment variables:', missingVars);
      
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

      if (process.env.NODE_ENV !== 'production') {
        console.log('[AUTH DEBUG] Missing input fields:', missingFields);
      }

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
    const passwordMatch = trimmedInputPassword === envPassword;

    if (!usernameMatch || !passwordMatch) {
      // Loguj w development dla debugowania (bez danych wrażliwych)
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

      // Zwróć szczegółowy komunikat o błędzie
      let message = "Nieprawidłowe dane logowania";
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

      if (process.env.NODE_ENV !== 'production') {
        console.log('[AUTH DEBUG] Login successful for user:', envUsername);
      }

      return response;
    } catch (jwtError) {
      console.error('[AUTH ERROR] JWT token creation failed:', jwtError);
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
    console.error("[AUTH ERROR] Unexpected error:", error);
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
    console.error("Logout error:", error);
    return NextResponse.json(
      { message: "Wystąpił błąd podczas wylogowania" },
      { status: 500 }
    );
  }
}
