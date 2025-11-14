/**
 * Funkcje walidacji pól wejściowych
 */

export function validateEmail(email: string): {
  valid: boolean;
  error?: string;
} {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email jest wymagany" };
  }

  const trimmed = email.trim();

  // Minimalna długość (a@b.c = 5 znaków)
  if (trimmed.length < 5) {
    return { valid: false, error: "Email jest za krótki" };
  }

  // Maksymalna długość (RFC 5321)
  if (trimmed.length > 254) {
    return { valid: false, error: "Email jest za długi" };
  }

  // Walidacja formatu
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Nieprawidłowy format email" };
  }

  return { valid: true };
}

