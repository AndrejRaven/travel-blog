import { NewsletterCacheData } from './component-types';

// Rate limiting constants
const MAX_ACTIONS = 3;
const TIME_WINDOW = 60 * 1000; // 60 seconds
const BLOCK_DURATION = 60 * 1000; // 60 seconds

// Cache keys
const CACHE_KEY = 'newsletter-cache';
const RATE_LIMIT_KEY = 'newsletter-rate-limit';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate limit types
type RateLimitData = {
  actions: number[];
  blockedUntil: number | null;
};

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Rate limiting functions
 */
function getRateLimitData(): RateLimitData {
  if (typeof window === 'undefined') {
    return { actions: [], blockedUntil: null };
  }
  
  try {
    const cached = localStorage.getItem(RATE_LIMIT_KEY);
    if (!cached) return { actions: [], blockedUntil: null };
    
    const data = JSON.parse(cached);
    return {
      actions: data.actions || [],
      blockedUntil: data.blockedUntil || null,
    };
  } catch (error) {
    console.error('Error parsing rate limit cache:', error);
    return { actions: [], blockedUntil: null };
  }
}

function saveRateLimitData(data: RateLimitData): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving rate limit cache:', error);
  }
}

/**
 * Main rate limiting function - checks and records action in one call
 */
export function checkAndRecordRateLimit(): { 
  allowed: boolean; 
  secondsLeft: number;
  message?: string;
} {
  const data = getRateLimitData();
  const now = Date.now();
  
  // Check if currently blocked
  if (data.blockedUntil && now < data.blockedUntil) {
    return {
      allowed: false,
      secondsLeft: Math.ceil((data.blockedUntil - now) / 1000),
      message: 'Za dużo akcji. Odczekaj chwilę.'
    };
  }
  
  // Clean old actions (older than TIME_WINDOW)
  const recentActions = data.actions.filter(t => now - t < TIME_WINDOW);
  
  // Check if too many recent actions
  if (recentActions.length >= MAX_ACTIONS) {
    const blockUntil = now + BLOCK_DURATION;
    saveRateLimitData({
      actions: recentActions,
      blockedUntil: blockUntil
    });
    
    return {
      allowed: false,
      secondsLeft: Math.ceil(BLOCK_DURATION / 1000),
      message: 'Za dużo akcji. Odczekaj 60 sekund.'
    };
  }
  
  // Record new action
  saveRateLimitData({
    actions: [...recentActions, now],
    blockedUntil: null
  });
  
  return { 
    allowed: true, 
    secondsLeft: 0 
  };
}

/**
 * Gets newsletter cache data from localStorage
 */
export function getNewsletterCache(): NewsletterCacheData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    
    // Validate cache structure
    if (!data.email || typeof data.subscribed !== 'boolean') {
      return null;
    }
    
    return {
      email: data.email,
      subscribed: data.subscribed,
      confirmed: data.confirmed || false,
      timestamp: data.timestamp || Date.now(),
    };
  } catch (error) {
    console.error('Error parsing newsletter cache:', error);
    return null;
  }
}

/**
 * Saves newsletter cache data to localStorage
 */
export function saveNewsletterCache(data: NewsletterCacheData): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving newsletter cache:', error);
  }
}

/**
 * Clears newsletter cache
 */
export function clearNewsletterCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_KEY);
}



/**
 * Checks if email is already subscribed
 */
export function isEmailSubscribed(email: string): boolean {
  const cache = getNewsletterCache();
  return cache?.email === email && cache?.subscribed === true;
}

/**
 * API functions (currently simulated, ready for real API integration)
 */

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Simulates newsletter subscription
 */
export async function subscribeNewsletter(email: string): Promise<ApiResponse> {
  try {
    const res = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const json = await res.json().catch(() => ({ success: false, message: 'Błąd zapisu' }));

    if (!res.ok || !json.success) {
      return { success: false, message: json.message || 'Błąd zapisu' };
    }

    const cache: NewsletterCacheData = {
      email: email.trim(),
      subscribed: true,
      confirmed: false,
      timestamp: Date.now(),
    };
    saveNewsletterCache(cache);

    return { success: true, message: json.message };
  } catch {
    return { success: false, message: 'Ups, problem z połączeniem. Spróbuj ponownie.' };
  }
}

/**
 * Simulates newsletter unsubscription
 */
export async function unsubscribeNewsletter(email: string): Promise<ApiResponse> {
  try {
    const res = await fetch('/api/newsletter/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const json = await res.json().catch(() => ({ success: false, message: 'Błąd wypisania' }));

    if (!res.ok || !json.success) {
      return { success: false, message: json.message || 'Błąd wypisania' };
    }

    const cache = getNewsletterCache();
    if (cache && cache.email === email) {
      const updatedCache: NewsletterCacheData = {
        ...cache,
        subscribed: false,
        confirmed: false,
      };
      saveNewsletterCache(updatedCache);
    }

    return { success: true, message: json.message };
  } catch {
    return { success: false, message: 'Ups, problem z połączeniem. Spróbuj ponownie.' };
  }
}

/**
 * Simulates checking subscription status
 */
export async function checkSubscriptionStatus(email: string): Promise<{
  subscribed: boolean;
  confirmed: boolean;
}> {
  try {
    const res = await fetch(`/api/newsletter/status?email=${encodeURIComponent(email)}`);
    const json = await res.json();

    if (!res.ok || !json?.success) {
      // Don't reset cache on error - return current cache values
      const cache = getNewsletterCache();
      if (cache && cache.email === email) {
        return { 
          subscribed: cache.subscribed, 
          confirmed: cache.confirmed || false,
        };
      }
      return { subscribed: false, confirmed: false };
    }

    const { subscribed, confirmed } = json.data || { subscribed: false, confirmed: false };

    const cache = getNewsletterCache();
    if (cache && cache.email === email) {
      saveNewsletterCache({
        ...cache,
        subscribed,
        confirmed,
      });
    }

    return { subscribed, confirmed };
  } catch {
    // Don't reset cache on error - return current cache values
    const cache = getNewsletterCache();
    if (cache && cache.email === email) {
      return { 
        subscribed: cache.subscribed, 
        confirmed: cache.confirmed || false,
      };
    }
    return { subscribed: false, confirmed: false };
  }
}

/**
 * Utility function to replace placeholders in messages
 */
export function replacePlaceholders(
  message: string, 
  replacements: Record<string, string>
): string {
  let result = message;
  
  Object.entries(replacements).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return result;
}

/**
 * Newsletter state management
 */
export type NewsletterState = 
  | 'new'           // Nowy użytkownik (formularz)
  | 'subscribed'    // Zapisany (może być confirmed=false lub confirmed=true)
  | 'unsubscribed'; // Po wypisaniu

/**
 * Determines current newsletter state based on cache
 */
export function getNewsletterState(email?: string): NewsletterState {
  const cache = getNewsletterCache();
  
  // If no cache or not subscribed and no email in cache, show new form
  if (!cache || (!cache.subscribed && !cache.email)) {
    return 'new';
  }
  
  // If email mismatch, show new form
  if (email && cache.email && cache.email !== email) {
    return 'new';
  }
  
  // If user has email in cache (even if subscribed: false temporarily),
  // or is subscribed, show subscribed state
  // This prevents resetting to 'new' when checking status for unconfirmed users
  if (cache.email || cache.subscribed) {
    return 'subscribed';
  }
  
  return 'new';
}
