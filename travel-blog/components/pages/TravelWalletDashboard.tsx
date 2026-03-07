"use client";

import { useMemo, useState } from "react";
import { TrendingUp, Calendar, Plus, Edit, MoreVertical, Trash2 } from "lucide-react";
import TravelWalletHeader from "./TravelWalletHeader";
import TravelWalletStats from "./TravelWalletStats";
import TravelWalletProgress from "./TravelWalletProgress";
import TravelWalletChartsSection from "./TravelWalletChartsSection";
import TravelWalletTables from "./TravelWalletTables";
import TravelWalletTimeline from "./TravelWalletTimeline";
import CurrencyBalancesCard from "./CurrencyBalancesCard";
import TransactionDetailsModal from "./TransactionDetailsModal";
import CountryExpensesSection from "./CountryExpensesSection";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import BudgetAlertCard from "@/components/ui/BudgetAlertCard";
import InsightsCard from "@/components/ui/InsightsCard";
import DrillDownModal from "@/components/ui/DrillDownModal";
import { StatCardSkeleton } from "@/components/ui/SkeletonLoader";
import PredictionCard from "@/components/ui/PredictionCard";
import MissingAccommodationReminder from "@/components/pages/MissingAccommodationReminder";
import type { TravelWalletData, Trip, CurrencyTransaction } from "@/lib/travel-wallet/types";
import {
  calculateRemainingBudget,
  calculateTotalBudget,
  calculateTotalTripDays,
  calculateTotalSpent,
  calculateTravelDays as getTravelDaysFromData,
} from "@/lib/travel-wallet/calculations";
import {
  getEffectiveDashboardMode,
} from "@/lib/travel-wallet/dashboard-mode";
import { getCurrencyTransactions } from "@/lib/travel-wallet/currency-transactions";
import { getAllExpenses, getExpensesByCountryId, getUniqueLocationsFromExpenses, calculateExpenseCategories } from "@/lib/travel-wallet/expenses";
import { getTripBySlug } from "@/lib/travel-wallet/trips-storage";
import { formatDateRange } from "@/lib/travel-wallet/countries";
import { getDaysWithExpensePortionsInRange } from "@/lib/travel-wallet/calendar";
import {
  calculateTotalActualCost,
  calculateTotalActualCostByTripId,
  calculateAverageDailyCost,
  calculateTravelDays,
  calculateBudgetDifference,
  isOverBudget,
} from "@/lib/travel-wallet/country-calculations";
import { calculatePlannedTotal } from "@/lib/travel-wallet/countries";
import { formatCurrency as formatCurrencyAmount, formatDate, formatCurrencyCompact } from "@/lib/travel-wallet/formatters";
import type { Country, Expense } from "@/lib/travel-wallet/types";

interface TravelWalletDashboardProps {
  data: TravelWalletData;
  slug: string;
  tripId?: string;
  tripName?: string;
  tripStartDate?: string;
  tripEndDate?: string;
  expandedCountries?: Set<string>;
  onToggleCountry?: (countryId: string) => void;
  onAddCountry?: (startDate?: string, endDate?: string) => void;
  onEditCountry?: (country: Country) => void;
  onDeleteCountry?: (country: Country) => void;
  onAddBudget?: (country: Country) => void;
  onReduceBudget?: (country: Country) => void;
  onAddExpense?: (date?: string) => void;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expense: Expense) => void;
  onAddLocation?: () => void;
  onEditLocation?: (location: string) => void;
  onDeleteLocation?: (location: string) => void;
  onEditTrip?: () => void;
  onAddCurrencyTransaction?: () => void;
  onDeleteCurrencyTransaction?: (transactionId: string) => void;
  onEditCurrencyTransaction?: (transaction: CurrencyTransaction) => void;
  isOffline?: boolean;
  /** Nadpisuje data.userName w nagłówku (np. z profilu zalogowanego użytkownika) */
  displayUserName?: string;
}

