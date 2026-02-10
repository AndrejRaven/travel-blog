"use client";

import { TrendingUp } from "lucide-react";
import { ProgressBar } from "./TravelWalletCharts";
import type { TravelWalletData } from "@/lib/travel-wallet/types";
import {
  calculateTotalBudget,
  calculateTotalSpent,
  calculateBurnRate,
} from "@/lib/travel-wallet/calculations";
import { formatCurrency } from "@/lib/travel-wallet/formatters";

interface TravelWalletProgressProps {
  data: TravelWalletData;
  tripId?: string;
}

export default function TravelWalletProgress({
  data,
  tripId,
}: TravelWalletProgressProps) {
  const totalBudget = calculateTotalBudget(data, tripId);
  const totalSpent = calculateTotalSpent(data, tripId);
  const burnRate = calculateBurnRate(data, tripId);


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
              {formatCurrency(totalSpent)}/{formatCurrency(totalBudget)}
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

