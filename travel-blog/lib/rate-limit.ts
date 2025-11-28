/**
 * Rate limiting z wykorzystaniem Redis (z fallbackiem in-memory)
 */
import { Redis } from "@upstash/redis";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const redisUrl = process.env.RATE_LIMIT_REDIS_REST_URL;
const redisToken = process.env.RATE_LIMIT_REDIS_REST_TOKEN;

const redisClient =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;

const memoryStore = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.resetTime < now) {
      memoryStore.delete(key);
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
async function incrementMemoryStore(
  identifier: string,
  windowMs: number
): Promise<RateLimitEntry> {
  const now = Date.now();
  const existing = memoryStore.get(identifier);

  if (!existing || existing.resetTime < now) {
    const entry = { count: 1, resetTime: now + windowMs };
    memoryStore.set(identifier, entry);
    return entry;
  }

  existing.count += 1;
  return existing;
}

async function incrementRedisStore(
  identifier: string,
  windowMs: number
): Promise<RateLimitEntry> {
  if (!redisClient) {
    return incrementMemoryStore(identifier, windowMs);
  }

  const key = `ratelimit:${identifier}`;
  const now = Date.now();

  try {
    const existing = (await redisClient.get<RateLimitEntry>(key)) || null;

    if (!existing || existing.resetTime < now) {
      const resetTime = now + windowMs;
      const entry = { count: 1, resetTime };
      await redisClient.set(key, entry, { px: windowMs });
      return entry;
    }

    const ttl = Math.max(existing.resetTime - now, 0);
    const updatedEntry = {
      count: existing.count + 1,
      resetTime: existing.resetTime,
    };
    await redisClient.set(key, updatedEntry, { px: ttl || 1 });
    return updatedEntry;
  } catch (error) {
    console.error("RateLimit redis error:", error);
    return incrementMemoryStore(identifier, windowMs);
  }
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const entry = await incrementRedisStore(identifier, config.windowMs);
  const success = entry.count <= config.maxRequests;
  const remaining = success
    ? Math.max(config.maxRequests - entry.count, 0)
    : 0;

  return {
    success,
    limit: config.maxRequests,
    remaining,
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
  contact: {
    maxRequests: 3,
    windowMs: 10 * 60 * 1000, // 10 minut
  },
} as const;

