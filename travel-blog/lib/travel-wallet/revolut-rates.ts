import type { ExchangeRate } from "./types";
import { updateReferenceRate } from "./reference-rates";
import {
  getCachedExchangeRates,
  setCachedExchangeRates,
  hasValidCache,
} from "./offline/exchange-rates-cache";

/**
 * Pobiera aktualne kursy walut z exchangerate-api.com
 * Używa cache gdy offline lub gdy API nie jest dostępne
 * @param baseCurrency - waluta bazowa (domyślnie PLN)
 * @param forceRefresh - wymusza pobranie z API nawet jeśli cache jest ważny
 * @returns array of exchange rates
 */
export async function fetchRevolutRates(
  baseCurrency: string = "PLN",
  forceRefresh: boolean = false
): Promise<ExchangeRate[]> {
  // Sprawdź cache przed wywołaniem API (jeśli nie wymuszamy odświeżenia)
  if (!forceRefresh) {
    const cachedRates = getCachedExchangeRates(baseCurrency);
    if (cachedRates) {
      return cachedRates;
    }
  }

  // Sprawdź czy jesteśmy online
  const isOnline = typeof window !== "undefined" ? navigator.onLine : true;

  // Jeśli offline, użyj cache nawet jeśli nieważny
  if (!isOnline) {
    const cachedRates = getCachedExchangeRates(baseCurrency);
    if (cachedRates) {
      return cachedRates;
    }
    // Jeśli brak cache i offline, użyj domyślnych kursów
    console.warn("[fetchRevolutRates] Offline and no cache - using default rates");
    return getDefaultRatesFallback(baseCurrency);
  }

  try {
    // W przeglądarce użyj względnego URL, w server component użyj pełnego URL
    const apiUrl = typeof window !== "undefined" 
      ? "/api/exchange-rates"
      : process.env.NEXT_PUBLIC_SITE_URL 
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/exchange-rates`
        : "http://localhost:3000/api/exchange-rates";
    
    const response = await fetch(apiUrl, {
      cache: "no-store", // Zawsze pobierz aktualne kursy
    });

    if (!response.ok) {
      throw new Error(`Exchange rates API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.rates) {
      throw new Error("Invalid response from exchange rates API");
    }

    // API zwraca kursy wyłącznie do PLN (fromCurrency -> PLN)
    const ratesToPln: ExchangeRate[] = data.rates.map((rate: {
      fromCurrency: string;
      toCurrency: string;
      rate: number;
      effectiveDate: string;
      source: string;
    }) => ({
      fromCurrency: rate.fromCurrency,
      toCurrency: rate.toCurrency,
      rate: rate.rate,
      effectiveDate: rate.effectiveDate,
      source: rate.source || "exchangerate-api",
    }));

    const effectiveDate = ratesToPln[0]?.effectiveDate ?? new Date().toISOString().split("T")[0];
    const source = ratesToPln[0]?.source ?? "exchangerate-api";

    // Gdy waluta bazowa to PLN – zwróć kursy bez zmian
    if (baseCurrency === "PLN") {
      setCachedExchangeRates(ratesToPln, baseCurrency);
      return ratesToPln;
    }

    // Znajdź kurs waluty bazowej do PLN (np. 1 USD = X PLN)
    const baseToPlnRate = ratesToPln.find(
      (r) => r.fromCurrency === baseCurrency && r.toCurrency === "PLN"
    );
    if (!baseToPlnRate || baseToPlnRate.rate <= 0) {
      setCachedExchangeRates(ratesToPln, "PLN");
      return ratesToPln;
    }

    const baseToPln = baseToPlnRate.rate;

    // Przelicz wszystkie kursy na walutę bazową: fromCurrency -> baseCurrency = (fromCurrency -> PLN) / baseToPln
    const rates: ExchangeRate[] = [];
    for (const r of ratesToPln) {
      if (r.fromCurrency === baseCurrency) continue;
      rates.push({
        fromCurrency: r.fromCurrency,
        toCurrency: baseCurrency,
        rate: r.rate / baseToPln,
        effectiveDate: r.effectiveDate,
        source: r.source,
      });
    }
    // PLN -> baseCurrency
    rates.push({
      fromCurrency: "PLN",
      toCurrency: baseCurrency,
      rate: 1 / baseToPln,
      effectiveDate,
      source,
    });

    setCachedExchangeRates(rates, baseCurrency);
    return rates;
  } catch (error) {
    console.error("Error fetching Revolut rates:", error);
    
    // Spróbuj użyć cache nawet jeśli nieważny (lepsze niż domyślne kursy)
    const cachedRates = getCachedExchangeRates(baseCurrency);
    if (cachedRates) {
      return cachedRates;
    }

    // Fallback do domyślnych kursów tylko jeśli brak cache
    console.warn("[fetchRevolutRates] API error and no cache - using default rates");
    return getDefaultRatesFallback(baseCurrency);
  }
}

/**
 * Aktualizuje kursy walut w wallet używając aktualnych kursów z API
 * Używa cache gdy offline lub gdy API nie jest dostępne
 * @param wallet - aktualny stan wallet
 * @param forceRefresh - wymusza pobranie z API nawet jeśli cache jest ważny
 * @returns zaktualizowany wallet z nowymi kursami
 */
export async function updateWalletRatesFromAPI(
  wallet: { baseCurrency?: string; referenceRates: ExchangeRate[] },
  forceRefresh: boolean = false
): Promise<{ referenceRates: ExchangeRate[] }> {
  try {
    const baseCurrency = wallet.baseCurrency ?? wallet.referenceRates[0]?.toCurrency ?? "PLN";
    const newRates = await fetchRevolutRates(baseCurrency, forceRefresh);
    
    // Zaktualizuj istniejące kursy, dodając nowe
    let updatedRates = [...wallet.referenceRates];
    
    for (const newRate of newRates) {
      updatedRates = updateReferenceRate(updatedRates, newRate);
    }

    return {
      referenceRates: updatedRates,
    };
  } catch (error) {
    console.error("Error updating wallet rates from API:", error);
    // Zwróć oryginalne kursy w przypadku błędu
    return wallet;
  }
}

/**
 * Fallback do domyślnych kursów w przypadku błędu API
 */
function getDefaultRatesFallback(baseCurrency: string = "PLN"): ExchangeRate[] {
  // Wartości = ile PLN za 1 jednostkę waluty (np. 1 USD ≈ 3.57 PLN)
  const toPlnRates: Record<string, number> = {
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
  const baseToPln = toPlnRates[baseCurrency] ?? 1;

  for (const [currency, rateToPln] of Object.entries(toPlnRates)) {
    if (currency === baseCurrency) continue;
    const rateToBase = baseCurrency === "PLN" ? rateToPln : rateToPln / baseToPln;
    rates.push({
      fromCurrency: currency,
      toCurrency: baseCurrency,
      rate: rateToBase,
      effectiveDate: today,
      source: "default",
    });
  }

  return rates;
}
