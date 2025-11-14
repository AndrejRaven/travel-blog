/**
 * Rate limiting w pamięci (in-memory)
 * Uwaga: W produkcji z wieloma instancjami serwera należy użyć Redis
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Map przechowująca limity dla różnych identyfikatorów
const rateLimitStore = new Map<string, RateLimitEntry>();

// Czyszczenie starych wpisów co 5 minut
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Sprawdza rate limit dla danego identyfikatora
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Jeśli nie ma wpisu lub okno czasowe wygasło, utwórz nowy
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(identifier, newEntry);

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: newEntry.resetTime,
    };
  }

  // Jeśli limit został przekroczony
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  // Zwiększ licznik
  entry.count++;

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    reset: entry.resetTime,
  };
}

// Predefiniowane konfiguracje dla różnych endpointów
export const rateLimitConfigs = {
  comments: {
    maxRequests: 5,
    windowMs: 5 * 60 * 1000, // 5 minut
  },
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minut
  },
  newsletter: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 godzina
  },
} as const;

