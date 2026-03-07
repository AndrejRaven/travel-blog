import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/travel-wallet/delete-trip
 * Body: { slug: string }
 * Usuwa podróż użytkownika z Supabase (sesja z cookies).
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Musisz być zalogowany." },
        { status: 401 }
      );
    }

    let body: { slug?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Bad request", message: "Nieprawidłowy JSON." },
        { status: 400 }
      );
    }

    const slug = body?.slug;
    if (!slug || typeof slug !== "string" || !slug.trim()) {
      return NextResponse.json(
        { error: "Bad request", message: "Brak slug podróży." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("trips")
      .delete()
      .eq("slug", slug.trim())
      .eq("user_id", user.id);

    if (error) {
      console.error("[delete-trip] Supabase delete error:", error);
      return NextResponse.json(
        { error: "Delete failed", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[delete-trip]", err);
    return NextResponse.json(
      { error: "Internal error", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
