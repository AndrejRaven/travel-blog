"use client";

import { useMemo, useState, useRef, useEffect, use } from "react";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import BackToHome from "@/components/shared/BackToHome";
import { getActivityLogs, type ActivityLogType, type ActivityLog } from "@/lib/travel-wallet/activity-log";
import { useTripData } from "@/lib/travel-wallet/hooks/useTripData";
import { getExpenseById } from "@/lib/travel-wallet/expenses";
import { getCurrencyTransactionById } from "@/lib/travel-wallet/currency-transactions";
import { getExpenseCategoryDisplay } from "@/lib/travel-wallet/constants";
import { formatExpenseDateRange } from "@/lib/travel-wallet/formatters";
import { getTripById } from "@/lib/travel-wallet/trips-storage";
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Globe, 
  Calendar,
  ArrowLeft,
  Filter,
  X,
  Check,
  ChevronDown
} from "lucide-react";
import Link from "@/components/ui/Link";
import DatePicker from "@/components/ui/DatePicker";

const logTypeConfig: Record<ActivityLogType, { icon: typeof Plus; label: string; color: string }> = {
  expense_added: {
    icon: Plus,
    label: "Dodano wydatek",
    color: "text-green-600 dark:text-green-400",
  },
  expense_edited: {
    icon: Edit,
    label: "Edytowano wydatek",
    color: "text-blue-600 dark:text-blue-400",
  },
  expense_deleted: {
    icon: Trash2,
    label: "Usunięto wydatek",
    color: "text-red-600 dark:text-red-400",
  },
  country_added: {
    icon: Globe,
    label: "Dodano kraj",
    color: "text-green-600 dark:text-green-400",
  },
  country_edited: {
    icon: Edit,
    label: "Edytowano kraj",
    color: "text-blue-600 dark:text-blue-400",
  },
  country_deleted: {
    icon: Trash2,
    label: "Usunięto kraj",
    color: "text-red-600 dark:text-red-400",
  },
  location_added: {
    icon: MapPin,
    label: "Dodano miejsce",
    color: "text-green-600 dark:text-green-400",
  },
  location_edited: {
    icon: Edit,
    label: "Edytowano miejsce",
    color: "text-blue-600 dark:text-blue-400",
  },
  location_deleted: {
    icon: Trash2,
    label: "Usunięto miejsce",
    color: "text-red-600 dark:text-red-400",
  },
  trip_edited: {
    icon: Calendar,
    label: "Edytowano podróż",
    color: "text-blue-600 dark:text-blue-400",
  },
  currency_transaction_added: {
    icon: Plus,
    label: "Dodano transakcję walutową",
    color: "text-green-600 dark:text-green-400",
  },
  currency_transaction_edited: {
    icon: Edit,
    label: "Edytowano transakcję walutową",
    color: "text-blue-600 dark:text-blue-400",
  },
  currency_transaction_deleted: {
    icon: Trash2,
    label: "Usunięto transakcję walutową",
    color: "text-red-600 dark:text-red-400",
  },
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate || !endDate) return "";
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

// Mapowanie kluczy na czytelne etykiety
const fieldLabels: Record<string, string> = {
  // Trip fields
  name: "Nazwa",
  startDate: "Data rozpoczęcia",
  endDate: "Data zakończenia",
  totalBudget: "Całkowity budżet",
  userName: "Nazwa użytkownika",
  // Expense fields
  amount: "Kwota",
  currency: "Waluta",
  category: "Kategoria",
  description: "Opis",
  date: "Data",
  location: "Miejsce",
};

function getFieldLabel(key: string): string {
  return fieldLabels[key] || key;
}

interface LogDetails {
  items: Array<{ 
    label: string; 
    value: string;
    isDiff?: boolean; // Czy to jest diff (zmiana wartości)
    oldValue?: string; // Stara wartość (dla diff)
    newValue?: string; // Nowa wartość (dla diff)
  }>;
}

/**
 * Wykrywa które pola się zmieniły między starą a nową wartością
 */
