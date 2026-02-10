"use client";

import { useState, useMemo } from "react";
import Link from "@/components/ui/Link";
import { MoreVertical, Plus, Edit, Trash2 } from "lucide-react";
import type { Country, Expense } from "@/lib/travel-wallet/types";
import {
  formatDateRange,
  calculatePlannedTotal,
} from "@/lib/travel-wallet/countries";
import { formatCurrency } from "@/lib/travel-wallet/formatters";

// Funkcja do formatowania zakresu dat w formacie "21.02 - 25.02"
const formatLocationDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startFormatted = start.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
  });
  
  const endFormatted = end.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
  });
  
  return `${startFormatted} - ${endFormatted}`;
};
import {
  calculateTotalActualCost,
  calculateTravelDays,
  calculateAverageDailyCost,
  calculateBudgetDifference,
  isOverBudget,
} from "@/lib/travel-wallet/country-calculations";
import { getUniqueLocationsFromExpenses, calculateExpenseCategories } from "@/lib/travel-wallet/expenses";
import CountryExpensesSection from "./CountryExpensesSection";
import type { ExpenseCategory } from "@/lib/travel-wallet/types";

interface CountryDetailsProps {
  country: Country;
  expenses: Expense[];
  onAddExpense?: (date?: string) => void;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expense: Expense) => void;
  onAddLocation?: () => void;
  onEditLocation?: (location: string) => void;
  onDeleteLocation?: (location: string) => void;
  slug?: string;
  tripId?: string;
}

