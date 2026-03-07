"use client";

import { X, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate, formatExpenseDateRange } from "@/lib/travel-wallet/formatters";
import type { Expense } from "@/lib/travel-wallet/types";
import { getCountryById } from "@/lib/travel-wallet/countries";
import { getExpenseCategoryDisplay } from "@/lib/travel-wallet/constants";
import { calculateDailyTotals } from "@/lib/travel-wallet/expense-analytics";
import LineChart from "./LineChart";

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "category" | "country";
  name: string;
  expenses: Expense[];
  tripId: string;
}

export default function DrillDownModal({
  isOpen,
  onClose,
  type,
  name,
  expenses,
  tripId,
}: DrillDownModalProps) {
  if (!isOpen) return null;

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const currency = expenses[0]?.currency || "";
  const topExpenses = [...expenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const dailyTotals = calculateDailyTotals(expenses);
  const chartData = dailyTotals.map((d) => ({
    label: formatDate(d.date),
    value: d.total,
    count: d.count,
    date: d.date,
  }));

  const categoryBreakdown = expenses.reduce((acc, exp) => {
    if (type === "country") {
      const key = getExpenseCategoryDisplay(exp.category, exp.accommodationType);
      acc[key] = (acc[key] || 0) + exp.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-4xl md:max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {type === "category" ? "Kategoria" : "Kraj"}: {name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {expenses.length} {expenses.length === 1 ? "wydatek" : "wydatków"} • {formatCurrency(total, currency)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Wykres trendu */}
          {chartData.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Trend wydatków w czasie
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <LineChart
                  data={chartData}
                  height={200}
                  currency={currency}
                />
              </div>
            </div>
          )}

          {/* Breakdown kategorii (tylko dla krajów) */}
          {type === "country" && Object.keys(categoryBreakdown).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Podział według kategorii
              </h3>
              <div className="space-y-2">
                {Object.entries(categoryBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, amount]) => {
                    const percentage = (amount / total) * 100;
                    const maxAmount = Math.max(...Object.values(categoryBreakdown));
                    const barWidth = (amount / maxAmount) * 100;
                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">{category}</span>
                          <div className="text-right">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(amount, currency)}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 ml-2">
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Top 5 wydatków */}
          {topExpenses.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Top 5 wydatków
              </h3>
              <div className="space-y-2">
                {topExpenses.map((expense, index) => {
                  const country = getCountryById(expense.countryId, tripId);
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {expense.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatExpenseDateRange(expense)} {country && `• ${country.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(expense.amount, expense.currency)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
