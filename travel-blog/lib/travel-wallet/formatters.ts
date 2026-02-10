/**
 * Formatuje kwotę walutową
 * @param amount - kwota do sformatowania
 * @param currency - kod waluty (opcjonalny, domyślnie PLN)
 * @returns sformatowana kwota jako string
 */
export function formatCurrency(
  amount: number,
  currency: string = "PLN"
): string {
  const formatted = new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  // Dla niektórych walut symbol jest po liczbie
  if (currency === "PLN" || currency === "THB" || currency === "JPY") {
    return `${formatted} ${currency === "PLN" ? "zł" : currency === "THB" ? "฿" : "¥"}`;
  }

  // Dla innych walut symbol jest przed liczbą
  const symbols: Record<string, string> = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    AUD: "A$",
    CAD: "C$",
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${formatted}`;
}

/**
 * Formatuje kwotę liczbową bez symbolu waluty (dla statystyk)
 * @param amount - kwota do sformatowania
 * @returns sformatowana kwota jako string
 */
export function formatCurrencyAmount(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatuje datę
 * @param dateString - data w formacie ISO (YYYY-MM-DD) lub undefined
 * @param options - opcjonalne opcje formatowania Intl.DateTimeFormat
 * @returns sformatowana data jako string lub "—" jeśli brak daty
 */
export function formatDate(
  dateString?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  return date.toLocaleDateString("pl-PL", options || defaultOptions);
}

/**
 * Formatuje datę z godziną (dla transakcji)
 * @param dateStr - data w formacie ISO (YYYY-MM-DD)
 * @param time - czas w formacie HH:mm (opcjonalny)
 * @returns sformatowana data z godziną jako string
 */
export function formatDateWithTime(dateStr: string, time?: string): string {
  if (time) {
    const [hours, minutes] = time.split(":");
    const date = new Date(dateStr);
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Formatuje datę w krótkim formacie (np. dla timeline)
 * @param dateString - data w formacie ISO (YYYY-MM-DD) lub undefined
 * @returns sformatowana data jako string lub "—" jeśli brak daty
 */
export function formatDateShort(dateString?: string): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  });
}
