"use client";

import { useState, useRef, useEffect } from "react";
import { formatCurrency } from "@/lib/travel-wallet/formatters";

// Kursy walut do PLN (muszą być takie same jak w expenses.ts)
const exchangeRates: Record<string, number> = {
  PLN: 1,
  USD: 4.0,
  EUR: 4.3,
  JPY: 0.027,
  THB: 0.11,
  GBP: 5.1,
  KRW: 0.003,
  TWD: 0.13,
  KZT: 0.007,
};

function convertToPLN(amount: number, currency: string): number {
  const rate = exchangeRates[currency.toUpperCase()] || 1;
  return amount * rate;
}

interface LineChartDataPoint {
  label: string;
  value: number;
  count?: number;
  date?: string;
  byCurrency?: Record<string, number>;
}

interface LineChartProps {
  data: LineChartDataPoint[];
  height?: number;
  showTooltip?: boolean;
  currency?: string;
  className?: string;
  highlightPoint?: number | null;
  onPointClick?: (index: number, point: LineChartDataPoint) => void;
}

export default function LineChart({
  data,
  height = 200,
  showTooltip = true,
  currency = "",
  className = "",
  highlightPoint = null,
  onPointClick,
}: LineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-sm text-gray-500 dark:text-gray-400">Brak danych</p>
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = 800;
  const chartHeight = height;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);

  const xScale = (index: number) => {
    if (data.length === 1) return innerWidth / 2;
    return (index / (data.length - 1)) * innerWidth;
  };

  const yScale = (value: number) => {
    if (maxValue === minValue) return innerHeight / 2;
    return innerHeight - ((value - minValue) / (maxValue - minValue)) * innerHeight;
  };

  const points = data.map((point, index) => ({
    x: xScale(index),
    y: yScale(point.value),
    ...point,
  }));

  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !showTooltip) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left - padding.left;
    
    // Znajdź najbliższy punkt
    const closestIndex = points.reduce((closest, point, index) => {
      const distance = Math.abs(point.x - x);
      const closestDistance = Math.abs(points[closest].x - x);
      return distance < closestDistance ? index : closest;
    }, 0);

    setHoveredIndex(closestIndex);
    setTooltipPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const activeIndex = highlightPoint !== null ? highlightPoint : hoveredIndex;

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width="100%"
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + innerHeight - ratio * innerHeight;
          const value = minValue + ratio * (maxValue - minValue);
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + innerWidth}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-200 dark:text-gray-700"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-gray-500 dark:fill-gray-400"
              >
                {formatCurrency(value, currency).replace(currency, "").trim()}
              </text>
            </g>
          );
        })}

        {/* Area under line */}
        <path
          d={`${pathData} L ${points[points.length - 1].x} ${innerHeight} L ${points[0].x} ${innerHeight} Z`}
          fill="url(#lineGradient)"
          className="transition-opacity duration-300"
        />

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="rgb(59, 130, 246)"
          strokeWidth="2"
          className="transition-all duration-300"
        />

        {/* Points */}
        {points.map((point, index) => {
          const isActive = activeIndex === index;
          const isHighlighted = highlightPoint === index;
          
          return (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r={isActive || isHighlighted ? 6 : 4}
                fill="rgb(59, 130, 246)"
                stroke="white"
                strokeWidth={isActive || isHighlighted ? 3 : 2}
                className={`transition-all duration-200 ${onPointClick ? "cursor-pointer hover:r-7" : ""}`}
                style={{
                  filter: isActive || isHighlighted ? "drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))" : undefined,
                }}
                onClick={() => onPointClick?.(index, point)}
              />
              
              {/* Label */}
              {isActive && (
                <text
                  x={point.x}
                  y={point.y - 15}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-gray-900 dark:fill-gray-100"
                >
                  {formatCurrency(point.value, currency)}
                </text>
              )}
            </g>
          );
        })}

        {/* X-axis labels */}
        {points.map((point, index) => {
          // Pokaż tylko niektóre etykiety, żeby nie było za dużo
          const showLabel = data.length <= 10 || index % Math.ceil(data.length / 10) === 0 || index === data.length - 1;
          
          if (!showLabel) return null;
          
          return (
            <text
              key={index}
              x={point.x}
              y={chartHeight - padding.bottom + 20}
              textAnchor="middle"
              className="text-xs fill-gray-600 dark:fill-gray-400"
            >
              {point.label.length > 10 ? point.label.substring(0, 10) + "..." : point.label}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {showTooltip && activeIndex !== null && (
        <div
          className="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-10 pointer-events-none transition-opacity duration-200"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y - 80}px`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {data[activeIndex].label}
          </div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
            {data[activeIndex].byCurrency && Object.keys(data[activeIndex].byCurrency).length > 0
              ? Object.entries(data[activeIndex].byCurrency)
                  .map(([curr, amount]) => {
                    const amountInPLN = convertToPLN(amount, curr);
                    if (curr === "PLN") {
                      return formatCurrency(amount, curr);
                    }
                    return `${formatCurrency(amount, curr)} (${formatCurrency(amountInPLN, "PLN")})`;
                  })
                  .join(" + ")
              : formatCurrency(data[activeIndex].value, currency)}
          </div>
          {data[activeIndex].count !== undefined && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {data[activeIndex].count} {data[activeIndex].count === 1 ? "wydatek" : "wydatków"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
