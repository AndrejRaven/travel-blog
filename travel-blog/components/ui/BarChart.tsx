"use client";

interface BarChartDataPoint {
  label: string;
  value: number;
  date?: string;
}

interface BarChartProps {
  data: BarChartDataPoint[];
  height?: number;
  currency?: string;
  className?: string;
}

function roundUpMax(value: number, step = 500): number {
  if (value <= 0) return step;
  return Math.ceil(value / step) * step;
}

export default function BarChart({
  data,
  height = 170,
  currency = "PLN",
  className = "",
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">Brak danych</p>
      </div>
    );
  }

  const padding = { top: 8, right: 8, bottom: 28, left: 48 };
  const chartWidth = 400;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const roundedMax = roundUpMax(maxValue);
  const barWidth = Math.max(12, (innerWidth / data.length) * 0.6);
  const gap = innerWidth / data.length - barWidth;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((r) => r * roundedMax);
  const yScale = (value: number) =>
    innerHeight - (value / roundedMax) * innerHeight;

  return (
    <div className={`relative ${className}`}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${chartWidth} ${height}`}
        className="overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Oś Y – linie i etykiety */}
        {yTicks.map((tick, i) => {
          const y = padding.top + yScale(tick);
          const label =
            tick >= 1000
              ? `${(tick / 1000).toFixed(1)}k`
              : tick.toFixed(0);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + innerWidth}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-200 dark:text-gray-700"
                strokeDasharray="2 2"
              />
              <text
                x={padding.left - 6}
                y={y + 3}
                textAnchor="end"
                className="text-[10px] fill-gray-500 dark:fill-gray-400"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Słupki */}
        {data.map((point, index) => {
          const x = padding.left + index * (innerWidth / data.length) + gap / 2;
          const barHeight = (point.value / roundedMax) * innerHeight;
          const y = padding.top + innerHeight - barHeight;
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(2, barHeight)}
                rx={2}
                className="fill-blue-500 dark:fill-blue-400 opacity-90 hover:opacity-100 transition-opacity"
              />
              <text
                x={x + barWidth / 2}
                y={height - padding.bottom + 6}
                textAnchor="middle"
                className="text-[9px] fill-gray-600 dark:fill-gray-400"
              >
                {point.label.length > 8
                  ? point.label.substring(0, 8) + "."
                  : point.label}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Skrócona legenda osi Y (jednostka) */}
      <div className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 text-right pr-2">
        {currency === "PLN" ? "zł" : currency}
      </div>
    </div>
  );
}
