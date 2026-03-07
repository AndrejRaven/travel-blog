"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/travel-wallet/formatters";

interface ComparisonCardProps {
  title: string;
  currentValue: number;
  previousValue: number;
  currentLabel: string;
  previousLabel: string;
  currency?: string;
  showPercentage?: boolean;
  className?: string;
}

export default function ComparisonCard({
  title,
  currentValue,
  previousValue,
  currentLabel,
  previousLabel,
  currency = "",
  showPercentage = true,
  className = "",
}: ComparisonCardProps) {
  const change = currentValue - previousValue;
  const changePercentage = previousValue > 0 ? (change / previousValue) * 100 : 0;
  const isPositive = change < 0; // Mniej wydatków = pozytywne
  const isNeutral = Math.abs(changePercentage) < 1;

  const getChangeColor = () => {
    if (isNeutral) return "text-gray-600 dark:text-gray-400";
    return isPositive
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  };

  const getChangeBgColor = () => {
    if (isNeutral) return "bg-gray-100 dark:bg-gray-700";
    return isPositive
      ? "bg-green-100 dark:bg-green-900/30"
      : "bg-red-100 dark:bg-red-900/30";
  };

  const maxValue = Math.max(currentValue, previousValue);
  const currentPercentage = maxValue > 0 ? (currentValue / maxValue) * 100 : 0;
  const previousPercentage = maxValue > 0 ? (previousValue / maxValue) * 100 : 0;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {title}
      </h3>

      {/* Wartości side-by-side */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            {currentLabel}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(currentValue, currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            {previousLabel}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(previousValue, currency)}
          </p>
        </div>
      </div>

      {/* Wykres słupkowy side-by-side */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${currentPercentage}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400 w-16 text-right">
            {currentLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gray-500 dark:bg-gray-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${previousPercentage}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400 w-16 text-right">
            {previousLabel}
          </span>
        </div>
      </div>

      {/* Wskaźnik zmiany */}
      {showPercentage && (
        <div
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${getChangeBgColor()}`}
        >
          {isNeutral ? (
            <Minus className={`w-4 h-4 ${getChangeColor()}`} />
          ) : isPositive ? (
            <TrendingDown className={`w-4 h-4 ${getChangeColor()}`} />
          ) : (
            <TrendingUp className={`w-4 h-4 ${getChangeColor()}`} />
          )}
          <span className={`text-sm font-semibold ${getChangeColor()}`}>
            {isNeutral
              ? "Brak zmian"
              : isPositive
              ? `Oszczędność ${Math.abs(changePercentage).toFixed(1)}%`
              : `Wzrost ${changePercentage.toFixed(1)}%`}
          </span>
          <span className={`text-xs ${getChangeColor()} opacity-75`}>
            ({change > 0 ? "+" : ""}
            {formatCurrency(Math.abs(change), currency)})
          </span>
        </div>
      )}
    </div>
  );
}
