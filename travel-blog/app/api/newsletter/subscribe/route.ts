import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limit";
import { validateEmail } from "@/lib/validation";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ipAddress = forwarded
      ? forwarded.split(",")[0]
      : req.headers.get("x-real-ip") || "unknown";

    const rateLimitResult = checkRateLimit(
      `newsletter:${ipAddress}`,
      rateLimitConfigs.newsletter
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Zbyt wiele prób zapisu. Spróbuj ponownie później.",
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

    const { email } = await req.json();

    // Walidacja email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { success: false, message: emailValidation.error || "Nieprawidłowy adres e-mail." },
        { status: 400 }
      );
    }

    const token = process.env.MAILERLITE_TOKEN;
    const groupId = process.env.MAILERLITE_GROUP_ID;

    if (!token || !groupId) {
      return NextResponse.json(
        { success: false, message: "Brak konfiguracji MailerLite na serwerze." },
        { status: 500 }
      );
    }

    const mlRes = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        groups: [groupId],
        // status: "unconfirmed", // DOI sterowane w panelu ML
        resubscribe: true,
      }),
    });

    if (!mlRes.ok) {
      let message = "Błąd zapisu";
      try {
        const err = await mlRes.json();
        message = err?.message || message;
        // Mapuj znany konflikt (już istnieje)
        if (mlRes.status === 409 || /already/i.test(message)) {
          return NextResponse.json(
            { success: false, message: "Ten email jest już zapisany. Sprawdź swoją skrzynkę!" },
            { status: 409 }
          );
        }
      } catch {}

      return NextResponse.json(
        { success: false, message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Dziękujemy za zapisanie się! Sprawdź skrzynkę — wysłaliśmy potwierdzenie. Email może dotrzeć z opóźnieniem 2-5 minut.",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Ups, problem z połączeniem. Spróbuj ponownie." },
      { status: 500 }
    );
  }
}


