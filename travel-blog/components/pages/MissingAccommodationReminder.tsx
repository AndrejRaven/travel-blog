"use client";

import { useMemo } from "react";
import { Calendar, Plus } from "lucide-react";
import { getAllExpenses } from "@/lib/travel-wallet/expenses";
import { formatDate } from "@/lib/travel-wallet/formatters";

/**
 * Zwraca tablicę dat (YYYY-MM-DD) dla każdego dnia w zakresie (włącznie).
 */
function getDatesInRange(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const dates: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export interface MissingAccommodationReminderProps {
  tripId: string;
  tripStartDate?: string;
  tripEndDate?: string;
  /** Wywołane z datą (i opcjonalnie kategorią), dla której użytkownik chce dodać nocleg (np. 0 zł – namiot) */
  onAddExpense?: (date?: string, category?: string) => void;
}

/**
 * Pokazuje listę dni (wstecz), w których nie ma żadnego wydatku z kategorii Noclegi.
 * Umożliwia szybkie dodanie noclegu (np. 0 zł dla namiotu).
 */
export default function MissingAccommodationReminder({
  tripId,
  tripStartDate,
  tripEndDate,
  onAddExpense,
}: MissingAccommodationReminderProps) {
  const { missingDates, today } = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    if (!tripStartDate || !tripEndDate) {
      return { missingDates: [], today };
    }
    const expenses = getAllExpenses(tripId);
    const nightsWithAccommodation = new Set(
      expenses.filter((e) => e.category === "Noclegi").map((e) => e.date)
    );
    const allDates = getDatesInRange(tripStartDate, tripEndDate);
    const missingDates = allDates.filter(
      (date) => date <= today && !nightsWithAccommodation.has(date)
    );
    return { missingDates, today };
  }, [tripId, tripStartDate, tripEndDate]);

  if (missingDates.length === 0 || !onAddExpense) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg p-2 bg-amber-100 dark:bg-amber-900/30">
          <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Brak wydatku na nocleg
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 mb-3">
            {missingDates.length === 1
              ? "1 dzień bez wpisu (np. namiot/kemping 0 zł):"
              : `${missingDates.length} dni bez wpisu (np. namiot/kemping 0 zł):`}
          </p>
          <ul className="flex flex-col gap-1">
            {missingDates.map((date) => (
              <li key={date}>
                <button
                  type="button"
                  onClick={() => onAddExpense(date, "Noclegi")}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 underline hover:no-underline"
                >
                  <Plus className="w-3 h-3 flex-shrink-0" />
                  Dodaj nocleg na {formatDate(date)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