function getChangedFields(
  old: NonNullable<ActivityLog["snapshot"]>["old"],
  newVal: NonNullable<ActivityLog["snapshot"]>["new"]
): Set<string> {
  const changed = new Set<string>();
  if (!old || !newVal) return changed;
  
  if (old.amount !== newVal.amount || old.currency !== newVal.currency) {
    changed.add("amount");
  }
  if (old.description !== newVal.description) changed.add("description");
  if (old.date !== newVal.date) changed.add("date");
  if (old.category !== newVal.category) changed.add("category");
  if (old.location !== newVal.location) changed.add("location");
  if (old.countryId !== newVal.countryId) changed.add("countryId");
  if (old.note !== newVal.note) changed.add("note");
  
  return changed;
}

function getLogDetailsExtended(log: ActivityLog, tripId: string): LogDetails {
  const items: LogDetails["items"] = [];

  // Formatuj kwotę - jeśli jest liczbą całkowitą, pokaż bez miejsc po przecinku
  const formatAmount = (value: number): string => {
    // Jeśli jest bardzo blisko liczby całkowitej (w granicach 0.001), pokaż jako liczbę całkowitą
    const rounded = Math.round(value * 100) / 100;
    if (Math.abs(rounded - Math.round(rounded)) < 0.001) {
      return Math.round(rounded).toString();
    }
    // W przeciwnym razie pokaż z 2 miejscami po przecinku
    return rounded.toFixed(2);
  };

  switch (log.type) {
    case "expense_added":
    case "expense_deleted": {
      // Dla dodania i usunięcia używaj aktualnych danych
      const expense = getExpenseById(log.entityId, tripId);
      if (!expense) break;
      
      const trip = getTripById(tripId);
      const country = trip?.data.countries.find(c => c.id === expense.countryId);
      const countryName = country?.name || "Nieznany kraj";
      
      items.push({ label: "Kraj", value: countryName });
      items.push({ label: "Kwota", value: `${formatAmount(expense.amount)} ${expense.currency}` });
      if (expense.description) {
        items.push({ label: "Opis", value: expense.description });
      }
      items.push({ label: "Data", value: formatExpenseDateRange(expense) });
      if (expense.location) {
        items.push({ label: "Miejsce", value: expense.location });
      }
      if (expense.category) {
        items.push({ label: "Kategoria", value: getExpenseCategoryDisplay(expense.category, expense.accommodationType) });
      }
      if (expense.note) {
        items.push({ label: "Notatka", value: expense.note });
      }
      
      break;
    }
    case "expense_edited": {
      // Dla edycji używaj diff view - pokaż tylko zmienione pola
      const snapshot = log.snapshot;
      if (!snapshot?.old) {
        // Fallback do aktualnych danych jeśli brak snapshot
        const expense = getExpenseById(log.entityId, tripId);
        if (!expense) break;
        
        const trip = getTripById(tripId);
        const country = trip?.data.countries.find(c => c.id === expense.countryId);
        const countryName = country?.name || "Nieznany kraj";
        
        items.push({ label: "Kraj", value: countryName });
        items.push({ label: "Kwota", value: `${formatAmount(expense.amount)} ${expense.currency}` });
        if (expense.description) {
          items.push({ label: "Opis", value: expense.description });
        }
        items.push({ label: "Data", value: formatExpenseDateRange(expense) });
        if (expense.location) {
          items.push({ label: "Miejsce", value: expense.location });
        }
        if (expense.category) {
          items.push({ label: "Kategoria", value: getExpenseCategoryDisplay(expense.category, expense.accommodationType) });
        }
        if (expense.note) {
          items.push({ label: "Notatka", value: expense.note });
        }
        break;
      }
      
      const oldExpense = snapshot.old;
      const newExpense = snapshot.new;
      
      // Jeśli brak nowej wartości, pobierz aktualną
      const currentExpense = newExpense || getExpenseById(log.entityId, tripId);
      const finalNewExpense = newExpense || (currentExpense ? {
        amount: currentExpense.amount,
        currency: currentExpense.currency,
        description: currentExpense.description,
        date: currentExpense.date,
        category: currentExpense.category,
        countryId: currentExpense.countryId,
        location: currentExpense.location,
        note: currentExpense.note,
      } : null);
      
      if (!finalNewExpense) break;
      
      const changedFields = getChangedFields(oldExpense, finalNewExpense);
      const trip = getTripById(tripId);
      
      // Kraj
      const oldCountry = trip?.data.countries.find(c => c.id === oldExpense.countryId);
      const newCountry = trip?.data.countries.find(c => c.id === finalNewExpense.countryId);
      const oldCountryName = oldCountry?.name || "Nieznany kraj";
      const newCountryName = newCountry?.name || "Nieznany kraj";
      
      if (changedFields.has("countryId")) {
        items.push({
          label: "Kraj",
          value: `${oldCountryName} → ${newCountryName}`,
          isDiff: true,
          oldValue: oldCountryName,
          newValue: newCountryName,
        });
      } else {
        items.push({ label: "Kraj", value: oldCountryName });
      }
      
      // Kwota - ZAWSZE pokazuj (minimum)
      if (changedFields.has("amount")) {
        const oldAmountStr = `${formatAmount(oldExpense.amount ?? 0)} ${oldExpense.currency ?? "PLN"}`;
        const newAmountStr = `${formatAmount(finalNewExpense.amount ?? 0)} ${finalNewExpense.currency ?? "PLN"}`;
        items.push({
          label: "Kwota",
          value: `${oldAmountStr} → ${newAmountStr}`,
          isDiff: true,
          oldValue: oldAmountStr,
          newValue: newAmountStr,
        });
      } else {
        // Jeśli nie ma zmian, pokaż aktualną wartość
        items.push({ 
          label: "Kwota", 
          value: `${formatAmount(oldExpense.amount ?? 0)} ${oldExpense.currency ?? "PLN"}` 
        });
      }
      
      // Opis
      if (changedFields.has("description")) {
        items.push({
          label: "Opis",
          value: `${oldExpense.description || "(brak)"} → ${finalNewExpense.description || "(brak)"}`,
          isDiff: true,
          oldValue: oldExpense.description || "(brak)",
          newValue: finalNewExpense.description || "(brak)",
        });
      } else if (oldExpense.description) {
        items.push({ label: "Opis", value: oldExpense.description });
      }
      
      // Data - ZAWSZE pokazuj (minimum)
      if (changedFields.has("date")) {
        const oldDateStr = oldExpense.date ? formatDate(oldExpense.date) : "(brak)";
        const newDateStr = finalNewExpense.date ? formatDate(finalNewExpense.date) : "(brak)";
        items.push({
          label: "Data",
          value: `${oldDateStr} → ${newDateStr}`,
          isDiff: true,
          oldValue: oldDateStr,
          newValue: newDateStr,
        });
      } else {
        // Jeśli nie ma zmian, pokaż aktualną datę
        items.push({ 
          label: "Data", 
          value: oldExpense.date ? formatDate(oldExpense.date) : "(brak)" 
        });
      }
      
      // Miejsce
      if (changedFields.has("location")) {
        items.push({
          label: "Miejsce",
          value: `${oldExpense.location || "(brak)"} → ${finalNewExpense.location || "(brak)"}`,
          isDiff: true,
          oldValue: oldExpense.location || "(brak)",
          newValue: finalNewExpense.location || "(brak)",
        });
      } else if (oldExpense.location) {
        items.push({ label: "Miejsce", value: oldExpense.location });
      }
      
      const oldCatDisplay = getExpenseCategoryDisplay(oldExpense.category || "", oldExpense.accommodationType) || "(brak)";
      const newCatDisplay = getExpenseCategoryDisplay(finalNewExpense.category || "", finalNewExpense.accommodationType) || "(brak)";
      if (changedFields.has("category") || (oldExpense.accommodationType !== finalNewExpense.accommodationType && (oldExpense.category === "Noclegi" || finalNewExpense.category === "Noclegi"))) {
        items.push({
          label: "Kategoria",
          value: `${oldCatDisplay} → ${newCatDisplay}`,
          isDiff: true,
          oldValue: oldCatDisplay,
          newValue: newCatDisplay,
        });
      } else {
        items.push({ label: "Kategoria", value: oldCatDisplay });
      }
      
      // Notatka
      if (changedFields.has("note")) {
        items.push({
          label: "Notatka",
          value: `${oldExpense.note || "(brak)"} → ${finalNewExpense.note || "(brak)"}`,
          isDiff: true,
          oldValue: oldExpense.note || "(brak)",
          newValue: finalNewExpense.note || "(brak)",
        });
      } else if (oldExpense.note) {
        items.push({ label: "Notatka", value: oldExpense.note });
      }
      
      break;
    }
    
    case "country_added":
    case "country_edited":
    case "country_deleted": {
      const trip = getTripById(tripId);
      const country = trip?.data.countries.find(c => c.id === log.entityId);
      
      if (!country) break; // If country not found, skip
      
      items.push({ label: "Kraj", value: country.name });
      if (country.startDate && country.endDate) {
        items.push({ label: "Zakres dat", value: formatDateRange(country.startDate, country.endDate) });
      }
      
      break;
    }
    
    case "location_added":
    case "location_edited":
    case "location_deleted": {
      if (!log.entityId || !log.entityId.includes(":")) break;
      
      const [countryId, locationName] = log.entityId.split(":");
      
      const trip = getTripById(tripId);
      const country = trip?.data.countries.find(c => c.id === countryId);
      
      if (!country) break; // If country not found, skip
      
      const countryName = country.name;
      
      // Try to find location in country
      const location = country.locations?.find(l => {
        const locName = typeof l === "string" ? l : l.name;
        return locName === locationName;
      });
      
      if (location) {
        const loc = typeof location === "string" ? { name: location, startDate: "", endDate: "" } : location;
        items.push({ label: "Miejsce", value: loc.name });
        items.push({ label: "Kraj", value: countryName });
        if (loc.startDate && loc.endDate) {
          items.push({ label: "Zakres dat", value: formatDateRange(loc.startDate, loc.endDate) });
        }
      } else {
        items.push({ label: "Miejsce", value: locationName });
        items.push({ label: "Kraj", value: countryName });
      }
      
      break;
    }
    
    case "trip_edited": {
      const trip = getTripById(tripId);
      
      if (!trip) break; // If trip not found, skip
      
      items.push({ label: "Podróż", value: trip.name });
      
      break;
    }
    
    case "currency_transaction_edited": {
      const oldTransaction = log.snapshot?.old;
      const newTransaction = log.snapshot?.new;
      
      if (!oldTransaction && !newTransaction) {
        // Fallback: pobierz aktualną transakcję
        const transaction = getCurrencyTransactionById(tripId, log.entityId);
        if (transaction) {
          items.push({ label: "Z", value: `${formatAmount(transaction.fromAmount)} ${transaction.fromCurrency}` });
          items.push({ label: "Na", value: `${formatAmount(transaction.toAmount)} ${transaction.toCurrency}` });
        }
        break;
      }
      
      // Wyświetl diff dla edytowanych pól
      const changedFields = new Set<string>();
      
      if (oldTransaction && newTransaction) {
        if (oldTransaction.amount !== newTransaction.amount || oldTransaction.currency !== newTransaction.currency) {
          changedFields.add("fromAmount");
          changedFields.add("fromCurrency");
        }
        if (oldTransaction.description !== newTransaction.description) {
          changedFields.add("description");
        }
        if (oldTransaction.date !== newTransaction.date) {
          changedFields.add("date");
        }
        if (oldTransaction.location !== newTransaction.location) {
          changedFields.add("location");
        }
        if (oldTransaction.countryId !== newTransaction.countryId) {
          changedFields.add("countryId");
        }
      }
      
      // Z waluty
      if (oldTransaction && newTransaction && changedFields.has("fromAmount")) {
        const oldValue = `${formatAmount(oldTransaction.amount ?? 0)} ${oldTransaction.currency ?? "PLN"}`;
        const newValue = `${formatAmount(newTransaction.amount ?? 0)} ${newTransaction.currency ?? "PLN"}`;
        items.push({
          label: "Z",
          value: `${oldValue} → ${newValue}`,
          isDiff: true,
          oldValue,
          newValue,
        });
      } else if (oldTransaction) {
        items.push({ 
          label: "Z", 
          value: `${formatAmount(oldTransaction.amount ?? 0)} ${oldTransaction.currency ?? "PLN"}` 
        });
      } else if (newTransaction) {
        items.push({ 
          label: "Z", 
          value: `${formatAmount(newTransaction.amount ?? 0)} ${newTransaction.currency ?? "PLN"}` 
        });
      }
      
      // Na walutę - ZAWSZE pokazuj
      if (oldTransaction && newTransaction && (changedFields.has("fromAmount") || oldTransaction.toAmount !== newTransaction.toAmount || oldTransaction.toCurrency !== newTransaction.toCurrency)) {
        const oldToValue = `${formatAmount(oldTransaction.toAmount ?? 0)} ${oldTransaction.toCurrency ?? ""}`;
        const newToValue = `${formatAmount(newTransaction.toAmount ?? 0)} ${newTransaction.toCurrency ?? ""}`;
        if (oldToValue !== newToValue) {
          items.push({
            label: "Na",
            value: `${oldToValue} → ${newToValue}`,
            isDiff: true,
            oldValue: oldToValue,
            newValue: newToValue,
          });
        } else {
          items.push({ label: "Na", value: oldToValue });
        }
      } else if (oldTransaction?.toAmount && oldTransaction?.toCurrency) {
        items.push({ 
          label: "Na", 
          value: `${formatAmount(oldTransaction.toAmount)} ${oldTransaction.toCurrency}` 
        });
      } else if (newTransaction?.toAmount && newTransaction?.toCurrency) {
        items.push({ 
          label: "Na", 
          value: `${formatAmount(newTransaction.toAmount)} ${newTransaction.toCurrency}` 
        });
      }
      
      // Data
      if (oldTransaction && newTransaction && changedFields.has("date")) {
        const oldDateStr = oldTransaction.date ? formatDate(oldTransaction.date) : "(brak)";
        const newDateStr = newTransaction.date ? formatDate(newTransaction.date) : "(brak)";
        items.push({
          label: "Data",
          value: `${oldDateStr} → ${newDateStr}`,
          isDiff: true,
          oldValue: oldDateStr,
          newValue: newDateStr,
        });
      } else if (oldTransaction?.date) {
        items.push({ label: "Data", value: formatDate(oldTransaction.date) });
      } else if (newTransaction?.date) {
        items.push({ label: "Data", value: formatDate(newTransaction.date) });
      }
      
      // Miejsce
      if (oldTransaction && newTransaction && changedFields.has("location")) {
        items.push({
          label: "Miejsce",
          value: `${oldTransaction.location || "(brak)"} → ${newTransaction.location || "(brak)"}`,
          isDiff: true,
          oldValue: oldTransaction.location || "(brak)",
          newValue: newTransaction.location || "(brak)",
        });
      } else if (oldTransaction?.location) {
        items.push({ label: "Miejsce", value: oldTransaction.location });
      } else if (newTransaction?.location) {
        items.push({ label: "Miejsce", value: newTransaction.location });
      }
      
      // Kraj
      if (oldTransaction && newTransaction && changedFields.has("countryId")) {
        const trip = getTripById(tripId);
        const oldCountry = trip?.data.countries.find(c => c.id === oldTransaction.countryId);
        const newCountry = trip?.data.countries.find(c => c.id === newTransaction.countryId);
        const oldCountryName = oldCountry?.name || oldTransaction.countryId || "(brak)";
        const newCountryName = newCountry?.name || newTransaction.countryId || "(brak)";
        items.push({
          label: "Kraj",
          value: `${oldCountryName} → ${newCountryName}`,
          isDiff: true,
          oldValue: oldCountryName,
          newValue: newCountryName,
        });
      } else if (oldTransaction?.countryId) {
        const trip = getTripById(tripId);
        const country = trip?.data.countries.find(c => c.id === oldTransaction.countryId);
        if (country) {
          items.push({ label: "Kraj", value: country.name });
        }
      } else if (newTransaction?.countryId) {
        const trip = getTripById(tripId);
        const country = trip?.data.countries.find(c => c.id === newTransaction.countryId);
        if (country) {
          items.push({ label: "Kraj", value: country.name });
        }
      }
      
      break;
    }
    
    case "currency_transaction_added": {
      // Spróbuj najpierw użyć snapshot (jeśli dostępny)
      if (log.snapshot?.toAmount && log.snapshot?.toCurrency) {
        items.push({ label: "Z", value: `${formatAmount(log.snapshot?.amount ?? 0)} ${log.snapshot?.currency ?? "PLN"}` });
        items.push({ label: "Na", value: `${formatAmount(log.snapshot?.toAmount)} ${log.snapshot?.toCurrency}` });
        if (log.snapshot?.date) {
          items.push({ label: "Data", value: formatDate(log.snapshot.date) });
        }
        if (log.snapshot?.location) {
          items.push({ label: "Miejsce", value: log.snapshot.location });
        }
        if (log.snapshot?.countryId) {
          const trip = getTripById(tripId);
          const country = trip?.data.countries.find(c => c.id === log.snapshot?.countryId);
          if (country) {
            items.push({ label: "Kraj", value: country.name });
          }
        }
      } else {
        // Fallback: pobierz transakcję z storage
        const transaction = getCurrencyTransactionById(tripId, log.entityId);
        if (transaction) {
          items.push({ label: "Z", value: `${formatAmount(transaction.fromAmount)} ${transaction.fromCurrency}` });
          items.push({ label: "Na", value: `${formatAmount(transaction.toAmount)} ${transaction.toCurrency}` });
          if (transaction.fee && transaction.feeCurrency) {
            items.push({ label: "Prowizja", value: `${formatAmount(transaction.fee)} ${transaction.feeCurrency}` });
          }
          if (transaction.date) {
            items.push({ label: "Data", value: formatDate(transaction.date) });
          }
          if (transaction.location) {
            items.push({ label: "Miejsce", value: transaction.location });
          }
          if (transaction.note) {
            items.push({ label: "Notatka", value: transaction.note });
          }
        }
      }
      break;
    }
    
    case "currency_transaction_deleted": {
      const transaction = getCurrencyTransactionById(tripId, log.entityId);
      if (!transaction) break; // If transaction not found, skip
      
      items.push({ label: "Z", value: `${formatAmount(transaction.fromAmount)} ${transaction.fromCurrency}` });
      items.push({ label: "Na", value: `${formatAmount(transaction.toAmount)} ${transaction.toCurrency}` });
      if (transaction.fee && transaction.feeCurrency) {
        items.push({ label: "Prowizja", value: `${formatAmount(transaction.fee)} ${transaction.feeCurrency}` });
      }
      if (transaction.date) {
        items.push({ label: "Data", value: formatDate(transaction.date) });
      }
      if (transaction.location) {
        items.push({ label: "Miejsce", value: transaction.location });
      }
      if (transaction.note) {
        items.push({ label: "Notatka", value: transaction.note });
      }
      
      break;
    }
  }

  return { items };
}

