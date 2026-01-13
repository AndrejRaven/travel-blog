"use client";

import { useState, useMemo } from "react";
import { MapPin, Calendar, DollarSign, TrendingUp, Plus, Globe, MoreVertical, Edit, Trash2 } from "lucide-react";
import TravelWalletStatCard from "./TravelWalletStatCard";
import TravelWalletStats from "./TravelWalletStats";
import TravelWalletHeader from "./TravelWalletHeader";
import CountryExpensesSection from "./CountryExpensesSection";
import TravelWalletProgress from "./TravelWalletProgress";
import TravelWalletChartsSection from "./TravelWalletChartsSection";
import Button from "@/components/ui/Button";
import type { TravelWalletData, Country, Expense, ExpenseCategory } from "@/lib/travel-wallet/types";
import {
  calculateTotalSpent,
  calculateRemainingBudget,
  calculateTotalBudget,
  calculateTotalTripDays,
} from "@/lib/travel-wallet/calculations";
import {
  calculateTotalActualCost,
  calculateAverageDailyCost,
  calculateTravelDays,
  calculateBudgetDifference,
  isOverBudget,
} from "@/lib/travel-wallet/country-calculations";
import { calculatePlannedTotal } from "@/lib/travel-wallet/countries";
import { getExpensesByCountryId, getUniqueLocationsFromExpenses, calculateExpenseCategories } from "@/lib/travel-wallet/expenses";
import { getTripBySlug } from "@/lib/travel-wallet/trips-storage";
import { formatDateRange } from "@/lib/travel-wallet/countries";

interface SingleCountryDashboardProps {
  data: TravelWalletData;
  slug: string;
  tripStartDate?: string;
  tripEndDate?: string;
  onAddExpense?: () => void;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expense: Expense) => void;
  onAddLocation?: () => void;
  onEditLocation?: (location: string) => void;
  onDeleteLocation?: (location: string) => void;
  onAddCountry?: (startDate?: string, endDate?: string) => void;
  onEditTrip?: () => void;
}

