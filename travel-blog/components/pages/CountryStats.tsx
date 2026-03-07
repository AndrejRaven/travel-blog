"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Wallet, Calendar, TrendingUp, Clock, MapPin, ArrowRight } from "lucide-react";
import TravelWalletStatCard from "./TravelWalletStatCard";
import type { Country, Expense, TravelWalletData } from "@/lib/travel-wallet/types";
import {
  calculateCountryRemainingBudget,
  calculateCountryTotalSpent,
  calculateDaysInCountry,
  calculateDaysUntilCountryStart,
  calculateDaysUntilCountryEnd,
  getCountryExpensesByCurrency,
} from "@/lib/travel-wallet/calculations";
import { getDaysWithExpensePortionsInRange } from "@/lib/travel-wallet/calendar";
import { calculatePlannedTotal } from "@/lib/travel-wallet/countries";
import { formatCurrency } from "@/lib/travel-wallet/formatters";
import { convertToBaseCurrency, convertAmount } from "@/lib/travel-wallet/reference-rates";

interface CountryStatsProps {
  country: Country;
  expenses: Expense[];
  tripId: string;
  slug?: string;
  data?: TravelWalletData;
  /** Waluta wyświetlania (gdy podróż wielokrajowa i ustawiona dla kraju). Gdy brak – używana jest waluta główna podróży. */
  displayCurrency?: string;
}

