import type { ExchangeRate } from "./types";
import { updateReferenceRate } from "./reference-rates";

/**
 * Pobiera aktualne kursy walut z exchangerate-api.com
 * @param baseCurrency - waluta bazowa (domyślnie PLN)
 * @returns array of exchange rates
 */
export async function fetchRevolutRates(
  baseCurrency: string = "PLN"
): Promise<ExchangeRate[]> {
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

    // Konwertuj odpowiedź API na format ExchangeRate[]
    const rates: ExchangeRate[] = data.rates.map((rate: {
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

    return rates;
  } catch (error) {
    console.error("Error fetching Revolut rates:", error);
    // Fallback do domyślnych kursów
    return getDefaultRatesFallback(baseCurrency);
  }
}

/**
 * Aktualizuje kursy walut w wallet używając aktualnych kursów z API
 * @param wallet - aktualny stan wallet
 * @returns zaktualizowany wallet z nowymi kursami
 */
export async function updateWalletRatesFromAPI(
  wallet: { referenceRates: ExchangeRate[] }
): Promise<{ referenceRates: ExchangeRate[] }> {
  try {
    const newRates = await fetchRevolutRates(wallet.referenceRates[0]?.toCurrency || "PLN");
    
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
  const defaultRates: Record<string, number> = {
    PLN: 1,
    USD: 4.0,
    EUR: 4.3,
    JPY: 0.027,
    THB: 0.11,
    GBP: 5.1,
    KRW: 0.003,
    TWD: 0.13,
    AUD: 2.6,
    CAD: 2.9,
  };

  const rates: ExchangeRate[] = [];
  const today = new Date().toISOString().split("T")[0];

  for (const [currency, rate] of Object.entries(defaultRates)) {
    if (currency !== baseCurrency) {
      rates.push({
        fromCurrency: currency,
        toCurrency: baseCurrency,
        rate: rate,
        effectiveDate: today,
        source: "default",
      });
    }
  }

  return rates;
}