export default function TravelWalletDashboard({
  data,
  slug,
  tripId,
  tripName,
  tripStartDate,
  tripEndDate,
  onAddCountry,
  onEditCountry,
  onDeleteCountry,
  onAddBudget,
  onReduceBudget,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
  onEditTrip,
  onAddCurrencyTransaction,
  onDeleteCurrencyTransaction,
  onEditCurrencyTransaction,
  isOffline = false,
  displayUserName,
}: TravelWalletDashboardProps) {
  // Określ efektywny tryb dashboardu
  const effectiveMode = getEffectiveDashboardMode(data);
  const isSingleMode = effectiveMode === "single-country" || effectiveMode === "single-location";

  // Pobierz trip - musi być przed useMemo które go używa
  const trip = useMemo(() => getTripBySlug(slug), [slug]);

  // Pobierz kraj dla single-country mode
  const country = useMemo(() => {
    if (!isSingleMode || data.countries.length === 0) return null;
    return data.countries[0];
  }, [isSingleMode, data.countries]);

  const baseCurrency = data.wallet?.baseCurrency ?? "PLN";

  // Oblicz budżet i wydatki - dla single-country użyj danych kraju (w walucie bazowej), dla multi-country całej podróży
  // Średnia dzienna: przy wydatkach = suma / liczba dni z wydatkami; bez wydatków = budżet / dni w podróży
  const { totalBudget, totalSpent, avgDailySpend, availableBalance } = useMemo(() => {
    if (isSingleMode && country && trip) {
      const countryExpenses = getExpensesByCountryId(country.id, trip.id);
      const countryPlanned = calculatePlannedTotal(country, data);
      const countryActual = calculateTotalActualCostByTripId(countryExpenses, trip.id);
      const countryRemaining = Math.max(0, countryPlanned - countryActual);
      const countryDays = Math.max(1, country.days ?? 1);
      const daysWithExpenses =
        countryExpenses.length && country.startDate && country.endDate
          ? getDaysWithExpensePortionsInRange(countryExpenses, country.startDate, country.endDate)
          : 0;
      const countryAvgDaily =
        daysWithExpenses > 0
          ? countryActual / daysWithExpenses
          : countryDays > 0
            ? countryPlanned / countryDays
            : 0;

      return {
        totalBudget: countryPlanned,
        totalSpent: countryActual,
        avgDailySpend: countryAvgDaily,
        availableBalance: countryRemaining,
      };
    }

    const spent = calculateTotalSpent(data, tripId);
    const budget = calculateTotalBudget(data, tripId);
    const daysInTrip =
      tripStartDate && tripEndDate
        ? calculateTotalTripDays(tripStartDate, tripEndDate)
        : getTravelDaysFromData(data);
    const expensesList = tripId ? getAllExpenses(tripId) : [];
    const daysWithExpenses =
      expensesList.length && tripStartDate && tripEndDate
        ? getDaysWithExpensePortionsInRange(expensesList, tripStartDate, tripEndDate)
        : 0;
    const avgDaily =
      daysWithExpenses > 0
        ? spent / daysWithExpenses
        : daysInTrip > 0 && budget > 0
          ? budget / daysInTrip
          : 0;

    return {
      totalBudget: budget,
      totalSpent: spent,
      avgDailySpend: avgDaily,
      availableBalance: calculateRemainingBudget(data, tripId),
    };
  }, [isSingleMode, country, trip, data, tripId, tripStartDate, tripEndDate]);

  // Pobierz wszystkie transakcje walutowe
  const allTransactions = useMemo(() => {
    if (!tripId) {
      return [];
    }
    return getCurrencyTransactions(tripId);
  }, [tripId, data]);

  // Filtruj transakcje po countryId dla single-country
  const transactions = useMemo(() => {
    if (isSingleMode && country) {
      return allTransactions.filter(tx => tx.countryId === country.id);
    }
    return allTransactions;
  }, [allTransactions, isSingleMode, country?.id]);

  // Pobierz wydatki - dla single-country tylko dla kraju, dla multi-country wszystkie
  const expenses = useMemo(() => {
    if (!tripId) return [];
    if (isSingleMode && country && trip) {
      return getExpensesByCountryId(country.id, trip.id);
    }
    return getAllExpenses(tripId);
  }, [tripId, isSingleMode, country?.id, trip?.id, data]);

  // Pobierz wydatki dla kart Insights - dla single-country tylko z kraju, dla multi-country wszystkie
  const insightsExpenses = useMemo(() => {
    if (!tripId) {
      return [];
    }
    if (isSingleMode && country && trip) {
      return getExpensesByCountryId(country.id, trip.id);
    }
    return getAllExpenses(tripId);
  }, [tripId, isSingleMode, country?.id, trip?.id, data]);

  // Stwórz "wirtualny kraj" dla wszystkich wydatków (dla CountryExpensesSection w multi-country)
  const allCountriesCountry: Country = useMemo(() => ({
    id: "all-countries",
    slug: "all-countries",
    name: "Wszystkie kraje",
    days: calculateTotalTripDays(tripStartDate, tripEndDate),
    startDate: tripStartDate,
    endDate: tripEndDate,
    budgets: [],
    status: "current" as const,
    locations: [],
  }), [tripStartDate, tripEndDate]);

  // Stan modala ze szczegółami transakcji
  const [selectedTransaction, setSelectedTransaction] = useState<CurrencyTransaction | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  // Stan dla drill-down modal
  const [drillDownData, setDrillDownData] = useState<{ type: "category" | "country"; name: string; expenses: Expense[] } | null>(null);

  // Stan dla menu lokalizacji (single-country)
  const [locationMenuOpen, setLocationMenuOpen] = useState<string | null>(null);

  const handleTransactionClick = (transaction: CurrencyTransaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsModalOpen(true);
  };

  // Funkcje pomocnicze dla single-country
  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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

  // Unikalne lokalizacje z kraju i wydatków (single-country)
  const availableLocations = useMemo(() => {
    if (!isSingleMode || !country) return [];
    
    const countryLocations = country.locations || [];
    const expenseLocations = getUniqueLocationsFromExpenses(expenses);
    
    const locationsWithDates: Array<{ name: string; startDate: string | null }> = [];
    
    countryLocations.forEach((loc) => {
      if (typeof loc === "string") {
        locationsWithDates.push({ name: loc, startDate: null });
      } else {
        locationsWithDates.push({ name: loc.name, startDate: loc.startDate });
      }
    });
    
    expenseLocations.forEach((loc) => {
      if (!locationsWithDates.some((l) => l.name === loc)) {
        locationsWithDates.push({ name: loc, startDate: null });
      }
    });
    
    return locationsWithDates
      .sort((a, b) => {
        if (a.startDate && b.startDate) {
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        }
        if (a.startDate && !b.startDate) return -1;
        if (!a.startDate && b.startDate) return 1;
        return a.name.localeCompare(b.name);
      })
      .map((loc) => loc.name);
  }, [isSingleMode, country, expenses]);

  // Niewybrane zakresy dat (single-country)
  const unassignedDateRanges = useMemo(() => {
    if (!isSingleMode || !country || !country.startDate || !country.endDate) return [];
    
    const countryStart = new Date(country.startDate);
    const countryEnd = new Date(country.endDate);
    
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
    
    locationRanges.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    const unassignedRanges: Array<{ startDate: string; endDate: string }> = [];
    let currentDate = new Date(countryStart);
    
    for (const range of locationRanges) {
      if (currentDate < range.start) {
        unassignedRanges.push({
          startDate: formatDateToYYYYMMDD(currentDate),
          endDate: formatDateToYYYYMMDD(new Date(range.start.getTime() - 86400000)),
        });
      }
      currentDate = new Date(Math.max(currentDate.getTime(), range.end.getTime() + 86400000));
    }
    
    if (currentDate <= countryEnd) {
      unassignedRanges.push({
        startDate: formatDateToYYYYMMDD(currentDate),
        endDate: formatDateToYYYYMMDD(countryEnd),
      });
    }
    
    return unassignedRanges;
  }, [isSingleMode, country]);

  // Oblicz kategorie wydatków (single-country)
  const calculatedCategories = useMemo(() => {
    if (!isSingleMode || !country) return [];
    const plannedCategories = country.categories?.map((cat) => ({
      name: cat.name,
      plannedAmount: cat.plannedAmount,
    }));
    return calculateExpenseCategories(expenses, plannedCategories);
  }, [isSingleMode, country, expenses]);

  // Obliczenia dla kraju (single-country)
  const planned = useMemo(() => country ? calculatePlannedTotal(country) : 0, [country]);
  const actual = useMemo(() => calculateTotalActualCost(expenses), [expenses]);
  const travelDays = useMemo(() => country ? calculateTravelDays(country.startDate, country.endDate) : 0, [country]);
  const averageDailyCost = useMemo(() => calculateAverageDailyCost(actual, travelDays), [actual, travelDays]);
  const budgetDifference = useMemo(() => country ? calculateBudgetDifference(planned, actual) : 0, [country, planned, actual]);
  const overBudget = useMemo(() => country ? isOverBudget(planned, actual) : false, [country, planned, actual]);

  // Sprawdź czy to tryb single-location
  const isSingleLocation = useMemo(() => {
    return isSingleMode && country?.locations && country.locations.length === 1;
  }, [isSingleMode, country]);
  const location = isSingleLocation && country?.locations?.[0] 
    ? (typeof country.locations[0] === "string" ? { name: country.locations[0] } : country.locations[0])
    : null;

  // Renderowanie dla single-country
  if (isSingleMode && country) {
    return (
      <div className="space-y-8">
        {/* TravelWalletHeader */}
        <TravelWalletHeader
          userName={displayUserName ?? data.userName}
          availableBalance={availableBalance}
          totalBudget={totalBudget}
          slug={slug}
          tripName={tripName}
          onAddExpense={onAddExpense}
          onEditTrip={onEditTrip}
          data={data}
          countryId={country.id}
          isOffline={isOffline}
        />

        {/* Header z nazwą kraju/lokalizacji */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-2">
                {isSingleLocation && location ? location.name : country.name}
              </h1>
              {isSingleLocation && (
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                  {country.name}
                </p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                {country.startDate && country.endDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateRange(country.startDate, country.endDate)}</span>
                  </div>
                )}
                {country.status === "current" && (
                  <div className="inline-block px-2 py-1 text-xs font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded">
                    OBECNIE
                  </div>
                )}
              </div>
            </div>
            {onEditCountry && (
              <button
                onClick={() => onEditCountry(country)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edytuj kraj</span>
              </button>
            )}
          </div>
        </div>

        {/* Statystyki podróży */}
        <TravelWalletStats 
          data={data}
          tripId={tripId}
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
          slug={slug}
          baseCurrency={baseCurrency}
        />

        {/* Pasek budżetu – zaraz pod statystykami (IA) */}
        <TravelWalletProgress data={data} tripId={tripId} baseCurrency={baseCurrency} country={country} expenses={expenses} />

        {/* Przypomnienie o brakującym noclegu (single-country) */}
        {tripId && tripStartDate && tripEndDate && (
          <MissingAccommodationReminder
            tripId={tripId}
            tripStartDate={tripStartDate}
            tripEndDate={tripEndDate}
            onAddExpense={onAddExpense}
          />
        )}

        {/* Kalendarz wydatków – główna akcja przed walutami (IA) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <CountryExpensesSection
            country={country}
            expenses={expenses}
            onAddExpense={onAddExpense}
            onEditExpense={onEditExpense}
            onDeleteExpense={onDeleteExpense}
          />
        </div>

        {/* Currency Transactions Section */}
        {tripId && (
          <CurrencyBalancesCard
            transactions={transactions}
            onAddTransaction={onAddCurrencyTransaction}
            onTransactionClick={handleTransactionClick}
            onEdit={onEditCurrencyTransaction}
            onDelete={onDeleteCurrencyTransaction}
          />
        )}

        {/* Insights i rekomendacje (single-country) */}
        {tripId && totalBudget > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Insights i rekomendacje</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BudgetAlertCard
                remainingBudget={availableBalance}
                totalBudget={totalBudget}
                totalSpent={totalSpent}
                currency={baseCurrency}
              />
              {avgDailySpend > 0 && (
                <InsightsCard
                  title="Średnie dzienne wydatki"
                  value={avgDailySpend}
                  subtitle={
                    insightsExpenses.length > 0
                      ? (() => {
                          const daysWithExpenses = new Set(insightsExpenses.map((e) => e.date)).size;
                          return `Na podstawie ${insightsExpenses.length} wydatków (${daysWithExpenses} ${daysWithExpenses === 1 ? "dzień" : "dni"} z wydatkami)`;
                        })()
                      : tripStartDate && tripEndDate
                        ? `Na podstawie budżetu (${calculateTotalTripDays(tripStartDate, tripEndDate)} dni w podróży)`
                        : "Na podstawie budżetu"
                  }
                  currency={baseCurrency}
                  variant="info"
                  icon={<TrendingUp className="w-5 h-5" />}
                />
              )}
              {tripStartDate && tripEndDate && (insightsExpenses.length > 0 || totalBudget > 0) && (
                <PredictionCard
                  expenses={insightsExpenses}
                  tripStartDate={tripStartDate}
                  tripEndDate={tripEndDate}
                  totalBudget={totalBudget}
                  totalSpentInPLN={totalSpent}
                  currency={baseCurrency}
                  className="lg:col-span-2"
                />
              )}
            </div>
          </div>
        )}

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
              {availableLocations.map((locationName) => {
                const countryLocations = country?.locations || [];
                const isCountryLocation = countryLocations.some((loc) => {
                  const name = typeof loc === "string" ? loc : loc.name;
                  return name === locationName;
                });
                const locationData = countryLocations.find((loc) => {
                  const name = typeof loc === "string" ? loc : loc.name;
                  return name === locationName;
                });
                const hasLocationData = locationData && typeof locationData !== "string";
                return (
                  <div
                    key={locationName}
                    className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {locationName}
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
                              locationMenuOpen === locationName ? null : locationName
                            )
                          }
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                          aria-label="Menu akcji"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        {locationMenuOpen === locationName && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setLocationMenuOpen(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                              {onEditLocation && (
                                <button
                                  onClick={() => {
                                    onEditLocation(locationName);
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
                                    onDeleteLocation(locationName);
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
                {formatCurrencyAmount(planned, baseCurrency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Faktyczne wydatki:
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCurrencyAmount(actual, baseCurrency)}
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
                {formatCurrencyAmount(budgetDifference, baseCurrency)}
              </span>
            </div>
            {travelDays > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  Średni dzienny koszt:
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrencyAmount(averageDailyCost, baseCurrency)}/dzień
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Wykresy */}
        <TravelWalletChartsSection data={data} />

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
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrencyAmount(category.amount, baseCurrency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction Details Modal */}
        <TransactionDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
        />
      </div>
    );
  }

  // Domyślny tryb multi-country
  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in-up">
      <TravelWalletHeader
        userName={displayUserName ?? data.userName}
        availableBalance={availableBalance}
        totalBudget={totalBudget}
        slug={slug}
        tripName={tripName}
        onAddExpense={onAddExpense}
        onEditTrip={onEditTrip}
        data={data}
        isOffline={isOffline}
      />
      <TravelWalletStats 
        data={data}
        tripId={tripId}
        tripStartDate={tripStartDate}
        tripEndDate={tripEndDate}
        slug={slug}
        baseCurrency={baseCurrency}
      />

      {/* Pasek budżetu – zaraz pod statystykami (IA) */}
      <TravelWalletProgress data={data} tripId={tripId} baseCurrency={baseCurrency} />

      {/* Przypomnienie o brakującym noclegu */}
      {tripId && tripStartDate && tripEndDate && (
        <MissingAccommodationReminder
          tripId={tripId}
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
          onAddExpense={onAddExpense}
        />
      )}

      {/* Kalendarz wydatków – główna akcja przed walutami (IA) */}
      {tripId && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <CountryExpensesSection
            country={allCountriesCountry}
            expenses={expenses}
            onAddExpense={onAddExpense}
            onEditExpense={onEditExpense}
            onDeleteExpense={onDeleteExpense}
          />
        </div>
      )}

      {/* Currency Transactions Section */}
      {tripId && (
        <CurrencyBalancesCard
          transactions={transactions}
          onAddTransaction={onAddCurrencyTransaction}
          onTransactionClick={handleTransactionClick}
          onEdit={onEditCurrencyTransaction}
          onDelete={onDeleteCurrencyTransaction}
        />
      )}

      {/* Insights Section */}
      {tripId && totalBudget > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Insights i rekomendacje</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BudgetAlertCard
              remainingBudget={availableBalance}
              totalBudget={totalBudget}
              totalSpent={totalSpent}
              currency={baseCurrency}
            />
            {avgDailySpend > 0 && (
              <InsightsCard
                title="Średnie dzienne wydatki"
                value={avgDailySpend}
                subtitle={
                  insightsExpenses.length > 0
                    ? (() => {
                        const daysWithExpenses = new Set(insightsExpenses.map((e) => e.date)).size;
                        return `Na podstawie ${insightsExpenses.length} wydatków (${daysWithExpenses} ${daysWithExpenses === 1 ? "dzień" : "dni"} z wydatkami)`;
                      })()
                    : tripStartDate && tripEndDate
                      ? `Na podstawie budżetu (${calculateTotalTripDays(tripStartDate, tripEndDate)} dni w podróży)`
                      : "Na podstawie budżetu"
                }
                currency={baseCurrency}
                variant="info"
                icon={<TrendingUp className="w-5 h-5" />}
              />
            )}
            {tripStartDate && tripEndDate && (insightsExpenses.length > 0 || totalBudget > 0) && (
              <PredictionCard
                expenses={insightsExpenses}
                tripStartDate={tripStartDate}
                tripEndDate={tripEndDate}
                totalBudget={totalBudget}
                totalSpentInPLN={totalSpent}
                currency={baseCurrency}
                className="lg:col-span-2"
              />
            )}
          </div>
        </div>
      )}
      <TravelWalletChartsSection data={data} />
      <TravelWalletTables
        data={data}
        slug={slug}
        onEditCountry={onEditCountry}
        onAddBudget={onAddBudget}
        onReduceBudget={onReduceBudget}
        onDeleteCountry={onDeleteCountry}
        onAddCountry={onAddCountry}
      />
      <TravelWalletTimeline
        data={data}
        slug={slug}
        tripStartDate={tripStartDate}
        tripEndDate={tripEndDate}
        onEditCountry={onEditCountry}
        onAddBudget={onAddBudget}
        onReduceBudget={onReduceBudget}
        onDeleteCountry={onDeleteCountry}
        onAddCountry={onAddCountry}
      />

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
      />

      {/* Floating Action Button for mobile */}
      {onAddExpense && (
        <FloatingActionButton
          onClick={onAddExpense}
          label="Dodaj wydatek"
        />
      )}

      {/* Drill-down Modal */}
      {drillDownData && (
        <DrillDownModal
          isOpen={!!drillDownData}
          onClose={() => setDrillDownData(null)}
          name={drillDownData.name}
          expenses={drillDownData.expenses}
          type={drillDownData.type}
          tripId={tripId ?? ""}
        />
      )}
    </div>
  );
}