export default function ActivityLogsPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const { trip, isLoading, status } = useTripData(resolvedParams.slug);
  const [selectedFilters, setSelectedFilters] = useState<Set<ActivityLogType>>(new Set());
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Zamknij menu po kliknięciu poza nim
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setIsFilterMenuOpen(false);
      }
    }

    if (isFilterMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isFilterMenuOpen]);

  const toggleFilter = (filterType: ActivityLogType) => {
    setSelectedFilters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(filterType)) {
        newSet.delete(filterType);
      } else {
        newSet.add(filterType);
      }
      return newSet;
    });
  };

  const removeFilter = (filterType: ActivityLogType) => {
    setSelectedFilters((prev) => {
      const newSet = new Set(prev);
      newSet.delete(filterType);
      return newSet;
    });
  };

  const clearAllFilters = () => {
    setSelectedFilters(new Set());
    setDateFrom("");
    setDateTo("");
  };

  const logs = useMemo(() => {
    if (!trip) return [];
    let allLogs = getActivityLogs(trip.id);
    
    // Filtrowanie po typie
    if (selectedFilters.size > 0) {
      allLogs = allLogs.filter((log) => selectedFilters.has(log.type));
    }
    
    // Filtrowanie po dacie
    if (dateFrom || dateTo) {
      allLogs = allLogs.filter((log) => {
        const logDate = new Date(log.timestamp);
        const logDateOnly = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
        
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (logDateOnly < fromDate) return false;
        }
        
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (logDateOnly > toDate) return false;
        }
        
        return true;
      });
    }
    
    return allLogs;
  }, [trip, selectedFilters, dateFrom, dateTo]);

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [logs]);

  if (isLoading) {
    return (
      <PageLayout maxWidth="4xl">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Ładowanie danych...</p>
        </div>
      </PageLayout>
    );
  }

  if (!trip) {
    // Specjalny przypadek: podróż widoczna w indeksie, ale brak pełnych danych offline.
    if (status === "offlineIndexOnly") {
      return (
        <PageLayout maxWidth="4xl">
          <div className="text-center py-12">
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Logi zmian dla tej podróży nie są dostępne offline.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Połącz się z internetem, aby zobaczyć historię zmian.
            </p>
          </div>
        </PageLayout>
      );
    }

    return (
      <PageLayout maxWidth="4xl">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Nie udało się załadować danych podróży.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth="4xl">
      <div className="mb-6">
        <Link
          href={`/portfel-podrozniczy/${resolvedParams.slug}`}
          variant="default"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Powrót do podróży
        </Link>
      </div>

      <PageHeader
        title="Logi zmian"
        subtitle={`Historia wszystkich zmian w podróży "${trip.name}"`}
      />

      {/* Filtry - Checkboxy */}
      <div className="mb-6 relative" ref={filterMenuRef}>
        <button
          onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filtruj
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isFilterMenuOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isFilterMenuOpen && (
          <div className="absolute top-full left-0 mt-2 min-w-[700px] max-w-[800px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Filtry po typie */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Typ akcji
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(logTypeConfig).map(([type, config]) => {
                    const Icon = config.icon;
                    const isSelected = selectedFilters.has(type as ActivityLogType);
                    return (
                      <label
                        key={type}
                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <div className="relative flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleFilter(type as ActivityLogType)}
                            className="sr-only"
                          />
                          <div
                            className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                                : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {config.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              
              {/* Filtry po dacie */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Zakres dat
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <DatePicker
                      id="date-from"
                      label="Data od"
                      value={dateFrom}
                      onChange={setDateFrom}
                      max={dateTo || undefined}
                    />
                  </div>
                  <div>
                    <DatePicker
                      id="date-to"
                      label="Data do"
                      value={dateTo}
                      onChange={setDateTo}
                      min={dateFrom || undefined}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Aktywne filtry */}
      {(selectedFilters.size > 0 || dateFrom || dateTo) && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Aktywne filtry:
          </span>
          {Array.from(selectedFilters).map((filterType) => {
            const config = logTypeConfig[filterType];
            return (
              <div
                key={filterType}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
              >
                <config.icon className={`w-3 h-3 ${config.color}`} />
                <span>{config.label}</span>
                <button
                  onClick={() => removeFilter(filterType)}
                  className="hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-full p-0.5 transition-colors"
                  aria-label="Usuń filtr"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
          {dateFrom && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
              <Calendar className="w-3 h-3" />
              <span>Od: {formatDate(dateFrom)}</span>
              <button
                onClick={() => setDateFrom("")}
                className="hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-full p-0.5 transition-colors"
                aria-label="Usuń filtr daty"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {dateTo && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
              <Calendar className="w-3 h-3" />
              <span>Do: {formatDate(dateTo)}</span>
              <button
                onClick={() => setDateTo("")}
                className="hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-full p-0.5 transition-colors"
                aria-label="Usuń filtr daty"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {(selectedFilters.size > 0 || dateFrom || dateTo) && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline"
            >
              Wyczyść wszystkie
            </button>
          )}
        </div>
      )}

      {/* Lista logów */}
      {sortedLogs.length > 0 ? (
        <div className="space-y-3">
          {sortedLogs.map((log) => {
            const config = logTypeConfig[log.type];
            const Icon = config.icon;
            const details = getLogDetailsExtended(log, trip.id);

            return (
              <div
                key={log.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {log.action}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    {details.items.length > 0 && (
                      <div className="space-y-1">
                        {details.items.map((item, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">
                              {item.label}:
                            </span>
                            {item.isDiff && item.oldValue !== undefined && item.newValue !== undefined ? (
                              <span className="flex-1 flex items-center gap-2 flex-wrap">
                                <span className="line-through text-red-600 dark:text-red-400">
                                  {item.oldValue}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">→</span>
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  {item.newValue}
                                </span>
                              </span>
                            ) : (
                              <span className="text-gray-700 dark:text-gray-300 flex-1">
                                {item.value}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            {selectedFilters.size === 0
              ? "Brak logów zmian dla tej podróży"
              : `Brak logów dla wybranych filtrów`}
          </p>
        </div>
      )}

      <BackToHome className="mt-12" />
    </PageLayout>
  );
}
