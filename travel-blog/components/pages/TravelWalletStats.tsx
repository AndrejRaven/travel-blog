"use client";

import { useMemo } from "react";
import { DollarSign, Wallet, MapPin, Calendar, TrendingUp, Clock } from "lucide-react";
import TravelWalletStatCard from "./TravelWalletStatCard";
import type { TravelWalletData } from "@/lib/travel-wallet/types";
import {
  calculateTotalSpent,
  calculateRemainingBudget,
  calculateTotalBudget,
  calculateCountriesVisited,
  calculateTotalCountries,
  calculateTravelDays,
  calculateAverageDailySpend,
  calculateDaysInTravel,
  calculateDaysRemaining,
  calculateDaysUntilStart,
  calculateTotalTripDays,
} from "@/lib/travel-wallet/calculations";
import { getEffectiveDashboardMode } from "@/lib/travel-wallet/dashboard-mode";
import { getBalancesWithBaseCurrency } from "@/lib/travel-wallet/wallet-operations";
import { calculateCurrencyBalances } from "@/lib/travel-wallet/currency-balances";
import { getTripBySlug } from "@/lib/travel-wallet/trips-storage";
import { formatCurrency } from "@/lib/travel-wallet/formatters";

interface TravelWalletStatsProps {
  data: TravelWalletData;
  tripId?: string;
  tripStartDate?: string;
  tripEndDate?: string;
  slug?: string;
}

export default function TravelWalletStats({ 
  data,
  tripId,
  tripStartDate, 
  tripEndDate,
  slug,
}: TravelWalletStatsProps) {
  const totalSpent = calculateTotalSpent(data, tripId);
  const remaining = calculateRemainingBudget(data, tripId);
  // Use data.totalBudget for planned budget (original total budget), fallback to calculateTotalBudget
  const plannedBudget = data.totalBudget ?? calculateTotalBudget(data, tripId);
  const countriesVisited = calculateCountriesVisited(data);
  const totalCountries = calculateTotalCountries(data);
  const travelDays = calculateTravelDays(data);
  const avgDailySpend = calculateAverageDailySpend(data, tripId);
  
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pl-PL", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Oblicz salda walutowe
  const currencyBalances = useMemo(() => {
    const balances: Array<{ currency: string; amount: number; amountInPLN: number }> = [];

    // Sprawdź czy jest nowy system wallet
    if (data.wallet) {
      const walletBalances = getBalancesWithBaseCurrency(data.wallet);
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
      <TravelWalletStatCard
        label="Łącznie wydano"
        value={`${formatCurrency(totalSpent)} zł`}
        icon={DollarSign}
      />
      <TravelWalletStatCard
        label="Pozostały budżet"
        value={`≈ ${formatCurrency(remaining)}/${formatCurrency(plannedBudget)} zł`}
        icon={Wallet}
      />
      <TravelWalletStatCard
        label={isSingleMode ? "Odwiedzone miejsca" : "Odwiedzone kraje"}
        value={isSingleMode ? `${locationsVisited}/${totalLocations}` : `${countriesVisited}/${totalCountries}`}
        icon={MapPin}
      />
      <TravelWalletStatCard
        label="Wszystkie dni podróży"
        value={travelDaysDisplay}
        icon={Calendar}
      />
      <TravelWalletStatCard
        label="Średnie dzienne wydatki"
        value={`${formatCurrency(avgDailySpend)} zł`}
        icon={TrendingUp}
      />
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
      
      {/* Podsumowanie walutowe */}
      {currencyBalances.length > 0 && (
        <div className="col-span-full mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            {currencyBalances.map((balance) => (
              <span key={balance.currency}>
                <span className="font-medium">{balance.currency}:</span>{" "}
                <span>{formatCurrency(balance.amount)}</span>{" "}
                <span className="text-gray-500 dark:text-gray-500">
                  ({formatCurrency(balance.amountInPLN)} zł)
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

