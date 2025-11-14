import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { generateCsrfToken } from "@/lib/csrf";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Weryfikacja uprawnień admin
    await requireAdmin();

    // Generuj i zwróć token CSRF
    const token = await generateCsrfToken();

    return NextResponse.json({ token });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Błąd podczas generowania tokenu CSRF:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

