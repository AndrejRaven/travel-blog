import type { ExchangeRate } from "../types";
import { safeSetLocalStorageItem } from "../utils/safe-local-storage";

const CACHE_KEY = "travel-wallet-exchange-rates-cache";
const CACHE_VALIDITY_HOURS = 24; // Cache ważny przez 24 godziny

interface CachedRates {
  rates: ExchangeRate[];
  cachedAt: string; // ISO timestamp
  baseCurrency: string;
}

/**
 * Sprawdza czy cache jest ważny
 * @param cachedAt - timestamp cache'u
 * @returns true jeśli cache jest ważny (mniej niż CACHE_VALIDITY_HOURS)
 */
function isCacheValid(cachedAt: string): boolean {
  const cachedDate = new Date(cachedAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - cachedDate.getTime()) / (1000 * 60 * 60);
  return hoursDiff < CACHE_VALIDITY_HOURS;
}

/**
 * Pobiera cache'owane kursy walut z localStorage
 * @param baseCurrency - waluta bazowa
 * @returns cache'owane kursy lub null jeśli brak cache lub cache nieważny
 */
export function getCachedExchangeRates(
  baseCurrency: string = "PLN"
): ExchangeRate[] | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      return null;
    }

    const cachedData: CachedRates = JSON.parse(cached);

    // Sprawdź czy cache jest dla tej samej waluty bazowej
    if (cachedData.baseCurrency !== baseCurrency) {
      return null;
    }

    // Sprawdź czy cache jest ważny
    if (!isCacheValid(cachedData.cachedAt)) {
      // Usuń nieważny cache
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return cachedData.rates;
  } catch (error) {
    console.error("Error reading exchange rates cache:", error);
    return null;
  }
}

/**
 * Zapisuje kursy walut do cache
 * @param rates - kursy do zapisania
 * @param baseCurrency - waluta bazowa
 */
export function setCachedExchangeRates(
  rates: ExchangeRate[],
  baseCurrency: string = "PLN"
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const cacheData: CachedRates = {
      rates,
      cachedAt: new Date().toISOString(),
      baseCurrency,
    };
    safeSetLocalStorageItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error saving exchange rates cache:", error);
  }
}

/**
 * Sprawdza czy cache istnieje i jest ważny
 * @param baseCurrency - waluta bazowa
 * @returns true jeśli cache istnieje i jest ważny
 */
export function hasValidCache(baseCurrency: string = "PLN"): boolean {
  const cached = getCachedExchangeRates(baseCurrency);
  return cached !== null;
}

/**
 * Usuwa cache kursów walut
 */
export function clearExchangeRatesCache(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error("Error clearing exchange rates cache:", error);
  }
}

/**
 * Pobiera timestamp ostatniego cache'u
 * @returns timestamp cache'u lub null jeśli brak cache
 */
export function getCacheTimestamp(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      return null;
    }

    const cachedData: CachedRates = JSON.parse(cached);
    return cachedData.cachedAt;
  } catch (error) {
    console.error("Error reading cache timestamp:", error);
    return null;
  }
}
