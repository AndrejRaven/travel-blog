"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Wallet, MapPin, Calendar, TrendingUp, Clock, ArrowRight } from "lucide-react";
import TravelWalletStatCard from "./TravelWalletStatCard";
import type { TravelWalletData } from "@/lib/travel-wallet/types";
import {
  calculateTotalSpent,
  calculateRemainingBudget,
  calculateTotalBudget,
  calculateCountriesVisited,
  calculateTotalCountries,
  calculateTravelDays,
  calculateDaysInTravel,
  calculateDaysRemaining,
  calculateDaysUntilStart,
  calculateTotalTripDays,
} from "@/lib/travel-wallet/calculations";
import { getEffectiveDashboardMode } from "@/lib/travel-wallet/dashboard-mode";
import { getBalancesWithBaseCurrency } from "@/lib/travel-wallet/wallet-operations";
import { calculateCurrencyBalances } from "@/lib/travel-wallet/currency-balances";
import { getTripBySlug } from "@/lib/travel-wallet/trips-storage";
import { getAllExpenses } from "@/lib/travel-wallet/expenses";
import { getDaysWithExpensePortionsInRange } from "@/lib/travel-wallet/calendar";
import { formatCurrency } from "@/lib/travel-wallet/formatters";

interface TravelWalletStatsProps {
  data: TravelWalletData;
  tripId?: string;
  tripStartDate?: string;
  tripEndDate?: string;
  slug?: string;
  /** Waluta główna do wyświetlania sum (np. PLN, USD). Domyślnie z data.wallet lub "PLN". */
  baseCurrency?: string;
}

