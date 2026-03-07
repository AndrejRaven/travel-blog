"use client";

import { TrendingUp, AlertCircle, Calendar, Info } from "lucide-react";
import { formatCurrency } from "@/lib/travel-wallet/formatters";
import { convertExpenseToPLN } from "@/lib/travel-wallet/expenses";
import { getDaysWithExpensePortionsInRange } from "@/lib/travel-wallet/calendar";
import type { Expense } from "@/lib/travel-wallet/types";

interface PredictionCardProps {
  expenses: Expense[];
  tripStartDate?: string;
  tripEndDate?: string;
  totalBudget?: number;
  /** Suma wydatków w PLN (expenses + prowizje). Gdy podana, używana zamiast sumy z listy – wtedy Prognoza = Średnie dzienne wydatki. */
  totalSpentInPLN?: number;
  currency?: string;
  className?: string;
}

export default function PredictionCard({
  expenses,
  tripStartDate,
  tripEndDate,
  totalBudget,
  totalSpentInPLN,
  currency = "PLN",
  className = "",
}: PredictionCardProps) {
  const hasDates = Boolean(tripStartDate && tripEndDate);
  const hasExpenses = expenses.length > 0;

  if (!hasDates) {
    return null;
  }

  const startDate = new Date(tripStartDate!);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(tripEndDate!);
  endDate.setHours(23, 59, 59, 999);

  const daysInTrip = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  let predictedTotal: number;
  let averageDaily: number;
  let sourceLabel: string;
  let message: string;
  let variant: "success" | "warning" | "danger" = "success";

  if (!hasExpenses) {
    if (totalBudget != null && totalBudget > 0) {
      averageDaily = totalBudget / daysInTrip;
      predictedTotal = totalBudget;
      sourceLabel = "Na podstawie budżetu (brak wydatków)";
      message = "Prognoza z budżetu";
    } else {
      return null;
    }
  } else {
    const daysWithExpenses = Math.max(
      1,
      getDaysWithExpensePortionsInRange(expenses, tripStartDate!, tripEndDate!)
    );
    const totalSpent =
      totalSpentInPLN != null
        ? totalSpentInPLN
        : expenses.reduce((sum, exp) => sum + convertExpenseToPLN(exp), 0);
    averageDaily = totalSpent / daysWithExpenses;
    predictedTotal = averageDaily * daysInTrip;
    sourceLabel = "Na podstawie dotychczasowych wydatków";
    message = "Prognoza z wydatków";

    if (totalBudget != null && totalBudget > 0) {
      if (predictedTotal > totalBudget * 1.2) {
        variant = "danger";
        message = "Wysokie tempo – przekroczysz budżet";
      } else if (predictedTotal > totalBudget) {
        variant = "warning";
        message = "Umiarkowane tempo – przekroczysz budżet";
      } else {
        message = "Stabilne tempo wydatków";
      }
    } else if (totalBudget != null && totalBudget === 0) {
      message = "Stabilne tempo wydatków";
    }
  }

  const budgetDifference = totalBudget != null && totalBudget > 0 ? totalBudget - predictedTotal : null;

  const variantClasses = {
    success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    warning: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    danger: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  };

  const iconClasses = {
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    danger: "text-red-600 dark:text-red-400",
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all duration-300 ${variantClasses[variant]} ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${variantClasses[variant]}`}>
            <Calendar className={`w-5 h-5 ${iconClasses[variant]}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Prognoza wydatków
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>
        </div>
        {variant === "danger" && (
          <AlertCircle className={`w-5 h-5 ${iconClasses[variant]}`} />
        )}
      </div>

      <div className="space-y-4">
        {/* Źródło prognozy */}
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 rounded-lg px-3 py-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{sourceLabel}</span>
        </div>

        {/* Budżet (jeśli jest) */}
        {totalBudget != null && totalBudget > 0 && (
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Budżet podróży
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(totalBudget, currency)}
            </p>
          </div>
        )}

        {/* Przewidywane wydatki do końca podróży */}
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            Przewidywane wydatki do końca podróży
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(predictedTotal, currency)}
          </p>
        </div>

        {/* Różnica vs budżet */}
        {budgetDifference !== null && (
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              {budgetDifference >= 0 ? "Zostanie w budżecie" : "Przekroczenie budżetu"}
            </p>
            <p className={`text-lg font-semibold ${budgetDifference >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {budgetDifference >= 0 ? "+" : ""}{formatCurrency(budgetDifference, currency)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Średnia dzienna
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(averageDaily, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Dni w podróży
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {daysInTrip}
            </p>
          </div>
        </div>

        {variant !== "success" && (
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
            <TrendingUp className={`w-4 h-4 ${iconClasses[variant]}`} />
            <span>
              {variant === "danger"
                ? "Rozważ zmniejszenie wydatków"
                : "Monitoruj swoje wydatki"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
