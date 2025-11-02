import { NextResponse } from "next/server";
import { findSubscriberInGroup, getMailerLiteConfig } from "@/lib/mailerlite";

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

    // Step 1: Change subscriber status to "unsubscribed"
    const updateRes = await fetch(
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
      }
    );

    if (!updateRes.ok) {
      // Try PATCH if PUT doesn't work
      const patchRes = await fetch(
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
        }
      );

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

    // Step 2: Remove subscriber from group (optional but recommended)
    let delOk = false;
    const del1 = await fetch(
      `https://connect.mailerlite.com/api/groups/${config.groupId}/subscribers/${subscriberId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${config.token}`, Accept: "application/json" },
      }
    );
    if (del1.ok) delOk = true;

    if (!delOk) {
      const del2 = await fetch(
        `https://connect.mailerlite.com/api/subscribers/${subscriberId}/groups/${config.groupId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${config.token}`, Accept: "application/json" },
        }
      );
      if (del2.ok) delOk = true;
    }

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


