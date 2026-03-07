import { NextResponse } from "next/server";

/**
 * Pobiera aktualne kursy walut z exchangerate-api.com
 * API zwraca wszystkie dostępne waluty w jednym żądaniu
 */

interface ExchangeRateResponse {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: string;
  source: string;
}

interface ExchangeRateAPIResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

/**
 * Pobiera wszystkie kursy walut względem PLN z exchangerate-api.com
 */
async function fetchAllRatesFromPLN(): Promise<ExchangeRateResponse[]> {
  const rates: ExchangeRateResponse[] = [];
  const today = new Date().toISOString().split("T")[0];

  try {
    // Pobierz wszystkie kursy względem PLN
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/PLN", {
      cache: "no-store", // Pobierz aktualne kursy
    });

    if (!response.ok) {
      throw new Error(`ExchangeRate API error: ${response.status}`);
    }

    const data: ExchangeRateAPIResponse = await response.json();

    // Konwertuj wszystkie kursy na format ExchangeRateResponse
    // data.rates zawiera kursy: { USD: 0.25, EUR: 0.23, ... } (ile PLN = 1 USD, czyli 1 PLN = 0.25 USD)
    // Dla formatu fromCurrency/toCurrency potrzebujemy: 1 USD = ? PLN, więc odwracamy
    for (const [currency, rate] of Object.entries(data.rates)) {
      // Pomiń XDR i PLN (PLN nie powinien być w rates, ale na wszelki wypadek)
      if (currency === "XDR" || currency === "PLN") continue;
      
      // rate to ile PLN = 1 currency (np. 0.25 dla USD oznacza 1 PLN = 0.25 USD)
      // Więc 1 currency = 1/rate PLN (np. 1 USD = 4 PLN)
      rates.push({
        fromCurrency: currency,
        toCurrency: "PLN",
        rate: 1 / rate, // 1 currency = (1/rate) PLN
        effectiveDate: data.date || today,
        source: "exchangerate-api",
      });
    }
  } catch (error) {
    console.error("Error fetching exchange rates from exchangerate-api:", error);
  }

  return rates;
}

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate co godzinę

export async function GET() {
  try {
    // Pobierz wszystkie kursy względem PLN
    const rates = await fetchAllRatesFromPLN();
    
    // Pobierz listę wszystkich dostępnych walut (base + wszystkie z rates)
    // Upewnij się, że PLN nie jest duplikowany
    const allCurrencies = new Set<string>(["PLN"]);
    rates.forEach((rate) => {
      if (rate.fromCurrency !== "PLN") {
        allCurrencies.add(rate.fromCurrency);
      }
    });

    return NextResponse.json({
      success: true,
      rates: rates,
      baseCurrency: "PLN",
      date: new Date().toISOString().split("T")[0],
      availableCurrencies: Array.from(allCurrencies).sort(),
    });
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch exchange rates",
      },
      { status: 500 }
    );
  }
}
