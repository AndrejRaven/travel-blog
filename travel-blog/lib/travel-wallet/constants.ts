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
