"use client";

import { useMemo, useState, useRef, useEffect, use } from "react";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import BackToHome from "@/components/shared/BackToHome";
import { getActivityLogs, type ActivityLogType, type ActivityLog } from "@/lib/travel-wallet/activity-log";
import { useTripData } from "@/lib/travel-wallet/hooks/useTripData";
import { getExpenseById } from "@/lib/travel-wallet/expenses";
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
  items: Array<{ label: string; value: string }>;
}

function getLogDetailsExtended(log: ActivityLog, tripId: string): LogDetails {
  const items: Array<{ label: string; value: string }> = [];

  switch (log.type) {
    case "expense_added":
    case "expense_edited":
    case "expense_deleted": {
      const expenseId = log.details.expenseId as string;
      const countryName = log.details.countryName as string;
      const amount = log.details.amount as number;
      const currency = log.details.currency as string;
      const description = log.details.description as string;
      
      // Pobierz wydatek, aby uzyskać datę
      const expense = getExpenseById(expenseId, tripId);
      
      items.push({ label: "Kraj", value: countryName });
      items.push({ label: "Kwota", value: `${amount} ${currency}` });
      if (description) {
        items.push({ label: "Opis", value: description });
      }
      if (log.type === "expense_edited") {
        const changes = log.details.changes as Record<string, unknown>;
        const changeLabels = Object.keys(changes).map(key => {
          const value = changes[key];
          const label = getFieldLabel(key);
          if (key === "date") {
            return `${label}: ${formatDate(value as string)}`;
          }
          return `${label}: ${value}`;
        });
        if (changeLabels.length > 0) {
          items.push({ label: "Zmiany", value: changeLabels.join(", ") });
        }
      }
      if (expense) {
        items.push({ label: "Data", value: formatDate(expense.date) });
        if (expense.location) {
          items.push({ label: "Miejsce", value: expense.location });
        }
        if (expense.category) {
          items.push({ label: "Kategoria", value: expense.category });
        }
      }
      
      break;
    }
    
    case "country_added":
    case "country_edited":
    case "country_deleted": {
      const countryId = log.details.countryId as string;
      const countryName = log.details.countryName as string;
      const startDate = log.details.startDate as string;
      const endDate = log.details.endDate as string;
      
      items.push({ label: "Kraj", value: countryName });
      if (startDate && endDate) {
        items.push({ label: "Zakres dat", value: formatDateRange(startDate, endDate) });
      }
      if (log.type === "country_edited") {
        const changes = log.details.changes as Record<string, unknown>;
        const changeLabels = Object.keys(changes).map(key => {
          const value = changes[key];
          const label = getFieldLabel(key);
          if (key === "startDate" || key === "endDate") {
            return `${label}: ${formatDate(value as string)}`;
          }
          return `${label}: ${value}`;
        });
        if (changeLabels.length > 0) {
          items.push({ label: "Zmiany", value: changeLabels.join(", ") });
        }
      }
      
      break;
    }
    
    case "location_added":
    case "location_edited":
    case "location_deleted": {
      const countryId = log.details.countryId as string;
      const countryName = log.details.countryName as string;
      const locationName = log.details.locationName as string || log.details.newLocationName as string || log.details.oldLocationName as string;
      const startDate = log.details.startDate as string;
      const endDate = log.details.endDate as string;
      
      items.push({ label: "Miejsce", value: locationName });
      items.push({ label: "Kraj", value: countryName });
      if (startDate && endDate) {
        items.push({ label: "Zakres dat", value: formatDateRange(startDate, endDate) });
      }
      if (log.type === "location_edited") {
        const changes = log.details.changes as Record<string, unknown>;
        const oldName = log.details.oldLocationName as string;
        const newName = log.details.newLocationName as string;
        if (oldName !== newName) {
          items.push({ label: "Zmieniono nazwę", value: `${oldName} → ${newName}` });
        }
        const changeLabels = Object.keys(changes).filter(key => key !== "name").map(key => {
          const value = changes[key];
          const label = getFieldLabel(key);
          if (key === "startDate" || key === "endDate") {
            return `${label}: ${formatDate(value as string)}`;
          }
          return `${label}: ${value}`;
        });
        if (changeLabels.length > 0) {
          items.push({ label: "Inne zmiany", value: changeLabels.join(", ") });
        }
      }
      
      break;
    }
    
    case "trip_edited": {
      const tripName = log.details.tripName as string;
      const changes = log.details.changes as Record<string, unknown>;
      
      items.push({ label: "Podróż", value: tripName });
      const changeLabels = Object.keys(changes).map(key => {
        const value = changes[key];
        const label = getFieldLabel(key);
        if (key === "startDate" || key === "endDate") {
          return `${label}: ${formatDate(value as string)}`;
        }
        return `${label}: ${value}`;
      });
      if (changeLabels.length > 0) {
        items.push({ label: "Zmiany", value: changeLabels.join(", ") });
      }
      
      break;
    }
    
    case "currency_transaction_added":
    case "currency_transaction_deleted": {
      const fromAmount = log.details.fromAmount as number;
      const fromCurrency = log.details.fromCurrency as string;
      const toAmount = log.details.toAmount as number;
      const toCurrency = log.details.toCurrency as string;
      
      // Format amounts with appropriate precision (2 decimal places for most currencies)
      const formatAmount = (amount: number): string => {
        // Round to 2 decimal places to avoid floating point precision issues
        const rounded = Math.round(amount * 100) / 100;
        // If it's a whole number, display without decimals
        if (rounded % 1 === 0) {
          return rounded.toString();
        }
        // Otherwise display with 2 decimal places
        return rounded.toFixed(2);
      };
      
      items.push({ label: "Z", value: `${formatAmount(fromAmount)} ${fromCurrency}` });
      items.push({ label: "Na", value: `${formatAmount(toAmount)} ${toCurrency}` });
      
      break;
    }
  }

  return { items };
}

export default function ActivityLogsPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const { trip, isLoading } = useTripData(resolvedParams.slug);
  const [selectedFilters, setSelectedFilters] = useState<Set<ActivityLogType>>(new Set());
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

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
  };

  const logs = useMemo(() => {
    if (!trip) return [];
    const allLogs = getActivityLogs(trip.id);
    if (selectedFilters.size === 0) return allLogs;
    return allLogs.filter((log) => selectedFilters.has(log.type));
  }, [trip, selectedFilters]);

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
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
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
        )}
      </div>

      {/* Aktywne filtry */}
      {selectedFilters.size > 0 && (
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
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline"
          >
            Wyczyść wszystkie
          </button>
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
                            <span className="text-gray-700 dark:text-gray-300 flex-1">
                              {item.value}
                            </span>
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
