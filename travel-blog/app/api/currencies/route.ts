import { NextResponse } from "next/server";

/**
 * Pobiera pełną listę wszystkich dostępnych walut z exchangerate-api.com
 */

interface ExchangeRateAPIResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface CurrencyInfo {
  code: string;
  name?: string;
}

export const dynamic = "force-dynamic";
export const revalidate = 86400; // Revalidate co 24h (waluty rzadko się zmieniają)

export async function GET() {
  try {
    // Pobierz kursy względem PLN - to da nam listę wszystkich dostępnych walut
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/PLN", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`ExchangeRate API error: ${response.status}`);
    }

    const data: ExchangeRateAPIResponse = await response.json();

    // Pobierz wszystkie dostępne waluty (base + wszystkie z rates)
    const currencySet = new Set<string>();
    currencySet.add(data.base); // PLN

    // Dodaj wszystkie waluty z rates (unikaj duplikatów, XDR i PLN)
    for (const currency of Object.keys(data.rates)) {
      if (currency !== "XDR" && currency !== "PLN") {
        currencySet.add(currency);
      }
    }

    // Konwertuj na tablicę i sortuj alfabetycznie
    const currencies: CurrencyInfo[] = Array.from(currencySet)
      .map(code => ({ code }))
      .sort((a, b) => a.code.localeCompare(b.code));

    return NextResponse.json({
      success: true,
      currencies: currencies,
      date: data.date || new Date().toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Error fetching currencies:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch currencies",
      },
      { status: 500 }
    );
  }
}
