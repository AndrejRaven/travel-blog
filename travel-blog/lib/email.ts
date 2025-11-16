import { Resend } from "resend";

export interface ContactEmailPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable");
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatRecipients(rawRecipients: string): string[] {
  return rawRecipients
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}

export async function sendContactEmail(payload: ContactEmailPayload) {
  const resend = getResendClient();
  const recipientList = process.env.CONTACT_RECIPIENT;
  const fromAddress =
    process.env.CONTACT_SENDER || "Vlogi z Drogi <no-reply@vlogizdrogi.pl>";

  if (!recipientList) {
    throw new Error("Missing CONTACT_RECIPIENT environment variable");
  }

  const recipients = formatRecipients(recipientList);
  if (!recipients.length) {
    throw new Error("CONTACT_RECIPIENT must contain at least one email");
  }

  const subjectLine = payload.subject?.trim()
    ? `[Kontakt] ${payload.subject.trim()}`
    : "[Kontakt] Nowa wiadomość";

  const textContent = [
    `Imię: ${payload.name}`,
    `Email: ${payload.email}`,
    `Temat: ${payload.subject || "Brak"}`,
    "",
    payload.message,
  ].join("\n");

  const htmlContent = `
    <div>
      <p><strong>Imię:</strong> ${escapeHtml(payload.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
      <p><strong>Temat:</strong> ${escapeHtml(payload.subject || "Brak")}</p>
      <hr />
      <p><strong>Wiadomość:</strong></p>
      <p style="white-space:pre-line;font-family:Inter,sans-serif;">
        ${escapeHtml(payload.message)}
      </p>
    </div>
  `.trim();

  await resend.emails.send({
    from: fromAddress,
    to: recipients,
    replyTo: `${payload.name} <${payload.email}>`,
    subject: subjectLine,
    text: textContent,
    html: htmlContent,
  });
}

