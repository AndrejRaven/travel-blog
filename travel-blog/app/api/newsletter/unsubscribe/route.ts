import { NextResponse } from "next/server";
import { findSubscriberInGroup, getMailerLiteConfig, clearSubscriberCache } from "@/lib/mailerlite";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Adres e-mail jest wymagany." },
        { status: 400 }
      );
    }

    const config = getMailerLiteConfig();
    if (!config) {
      return NextResponse.json(
        { success: false, message: "Brak konfiguracji MailerLite na serwerze." },
        { status: 500 }
      );
    }

    // Use optimized direct search instead of pagination
    const subscriber = await findSubscriberInGroup(email, config);

    // If not found, treat as already unsubscribed (idempotent)
    if (!subscriber?.id) {
      return NextResponse.json({
        success: true,
        message: "Wypisaliśmy Cię z newslettera. Możesz wrócić w każdej chwili!",
      });
    }

    const subscriberId = subscriber.id as string;

    // Step 1: Change subscriber status to "unsubscribed" (z timeout)
    const controller1 = new AbortController();
    const timeoutId1 = setTimeout(() => controller1.abort(), 5000);
    
    let updateRes: Response;
    try {
      updateRes = await fetch(
        `https://connect.mailerlite.com/api/subscribers/${subscriberId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            status: "unsubscribed",
          }),
          signal: controller1.signal,
        }
      );
      clearTimeout(timeoutId1);
    } catch (error) {
      clearTimeout(timeoutId1);
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { success: false, message: "Timeout - MailerLite API nie odpowiada." },
          { status: 504 }
        );
      }
      throw error;
    }

    if (!updateRes.ok) {
      // Try PATCH if PUT doesn't work (z timeout)
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
      
      let patchRes: Response;
      try {
        patchRes = await fetch(
          `https://connect.mailerlite.com/api/subscribers/${subscriberId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${config.token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              status: "unsubscribed",
            }),
            signal: controller2.signal,
          }
        );
        clearTimeout(timeoutId2);
      } catch (error) {
        clearTimeout(timeoutId2);
        if (error instanceof Error && error.name === 'AbortError') {
          return NextResponse.json(
            { success: false, message: "Timeout - MailerLite API nie odpowiada." },
            { status: 504 }
          );
        }
        throw error;
      }

      if (!patchRes.ok) {
        const error = await patchRes.json().catch(() => ({}));
        return NextResponse.json(
          {
            success: false,
            message:
              error?.message || "Nie udało się zmienić statusu na wypisany.",
          },
          { status: 400 }
        );
      }
    }

    // Step 2: Remove subscriber from group (optional but recommended) - z timeout
    let delOk = false;
    const controller3 = new AbortController();
    const timeoutId3 = setTimeout(() => controller3.abort(), 3000);
    
    try {
      const del1 = await fetch(
        `https://connect.mailerlite.com/api/groups/${config.groupId}/subscribers/${subscriberId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${config.token}`, Accept: "application/json" },
          signal: controller3.signal,
        }
      );
      clearTimeout(timeoutId3);
      if (del1.ok) delOk = true;
    } catch {
      clearTimeout(timeoutId3);
    }

    if (!delOk) {
      const controller4 = new AbortController();
      const timeoutId4 = setTimeout(() => controller4.abort(), 3000);
      
      try {
        const del2 = await fetch(
          `https://connect.mailerlite.com/api/subscribers/${subscriberId}/groups/${config.groupId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${config.token}`, Accept: "application/json" },
            signal: controller4.signal,
          }
        );
        clearTimeout(timeoutId4);
        if (del2.ok) delOk = true;
      } catch {
        clearTimeout(timeoutId4);
      }
    }

    // Wyczyść cache dla tego emaila
    clearSubscriberCache(email);

    // If status update succeeded, we're done (removal from group is optional)
    return NextResponse.json({
      success: true,
      message: "Wypisaliśmy Cię z newslettera. Możesz wrócić w każdej chwili!",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Ups, problem z połączeniem. Spróbuj ponownie." },
      { status: 500 }
    );
  }
}


