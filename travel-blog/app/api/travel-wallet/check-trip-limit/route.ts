import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

const SERVER_TIMEOUT_MS = 6000;

/**
 * GET /api/travel-wallet/check-trip-limit
 * Sprawdza limit podróży dla zalogowanego użytkownika (sesja z cookies).
 * Odpowiedź: { canCreate, currentCount, limit, tier } lub 401.
 */
export async function GET(_request: NextRequest) {
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

    const profilePromise = supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    const countPromise = supabase
      .from("trips")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_anonymous", false);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(new Error("Timeout: Sprawdzanie limitu podróży trwa zbyt długo. Sprawdź połączenie z internetem.")),
        SERVER_TIMEOUT_MS
      )
    );

    const [profileResult, countResult] = (await Promise.race([
      Promise.all([
        profilePromise.then((r) => ({ data: r.data, error: r.error })),
        countPromise.then((r) => ({ count: r.count, error: r.error })),
      ]),
      timeoutPromise,
    ])) as [
      { data: { subscription_tier?: string } | null; error: unknown },
      { count: number | null; error: unknown },
    ];

    const [
      { data: profile, error: profileError },
      { count, error: countError },
    ] = [profileResult, countResult];

    if (profileError) {
      console.error("[check-trip-limit] Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Profile fetch failed" },
        { status: 500 }
      );
    }
    if (countError) {
      console.error("[check-trip-limit] Error counting trips:", countError);
      return NextResponse.json(
        { error: "Count fetch failed" },
        { status: 500 }
      );
    }

    const tier = profile?.subscription_tier || "free";
    const currentCount = count ?? 0;
    const limit = tier === "premium" ? 999999 : 1;
    const canCreate = currentCount < limit;

    return NextResponse.json({
      canCreate,
      currentCount,
      limit: tier === "premium" ? 999999 : 1,
      tier,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("Timeout")) {
      return NextResponse.json(
        { error: "Timeout", message },
        { status: 504 }
      );
    }
    console.error("[check-trip-limit]", err);
    return NextResponse.json(
      { error: "Internal error", message },
      { status: 500 }
    );
  }
}