export default function CountryStats({
  country,
  expenses,
  tripId,
  slug,
  data,
  displayCurrency: displayCurrencyProp,
}: CountryStatsProps) {
  const router = useRouter();
  const baseCurrency = data?.wallet?.baseCurrency ?? "PLN";
  const displayCurrency = displayCurrencyProp ?? baseCurrency;
  const referenceRates = data?.wallet?.referenceRates ?? [];
  const toDisplay = (amount: number) =>
    displayCurrency === baseCurrency
      ? amount
      : convertAmount(amount, baseCurrency, displayCurrency, referenceRates);

  // Oblicz statystyki dla kraju (z walutą bazową z data gdy dostępna)
  const totalSpent = useMemo(() => {
    return calculateCountryTotalSpent(country.id, tripId);
  }, [country.id, tripId]);

  const expensesByCurrency = useMemo(() => {
    return getCountryExpensesByCurrency(country.id, tripId);
  }, [country.id, tripId]);

  const plannedBudget = useMemo(() => {
    return calculatePlannedTotal(country, data);
  }, [country, data]);

  const remainingBudget = useMemo(() => {
    return calculateCountryRemainingBudget(country, expenses, tripId, data);
  }, [country, expenses, tripId, data]);

  const daysInCountry = useMemo(() => {
    return calculateDaysInCountry(country);
  }, [country]);

  const avgDailySpend = useMemo(() => {
    if (totalSpent <= 0) return 0;
    if (!country.startDate || !country.endDate) return 0;
    const daysWithPortions = getDaysWithExpensePortionsInRange(expenses, country.startDate, country.endDate);
    return daysWithPortions > 0 ? totalSpent / daysWithPortions : 0;
  }, [expenses, country.startDate, country.endDate, totalSpent]);

  const daysUntilStart = useMemo(() => {
    return calculateDaysUntilCountryStart(country);
  }, [country]);

  const daysUntilEnd = useMemo(() => {
    return calculateDaysUntilCountryEnd(country);
  }, [country]);

  // Oblicz odwiedzone lokalizacje
  const { visitedLocations, totalLocations } = useMemo(() => {
    if (!country.locations || country.locations.length === 0) {
      return { visitedLocations: 0, totalLocations: 0 };
    }
    
    const locationsWithDates = country.locations.filter((loc) => typeof loc !== "string");
    const total = locationsWithDates.length;
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const visited = locationsWithDates.filter((loc) => {
      if (typeof loc === "string") return false;
      if (!loc.endDate) return false;
      const endDate = new Date(loc.endDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate <= now;
    }).length;
    
    return { visitedLocations: visited, totalLocations: total };
  }, [country.locations]);

  // Zaplanowany budżet kraju per waluta z kwotą w walucie bazowej (do sekcji "Mam przeznaczone")
  const plannedBudgetsInBase = useMemo(() => {
    if (!country.budgets?.length) return [];
    const refRates = data?.wallet?.referenceRates;
    const base = data?.wallet?.baseCurrency ?? "PLN";
    return country.budgets
      .filter((b) => b.amount > 0)
      .map((b) => ({
        currency: b.currency,
        amount: b.amount,
        amountInBase: refRates && data?.wallet
          ? convertToBaseCurrency(b.amount, b.currency, base, refRates)
          : b.amount * ({ PLN: 1, EUR: 4.3, USD: 4.0, GBP: 5.0, THB: 0.11 }[b.currency] ?? 1),
      }));
  }, [country.budgets, data?.wallet]);

  // Waluty z wydatków
  const walletCurrencies = useMemo(() => {
    return Object.keys(expensesByCurrency).sort((a, b) => {
      if (a === "PLN") return -1;
      if (b === "PLN") return 1;
      return a.localeCompare(b);
    });
  }, [expensesByCurrency]);

  const handleTotalSpentClick = () => {
    if (slug) {
      router.push(`/portfel-podrozniczy/${slug}/statystyki-wydatkow`);
    }
  };

  // Określ status pobytu w kraju
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const startDate = country.startDate ? new Date(country.startDate) : null;
  const endDate = country.endDate ? new Date(country.endDate) : null;
  
  let stayStatus: {
    label: string;
    value: string;
  } = { label: "", value: "" };

  if (startDate && endDate) {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    if (startDate > now) {
      // Pobyt jeszcze się nie zaczął
      stayStatus = {
        label: "Zostało do rozpoczęcia pobytu",
        value: `${daysUntilStart} dni`,
      };
    } else if (endDate < now) {
      // Pobyt już się zakończył
      stayStatus = {
        label: "Pobyt zakończony",
        value: "Zakończony",
      };
    } else {
      // Pobyt trwa
      stayStatus = {
        label: "Zostało do zakończenia pobytu",
        value: `${daysUntilEnd} dni`,
      };
    }
  }

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Łącznie wydano w kraju */}
        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden animate-fade-in-up"
          onClick={handleTotalSpentClick}
          style={{ animationDelay: "0s" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="flex flex-col h-full relative z-10">
            <div className="flex items-start justify-between flex-1">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  Łącznie wydano w kraju
                </p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {formatCurrency(toDisplay(totalSpent), displayCurrency)}
                </p>
                {Object.keys(expensesByCurrency).length > 0 && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {Object.entries(expensesByCurrency)
                      .filter(([, amount]) => amount > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([currency, amount]) => formatCurrency(amount, currency))
                      .join(" · ")}
                  </p>
                )}
                {avgDailySpend > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                    Śr. dzienna (z wydatków): {formatCurrency(toDisplay(avgDailySpend), displayCurrency)}
                  </p>
                )}
                {plannedBudget > 0 && daysInCountry > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Założona średnia dzienna: {formatCurrency(toDisplay(plannedBudget / daysInCountry), displayCurrency)} (budżet {formatCurrency(toDisplay(plannedBudget), displayCurrency)} ÷ {daysInCountry} dni w kraju)
                  </p>
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

        {/* Pozostały budżet kraju */}
        <TravelWalletStatCard
          label="Pozostały budżet kraju"
          value={`≈ ${formatCurrency(toDisplay(remainingBudget), displayCurrency, 2)} / ${formatCurrency(toDisplay(plannedBudget), displayCurrency, 2)}`}
          icon={Wallet}
        />

        {/* Dni w kraju */}
        <TravelWalletStatCard
          label="Dni w kraju"
          value={daysInCountry}
          icon={Calendar}
        />

        {/* Średnie dzienne wydatki w kraju */}
        <TravelWalletStatCard
          label="Średnie dzienne wydatki w kraju"
          value={formatCurrency(toDisplay(avgDailySpend), displayCurrency)}
          icon={TrendingUp}
        />

        {/* Dni do rozpoczęcia/zakończenia pobytu */}
        {stayStatus.label && (
          <TravelWalletStatCard
            label={stayStatus.label}
            value={stayStatus.value}
            icon={Clock}
          />
        )}

        {/* Lokalizacje w kraju */}
        {totalLocations > 0 && (
          <TravelWalletStatCard
            label="Odwiedzone miejsca"
            value={`${visitedLocations}/${totalLocations}`}
            icon={MapPin}
          />
        )}
      </div>

      {/* Budżet kraju – jak na głównym dashboardzie, tylko dla tego kraju */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
          Budżet kraju
        </p>
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
          <div className="flex justify-between gap-4 items-center">
            <span>Całkowity (zaplanowany):</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {formatCurrency(toDisplay(plannedBudget), displayCurrency, 2)}
            </span>
          </div>
          <div className="flex justify-between gap-4 items-center">
            <span>Wydane:</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {formatCurrency(toDisplay(totalSpent), displayCurrency, 2)}
            </span>
          </div>
          <div className="flex justify-between gap-4 items-center pt-1 border-t border-gray-200 dark:border-gray-700">
            <span className="font-semibold">Pozostały:</span>
            <span className={`font-semibold ${remainingBudget >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              ≈ {formatCurrency(toDisplay(remainingBudget), displayCurrency, 2)}
            </span>
          </div>
          {plannedBudgetsInBase.length > 0 && (
            <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 mb-1.5">Mam przeznaczone dla kraju:</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {plannedBudgetsInBase.map((b) => (
                  <span key={b.currency}>
                    <span className="font-medium">{formatCurrency(b.amount, b.currency, 2)}</span>
                    <span className="text-gray-500 dark:text-gray-500">
                      {" "}({formatCurrency(toDisplay(b.amountInBase), displayCurrency, 2)})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
