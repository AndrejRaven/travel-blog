import type { Expense } from "./types";
import { formatDate, formatCurrency, formatExpenseDateRange } from "./formatters";
import { getCountryById } from "./countries";
import { getAccommodationLabel } from "./constants";

/**
 * Eksportuje wydatki do formatu CSV
 */
export function exportExpensesToCSV(
  expenses: Expense[],
  tripId: string,
  filename: string = "wydatki.csv"
): void {
  if (expenses.length === 0) {
    return;
  }

  const headers = [
    "Data",
    "Opis",
    "Kategoria",
    "Typ noclegu",
    "Kraj",
    "Lokalizacja",
    "Kwota",
    "Waluta",
    "Notatka",
  ];

  const rows = expenses.map((expense) => {
    const country = getCountryById(expense.countryId, tripId);
    const accommodationLabel =
      expense.category === "Noclegi" && expense.accommodationType
        ? getAccommodationLabel(expense.accommodationType)
        : "";
    return [
      formatExpenseDateRange(expense),
      escapeCSV(expense.description || ""),
      escapeCSV(expense.category),
      escapeCSV(accommodationLabel),
      escapeCSV(country?.name || ""),
      escapeCSV(expense.location || ""),
      expense.amount.toString().replace(".", ","),
      expense.currency,
      escapeCSV(expense.note || ""),
    ];
  });

  // Łączenie nagłówków i wierszy
  const csvContent = [
    headers.join(";"),
    ...rows.map((row) => row.join(";")),
  ].join("\n");

  // Dodaj BOM dla UTF-8 (dla polskich znaków w Excel)
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

  // Utwórz link do pobrania
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Escapuje wartości dla CSV (obsługa cudzysłowów i średników)
 */
function escapeCSV(value: string): string {
  if (value.includes(";") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Formatuje wydatki do druku
 */
export function formatExpensesForPrint(expenses: Expense[], tripId: string): string {
  if (expenses.length === 0) {
    return "Brak wydatków do wyświetlenia.";
  }

  const lines: string[] = [];
  lines.push("LISTA WYDATKÓW");
  lines.push("=".repeat(50));
  lines.push("");

  const totalByCurrency: Record<string, number> = {};

  expenses.forEach((expense) => {
    const country = getCountryById(expense.countryId, tripId);
    const amount = formatCurrency(expense.amount, expense.currency);
    
    lines.push(`Data: ${formatExpenseDateRange(expense)}`);
    lines.push(`Opis: ${expense.description || "-"}`);
    lines.push(`Kategoria: ${expense.category}`);
    lines.push(`Kraj: ${country?.name || "-"}`);
    if (expense.location) {
      lines.push(`Lokalizacja: ${expense.location}`);
    }
    lines.push(`Kwota: ${amount}`);
    if (expense.note) {
      lines.push(`Notatka: ${expense.note}`);
    }
    lines.push("-".repeat(50));

    totalByCurrency[expense.currency] = 
      (totalByCurrency[expense.currency] || 0) + expense.amount;
  });

  lines.push("");
  lines.push("PODSUMOWANIE:");
  Object.entries(totalByCurrency)
    .sort((a, b) => b[1] - a[1])
    .forEach(([currency, total]) => {
      lines.push(`${currency}: ${formatCurrency(total, currency)}`);
    });

  return lines.join("\n");
}
