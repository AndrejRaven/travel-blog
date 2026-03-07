"use client";

import { TrendingUp, TrendingDown, Minus, Award, Calendar, MapPin, Tag, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/travel-wallet/formatters";

interface InsightsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: "up" | "down" | "stable";
    percentage: number;
    label?: string;
  };
  icon?: React.ReactNode;
  variant?: "default" | "highlight" | "success" | "warning" | "info";
  className?: string;
  currency?: string;
}

const iconMap = {
  award: Award,
  calendar: Calendar,
  mapPin: MapPin,
  tag: Tag,
  dollarSign: DollarSign,
};

export default function InsightsCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = "default",
  className = "",
  currency = "",
}: InsightsCardProps) {
  const variantClasses = {
    default: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
    highlight: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    warning: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    info: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
  };

  const iconColorClasses = {
    default: "text-gray-600 dark:text-gray-400",
    highlight: "text-blue-600 dark:text-blue-400",
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    info: "text-purple-600 dark:text-purple-400",
  };

  const bgColorClasses = {
    default: "bg-gray-100 dark:bg-gray-700",
    highlight: "bg-blue-100 dark:bg-blue-900/30",
    success: "bg-green-100 dark:bg-green-900/30",
    warning: "bg-yellow-100 dark:bg-yellow-900/30",
    info: "bg-purple-100 dark:bg-purple-900/30",
  };

  const formatValue = (val: string | number): string => {
    if (typeof val === "number" && currency) {
      return formatCurrency(val, currency);
    }
    return String(val);
  };

  return (
    <div
      className={`rounded-xl border p-6 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${variantClasses[variant]} ${className}`}
    >
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 min-w-0">
            {icon && (
              <div className={`shrink-0 rounded-lg p-2 ${bgColorClasses[variant]}`}>
                <div className={iconColorClasses[variant]}>{icon}</div>
              </div>
            )}
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide truncate">
              {title}
            </p>
          </div>
          
          <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 break-words">
            {formatValue(value)}
          </p>
          
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 break-words">
              {subtitle}
            </p>
          )}

          {trend && (
            <div className="flex items-center gap-2 mt-3 min-w-0">
              {trend.direction === "up" && (
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              )}
              {trend.direction === "down" && (
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              )}
              {trend.direction === "stable" && (
                <Minus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
              <span
                className={`text-sm font-medium ${
                  trend.direction === "up"
                    ? "text-green-600 dark:text-green-400"
                    : trend.direction === "down"
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {trend.label || `${trend.percentage.toFixed(1)}%`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