export default function SingleCountryDashboard({
  data,
  slug,
  tripStartDate,
  tripEndDate,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
  onAddCountry,
  onEditTrip,
}: SingleCountryDashboardProps) {
  // Użyj useMemo aby zapewnić aktualność danych kraju
  // Używamy data zamiast data.countries aby wykryć wszystkie zmiany
  const country = useMemo(() => {
    const countryData = data.countries[0];
    console.log('[SingleCountryDashboard] country useMemo - data:', data);
    console.log('[SingleCountryDashboard] country useMemo - data.countries:', data.countries);
    console.log('[SingleCountryDashboard] country useMemo - countryData:', countryData);
    if (countryData) {
      console.log('[SingleCountryDashboard] country useMemo - countryData.locations:', countryData.locations);
      console.log('[SingleCountryDashboard] country useMemo - countryData.locations type:', typeof countryData.locations);
      console.log('[SingleCountryDashboard] country useMemo - countryData.locations isArray:', Array.isArray(countryData.locations));
    }
    return countryData;
  }, [data]);
  
  const trip = getTripBySlug(slug);
  
  // Pobierz wydatki dla kraju
  const expenses = useMemo(() => {
    if (!trip || !country) return [];
    return getExpensesByCountryId(country.id, trip.id);
  }, [trip, country?.id]);

  // Wszystkie hooki muszą być wywoływane przed warunkowym returnem
  const [locationMenuOpen, setLocationMenuOpen] = useState<string | null>(null);

  // Oblicz kategorie wydatków na podstawie aktualnych wydatków
  const calculatedCategories = useMemo(() => {
    if (!country) return [];
    const plannedCategories = country.categories?.map((cat) => ({
      name: cat.name,
      plannedAmount: cat.plannedAmount,
    }));
    return calculateExpenseCategories(expenses, plannedCategories);
  }, [expenses, country?.categories]);

  // Funkcja pomocnicza do formatowania daty na YYYY-MM-DD
  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Formatowanie zakresu dat lokalizacji
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

  // Unikalne lokalizacje z kraju i wydatków, posortowane według daty rozpoczęcia
  const availableLocations = useMemo(() => {
    console.log('[SingleCountryDashboard] availableLocations useMemo - country:', country);
    if (!country) {
      console.log('[SingleCountryDashboard] availableLocations useMemo - no country, returning []');
      return [];
    }
    const countryLocations = country.locations || [];
    console.log('[SingleCountryDashboard] availableLocations useMemo - countryLocations:', countryLocations);
    console.log('[SingleCountryDashboard] availableLocations useMemo - countryLocations.length:', countryLocations.length);
    console.log('[SingleCountryDashboard] availableLocations useMemo - countryLocations type:', typeof countryLocations);
    console.log('[SingleCountryDashboard] availableLocations useMemo - countryLocations isArray:', Array.isArray(countryLocations));
    
    // Debug: sprawdź czy lokalizacje są obecne
    if (countryLocations.length > 0) {
      console.log('[SingleCountryDashboard] availableLocations useMemo - country.locations found:', countryLocations);
      countryLocations.forEach((loc, index) => {
        console.log(`[SingleCountryDashboard] availableLocations useMemo - location[${index}]:`, loc);
        console.log(`[SingleCountryDashboard] availableLocations useMemo - location[${index}] type:`, typeof loc);
      });
    } else {
      console.log('[SingleCountryDashboard] availableLocations useMemo - countryLocations is empty');
    }
    
    const expenseLocations = getUniqueLocationsFromExpenses(expenses);
    console.log('[SingleCountryDashboard] availableLocations useMemo - expenseLocations:', expenseLocations);
    
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
  }, [country, expenses]);

  // Oblicz niewybrane zakresy dat (daty w zakresie kraju, które nie są pokryte przez lokalizacje)
  const unassignedDateRanges = useMemo(() => {
    if (!country || !country.startDate || !country.endDate) return [];
    
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
  }, [country]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pl-PL", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Jeśli nie ma kraju, pokaż empty state
  if (!country || data.countries.length === 0) {
    const totalSpent = calculateTotalSpent(data);
    const remainingBudget = calculateRemainingBudget(data);
    const totalBudget = calculateTotalBudget(data);
    const totalTripDays = calculateTotalTripDays(tripStartDate, tripEndDate);

    return (
      <div className="space-y-8">
        {/* Header z nazwą podróży */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-2">
                {trip?.name || "Podróż"}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                {tripStartDate && tripEndDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(tripStartDate)} - {formatDate(tripEndDate)}</span>
                  </div>
                )}
                {totalBudget > 0 && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Budżet: {formatCurrency(totalBudget)} zł</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statystyki podróży */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <TravelWalletStatCard
            label="Budżet całkowity"
            value={`${formatCurrency(totalBudget)} zł`}
            icon={DollarSign}
          />
          <TravelWalletStatCard
            label="Wydane"
            value={`${formatCurrency(totalSpent)} zł`}
            icon={DollarSign}
          />
          <TravelWalletStatCard
            label="Pozostały budżet"
            value={`${formatCurrency(remainingBudget)} zł`}
            icon={TrendingUp}
          />
          {totalTripDays > 0 && (
            <TravelWalletStatCard
              label="Dni podróży"
              value={totalTripDays.toString()}
              icon={Calendar}
            />
          )}
        </div>

        {/* Sekcja "Dodaj pierwszy kraj" */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                <Globe className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-2">
                Dodaj lokalizację
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Aby rozpocząć śledzenie wydatków, dodaj kraj z lokalizacją do swojej podróży. 
                Będziesz mógł planować budżet i rejestrować wydatki.
              </p>
            </div>
            {onAddCountry && (
              <Button
                variant="primary"
                onClick={() => onAddCountry()}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Dodaj lokalizację
              </Button>
            )}
            {onAddExpense && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  lub
                </p>
                <Button
                  variant="outline"
                  onClick={onAddExpense}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj wydatek
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Postęp budżetu (jeśli są wydatki) */}
        {totalSpent > 0 && (
          <TravelWalletProgress data={data} />
        )}
      </div>
    );
  }

  // Obliczenia dla kraju (tylko jeśli country istnieje)
  const planned = country ? calculatePlannedTotal(country) : 0;
  const actual = calculateTotalActualCost(expenses);
  const travelDays = country ? calculateTravelDays(country.startDate, country.endDate) : 0;
  const averageDailyCost = calculateAverageDailyCost(actual, travelDays);
  const budgetDifference = country ? calculateBudgetDifference(planned, actual) : 0;
  const overBudget = country ? isOverBudget(planned, actual) : false;

  // Sprawdź czy to tryb single-location
  const isSingleLocation = country.locations && country.locations.length === 1;
  const location = isSingleLocation ? country.locations[0] : null;

  const availableBalance = calculateRemainingBudget(data);
  const totalBudget = calculateTotalBudget(data);

  return (
    <div className="space-y-8">
      {/* TravelWalletHeader */}
      <TravelWalletHeader
        userName={data.userName}
        availableBalance={availableBalance}
        totalBudget={totalBudget}
        slug={slug}
        onAddExpense={onAddExpense}
        onEditTrip={onEditTrip}
        data={data}
      />

      {/* Header z nazwą kraju/lokalizacji */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-2">
              {isSingleLocation ? location?.name : country.name}
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
        </div>
      </div>

      {/* Statystyki podróży */}
      <TravelWalletStats 
        data={data} 
        tripStartDate={tripStartDate}
        tripEndDate={tripEndDate}
      />

      {/* Lokalizacje */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Lokalizacje
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
            Brak lokalizacji. Dodaj lokalizację, aby móc przypisywać wydatki do
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
                      (brak lokalizacji)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Kalendarz wydatków */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <CountryExpensesSection
          country={country}
          expenses={expenses}
          onAddExpense={onAddExpense}
          onEditExpense={onEditExpense ? (expense) => {
            // Przekieruj do strony szczegółów kraju z edycją wydatku
            window.location.href = `/portfel-podrozniczy/${slug}/kraje/${country.slug}?expense=${expense.id}`;
          } : undefined}
          onDeleteExpense={onDeleteExpense ? (expense) => {
            // Przekieruj do strony szczegółów kraju z usunięciem wydatku
            window.location.href = `/portfel-podrozniczy/${slug}/kraje/${country.slug}?deleteExpense=${expense.id}`;
          } : undefined}
        />
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

      {/* Postęp budżetu */}
      <TravelWalletProgress data={data} />

      {/* Wykresy */}
      <TravelWalletChartsSection data={data} />

      {/* Budżety według waluty */}
      {country.budgets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Budżety według waluty
          </h2>
          <div className="space-y-2">
            {country.budgets.map((budget, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {budget.currency.toUpperCase()}
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(budget.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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

