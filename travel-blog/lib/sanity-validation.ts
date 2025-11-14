/**
 * Runtime walidacja parametrów Sanity queries
 */

/**
 * Waliduje Sanity ID
 */
export function validateSanityId(id: string): boolean {
  // Sanity IDs mają określony format
  if (!id || typeof id !== "string") {
    return false;
  }

  // Sprawdź długość (Sanity IDs są zwykle 20-40 znaków)
  if (id.length < 10 || id.length > 100) {
    return false;
  }

  // Sprawdź czy nie zawiera niebezpiecznych znaków
  if (/[<>\"'%;()&+]/.test(id)) {
    return false;
  }

  return true;
}

/**
 * Waliduje parametry Sanity queries
 */
export function validateSanityParams(params: Record<string, unknown>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      errors.push(`Parameter ${key} is null or undefined`);
      continue;
    }

    // Walidacja ID
    if (key.endsWith("Id") || key.endsWith("_id") || key === "id") {
      if (typeof value !== "string" || !validateSanityId(value)) {
        errors.push(`Parameter ${key} is not a valid Sanity ID`);
      }
    }

    // Walidacja stringów
    if (typeof value === "string") {
      if (value.length > 1000) {
        errors.push(`Parameter ${key} is too long (max 1000 characters)`);
      }
    }

    // Walidacja arrayów
    if (Array.isArray(value)) {
      if (value.length > 100) {
        errors.push(`Parameter ${key} array is too long (max 100 items)`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

