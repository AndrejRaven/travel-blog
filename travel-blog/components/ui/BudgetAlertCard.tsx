"use client";

import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { formatCurrency } from "@/lib/travel-wallet/formatters";

interface BudgetAlertCardProps {
  remainingBudget: number;
  totalBudget: number;
  totalSpent: number;
  currency?: string;
  className?: string;
}

export default function BudgetAlertCard({
  remainingBudget,
  totalBudget,
  totalSpent,
  currency = "PLN",
  className = "",
}: BudgetAlertCardProps) {
  const budgetPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remainingPercentage = totalBudget > 0 ? (remainingBudget / totalBudget) * 100 : 0;

  // Określ wariant na podstawie procentu wykorzystanego budżetu
  let variant: "success" | "warning" | "danger" = "success";
  let icon = CheckCircle;
  let message = "";
  let title = "Budżet w normie";

  if (budgetPercentage >= 100) {
    variant = "danger";
    icon = AlertTriangle;
    title = "Budżet przekroczony";
    message = `Przekroczono budżet o ${formatCurrency(Math.abs(remainingBudget), currency)}`;
  } else if (budgetPercentage >= 80) {
    variant = "warning";
    icon = AlertTriangle;
    title = "Uwaga: Wysokie wykorzystanie budżetu";
    message = `Wykorzystano ${budgetPercentage.toFixed(1)}% budżetu. Pozostało ${formatCurrency(remainingBudget, currency)}`;
  } else if (budgetPercentage >= 50) {
    variant = "warning";
    icon = Info;
    title = "Średnie wykorzystanie budżetu";
    message = `Wykorzystano ${budgetPercentage.toFixed(1)}% budżetu. Pozostało ${formatCurrency(remainingBudget, currency)}`;
  } else {
    variant = "success";
    icon = CheckCircle;
    title = "Budżet w normie";
    message = `Wykorzystano ${budgetPercentage.toFixed(1)}% budżetu. Pozostało ${formatCurrency(remainingBudget, currency)}`;
  }

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

  const bgIconClasses = {
    success: "bg-green-100 dark:bg-green-900/30",
    warning: "bg-yellow-100 dark:bg-yellow-900/30",
    danger: "bg-red-100 dark:bg-red-900/30",
  };

  const Icon = icon;

  return (
    <div className={`rounded-xl border p-6 shadow-sm hover:shadow-md transition-all duration-200 ${variantClasses[variant]} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`rounded-lg p-2 ${bgIconClasses[variant]}`}>
              <Icon className={`w-5 h-5 ${iconClasses[variant]}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {message}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Wykorzystanie budżetu
              </span>
              <span className={`text-xs font-bold ${iconClasses[variant]}`}>
                {budgetPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  variant === "danger"
                    ? "bg-red-500 dark:bg-red-400"
                    : variant === "warning"
                    ? "bg-yellow-500 dark:bg-yellow-400"
                    : "bg-green-500 dark:bg-green-400"
                }`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Wydano: {formatCurrency(totalSpent, currency)}</span>
              <span>Budżet: {formatCurrency(totalBudget, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
