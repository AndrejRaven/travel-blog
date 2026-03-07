/**
 * Cache dla listy walut z API
 * Cache ważny przez 1 godzinę
 */

const CACHE_KEY = 'travel-wallet-currencies-cache';
const CACHE_TTL = 60 * 60 * 1000; // 1 godzina

interface CachedCurrencies {
  currencies: string[];
  timestamp: number;
  date?: string;
}

/**
 * Pobiera waluty z cache jeśli są ważne
 */
export function getCachedCurrencies(): string[] | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data: CachedCurrencies = JSON.parse(cached);
    const now = Date.now();
    
    // Sprawdź czy cache jest ważny (mniej niż 1 godzina)
    if (now - data.timestamp < CACHE_TTL) {
      return data.currencies;
    }
    
    // Cache wygasł - usuń
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    console.error('[CurrenciesCache] Error reading cache:', error);
    return null;
  }
}

/**
 * Zapisuje waluty do cache
 */
export function setCachedCurrencies(currencies: string[], date?: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const data: CachedCurrencies = {
      currencies,
      timestamp: Date.now(),
      date,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[CurrenciesCache] Error saving cache:', error);
  }
}

/**
 * Czyści cache (używane przy błędach)
 */
export function clearCurrenciesCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('[CurrenciesCache] Error clearing cache:', error);
  }
}
