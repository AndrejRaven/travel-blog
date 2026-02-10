"use client";

import { useState, useMemo } from "react";
import Button from "@/components/ui/Button";
import { Edit, Trash2 } from "lucide-react";
import type { Country, Expense } from "@/lib/travel-wallet/types";
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  hasExpensesOnDate,
  getExpensesForDate,
  formatDateToYYYYMMDD,
} from "@/lib/travel-wallet/calendar";
import { convertExpenseToPLN } from "@/lib/travel-wallet/expenses";
import { formatCurrency } from "@/lib/travel-wallet/formatters";

interface CountryExpenseCalendarProps {
  country: Country;
  expenses: Expense[];
  onAddExpense?: (date: string) => void;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expense: Expense) => void;
}

export default function CountryExpenseCalendar({
  country,
  expenses,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}: CountryExpenseCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [lastSelectedDate, setLastSelectedDate] = useState<string | null>(null);

  // Pobierz miesiąc z startDate kraju lub aktualny miesiąc
  const currentMonth = useMemo(() => {
    if (country.startDate) {
      const date = new Date(country.startDate);
      return { year: date.getFullYear(), month: date.getMonth() };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, [country.startDate]);

  // Generuj dni miesiąca
  const monthDays = useMemo(() => {
    return getDaysInMonth(currentMonth.year, currentMonth.month);
  }, [currentMonth.year, currentMonth.month]);

  // Pierwszy dzień tygodnia miesiąca
  const firstDayOfWeek = useMemo(() => {
    return getFirstDayOfMonth(currentMonth.year, currentMonth.month);
  }, [currentMonth.year, currentMonth.month]);

  // Dni tygodnia
  const weekDays = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];

  // Nazwa miesiąca
  const monthName = useMemo(() => {
    return new Date(currentMonth.year, currentMonth.month, 1).toLocaleDateString(
      "pl-PL",
      { month: "long", year: "numeric" }
    );
  }, [currentMonth.year, currentMonth.month]);

  // Filtruj expenses dla wybranego dnia lub wszystkie
  const displayedExpenses = useMemo(() => {
    if (selectedDate === null) {
      // Wyświetl wszystkie expenses
      return expenses;
    }
    return getExpensesForDate(selectedDate, expenses);
  }, [selectedDate, expenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pl-PL", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long",
    });
  };

  const handleDayClick = (date: Date) => {
    const dateString = formatDateToYYYYMMDD(date);
    if (selectedDate === dateString) {
      // Kliknięcie w ten sam dzień - resetuj wybór
      setSelectedDate(null);
    } else {
      setSelectedDate(dateString);
      setLastSelectedDate(dateString);
    }
  };

  const isDateInRange = (date: Date): boolean => {
    if (!country.startDate || !country.endDate) return false;
    const start = new Date(country.startDate);
    const end = new Date(country.endDate);
    return date >= start && date <= end;
  };

  // Funkcja obliczająca sumę wydatków dla dnia
  const getDailyTotal = (dateString: string): number => {
    const dayExpenses = getExpensesForDate(dateString, expenses);
    return dayExpenses.reduce((total, expense) => {
      return total + convertExpenseToPLN(expense);
    }, 0);
  };

  return (
    <div className="space-y-2">
      {/* Nagłówek kalendarza */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 capitalize">
          {monthName}
        </h3>
        <Button
          onClick={() => {
            if (selectedDate !== null) {
              // Przełącz na widok wszystkich
              setSelectedDate(null);
            } else {
              // Przywróć ostatnio wybrany dzień
              if (lastSelectedDate) {
                setSelectedDate(lastSelectedDate);
              }
            }
          }}
          variant="outline"
          className="text-[10px] py-0.5 px-1.5 h-5"
        >
          {selectedDate !== null ? "Wszystko" : "Dzień"}
        </Button>
      </div>

      {/* Kalendarz miesięczny */}
      <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-1">
        {/* Dni tygodnia */}
        <div className="grid grid-cols-7 gap-px mb-px">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-[9px] font-semibold text-gray-600 dark:text-gray-400 py-0.5"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Dni miesiąca */}
        <div className="grid grid-cols-7 gap-px">
          {/* Puste komórki przed pierwszym dniem miesiąca */}
          {Array.from({ length: firstDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="h-10" />
          ))}

          {/* Dni miesiąca */}
          {monthDays.map((date) => {
            const dateString = formatDateToYYYYMMDD(date);
            const hasExpenses = hasExpensesOnDate(dateString, expenses);
            const isSelected = selectedDate === dateString;
            const inRange = isDateInRange(date);
            const isToday =
              formatDateToYYYYMMDD(new Date()) === dateString;
            const dailyTotal = getDailyTotal(dateString);

            return (
              <button
                key={dateString}
                onClick={() => inRange && handleDayClick(date)}
                disabled={!inRange}
                className={`
                  h-10 rounded border transition-colors p-0.5
                  ${!inRange
                    ? "bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    : isSelected
                    ? "bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400"
                    : hasExpenses
                    ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }
                  ${isToday ? "ring-1 ring-blue-400 dark:ring-blue-500" : ""}
                `}
              >
                <div className="flex flex-col items-center justify-center h-full gap-0">
                  <span
                    className={`
                      text-[10px] font-semibold leading-none
                      ${!inRange
                        ? "text-gray-400 dark:text-gray-600"
                        : isSelected
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-gray-900 dark:text-gray-100"
                      }
                    `}
                  >
                    {date.getDate()}
                  </span>
                  {hasExpenses && inRange && dailyTotal > 0 ? (
                    <span
                      className={`
                        text-[8px] font-medium leading-none
                        ${isSelected
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-green-600 dark:text-green-400"
                        }
                      `}
                    >
                      {formatCurrency(dailyTotal)} zł
                    </span>
                  ) : (
                    <span className="text-[8px] leading-none opacity-0">0</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista expenses dla wybranego dnia lub wszystkie */}
      {selectedDate !== null ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            {formatDate(selectedDate)}
          </h3>
          {displayedExpenses.length > 0 ? (
            <div className="space-y-3">
              {displayedExpenses.map((expense) => {
                const amountInPLN = convertExpenseToPLN(expense);
                return (
                  <div
                    key={expense.id}
                    className="flex justify-between items-start py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {expense.category}
                        </span>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                          {formatCurrency(amountInPLN)} zł
                        </span>
                        {expense.currency !== "PLN" && (
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            ({formatCurrency(expense.amount)} {expense.currency})
                          </span>
                        )}
                      </div>
                      {expense.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {expense.description}
                        </p>
                      )}
                      {expense.note && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
                          {expense.note}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {onEditExpense && (
                        <button
                          onClick={() => onEditExpense(expense)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                          aria-label="Edytuj wydatek"
                        >
                          <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      )}
                      {onDeleteExpense && (
                        <button
                          onClick={() => onDeleteExpense(expense)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          aria-label="Usuń wydatek"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              Brak wydatków w tym dniu
            </p>
          )}
          <div className="mt-4">
            <Button
              onClick={() => selectedDate && onAddExpense?.(selectedDate)}
              variant="outline"
              className="text-sm"
            >
              Dodaj wydatek
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            Wszystkie wydatki
          </h3>
          {displayedExpenses.length > 0 ? (
            <div className="space-y-3">
              {displayedExpenses
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map((expense) => {
                  const amountInPLN = convertExpenseToPLN(expense);
                  const formattedDate = new Date(expense.date).toLocaleDateString(
                    "pl-PL",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }
                  );
                  return (
                    <div
                      key={expense.id}
                      className="flex justify-between items-start py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {expense.category}
                          </span>
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            {formatCurrency(amountInPLN)} zł
                          </span>
                          {expense.currency !== "PLN" && (
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              ({formatCurrency(expense.amount)} {expense.currency})
                            </span>
                          )}
                        </div>
                        {expense.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {expense.description}
                          </p>
                        )}
                        {expense.note && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
                            {expense.note}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formattedDate}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              Brak wydatków dla tego kraju
            </p>
          )}
        </div>
      )}
    </div>
  );
}

