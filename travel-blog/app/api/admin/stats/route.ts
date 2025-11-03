import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllStats } from "@/lib/admin-stats";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    // Weryfikacja uprawnień admin
    await requireAdmin();

    // Pobierz wszystkie statystyki
    const stats = await getAllStats();

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    // Jeśli błąd autoryzacji, zwróć 401
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Błąd podczas pobierania statystyk",
      },
      { status: 500 }
    );
  }
}

