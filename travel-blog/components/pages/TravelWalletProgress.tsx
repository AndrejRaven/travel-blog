"use client";

import { TrendingUp } from "lucide-react";
import { ProgressBar } from "./TravelWalletCharts";
import type { TravelWalletData, Country, Expense } from "@/lib/travel-wallet/types";
import {
  calculateTotalBudget,
  calculateTotalSpent,
  calculateBurnRate,
} from "@/lib/travel-wallet/calculations";
import {
  calculatePlannedTotal,
} from "@/lib/travel-wallet/countries";
import {
  calculateTotalActualCost,
  calculateTotalActualCostByTripId,
  calculateTravelDays,
} from "@/lib/travel-wallet/country-calculations";
import { formatCurrency } from "@/lib/travel-wallet/formatters";

// Funkcja pomocnicza do obliczania burn rate dla kraju (w walucie bazowej gdy podano tripId/data)
function calculateBurnRateForCountry(
  country: Country,
  expenses: Expense[],
  tripId?: string,
  data?: TravelWalletData
): number {
  const planned = calculatePlannedTotal(country, data);
  const actual = tripId
    ? calculateTotalActualCostByTripId(expenses, tripId)
    : calculateTotalActualCost(expenses);
  if (planned === 0) return 0;
  const difference = actual - planned;
  return (difference / planned) * 100;
}

interface TravelWalletProgressProps {
  data: TravelWalletData;
  tripId?: string;
  /** Waluta główna do wyświetlania sum (np. PLN, USD). Domyślnie z data.wallet lub "PLN". */
  baseCurrency?: string;
  country?: Country;
  expenses?: Expense[];
}

export default function TravelWalletProgress({
  data,
  tripId,
  baseCurrency = data?.wallet?.baseCurrency ?? "PLN",
  country,
  expenses,
}: TravelWalletProgressProps) {
  const currency = baseCurrency ?? data?.wallet?.baseCurrency ?? "PLN";
  const isCountryMode = country !== undefined && expenses !== undefined;

  const totalBudget = isCountryMode
    ? calculatePlannedTotal(country, data)
    : calculateTotalBudget(data, tripId);
  const totalSpent = isCountryMode
    ? tripId
      ? calculateTotalActualCostByTripId(expenses || [], tripId)
      : calculateTotalActualCost(expenses || [])
    : calculateTotalSpent(data, tripId);
  const burnRate = isCountryMode
    ? calculateBurnRateForCountry(country, expenses || [], tripId, data)
    : calculateBurnRate(data, tripId);

  const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6 mb-8">
      {/* Budget Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Postęp budżetu
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(totalSpent, currency)}/{formatCurrency(totalBudget, currency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {percentage.toFixed(1)}%
            </p>
          </div>
        </div>
        <ProgressBar
          value={totalSpent}
          max={totalBudget}
          color="blue"
          height="lg"
          showLabel={false}
        />
      </div>

      {/* Burn Rate */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Tempo wydatków
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p
            className={`text-2xl font-bold ${
              burnRate >= 0
                ? "text-red-600 dark:text-red-400"
                : "text-green-600 dark:text-green-400"
            }`}
          >
            {burnRate >= 0 ? "+" : ""}
            {burnRate.toFixed(1)}%
          </p>
          <TrendingUp
            className={`w-5 h-5 ${
              burnRate >= 0
                ? "text-red-600 dark:text-red-400"
                : "text-green-600 dark:text-green-400 rotate-180"
            }`}
          />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Wydawanie{" "}
          {burnRate >= 0
            ? `${Math.abs(burnRate).toFixed(1)}% szybciej`
            : `${Math.abs(burnRate).toFixed(1)}% wolniej`}{" "}
          niż planowano
        </p>
      </div>
    </div>
  );
}

