import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Adres e-mail jest wymagany." },
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
      } catch (_) {}

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


