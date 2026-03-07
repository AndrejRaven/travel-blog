/**
 * Formatuje kwotę walutową
 * @param amount - kwota do sformatowania
 * @param currency - kod waluty (opcjonalny, domyślnie PLN)
 * @param fractionDigits - liczba miejsc po przecinku (domyślnie 2 dla wszystkich walut)
 * @returns sformatowana kwota jako string
 */
export function formatCurrency(
  amount: number,
  currency: string = "PLN",
  fractionDigits?: number
): string {
  // Domyślnie zawsze używaj 2 miejsc po przecinku dla wszystkich walut
  const defaultFractionDigits = fractionDigits !== undefined ? fractionDigits : 2;
  
  const formatted = new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: defaultFractionDigits,
    maximumFractionDigits: defaultFractionDigits,
  }).format(Math.abs(amount));

  // Dla niektórych walut symbol jest po liczbie
  if (currency === "PLN" || currency === "THB" || currency === "JPY") {
    return `${formatted} ${currency === "PLN" ? "zł" : currency === "THB" ? "฿" : "¥"}`;
  }

  // Dla innych walut symbol jest przed liczbą; kod waluty (np. NOK) ze spacją przed kwotą
  const symbols: Record<string, string> = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    AUD: "A$",
    CAD: "C$",
  };
  const symbol = symbols[currency] || currency;
  const space = symbol.length <= 3 && symbol === symbol.toUpperCase() ? " " : "";
  return `${symbol}${space}${formatted}`;
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
 * Formatuje kwotę liczbową bez spacji (dla kompaktowych wyświetleń)
 * @param amount - kwota do sformatowania
 * @returns sformatowana kwota jako string bez spacji
 */
export function formatCurrencyCompact(amount: number): string {
  return Math.abs(amount).toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false, // Bez separatorów tysięcy
  });
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

/**
 * Formatuje zakres dat wydatku (jedna data lub zakres gdy endDate).
 * @param expense - wydatek z date i opcjonalnie endDate
 * @returns np. "1 maja 2025" lub "1–3 maja 2025"
 */
export function formatExpenseDateRange(expense: {
  date: string;
  endDate?: string;
}): string {
  if (!expense.date) return "—";
  if (!expense.endDate || expense.endDate === expense.date) {
    return formatDate(expense.date);
  }
  const start = new Date(expense.date);
  const end = new Date(expense.endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return formatDate(expense.date);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${end.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}`;
  }
  return `${formatDate(expense.date)} – ${formatDate(expense.endDate)}`;
}
