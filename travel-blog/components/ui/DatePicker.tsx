"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  min?: string;
  max?: string;
  disabledDates?: string[]; // Lista dat w formacie YYYY-MM-DD, które są wyłączone
  label?: string;
  required?: boolean;
  error?: string;
  id?: string;
}

export default function DatePicker({
  value,
  onChange,
  min,
  max,
  disabledDates = [],
  label,
  required,
  error,
  id,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<"bottom" | "top" | "left" | "right">("bottom");
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();
  
  // Funkcja pomocnicza do formatowania daty
  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Konwertuj disabledDates na Set dla szybkiego wyszukiwania
  const disabledDatesSet = useMemo(() => {
    return new Set(disabledDates);
  }, [disabledDates]);

  // Stabilna wartość dla disabledDates do użycia w zależnościach
  const disabledDatesKey = useMemo(() => {
    return [...disabledDates].sort().join(",");
  }, [disabledDates]);

  // Sprawdź czy data jest wyłączona (z powodu min/max)
  const isDateOutOfRange = (date: Date): boolean => {
    const dateString = formatDateToYYYYMMDD(date);
    
    // Sprawdź min/max
    if (min && dateString < min) return true;
    if (max && dateString > max) return true;
    
    return false;
  };

  // Sprawdź czy data jest zajęta (w disabledDates)
  const isDateOccupied = (date: Date): boolean => {
    const dateString = formatDateToYYYYMMDD(date);
    return disabledDatesSet.has(dateString);
  };

  // Sprawdź czy data jest wyłączona (z jakiegokolwiek powodu)
  const isDateDisabled = (date: Date): boolean => {
    return isDateOutOfRange(date) || isDateOccupied(date);
  };

  // Funkcja pomocnicza do walidacji daty
  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
  };

  // Funkcja sprawdzająca czy w danym miesiącu są dostępne daty
  const hasAvailableDatesInMonth = (year: number, month: number): boolean => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      if (!isDateDisabled(date)) {
        return true;
      }
    }
    return false;
  };

  // Funkcja znajdująca pierwszy miesiąc z dostępnymi datami
  const findFirstAvailableMonth = (startYear: number, startMonth: number): { year: number; month: number } => {
    if (!min || !max) {
      return { year: startYear, month: startMonth };
    }

    // Waliduj daty przed użyciem
    if (!isValidDate(min) || !isValidDate(max)) {
      return { year: startYear, month: startMonth };
    }

    const minDate = new Date(min);
    const maxDate = new Date(max);
    
    // Sprawdź czy daty są prawidłowe
    if (isNaN(minDate.getTime()) || isNaN(maxDate.getTime())) {
      return { year: startYear, month: startMonth };
    }
    let currentYear = startYear;
    let currentMonth = startMonth;
    const maxIterations = 24; // Maksymalnie 2 lata przeszukiwania
    let iterations = 0;

    while (iterations < maxIterations) {
      const monthStart = new Date(currentYear, currentMonth, 1);
      const monthEnd = new Date(currentYear, currentMonth + 1, 0);

      // Sprawdź czy miesiąc jest w zakresie min-max
      if (monthStart <= maxDate && monthEnd >= minDate) {
        if (hasAvailableDatesInMonth(currentYear, currentMonth)) {
          return { year: currentYear, month: currentMonth };
        }
      }

      // Przejdź do następnego miesiąca
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }

      // Jeśli przekroczyliśmy max, zatrzymaj
      if (monthStart > maxDate) {
        break;
      }

      iterations++;
    }

    // Jeśli nie znaleziono, zwróć początkowy miesiąc
    return { year: startYear, month: startMonth };
  };

  // Funkcja do obliczania początkowego miesiąca
  const calculateInitialMonth = (): { year: number; month: number } => {
    // Jeśli value jest ustawione i prawidłowe, użyj miesiąca z value
    if (value && isValidDate(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const month = { year: date.getFullYear(), month: date.getMonth() };
        // Sprawdź czy w tym miesiącu są dostępne daty, jeśli nie, znajdź pierwszy dostępny
        if (!hasAvailableDatesInMonth(month.year, month.month)) {
          return findFirstAvailableMonth(month.year, month.month);
        }
        return month;
      }
    }
    // Jeśli value jest puste, ale min jest ustawione i prawidłowe, użyj miesiąca z min
    if (min && isValidDate(min)) {
      const date = new Date(min);
      if (!isNaN(date.getTime())) {
        const month = { year: date.getFullYear(), month: date.getMonth() };
        // Sprawdź czy w tym miesiącu są dostępne daty, jeśli nie, znajdź pierwszy dostępny
        if (!hasAvailableDatesInMonth(month.year, month.month)) {
          return findFirstAvailableMonth(month.year, month.month);
        }
        return month;
      }
    }
    // W przeciwnym razie użyj aktualnego miesiąca
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  };

  const [currentMonth, setCurrentMonth] = useState(() => calculateInitialMonth());

  // Aktualizuj miesiąc gdy value, min, max lub disabledDates się zmienia
  useEffect(() => {
    const newMonth = calculateInitialMonth();
    // Aktualizuj tylko jeśli miesiąc faktycznie się zmienił
    setCurrentMonth((prev) => {
      if (prev.year !== newMonth.year || prev.month !== newMonth.month) {
        return newMonth;
      }
      return prev;
    });
  }, [value, min, max, disabledDatesKey]);

  // Generuj dni miesiąca
  const monthDays = useMemo(() => {
    const days: Date[] = [];
    const firstDay = new Date(currentMonth.year, currentMonth.month, 1);
    const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(currentMonth.year, currentMonth.month, day));
    }

    return days;
  }, [currentMonth.year, currentMonth.month]);

  // Pierwszy dzień tygodnia miesiąca
  const firstDayOfWeek = useMemo(() => {
    const firstDay = new Date(currentMonth.year, currentMonth.month, 1);
    return firstDay.getDay();
  }, [currentMonth.year, currentMonth.month]);

  // Nazwa miesiąca
  const monthName = useMemo(() => {
    return new Date(currentMonth.year, currentMonth.month, 1).toLocaleDateString(
      "pl-PL",
      { month: "long", year: "numeric" }
    );
  }, [currentMonth.year, currentMonth.month]);

  // Dni tygodnia
  const weekDays = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];

  const formatDateToDisplay = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  // Funkcja do obliczania pozycji kalendarza
  const calculatePosition = () => {
    if (!inputRef.current || typeof window === "undefined") return "bottom";
    
    const inputRect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const calendarHeight = 280; // Przybliżona wysokość kalendarza
    const calendarWidth = 240; // Szerokość kalendarza
    
    // Sprawdź czy jest miejsce na dole
    const spaceBelow = viewportHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;
    const spaceRight = viewportWidth - inputRect.left;
    const spaceLeft = inputRect.left;
    
    // Priorytet: dół > góra > prawo > lewo
    if (spaceBelow >= calendarHeight) {
      return "bottom";
    } else if (spaceAbove >= calendarHeight) {
      return "top";
    } else if (spaceRight >= calendarWidth) {
      return "right";
    } else if (spaceLeft >= calendarWidth) {
      return "left";
    }
    
    // Fallback: wybierz najlepszą dostępną opcję
    if (spaceAbove > spaceBelow) {
      return "top";
    } else if (spaceRight > spaceLeft) {
      return "right";
    } else {
      return "left";
    }
  };

  // Aktualizuj pozycję gdy kalendarz się otwiera
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Użyj setTimeout aby upewnić się, że DOM jest zaktualizowany
      setTimeout(() => {
        const newPosition = calculatePosition();
        setPosition(newPosition);
      }, 0);
    }
  }, [isOpen]);

  const handleDateClick = (date: Date) => {
    const dateString = formatDateToYYYYMMDD(date);
    if (isDateDisabled(date)) {
      // Nie zamykaj kalendarza, tylko pokaż toast
      if (isDateOccupied(date)) {
        addToast({
          type: "error",
          title: "Data niedostępna",
          message: "Ta data jest już zajęta przez inny kraj.",
          duration: 3000,
        });
      } else if (isDateOutOfRange(date)) {
        addToast({
          type: "error",
          title: "Data poza zakresem",
          message: "Ta data jest poza zakresem podróży.",
          duration: 3000,
        });
      }
      return;
    }
    onChange(dateString);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label} {required && "*"}
        </label>
      )}
      
      {/* Input z przyciskiem */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          value={formatDateToDisplay(value)}
          readOnly
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer ${
            error ? "border-red-500 dark:border-red-400" : ""
          }`}
          placeholder="dd.mm.rrrr"
          required={required}
        />
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div
              ref={calendarRef}
              className={`absolute z-20 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 w-[240px] ${
                position === "top"
                  ? "bottom-full left-0 mb-1"
                  : position === "right"
                  ? "top-0 left-full ml-1"
                  : position === "left"
                  ? "top-0 right-full mr-1"
                  : "top-full left-0 mt-1"
              }`}
            >
              {/* Header kalendarza */}
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={goToPreviousMonth}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  aria-label="Poprzedni miesiąc"
                >
                  <ChevronLeft className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                </button>
                <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 capitalize">
                  {monthName}
                </h3>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  aria-label="Następny miesiąc"
                >
                  <ChevronRight className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Dni tygodnia */}
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-[10px] font-semibold text-gray-600 dark:text-gray-400 py-0.5"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Dni miesiąca */}
              <div className="grid grid-cols-7 gap-0.5">
                {/* Puste komórki przed pierwszym dniem */}
                {Array.from({ length: firstDayOfWeek }).map((_, index) => (
                  <div key={`empty-${index}`} className="h-6" />
                ))}

                {/* Dni miesiąca */}
                {monthDays.map((date) => {
                  const dateString = formatDateToYYYYMMDD(date);
                  const isOutOfRange = isDateOutOfRange(date);
                  const isOccupied = isDateOccupied(date);
                  const isDisabled = isOutOfRange || isOccupied;
                  const isSelected = value === dateString;
                  const isToday = formatDateToYYYYMMDD(new Date()) === dateString;

                  return (
                    <button
                      key={dateString}
                      type="button"
                      onClick={() => handleDateClick(date)}
                      disabled={isDisabled}
                      className={`
                        h-6 rounded text-[11px] transition-colors flex items-center justify-center
                        ${isOccupied
                          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 cursor-not-allowed font-medium"
                          : isOutOfRange
                          ? "bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                          : isSelected
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold"
                          : isToday
                          ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-semibold hover:bg-green-100 dark:hover:bg-green-900/30"
                          : "bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-gray-100 hover:bg-green-100 dark:hover:bg-green-900/30"
                        }
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

