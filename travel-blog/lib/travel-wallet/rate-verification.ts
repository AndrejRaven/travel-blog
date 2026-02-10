import type { ExchangeRate } from "./types";
import { getReferenceRate } from "./reference-rates";

export interface RateVerificationResult {
  isValid: boolean;
  transactionRate: number;
  referenceRate: number | null;
  differencePercent: number | null;
  isAboveLimit: boolean;
  isBelowLimit: boolean;
}

/**
 * Weryfikuje czy kurs transakcji nie odbiega o więcej niż 10% od kursu z API
 * @param transactionRate - kurs wprowadzony przez użytkownika (toAmount / fromAmount)
 * @param fromCurrency - waluta źródłowa
 * @param toCurrency - waluta docelowa
 * @param referenceRates - kursy referencyjne z API
 * @param date - opcjonalna data transakcji (domyślnie używa najnowszego kursu)
 * @returns wynik weryfikacji z informacją czy kurs jest w granicach ±10%
 */
export function verifyExchangeRate(
  transactionRate: number,
  fromCurrency: string,
  toCurrency: string,
  referenceRates: ExchangeRate[],
  date?: string
): RateVerificationResult {
  // Pobierz kurs referencyjny z API
  // Jeśli data jest w przyszłości, użyj najnowszego kursu (bez filtrowania po dacie)
  const referenceRate = getReferenceRate(
    referenceRates,
    fromCurrency,
    toCurrency,
    date && new Date(date) <= new Date() ? date : undefined
  );

  // Jeśli nie ma kursu referencyjnego, nie można zweryfikować - uznajemy za NIE ważne
  // (wymagamy weryfikacji przez użytkownika)
  if (referenceRate === null) {
    return {
      isValid: false, // Zmienione z true na false - wymagamy weryfikacji
      transactionRate,
      referenceRate: null,
      differencePercent: null,
      isAboveLimit: false,
      isBelowLimit: false,
    };
  }

  // Oblicz różnicę procentową
  const differencePercent = ((transactionRate - referenceRate) / referenceRate) * 100;

  // Sprawdź czy kurs jest w granicach ±10%
  const isValid = Math.abs(differencePercent) <= 10;
  const isAboveLimit = differencePercent > 10;
  const isBelowLimit = differencePercent < -10;

  return {
    isValid,
    transactionRate,
    referenceRate,
    differencePercent,
    isAboveLimit,
    isBelowLimit,
  };
}