export default function CountryDetails({
  country,
  expenses,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
  slug,
  tripId,
}: CountryDetailsProps) {
  const [locationMenuOpen, setLocationMenuOpen] = useState<string | null>(null);
  const planned = calculatePlannedTotal(country);
  const actual = calculateTotalActualCost(expenses);
  const travelDays = calculateTravelDays(country.startDate, country.endDate);
  const averageDailyCost = calculateAverageDailyCost(actual, travelDays);
  const budgetDifference = calculateBudgetDifference(planned, actual);
  const overBudget = isOverBudget(planned, actual);

  // Oblicz kategorie wydatków na podstawie aktualnych wydatków
  const calculatedCategories = useMemo(() => {
    const plannedCategories = country.categories?.map((cat) => ({
      name: cat.name,
      plannedAmount: cat.plannedAmount,
    }));
    return calculateExpenseCategories(expenses, plannedCategories);
  }, [expenses, country.categories]);

  // Funkcja pomocnicza do formatowania daty na YYYY-MM-DD
  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

        // Unikalne lokalizacje z kraju i wydatków, posortowane według daty rozpoczęcia
        const availableLocations = useMemo(() => {
          const countryLocations = country.locations || [];
          const expenseLocations = getUniqueLocationsFromExpenses(expenses);
          
          // Zbierz wszystkie lokalizacje z datami
          const locationsWithDates: Array<{ name: string; startDate: string | null }> = [];
          
          // Dodaj lokalizacje z kraju (mają daty)
          countryLocations.forEach((loc) => {
            if (typeof loc === "string") {
              locationsWithDates.push({ name: loc, startDate: null });
            } else {
              locationsWithDates.push({ name: loc.name, startDate: loc.startDate });
            }
          });
          
          // Dodaj lokalizacje z wydatków (nie mają dat, więc startDate = null)
          expenseLocations.forEach((loc) => {
            if (!locationsWithDates.some((l) => l.name === loc)) {
              locationsWithDates.push({ name: loc, startDate: null });
            }
          });
          
          // Sortuj: najpierw według daty rozpoczęcia (rosnąco), potem alfabetycznie dla tych bez dat
          return locationsWithDates
            .sort((a, b) => {
              // Jeśli obie mają daty, sortuj według daty
              if (a.startDate && b.startDate) {
                return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
              }
              // Jeśli tylko a ma datę, a idzie pierwsze
              if (a.startDate && !b.startDate) {
                return -1;
              }
              // Jeśli tylko b ma datę, b idzie pierwsze
              if (!a.startDate && b.startDate) {
                return 1;
              }
              // Jeśli żadna nie ma daty, sortuj alfabetycznie
              return a.name.localeCompare(b.name);
            })
            .map((loc) => loc.name);
        }, [country.locations, expenses]);

        // Oblicz niewybrane zakresy dat (daty w zakresie kraju, które nie są pokryte przez lokalizacje)
        const unassignedDateRanges = useMemo(() => {
          if (!country.startDate || !country.endDate) return [];
          
          const countryStart = new Date(country.startDate);
          const countryEnd = new Date(country.endDate);
          
          // Zbierz wszystkie zakresy dat lokalizacji (tylko te z datami)
          const locationRanges: Array<{ start: Date; end: Date }> = [];
          const countryLocations = country.locations || [];
          
          countryLocations.forEach((loc) => {
            if (typeof loc !== "string" && loc.startDate && loc.endDate) {
              locationRanges.push({
                start: new Date(loc.startDate),
                end: new Date(loc.endDate),
              });
            }
          });
          
          // Sortuj zakresy według daty rozpoczęcia
          locationRanges.sort((a, b) => a.start.getTime() - b.start.getTime());
          
          // Znajdź przerwy między zakresami
          const unassignedRanges: Array<{ startDate: string; endDate: string }> = [];
          
          let currentDate = new Date(countryStart);
          
          for (const range of locationRanges) {
            // Jeśli jest przerwa przed tym zakresem
            if (currentDate < range.start) {
              // Odejmij 1 dzień od start, bo chcemy datę przed zakresem lokalizacji
              const gapEnd = new Date(range.start);
              gapEnd.setDate(gapEnd.getDate() - 1);
              
              if (currentDate <= gapEnd) {
                unassignedRanges.push({
                  startDate: formatDateToYYYYMMDD(currentDate),
                  endDate: formatDateToYYYYMMDD(gapEnd),
                });
              }
            }
            
            // Przesuń currentDate na koniec tego zakresu + 1 dzień
            currentDate = new Date(range.end);
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          // Sprawdź czy jest przerwa na końcu (po ostatniej lokalizacji)
          if (currentDate <= countryEnd) {
            unassignedRanges.push({
              startDate: formatDateToYYYYMMDD(currentDate),
              endDate: formatDateToYYYYMMDD(countryEnd),
            });
          }
          
          return unassignedRanges;
        }, [country.startDate, country.endDate, country.locations]);

  const getStatusLabel = (status: Country["status"]) => {
    switch (status) {
      case "visited":
        return "Odwiedzony";
      case "current":
        return "Obecny";
      case "upcoming":
        return "Nadchodzący";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Link powrotu */}
      <div>
        <Link
          href={`/portfel-podrozniczy/${slug}/kraje`}
          variant="arrow"
          className="text-gray-600 dark:text-gray-400"
        >
          Powrót do listy krajów
        </Link>
      </div>

      {/* Podstawowe informacje */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {country.name}
        </h1>
        <div className="space-y-2 text-gray-600 dark:text-gray-400">
          <p>
            <span className="font-semibold">Daty:</span>{" "}
            {formatDateRange(country.startDate, country.endDate)}
          </p>
          <p>
            <span className="font-semibold">Liczba dni:</span> {travelDays > 0 ? travelDays : country.days}
          </p>
          <p>
            <span className="font-semibold">Status:</span>{" "}
            {getStatusLabel(country.status)}
          </p>
        </div>
      </div>

      {/* Miejsca */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Miejsca
          </h2>
          {onAddLocation && (
            <button
              onClick={() => onAddLocation()}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Dodaj
            </button>
          )}
        </div>
        {availableLocations.length > 0 ? (
          <div className="space-y-2">
            {availableLocations.map((location) => {
              const countryLocations = country.locations || [];
              const isCountryLocation = countryLocations.some((loc) => {
                const name = typeof loc === "string" ? loc : loc.name;
                return name === location;
              });
              const locationData = countryLocations.find((loc) => {
                const name = typeof loc === "string" ? loc : loc.name;
                return name === location;
              });
              const hasLocationData = locationData && typeof locationData !== "string";
              return (
                <div
                  key={location}
                  className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {location}
                      </span>
                      {hasLocationData && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatLocationDateRange(locationData.startDate, locationData.endDate)}
                        </span>
                      )}
                      {!isCountryLocation && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          (z wydatków)
                        </span>
                      )}
                    </div>
                  </div>
                  {isCountryLocation && (onEditLocation || onDeleteLocation) && (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setLocationMenuOpen(
                            locationMenuOpen === location ? null : location
                          )
                        }
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        aria-label="Menu akcji"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      {locationMenuOpen === location && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setLocationMenuOpen(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                            {onEditLocation && (
                              <button
                                onClick={() => {
                                  onEditLocation(location);
                                  setLocationMenuOpen(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edytuj
                              </button>
                            )}
                            {onDeleteLocation && (
                              <button
                                onClick={() => {
                                  onDeleteLocation(location);
                                  setLocationMenuOpen(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Usuń
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center py-4">
            Brak miejsc. Dodaj miejsce, aby móc przypisywać wydatki do
            konkretnych miejsc.
          </p>
        )}

        {/* Niewybrane daty */}
        {unassignedDateRanges.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
              Niewybrane daty
            </h3>
            <div className="space-y-2">
              {unassignedDateRanges.map((range, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                      {formatLocationDateRange(range.startDate, range.endDate)}
                    </span>
                    <span className="text-xs text-amber-600 dark:text-amber-400 italic">
                      (brak miejsc)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Podsumowanie numeryczne */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Podsumowanie
          </h2>
          {overBudget && (
            <span className="px-3 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
              Przekroczono budżet
            </span>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">
              Planowany budżet:
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(planned)} zł
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">
              Faktyczne wydatki:
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(actual)} zł
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">
              Różnica:
            </span>
            <span
              className={`text-lg font-bold ${
                budgetDifference >= 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {budgetDifference >= 0 ? "+" : ""}
              {formatCurrency(budgetDifference)} zł
            </span>
          </div>
          {travelDays > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Średni dzienny koszt:
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(averageDailyCost)} zł/dzień
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Zintegrowana sekcja wydatków i kalendarza */}
      <CountryExpensesSection
        country={country}
        expenses={expenses}
        onAddExpense={onAddExpense}
        onEditExpense={onEditExpense}
        onDeleteExpense={onDeleteExpense}
      />

      {/* Kategorie wydatków */}
      {calculatedCategories && calculatedCategories.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Kategorie wydatków
          </h2>
          <div className="space-y-3">
            {calculatedCategories.map((category, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {category.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Planowane: {formatCurrency(category.plannedAmount)} zł
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(category.amount)} zł
                  </p>
                  {category.plannedAmount > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {((category.amount / category.plannedAmount) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

