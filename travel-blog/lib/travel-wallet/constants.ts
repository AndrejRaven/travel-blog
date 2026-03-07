/**
 * Symbole walut używane w aplikacji
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  PLN: "zł",
  EUR: "€",
  USD: "$",
  GBP: "£",
  THB: "฿",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
};

/**
 * Etykiety typów transakcji walutowych
 */
export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  exchange: "Wymiana",
  withdrawal: "Wypłata z bankomatu",
  initial: "Stan początkowy",
};

/** Typy noclegów – używane gdy category === "Noclegi" */
export const ACCOMMODATION_TYPES: Record<string, string> = {
  hotel: "Hotel",
  hostel: "Hostel",
  namiot: "Namiot / na dziko",
  kemping: "Kemping",
  w_drodze: "W drodze",
  guesthouse: "Guesthouse / pensjonat",
  zaproszenie: "Zaproszenie",
};

/** Typy noclegów, dla których dozwolona jest kwota 0 zł */
export const ACCOMMODATION_TYPES_ALLOWING_ZERO: string[] = ["namiot", "kemping"];

/** Etykieta typu noclegu (dla wyświetlania w UI) */
export function getAccommodationLabel(type?: string): string {
  if (!type) return "";
  return ACCOMMODATION_TYPES[type] ?? type;
}

/** Tekst kategorii do wyświetlenia (Noclegi + typ np. "Noclegi (Namiot)") */
export function getExpenseCategoryDisplay(category: string, accommodationType?: string): string {
  if (category !== "Noclegi" || !accommodationType) return category;
  const label = getAccommodationLabel(accommodationType);
  return label ? `${category} (${label})` : category;
}