export default function TravelWalletStats({ 
  data,
  tripId,
  tripStartDate, 
  tripEndDate,
  slug,
  baseCurrency = data?.wallet?.baseCurrency ?? "PLN",
}: TravelWalletStatsProps) {
  const currency = baseCurrency ?? data?.wallet?.baseCurrency ?? "PLN";
  const router = useRouter();
  const totalSpent = calculateTotalSpent(data, tripId);
  
  // Oblicz wydatki w różnych walutach (do ewentualnego użycia)
  const expensesByCurrency = useMemo(() => {
    if (!tripId) return {};
    const expenses = getAllExpenses(tripId);
    return expenses.reduce((acc: Record<string, number>, exp: { currency: string; amount: number }) => {
      acc[exp.currency] = (acc[exp.currency] || 0) + exp.amount;
      return acc;
    }, {});
  }, [tripId]);
  const remaining = calculateRemainingBudget(data, tripId);
  const plannedBudget = data.totalBudget ?? calculateTotalBudget(data, tripId);
  const countriesVisited = calculateCountriesVisited(data);
  const totalCountries = calculateTotalCountries(data);
  const travelDays = calculateTravelDays(data);

  const avgDailySpend = useMemo(() => {
    const spent = calculateTotalSpent(data, tripId);
    const daysInTrip = calculateTotalTripDays(tripStartDate, tripEndDate);
    if (!tripId) return 0;
    const expenses = getAllExpenses(tripId);
    const daysWithExpenses =
      expenses.length && tripStartDate && tripEndDate
        ? getDaysWithExpensePortionsInRange(expenses, tripStartDate, tripEndDate)
        : 0;
    if (daysWithExpenses > 0) return spent / daysWithExpenses;
    if (daysInTrip > 0 && plannedBudget > 0) return plannedBudget / daysInTrip;
    return 0;
  }, [data, tripId, tripStartDate, tripEndDate, plannedBudget]);
  
  // Wykryj aktualny tryb dashboardu
  const effectiveMode = getEffectiveDashboardMode(data);
  
  // Dla trybu single-country oblicz liczbę lokalizacji
  const isSingleMode = effectiveMode === "single-country" || effectiveMode === "single-location";
  let locationsVisited = 0;
  let totalLocations = 0;
  
  if (isSingleMode && data.countries.length > 0) {
    const country = data.countries[0];
    const locations = country.locations || [];
    // Filtruj tylko lokalizacje z datami (nie stringi)
    const locationsWithDates = locations.filter((loc) => typeof loc !== "string");
    totalLocations = locationsWithDates.length;
    // Policz odwiedzone lokalizacje (te z datami zakończenia w przeszłości lub obecne)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    locationsVisited = locationsWithDates.filter((loc) => {
      if (typeof loc === "string") return false;
      if (!loc.endDate) return false;
      const endDate = new Date(loc.endDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate <= now;
    }).length;
  }
  
  // Oblicz dni na podstawie dat podróży
  const totalTripDays = calculateTotalTripDays(tripStartDate, tripEndDate);
  let daysInTravel = calculateDaysInTravel(tripStartDate, tripEndDate);
  const daysRemaining = calculateDaysRemaining(tripEndDate);
  const daysUntilStart = calculateDaysUntilStart(tripStartDate);
  
  // Sprawdź czy podróż już się odbyła
  const isTripCompleted = tripEndDate ? new Date(tripEndDate) < new Date() : false;
  
  // Sprawdź czy podróż już się zaczęła
  const isTripStarted = tripStartDate ? new Date(tripStartDate) <= new Date() : true;
  
  // Upewnij się, że daysInTravel nie przekracza totalTripDays
  if (totalTripDays > 0 && daysInTravel > totalTripDays) {
    daysInTravel = totalTripDays;
  }
  
  // Format dla dni podróży: "dni w podróży/pozostało = 84/101"
  const travelDaysDisplay = tripStartDate && tripEndDate && totalTripDays > 0
    ? `${daysInTravel}/${totalTripDays}`
    : travelDays.toString();


  // Oblicz salda walutowe
  const currencyBalances = useMemo(() => {
    const balances: Array<{ currency: string; amount: number; amountInPLN: number }> = [];

    // Sprawdź czy jest nowy system wallet
    if (data.wallet) {
      // Use tripId to get actual exchange rates from transactions
      const walletBalances = getBalancesWithBaseCurrency(data.wallet, tripId);
      walletBalances.forEach((balance) => {
        if (balance.amount > 0.01) {
          balances.push({
            currency: balance.currency,
            amount: balance.amount,
            amountInPLN: balance.amountInBase,
          });
        }
      });
    } else if (slug) {
      // Stary system - użyj calculateCurrencyBalances
      const trip = getTripBySlug(slug);
      
      if (trip) {
        const oldBalances = calculateCurrencyBalances(trip);
        oldBalances.forEach((balance) => {
          if (balance.amount > 0.01) {
            // Przelicz na PLN używając stałych kursów z currency-balances.ts
            const exchangeRates: Record<string, number> = {
              PLN: 1,
              EUR: 4.3,
              USD: 4.0,
              GBP: 5.0,
              THB: 0.12,
              JPY: 0.027,
              AUD: 2.6,
              CAD: 2.9,
            };
            const rate = exchangeRates[balance.currency.toUpperCase()] || 1;
            balances.push({
              currency: balance.currency,
              amount: balance.amount,
              amountInPLN: balance.amount * rate,
            });
          }
        });
      }
    }

    // Sortuj: najpierw PLN, potem alfabetycznie
    return balances.sort((a, b) => {
      if (a.currency === "PLN") return -1;
      if (b.currency === "PLN") return 1;
      return a.currency.localeCompare(b.currency);
    });
  }, [data.wallet, tripId, slug]);

  const handleTotalSpentClick = () => {
    if (slug) {
      router.push(`/portfel-podrozniczy/${slug}/statystyki-wydatkow`);
    }
  };

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden animate-fade-in-up"
          onClick={handleTotalSpentClick}
          style={{ animationDelay: "0s" }}
        >
          {/* Gradient background on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="flex flex-col h-full relative z-10">
            <div className="flex items-start justify-between flex-1">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  Łącznie wydano
                </p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {formatCurrency(totalSpent, currency)}
                </p>
                {Object.keys(expensesByCurrency).length > 0 && (
                  <div className="space-y-1 mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {Object.entries(expensesByCurrency)
                      .filter(([, amount]) => amount > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([currency, amount]) => (
                        <p key={currency}>{formatCurrency(amount, currency)}</p>
                      ))}
                  </div>
                )}
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 flex-shrink-0 ml-4 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:rotate-3 transition-transform duration-300" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                <span>Zobacz wszystko</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="flex flex-col h-full relative z-10">
          <div className="flex items-start justify-between flex-1">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Pozostały budżet
              </p>
              <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                ≈ {formatCurrency(remaining, currency)} / {formatCurrency(plannedBudget, currency)}
              </p>
              {currencyBalances.length > 0 && (
                <div className="space-y-1 mt-2 text-xs text-gray-600 dark:text-gray-400">
                  {currencyBalances.map((b) => (
                    <p key={b.currency}>{formatCurrency(b.amount, b.currency)}</p>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 flex-shrink-0 ml-4 group-hover:scale-110 transition-transform duration-300">
              <Wallet className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:rotate-3 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </div>
      {(() => {
        const formatRange = (startDate?: string, endDate?: string) => {
          if (!startDate || !endDate) return "";
          const s = new Date(startDate);
          const e = new Date(endDate);
          return `${s.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" })} – ${e.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" })}`;
        };
        const unassignedRanges: Array<{ startDate: string; endDate: string }> = [];
        if (tripStartDate && tripEndDate && data.countries.length > 0) {
          const tripStart = new Date(tripStartDate);
          const tripEnd = new Date(tripEndDate);
          const toYMD = (d: Date) => d.toISOString().split("T")[0];
          const ranges = data.countries
            .filter((c) => c.startDate && c.endDate)
            .map((c) => ({ start: new Date(c.startDate!), end: new Date(c.endDate!) }))
            .sort((a, b) => a.start.getTime() - b.start.getTime());
          let cur = new Date(tripStart);
          for (const r of ranges) {
            if (cur < r.start) {
              const gapEnd = new Date(r.start);
              gapEnd.setDate(gapEnd.getDate() - 1);
              if (cur <= gapEnd) unassignedRanges.push({ startDate: toYMD(cur), endDate: toYMD(gapEnd) });
            }
            cur = new Date(r.end);
            cur.setDate(cur.getDate() + 1);
          }
          if (cur <= tripEnd) unassignedRanges.push({ startDate: toYMD(cur), endDate: toYMD(tripEnd) });
        }
        const sortedCountries = [...data.countries].sort((a, b) =>
          (a.startDate && b.startDate ? new Date(a.startDate).getTime() - new Date(b.startDate).getTime() : 0)
        );
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex flex-col h-full relative z-10">
              <div className="flex items-start justify-between flex-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                    Kraje i daty
                  </p>
                  <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                    {sortedCountries.map((c) => (
                      <p key={c.id} className="truncate">
                        {c.name}: {formatRange(c.startDate, c.endDate) || "—"}
                      </p>
                    ))}
                    {unassignedRanges.length > 0 && (
                      <p className="text-amber-600 dark:text-amber-400 font-medium">
                        Brak zaplanowanego kraju (daty): {unassignedRanges.map((u) => formatRange(u.startDate, u.endDate)).join(", ")}
                      </p>
                    )}
                    {data.countries.length === 0 && !tripStartDate && !tripEndDate && (
                      <p className="text-gray-500 dark:text-gray-400">Brak danych</p>
                    )}
                  </div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 flex-shrink-0 ml-4">
                  <MapPin className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      <TravelWalletStatCard
        label="Wszystkie dni podróży"
        value={travelDaysDisplay}
        icon={Calendar}
      />
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="flex flex-col h-full relative z-10">
          <div className="flex items-start justify-between flex-1">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Średnie dzienne wydatki
              </p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {formatCurrency(avgDailySpend, currency)}
              </p>
              {plannedBudget > 0 && totalTripDays > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Założona średnia dzienna: {formatCurrency(plannedBudget / totalTripDays, currency)} (budżet {formatCurrency(plannedBudget, currency)} ÷ {totalTripDays} dni podróży)
                </p>
              )}
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 flex-shrink-0 ml-4 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:rotate-3 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </div>
      <TravelWalletStatCard
        label={
          !isTripStarted 
            ? "Zostało do początku podróży"
            : "Zostało do końca podróży"
        }
        value={
          !isTripStarted
            ? tripStartDate
              ? `${daysUntilStart} dni`
              : "—"
            : tripEndDate 
              ? isTripCompleted 
                ? "Podróż zakończona" 
                : `${daysRemaining} dni`
              : "—"
        }
        icon={Clock}
      />
      </div>
      
      {/* Podsumowanie walutowe */}
      {currencyBalances.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            {currencyBalances.map((balance) => (
              <span key={balance.currency}>
                <span className="font-medium">{balance.currency}:</span>{" "}
                <span>{formatCurrency(balance.amount, balance.currency)}</span>{" "}
                <span className="text-gray-500 dark:text-gray-500">
                  ({formatCurrency(balance.amountInPLN, currency)})
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

