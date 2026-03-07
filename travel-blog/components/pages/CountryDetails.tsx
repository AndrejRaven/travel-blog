"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "@/components/ui/Link";
import { MoreVertical, Plus, Edit, Trash2, Search } from "lucide-react";
import TravelWalletHeader from "./TravelWalletHeader";
import TravelWalletStats from "./TravelWalletStats";
import CountryStats from "./CountryStats";
import CurrencyBalancesCard from "./CurrencyBalancesCard";
import TravelWalletProgress from "./TravelWalletProgress";
import type { Country, Expense, TravelWalletData, CurrencyTransaction } from "@/lib/travel-wallet/types";
import {
  formatDateRange,
  calculatePlannedTotal,
  getCountryStatusLabel,
} from "@/lib/travel-wallet/countries";
import { formatCurrency } from "@/lib/travel-wallet/formatters";
import { convertAmount } from "@/lib/travel-wallet/reference-rates";

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
  calculateTotalActualCostByTripId,
  calculateTravelDays,
  calculateAverageDailyCost,
  calculateBudgetDifference,
  isOverBudget,
} from "@/lib/travel-wallet/country-calculations";
import {
  calculateRemainingBudget,
  calculateTotalBudget,
} from "@/lib/travel-wallet/calculations";
import { getUniqueLocationsFromExpenses, calculateExpenseCategories } from "@/lib/travel-wallet/expenses";
import CountryExpensesSection from "./CountryExpensesSection";
import type { ExpenseCategory } from "@/lib/travel-wallet/types";
import { getBalancesForCountry } from "@/lib/travel-wallet/wallet-operations";
import { getTripBySlug } from "@/lib/travel-wallet/trips-storage";
import { getCurrencyName } from "@/lib/travel-wallet/currency-names";

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
  data?: TravelWalletData; // Pełne dane podróży
  tripName?: string;
  tripStartDate?: string;
  tripEndDate?: string;
  transactions?: CurrencyTransaction[]; // Transakcje walutowe dla kraju
  onAddCurrencyTransaction?: () => void;
  onDeleteCurrencyTransaction?: (transactionId: string) => void;
  onEditCurrencyTransaction?: (transaction: CurrencyTransaction) => void;
  onTransactionClick?: (transaction: CurrencyTransaction) => void;
  onEditTrip?: () => void;
  onEditCountry?: () => void;
  /** Callback przy zmianie waluty wyświetlania (tylko podróże wielokrajowe). */
  onDisplayCurrencyChange?: (displayCurrency: string) => void;
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
  data,
  tripName,
  tripStartDate,
  tripEndDate,
  transactions = [],
  onAddCurrencyTransaction,
  onDeleteCurrencyTransaction,
  onEditCurrencyTransaction,
  onTransactionClick,
  onEditTrip,
  onEditCountry,
  onDisplayCurrencyChange,
}: CountryDetailsProps) {
  const [locationMenuOpen, setLocationMenuOpen] = useState<string | null>(null);
  const [displayCurrencyDropdownOpen, setDisplayCurrencyDropdownOpen] = useState(false);
  const [displayCurrencyFilterText, setDisplayCurrencyFilterText] = useState("");
  const displayCurrencyDropdownRef = useRef<HTMLDivElement>(null);
  const baseCurrency = data?.wallet?.baseCurrency ?? "PLN";
  const displayCurrency = country.displayCurrency ?? baseCurrency;
  const referenceRates = data?.wallet?.referenceRates ?? [];
  const toDisplay = (amount: number) =>
    displayCurrency === baseCurrency
      ? amount
      : convertAmount(amount, baseCurrency, displayCurrency, referenceRates);

  const planned = calculatePlannedTotal(country, data);
  const actual =
    tripId
      ? calculateTotalActualCostByTripId(expenses, tripId)
      : calculateTotalActualCost(expenses, data?.wallet?.baseCurrency, data?.wallet?.referenceRates);
  const travelDays = calculateTravelDays(country.startDate, country.endDate);
  const averageDailyCost = calculateAverageDailyCost(actual, travelDays);
  const budgetDifference = calculateBudgetDifference(planned, actual);
  const overBudget = isOverBudget(planned, actual);
  const remainingCountry = Math.max(0, planned - actual);

  // Salda walutowe dla kraju (do bloku Dostępne środki)
  const countryBalanceCurrencies = useMemo(() => {
    if (!data?.wallet || !tripId || !slug) return [];
    const trip = getTripBySlug(slug);
    if (!trip) return [];
    const balances = getBalancesForCountry(data.wallet, tripId, country.id);
    return balances
      .filter((b) => b.amount > 0.01)
      .map((b) => ({
        currency: b.currency,
        amount: b.amount,
        isBase: b.currency === baseCurrency,
      }))
      .sort((a, b) => {
        if (a.isBase) return -1;
        if (b.isBase) return 1;
        return a.currency.localeCompare(b.currency);
      });
  }, [data?.wallet, tripId, slug, country.id, baseCurrency]);

  // Waluty dostępne w portfelu (salda + z transakcji wymiany) – do selecta waluty wyświetlania
  const walletCurrencyCodes = useMemo(() => {
    if (!data?.wallet) return [];
    const fromBalances = data.wallet.balances.map((b) => b.currency);
    const fromTransactions = transactions.flatMap((t) => [t.fromCurrency, t.toCurrency]);
    const set = new Set<string>([baseCurrency, ...fromBalances, ...fromTransactions]);
    return Array.from(set).sort((a, b) => {
      if (a === baseCurrency) return -1;
      if (b === baseCurrency) return 1;
      return a.localeCompare(b);
    });
  }, [data?.wallet, baseCurrency, transactions]);

  const getDisplayCurrencySearchText = (code: string) =>
    `${code} ${getCurrencyName(code)}`.toLowerCase();
  const filteredDisplayCurrencies = useMemo(() => {
    const q = displayCurrencyFilterText.trim().toLowerCase();
    if (!q) return walletCurrencyCodes;
    return walletCurrencyCodes.filter((code) => getDisplayCurrencySearchText(code).includes(q));
  }, [walletCurrencyCodes, displayCurrencyFilterText]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (displayCurrencyDropdownRef.current?.contains(e.target as Node)) return;
      setDisplayCurrencyDropdownOpen(false);
    };
    if (displayCurrencyDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [displayCurrencyDropdownOpen]);

  // Oblicz availableBalance i totalBudget dla TravelWalletHeader
  const availableBalance = data && tripId ? calculateRemainingBudget(data, tripId) : 0;
  const totalBudget = data && tripId ? (data.totalBudget ?? calculateTotalBudget(data, tripId)) : 0;

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


  return (
    <div className="space-y-8">
      {/* Karta: nazwa kraju + daty/status oraz Dostępne środki + Budżet kraju w jednym bloku */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        {/* Waluta wyświetlania – wyżej i bardziej widoczna, select z wyszukiwaniem (tylko waluty z portfela) */}
        {data?.countries && data.countries.length > 1 && onDisplayCurrencyChange && walletCurrencyCodes.length > 0 && (
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Waluta wyświetlania w tym kraju
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Kwoty na stronie tego kraju będą pokazywane w wybranej walucie (przeliczenie z waluty głównej podróży).
            </p>
            <div className="relative max-w-md" ref={displayCurrencyDropdownRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-[1]" />
              <input
                type="text"
                readOnly={!displayCurrencyDropdownOpen}
                value={displayCurrencyDropdownOpen ? displayCurrencyFilterText : `${displayCurrency} – ${getCurrencyName(displayCurrency)}`}
                onChange={(e) => {
                  setDisplayCurrencyFilterText(e.target.value);
                  setDisplayCurrencyDropdownOpen(true);
                }}
                onFocus={() => {
                  setDisplayCurrencyDropdownOpen(true);
                  setDisplayCurrencyFilterText("");
                }}
                placeholder="Wpisz kod lub nazwę (np. USD, dolar)..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
              {displayCurrencyDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto z-10">
                  {filteredDisplayCurrencies.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      Brak pasujących walut
                    </div>
                  ) : (
                    filteredDisplayCurrencies.map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          onDisplayCurrencyChange(code);
                          setDisplayCurrencyDropdownOpen(false);
                          setDisplayCurrencyFilterText("");
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between gap-2"
                      >
                        <span>{code} – {getCurrencyName(code)}</span>
                        {code === displayCurrency && (
                          <span className="text-blue-600 dark:text-blue-400 font-medium">✓</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Lewa strona – informacje o kraju */}
          <div>
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
                {getCountryStatusLabel(country.status)}
              </p>
            </div>
          </div>
          {/* Prawa strona – Dostępne środki + Budżet kraju */}
          {tripId && data?.wallet && (
            <div className="text-right w-full md:w-auto md:min-w-[240px] shrink-0">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                Dostępne środki
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-3">
                <div className="flex justify-between gap-4 items-center">
                  <span>Całkowity:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatCurrency(toDisplay(remainingCountry), displayCurrency, 2)}
                  </span>
                </div>
                {countryBalanceCurrencies.map((balance) => (
                  <div key={balance.currency} className="flex justify-between gap-4 items-center">
                    <span>{balance.currency === baseCurrency ? balance.currency : getCurrencyName(balance.currency)}:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {formatCurrency(balance.amount, balance.currency, 2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Budżet kraju
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <div className="flex justify-between gap-4">
                    <span>Całkowity (zaplanowany):</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {formatCurrency(toDisplay(planned), displayCurrency, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Wydane:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {formatCurrency(toDisplay(actual), displayCurrency, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 pt-1 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-semibold">Pozostały:</span>
                    <span className={`font-semibold ${remainingCountry >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      ≈ {formatCurrency(toDisplay(remainingCountry), displayCurrency, 2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CountryStats */}
      {tripId && (
        <CountryStats
          country={country}
          expenses={expenses}
          tripId={tripId}
          slug={slug}
          data={data}
          displayCurrency={displayCurrency}
        />
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

      {/* CurrencyBalancesCard */}
      {tripId && onAddCurrencyTransaction && onTransactionClick && (
        <CurrencyBalancesCard
          transactions={transactions}
          onAddTransaction={onAddCurrencyTransaction}
          onTransactionClick={onTransactionClick}
        />
      )}

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
              {formatCurrency(toDisplay(planned), displayCurrency)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">
              Faktyczne wydatki:
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(toDisplay(actual), displayCurrency)}
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
              {formatCurrency(toDisplay(budgetDifference), displayCurrency)}
            </span>
          </div>
          {travelDays > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Średni dzienny koszt:
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(toDisplay(averageDailyCost), displayCurrency)}/dzień
              </span>
            </div>
          )}
        </div>
      </div>

      {/* TravelWalletProgress dla kraju */}
      {data && tripId && (
        <TravelWalletProgress
          data={data}
          tripId={tripId}
          country={country}
          expenses={expenses}
        />
      )}

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
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(toDisplay(category.amount), displayCurrency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

