"use client";

import { useState } from "react";
import { formatDate } from "@/lib/travel-wallet/formatters";
import { formatCurrency } from "@/lib/travel-wallet/formatters";

interface CalendarHeatmapProps {
  data: Array<{ date: string; value: number; count?: number }>;
  startDate?: string;
  endDate?: string;
  className?: string;
  currency?: string;
}

export default function CalendarHeatmap({
  data,
  startDate,
  endDate,
  className = "",
  currency = "",
}: CalendarHeatmapProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  if (data.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">Brak danych</p>
      </div>
    );
  }

  // Utwórz mapę dat do wartości
  const dateMap = new Map<string, { value: number; count?: number }>();
  data.forEach((item) => {
    dateMap.set(item.date, { value: item.value, count: item.count });
  });

  // Określ zakres dat
  const dates = data.map((d) => d.date).sort();
  const actualStartDate = startDate || dates[0];
  const actualEndDate = endDate || dates[dates.length - 1];

  const start = new Date(actualStartDate);
  const end = new Date(actualEndDate);

  // Znajdź maksymalną wartość dla normalizacji kolorów
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  // Generuj wszystkie dni w zakresie
  const days: Array<{ date: string; value: number; count?: number }> = [];
  const current = new Date(start);
  
  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    const dayData = dateMap.get(dateStr);
    days.push({
      date: dateStr,
      value: dayData?.value || 0,
      count: dayData?.count || 0,
    });
    current.setDate(current.getDate() + 1);
  }

  // Grupuj dni według tygodni (poniedziałek-niedziela)
  const weeks: Array<Array<{ date: string; value: number; count?: number }>> = [];
  let currentWeek: Array<{ date: string; value: number; count?: number }> = [];

  // Uzupełnij pierwszy tydzień pustymi dniami jeśli zaczyna się nie od poniedziałku
  const firstDay = new Date(start);
  const firstDayOfWeek = firstDay.getDay();
  const daysToAdd = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  for (let i = 0; i < daysToAdd; i++) {
    currentWeek.push({ date: "", value: 0, count: 0 });
  }

  days.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  // Uzupełnij ostatni tydzień pustymi dniami
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: "", value: 0, count: 0 });
    }
    weeks.push(currentWeek);
  }

  // Funkcja do określenia intensywności koloru
  const getIntensity = (value: number): number => {
    if (value === 0) return 0;
    return Math.min((value / maxValue) * 100, 100);
  };

  const getColor = (intensity: number): string => {
    if (intensity === 0) {
      return "bg-gray-100 dark:bg-gray-800";
    }
    if (intensity < 25) {
      return "bg-blue-200 dark:bg-blue-900";
    }
    if (intensity < 50) {
      return "bg-blue-400 dark:bg-blue-700";
    }
    if (intensity < 75) {
      return "bg-blue-600 dark:bg-blue-500";
    }
    return "bg-blue-800 dark:bg-blue-400";
  };

  const handleMouseMove = (
    event: React.MouseEvent<HTMLDivElement>,
    date: string
  ) => {
    if (!date) return;
    setHoveredDate(date);
    setTooltipPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const hoveredData = hoveredDate ? dateMap.get(hoveredDate) : null;

  return (
    <div className={`relative ${className}`}>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Etykiety dni tygodnia */}
          <div className="flex mb-2">
            <div className="w-8 flex-shrink-0"></div>
            <div className="flex-1 grid grid-cols-7 gap-1">
              {["Pon", "Wt", "Śr", "Czw", "Pt", "So", "Nd"].map((day) => (
                <div
                  key={day}
                  className="text-xs text-center text-gray-600 dark:text-gray-400 font-medium"
                >
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* Kalendarz */}
          <div className="flex gap-1">
            {/* Etykiety tygodni */}
            <div className="flex flex-col gap-1">
              {weeks.map((_, weekIndex) => {
                const weekStart = new Date(
                  weeks[weekIndex].find((d) => d.date)?.date || ""
                );
                if (weekIndex % 4 === 0 && weekStart) {
                  return (
                    <div
                      key={weekIndex}
                      className="text-xs text-gray-600 dark:text-gray-400 h-3 flex items-center"
                    >
                      {weekStart.getDate()}/{weekStart.getMonth() + 1}
                    </div>
                  );
                }
                return <div key={weekIndex} className="h-3"></div>;
              })}
            </div>

            {/* Dni */}
            <div className="flex-1 grid grid-cols-7 gap-1">
              {weeks.flat().map((day, index) => {
                if (!day.date) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="w-full aspect-square"
                    />
                  );
                }

                const intensity = getIntensity(day.value);
                const color = getColor(intensity);

                return (
                  <div
                    key={day.date}
                    className={`w-full aspect-square rounded ${color} transition-all duration-200 ${
                      hoveredDate === day.date
                        ? "ring-2 ring-blue-500 dark:ring-blue-400 scale-110"
                        : "hover:ring-1 hover:ring-gray-400 dark:hover:ring-gray-500"
                    }`}
                    onMouseMove={(e) => handleMouseMove(e, day.date)}
                    onMouseLeave={() => setHoveredDate(null)}
                    title={`${formatDate(day.date)}: ${formatCurrency(day.value, currency)}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-600 dark:text-gray-400">
        <span>Mniej</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="w-3 h-3 rounded bg-blue-200 dark:bg-blue-900" />
          <div className="w-3 h-3 rounded bg-blue-400 dark:bg-blue-700" />
          <div className="w-3 h-3 rounded bg-blue-600 dark:bg-blue-500" />
          <div className="w-3 h-3 rounded bg-blue-800 dark:bg-blue-400" />
        </div>
        <span>Więcej</span>
      </div>

      {/* Tooltip */}
      {hoveredDate && hoveredData && (
        <div
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50 pointer-events-none"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y - 10}px`,
          }}
        >
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatDate(hoveredDate)}
          </div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
            {formatCurrency(hoveredData.value, currency)}
          </div>
          {hoveredData.count !== undefined && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {hoveredData.count} {hoveredData.count === 1 ? "wydatek" : "wydatków"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
