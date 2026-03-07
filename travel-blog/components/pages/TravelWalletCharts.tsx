"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/travel-wallet/formatters";

interface ProgressBarProps {
  value: number;
  max: number;
  color?: "blue" | "green" | "purple" | "orange" | "red";
  showLabel?: boolean;
  height?: "sm" | "md" | "lg";
  className?: string;
}

export function ProgressBar({
  value,
  max,
  color = "blue",
  showLabel = true,
  height = "md",
  className = "",
}: ProgressBarProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const heightClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const colorClasses = {
    blue: "bg-gray-500 dark:bg-gray-600",
    green: "bg-gray-500 dark:bg-gray-600",
    purple: "bg-gray-500 dark:bg-gray-600",
    orange: "bg-gray-500 dark:bg-gray-600",
    red: "bg-gray-500 dark:bg-gray-600",
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {value}/{max}
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`${heightClasses[height]} ${colorClasses[color]} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${animatedValue}%` }}
        />
      </div>
    </div>
  );
}

interface PieChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
  className?: string;
}

export function PieChart({ data, size = 120, className = "" }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-sm text-gray-500 dark:text-gray-400">Brak danych</span>
      </div>
    );
  }

  let currentAngle = -90;
  const radius = size / 2;
  const center = size / 2;

  const paths = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startAngleRad);
    const y1 = center + radius * Math.sin(startAngleRad);
    const x2 = center + radius * Math.cos(endAngleRad);
    const y2 = center + radius * Math.sin(endAngleRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");

    currentAngle += angle;

    return { pathData, color: item.color, label: item.label, percentage };
  });

  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {paths.map((path, index) => (
          <path
            key={index}
            d={path.pathData}
            fill={path.color}
            className="transition-opacity hover:opacity-80"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">walut</div>
        </div>
      </div>
    </div>
  );
}

interface BudgetBreakdownProps {
  budgets: Array<{ currency: string; amount: number; color?: string }>;
  exchangeRates?: Record<string, number>;
  showChart?: boolean;
  className?: string;
}

export function BudgetBreakdown({
  budgets,
  exchangeRates = {},
  showChart = true,
  className = "",
}: BudgetBreakdownProps) {
  if (budgets.length === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">Brak danych budżetowych</p>
      </div>
    );
  }

  const total = budgets.reduce((sum, budget) => {
    const rate = exchangeRates[budget.currency.toUpperCase()] || 1;
    return sum + budget.amount * rate;
  }, 0);

  // Neutralne odcienie szarości dla wykresów
  const defaultColors = [
    "rgb(107, 114, 128)", // gray-500
    "rgb(75, 85, 99)", // gray-600
    "rgb(55, 65, 81)", // gray-700
    "rgb(31, 41, 55)", // gray-800
    "rgb(156, 163, 175)", // gray-400
    "rgb(209, 213, 219)", // gray-300
    "rgb(229, 231, 235)", // gray-200
    "rgb(243, 244, 246)", // gray-100
  ];

  const chartData = budgets.map((budget, index) => {
    const rate = exchangeRates[budget.currency.toUpperCase()] || 1;
    const valueInPLN = budget.amount * rate;
    return {
      label: budget.currency,
      value: valueInPLN,
      color: budget.color || defaultColors[index % defaultColors.length],
    };
  });


  return (
    <div className={`space-y-4 ${className}`}>
      {showChart && chartData.length > 0 && (
        <div className="flex justify-center">
          <PieChart data={chartData} size={140} />
        </div>
      )}
      <div className="space-y-2">
        {budgets.map((budget, index) => {
          const rate = exchangeRates[budget.currency.toUpperCase()] || 1;
          const valueInPLN = budget.amount * rate;
          const percentage = total > 0 ? (valueInPLN / total) * 100 : 0;
          const color = budget.color || defaultColors[index % defaultColors.length];

          return (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {budget.currency.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(budget.amount, budget.currency)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface BarChartData {
  label: string;
  planned: number;
  actual: number;
}

interface BarChartProps {
  data: BarChartData[];
  maxValue?: number;
  className?: string;
  onCountryClick?: (country: string) => void;
  baseCurrency?: string;
}

export function BarChart({ data, maxValue, className = "", onCountryClick, baseCurrency = "PLN" }: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">Brak danych</p>
      </div>
    );
  }

  // Oblicz maksymalną wartość jeśli nie podano
  const calculatedMax =
    maxValue ||
    Math.max(
      ...data.flatMap((item) => [item.planned, item.actual]),
      1000
    );

  // Zaokrąglij w górę do najbliższej 1000
  const roundedMax = Math.ceil(calculatedMax / 1000) * 1000;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Wydatki według kraju
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-300 dark:bg-gray-600" />
            <span className="text-gray-600 dark:text-gray-400">Planowane</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-700 dark:bg-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">Rzeczywiste</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {data.map((item, index) => {
          const plannedPercentage = (item.planned / roundedMax) * 100;
          const actualPercentage = (item.actual / roundedMax) * 100;

          return (
            <div
              key={index}
              className={`space-y-2 ${onCountryClick ? "cursor-pointer hover:opacity-80" : ""}`}
              role={onCountryClick ? "button" : undefined}
              onClick={onCountryClick ? () => onCountryClick(item.label) : undefined}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {item.label}
                </span>
                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <span>Planowane: {formatCurrency(item.planned, baseCurrency)}</span>
                  <span>Rzeczywiste: {formatCurrency(item.actual, baseCurrency)}</span>
                </div>
              </div>
              <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                {/* Planned bar (lighter) */}
                <div
                  className="absolute left-0 top-0 h-full bg-gray-300 dark:bg-gray-600 rounded-l"
                  style={{ width: `${plannedPercentage}%` }}
                />
                {/* Actual bar (darker, on top if higher) */}
                <div
                  className={`absolute left-0 top-0 h-full bg-gray-700 dark:bg-gray-400 rounded ${
                    item.actual > item.planned ? "rounded-l" : ""
                  }`}
                  style={{
                    width: `${actualPercentage}%`,
                    zIndex: item.actual > item.planned ? 10 : 5,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Y-axis labels */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
        <span>0</span>
        <span>{formatCurrency(roundedMax, baseCurrency)}</span>
      </div>
    </div>
  );
}

/** Wykres statusów podróży: zawsze 3 statusy, przy 0 – szary okrąg, przy 1 – jednolity kolor, przy 2+ – segmenty. */
export function StatusPieChart({
  data,
  size = 150,
  className = "",
}: {
  data: Array<{ category: string; value: number; color?: string }>;
  size?: number;
  className?: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const nonZero = data.filter((item) => item.value > 0);
  const radius = size / 2;
  const center = size / 2;

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-gray-500 dark:text-gray-400">Brak danych</span>
      </div>
    );
  }

  // Wszystkie zera: jeden szary okrąg
  if (total === 0) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex justify-center">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
              <circle
                cx={center}
                cy={center}
                r={radius - 1}
                fill="rgb(156, 163, 175)"
                className="opacity-80"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">0 podróży</span>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          {data.map((item, index) => (
            <div
              key={item.category}
              className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-gray-50 dark:bg-gray-800/50"
            >
              <span className="text-gray-700 dark:text-gray-300">{item.category}</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">0 (0%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Dokładnie jeden status > 0: jednolity pełny okrąg
  if (nonZero.length === 1) {
    const single = nonZero[0];
    const color = single.color || "rgb(156, 163, 175)";
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex justify-center">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
              <circle
                cx={center}
                cy={center}
                r={radius - 1}
                fill={color}
                className="opacity-90"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{total}</span>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          {data.map((item) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
            return (
              <div
                key={item.category}
                className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-gray-50 dark:bg-gray-800/50"
              >
                <span className="text-gray-700 dark:text-gray-300">{item.category}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {item.value} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Dwa lub trzy statusy: segmenty
  let currentAngle = -90;
  const segments = data.filter((item) => item.value > 0).map((item) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    const x1 = center + radius * Math.cos(startAngleRad);
    const y1 = center + radius * Math.sin(startAngleRad);
    const x2 = center + radius * Math.cos(endAngleRad);
    const y2 = center + radius * Math.sin(endAngleRad);
    const largeArcFlag = angle > 180 ? 1 : 0;
    const pathData = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");
    return { pathData, color: item.color || "rgb(156, 163, 175)", category: item.category, value: item.value };
  });

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {segments.map((seg, index) => (
              <path key={index} d={seg.pathData} fill={seg.color} className="opacity-90" />
            ))}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{total}</span>
          </div>
        </div>
      </div>
      <div className="space-y-1">
        {data.map((item) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
          return (
            <div
              key={item.category}
              className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-gray-50 dark:bg-gray-800/50"
            >
              <span className="text-gray-700 dark:text-gray-300">{item.category}</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {item.value} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CategoryPieChartProps {
  data: Array<{ category: string; value: number; color?: string }>;
  size?: number;
  onCategoryClick?: (category: string) => void;
  selectedCategory?: string;
  className?: string;
  currency?: string;
}

export function CategoryPieChart({
  data,
  size = 200,
  onCategoryClick,
  selectedCategory,
  className = "",
  currency = "",
}: CategoryPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-sm text-gray-500 dark:text-gray-400">Brak danych</span>
      </div>
    );
  }

  // Kolory dla kategorii
  const defaultColors = [
    "rgb(59, 130, 246)", // blue-500
    "rgb(34, 197, 94)", // green-500
    "rgb(168, 85, 247)", // purple-500
    "rgb(249, 115, 22)", // orange-500
    "rgb(239, 68, 68)", // red-500
    "rgb(236, 72, 153)", // pink-500
    "rgb(14, 165, 233)", // sky-500
    "rgb(251, 191, 36)", // amber-500
  ];

  let currentAngle = -90;
  const radius = size / 2;
  const center = size / 2;

  const paths = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startAngleRad);
    const y1 = center + radius * Math.sin(startAngleRad);
    const x2 = center + radius * Math.cos(endAngleRad);
    const y2 = center + radius * Math.sin(endAngleRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");

    currentAngle += angle;

    const color = item.color || defaultColors[index % defaultColors.length];
    const isSelected = selectedCategory === item.category;

    return {
      pathData,
      color,
      label: item.category,
      percentage,
      value: item.value,
      isSelected,
    };
  });


  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {paths.map((path, index) => (
              <path
                key={index}
                d={path.pathData}
                fill={path.color}
                className={`transition-all duration-200 ${
                  onCategoryClick ? "cursor-pointer" : ""
                } ${path.isSelected ? "opacity-100" : "opacity-80 hover:opacity-100"}`}
                style={{
                  filter: path.isSelected ? "drop-shadow(0 0 8px rgba(0,0,0,0.3))" : undefined,
                  transform: path.isSelected ? "scale(1.05)" : "scale(1)",
                  transformOrigin: "center",
                }}
                onClick={() => onCategoryClick?.(path.label)}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {data.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">kategorii</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="space-y-2">
        {paths
          .sort((a, b) => b.value - a.value)
          .map((path, index) => (
            <button
              key={index}
              onClick={() => onCategoryClick?.(path.label)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                path.isSelected
                  ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-400"
                  : "bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: path.color }}
                />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-left">
                  {path.label}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(path.value, currency || "PLN")}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {path.percentage.toFixed(1)}%
                </div>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
