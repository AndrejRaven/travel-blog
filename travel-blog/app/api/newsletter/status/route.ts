import { NextResponse } from "next/server";
import { findSubscriberInGroup } from "@/lib/mailerlite";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { success: false, message: "Brak adresu email" },
      { status: 400 }
    );
  }

  try {
    // Use optimized direct search instead of pagination
    const subscriber = await findSubscriberInGroup(email);

    if (!subscriber) {
      return NextResponse.json({
        success: true,
        data: { subscribed: false, confirmed: false },
      });
    }

    const status = String(subscriber.status || "").toLowerCase();
    
    // Subscribed means: in group and not unsubscribed/bounced/junk
    // Confirmed means: status is "active" (not "unconfirmed")
    const subscribed = status !== "unsubscribed" && status !== "bounced" && status !== "junk";
    const confirmed = status === "active";
    
    return NextResponse.json({
      success: true,
      data: {
        subscribed,
        confirmed,
      },
    });
  } catch (error) {
    console.error('[Newsletter Status] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, message: `Błąd sprawdzania statusu: ${errorMessage}` },
      { status: 500 }
    );
  }
}


