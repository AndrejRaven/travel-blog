"use client";

import { BarChart } from "./TravelWalletCharts";
import { ProgressBar } from "./TravelWalletCharts";
import type { TravelWalletData } from "@/lib/travel-wallet/types";
import {
  calculatePlannedSpending,
  calculateActualSpending,
  calculateCategoryTotals,
} from "@/lib/travel-wallet/calculations";
import { formatCurrency } from "@/lib/travel-wallet/formatters";

interface TravelWalletChartsSectionProps {
  data: TravelWalletData;
}

export default function TravelWalletChartsSection({
  data,
}: TravelWalletChartsSectionProps) {
  // Przygotuj dane dla wykresu słupkowego
  const barChartData = data.countries
    .filter((country) => country.status === "visited" || country.status === "current")
    .map((country) => ({
      label: country.name,
      planned: calculatePlannedSpending(country),
      actual: calculateActualSpending(country),
    }));

  // Przygotuj dane dla category breakdown
  const categoryTotals = calculateCategoryTotals(data);
  const categoryData = Object.entries(categoryTotals).map(([name, totals]) => ({
    name,
    actual: totals.actual,
    planned: totals.planned,
    total: totals.actual + totals.planned,
  }));

  // Sortuj kategorie według faktycznych wydatków (malejąco)
  categoryData.sort((a, b) => b.actual - a.actual);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pl-PL", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const maxCategoryValue = Math.max(
    ...categoryData.map((cat) => Math.max(cat.actual, cat.planned)),
    1000
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
      {/* Left: Bar Chart - Spending by Country */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <BarChart data={barChartData} />
      </div>

      {/* Right: Category Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
          Podział według kategorii
        </h3>
        {categoryData.length > 0 ? (
          <div className="space-y-4">
            {categoryData.map((category, index) => {
              const percentage =
                maxCategoryValue > 0
                  ? (category.actual / maxCategoryValue) * 100
                  : 0;
              const totalSpent = categoryData.reduce(
                (sum, cat) => sum + cat.actual,
                0
              );
              const categoryPercentage =
                totalSpent > 0 ? (category.actual / totalSpent) * 100 : 0;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {category.name}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(category.actual)}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                        {categoryPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <ProgressBar
                    value={category.actual}
                    max={maxCategoryValue}
                    color="blue"
                    height="md"
                    showLabel={false}
                  />
                </div>
              );
            })}
            {/* Total */}
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                  ŁĄCZNIE
                </span>
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(
                    categoryData.reduce((sum, cat) => sum + cat.actual, 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Brak danych kategorii
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

