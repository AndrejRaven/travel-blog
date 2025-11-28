import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limit";
import { validateEmail } from "@/lib/validation";
import { sendContactEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const SUBJECT_LABELS = {
  wspolpraca: "Współpraca",
  pytanie: "Pytanie o podróż",
  blog: "Pytanie o blog",
  newsletter: "Newsletter",
  inne: "Inne",
} as const;

type SubjectKey = keyof typeof SUBJECT_LABELS;

const MIN_MESSAGE_LENGTH = 10;

function isSubjectKey(value: string): value is SubjectKey {
  return value in SUBJECT_LABELS;
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(
      `contact:${clientIp}`,
      rateLimitConfigs.contact
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Wysłano zbyt wiele wiadomości. Spróbuj ponownie za kilka minut.",
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

    const body = await request
      .json()
      .catch(() => null) as Partial<{
        name: string;
        email: string;
        subject: string;
        message: string;
      }> | null;

    if (!body) {
      return NextResponse.json(
        { success: false, message: "Nieprawidłowe dane formularza." },
        { status: 400 }
      );
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const subjectValue =
      typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name || name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Imię i nazwisko jest wymagane.",
        },
        { status: 400 }
      );
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: emailValidation.error || "Nieprawidłowy adres e-mail.",
        },
        { status: 400 }
      );
    }

    if (!subjectValue) {
      return NextResponse.json(
        {
          success: false,
          message: "Wybierz temat wiadomości.",
        },
        { status: 400 }
      );
    }

    if (!message || message.length < MIN_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: "Wiadomość musi mieć co najmniej 10 znaków.",
        },
        { status: 400 }
      );
    }

    const normalizedSubject = subjectValue.toLowerCase();
    const subjectLabel = isSubjectKey(normalizedSubject)
      ? SUBJECT_LABELS[normalizedSubject]
      : subjectValue;

    await sendContactEmail({
      name,
      email,
      subject: subjectLabel,
      message,
    });

    return NextResponse.json({
      success: true,
      message: "Dziękujemy! Wiadomość została wysłana.",
    });
  } catch (error) {
    logger.error("Kontakt API - wysyłka nieudana", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę.",
      },
      { status: 500 }
    );
  }
}

