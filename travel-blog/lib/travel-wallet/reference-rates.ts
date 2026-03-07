import type { ExchangeRate } from "./types";

/**
 * Gets reference rate for currency conversion
 * @param rates - array of exchange rates
 * @param fromCurrency - source currency code
 * @param toCurrency - target currency code
 * @param date - optional date to get rate for (defaults to latest)
 * @returns exchange rate or null if not found
 */
export function getReferenceRate(
  rates: ExchangeRate[],
  fromCurrency: string,
  toCurrency: string,
  date?: string
): number | null {
  // Same currency - rate is 1
  if (fromCurrency === toCurrency) {
    return 1;
  }

  // Direct rate
  // Jeśli data jest w przyszłości, użyj najnowszego kursu (bez filtrowania po dacie)
  const useDateFilter = date && new Date(date) <= new Date();
  const directRate = rates.find(
    (r) =>
      r.fromCurrency === fromCurrency &&
      r.toCurrency === toCurrency &&
      (!useDateFilter || r.effectiveDate <= date)
  );

  if (directRate) {
    return directRate.rate;
  }

  // Try reverse rate (1 / rate)
  const reverseRate = rates.find(
    (r) =>
      r.fromCurrency === toCurrency &&
      r.toCurrency === fromCurrency &&
      (!date || r.effectiveDate <= date)
  );

  if (reverseRate) {
    const calculatedRate = 1 / reverseRate.rate;
    return calculatedRate;
  }

  // Try through base currency (if we have rates to/from a common base)
  // This is a simplified approach - in production you might want a more sophisticated path finding
  const baseCurrency = findCommonBaseCurrency(rates, fromCurrency, toCurrency);
  if (baseCurrency) {
    const fromToBase = getReferenceRate(rates, fromCurrency, baseCurrency, date);
    const baseToTo = getReferenceRate(rates, baseCurrency, toCurrency, date);
    if (fromToBase !== null && baseToTo !== null) {
      const calculatedRate = fromToBase * baseToTo;
      return calculatedRate;
    }
  }

  return null;
}

/**
 * Finds a common base currency that can be used to convert between two currencies
 */
function findCommonBaseCurrency(
  rates: ExchangeRate[],
  fromCurrency: string,
  toCurrency: string
): string | null {
  // Get all currencies that have rates from both fromCurrency and toCurrency
  const fromCurrencies = new Set(
    rates
      .filter((r) => r.fromCurrency === fromCurrency)
      .map((r) => r.toCurrency)
  );
  const toCurrencies = new Set(
    rates
      .filter((r) => r.fromCurrency === toCurrency)
      .map((r) => r.toCurrency)
  );

  // Find intersection
  for (const currency of fromCurrencies) {
    if (toCurrencies.has(currency)) {
      return currency;
    }
  }

  return null;
}

/**
 * Updates reference rates by adding a new rate
 * @param rates - current array of exchange rates
 * @param newRate - new exchange rate to add
 * @returns updated array of exchange rates
 */
export function updateReferenceRate(
  rates: ExchangeRate[],
  newRate: ExchangeRate
): ExchangeRate[] {
  // Remove any existing rate for the same currency pair with same or later effective date
  const filtered = rates.filter(
    (r) =>
      !(
        r.fromCurrency === newRate.fromCurrency &&
        r.toCurrency === newRate.toCurrency &&
        r.effectiveDate >= newRate.effectiveDate
      )
  );

  // Add new rate
  return [...filtered, newRate].sort(
    (a, b) => a.effectiveDate.localeCompare(b.effectiveDate)
  );
}

/**
 * Converts amount from one currency to base currency using reference rates
 * @param amount - amount to convert
 * @param currency - source currency code
 * @param baseCurrency - base currency code
 * @param rates - array of exchange rates
 * @returns converted amount in base currency
 */
export function convertToBaseCurrency(
  amount: number,
  currency: string,
  baseCurrency: string,
  rates: ExchangeRate[]
): number {
  if (currency === baseCurrency) {
    return amount;
  }

  const rate = getReferenceRate(rates, currency, baseCurrency);
  if (rate === null) {
    // Fallback: if rate not found, return amount (assume 1:1)
    // In production, you might want to throw an error or use a default rate
    console.warn(
      `No reference rate found for ${currency} to ${baseCurrency}, using 1:1`
    );
    return amount;
  }

  return amount * rate;
}

/**
 * Converts amount between any two currencies using reference rates
 * @param amount - amount to convert
 * @param fromCurrency - source currency code
 * @param toCurrency - target currency code
 * @param rates - array of exchange rates
 * @returns converted amount
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRate[]
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rate = getReferenceRate(rates, fromCurrency, toCurrency);
  if (rate === null) {
    console.warn(
      `No reference rate found for ${fromCurrency} to ${toCurrency}, using 1:1`
    );
    return amount;
  }

  return amount * rate;
}

/**
 * Gets the latest reference rate for a currency pair
 * @param rates - array of exchange rates
 * @param fromCurrency - source currency code
 * @param toCurrency - target currency code
 * @returns latest exchange rate or null
 */
export function getLatestReferenceRate(
  rates: ExchangeRate[],
  fromCurrency: string,
  toCurrency: string
): number | null {
  return getReferenceRate(rates, fromCurrency, toCurrency);
}

/**
 * Initializes default reference rates (from hardcoded rates in calculations.ts)
 * defaultRates = ile PLN za 1 jednostkę waluty (1 USD = 4 PLN, 1 THB = 0.11 PLN).
 * Dla baseCurrency !== PLN przeliczamy: kurs X→base = (X→PLN) / (base→PLN).
 *
 * @param baseCurrency - base currency code (default: "PLN")
 * @returns array of default exchange rates
 */
export function getDefaultReferenceRates(
  baseCurrency: string = "PLN"
): ExchangeRate[] {
  // Ile PLN za 1 jednostkę waluty (np. 1 USD ≈ 3.57 PLN); przy braku API używane jako fallback
  const defaultRates: Record<string, number> = {
    PLN: 1,
    USD: 3.57,
    EUR: 3.85,
    JPY: 0.024,
    THB: 0.098,
    GBP: 4.52,
    KRW: 0.0026,
    TWD: 0.11,
    AUD: 2.32,
    CAD: 2.58,
    NOK: 0.33,
  };

  const rates: ExchangeRate[] = [];
  const today = new Date().toISOString().split("T")[0];
  const baseToPln = defaultRates[baseCurrency] ?? 1;

  for (const [currency, rate] of Object.entries(defaultRates)) {
    if (currency !== baseCurrency) {
      // rate = ile PLN za 1 jednostkę waluty. Dla base !== PLN: 1 X = (rate/baseToPln) base
      const rateToBase = baseCurrency === "PLN" ? rate : rate / baseToPln;
      rates.push({
        fromCurrency: currency,
        toCurrency: baseCurrency,
        rate: rateToBase,
        effectiveDate: today,
        source: "default",
      });
    }
  }

  return rates;
}
