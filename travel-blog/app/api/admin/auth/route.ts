import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

export const dynamic = 'force-dynamic';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Sprawdź dane logowania
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { message: "Nieprawidłowe dane logowania" },
        { status: 401 }
      );
    }

    // Utwórz JWT token
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({ 
      username,
      role: "admin",
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 godziny
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

    return response;
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { message: "Wystąpił błąd podczas logowania" },
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
