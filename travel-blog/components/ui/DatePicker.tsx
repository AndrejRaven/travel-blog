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
  relatedDate?: { type: 'start' | 'end'; value: string }; // Powiązana data dla automatycznej walidacji relacji
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
  relatedDate,
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

  // Oblicz efektywne min/max z uwzględnieniem relatedDate
  const effectiveMin = useMemo(() => {
    if (relatedDate?.type === 'end' && relatedDate.value) {
      // Jeśli to endDate, a relatedDate.value to startDate, ustaw min na startDate
      return relatedDate.value;
    }
    return min;
  }, [min, relatedDate]);

  const effectiveMax = useMemo(() => {
    if (relatedDate?.type === 'start' && relatedDate.value) {
      // Jeśli to startDate, a relatedDate.value to endDate, ustaw max na endDate
      return relatedDate.value;
    }
    return max;
  }, [max, relatedDate]);

  // Sprawdź czy data jest wyłączona (z powodu min/max)
  const isDateOutOfRange = (date: Date): boolean => {
    const dateString = formatDateToYYYYMMDD(date);
    
    // Sprawdź efektywne min/max
    if (effectiveMin && dateString < effectiveMin) return true;
    if (effectiveMax && dateString > effectiveMax) return true;
    
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
    return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/) !== null;
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
    if (!effectiveMin || !effectiveMax) {
      return { year: startYear, month: startMonth };
    }

    // Waliduj daty przed użyciem
    if (!isValidDate(effectiveMin) || !isValidDate(effectiveMax)) {
      return { year: startYear, month: startMonth };
    }

    const minDate = new Date(effectiveMin);
    const maxDate = new Date(effectiveMax);
    
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

      // Jeśli przekroczyliśmy effectiveMax, zatrzymaj
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
    // Jeśli value jest puste, ale relatedDate jest ustawione, użyj miesiąca z relatedDate.value
    // (np. dla endDate użyj miesiąca z startDate)
    if (relatedDate?.value && isValidDate(relatedDate.value)) {
      const date = new Date(relatedDate.value);
      if (!isNaN(date.getTime())) {
        const month = { year: date.getFullYear(), month: date.getMonth() };
        // Sprawdź czy w tym miesiącu są dostępne daty, jeśli nie, znajdź pierwszy dostępny
        if (!hasAvailableDatesInMonth(month.year, month.month)) {
          return findFirstAvailableMonth(month.year, month.month);
        }
        return month;
      }
    }
    // Jeśli value jest puste, ale effectiveMin jest ustawione i prawidłowe, użyj miesiąca z effectiveMin
    if (effectiveMin && isValidDate(effectiveMin)) {
      const date = new Date(effectiveMin);
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

  // Aktualizuj miesiąc gdy value, min, max, relatedDate lub disabledDates się zmienia
  useEffect(() => {
    const newMonth = calculateInitialMonth();
    // Aktualizuj tylko jeśli miesiąc faktycznie się zmienił
    setCurrentMonth((prev) => {
      if (prev.year !== newMonth.year || prev.month !== newMonth.month) {
        return newMonth;
      }
      return prev;
    });
  }, [value, min, max, relatedDate?.value, disabledDatesKey]);

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

  const [calendarPosition, setCalendarPosition] = useState<{ top: number; left: number } | null>(null);

  // Funkcja do obliczania pozycji kalendarza (fixed positioning względem viewportu)
  const calculatePosition = () => {
    if (!inputRef.current || typeof window === "undefined") return null;
    
    const inputRect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const calendarHeight = 280; // Przybliżona wysokość kalendarza
    const calendarWidth = 240; // Szerokość kalendarza
    
    let top = 0;
    let left = 0;
    let position: "bottom" | "top" | "right" | "left" = "bottom";
    
    // Sprawdź czy jest miejsce na dole
    const spaceBelow = viewportHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;
    const spaceRight = viewportWidth - inputRect.right;
    const spaceLeft = inputRect.left;
    
    // Priorytet: dół > góra > prawo > lewo
    if (spaceBelow >= calendarHeight) {
      position = "bottom";
      top = inputRect.bottom + 4; // 4px margin
      left = inputRect.left;
    } else if (spaceAbove >= calendarHeight) {
      position = "top";
      top = inputRect.top - calendarHeight - 4; // 4px margin
      left = inputRect.left;
    } else if (spaceRight >= calendarWidth) {
      position = "right";
      top = inputRect.top;
      left = inputRect.right + 4; // 4px margin
    } else if (spaceLeft >= calendarWidth) {
      position = "left";
      top = inputRect.top;
      left = inputRect.left - calendarWidth - 4; // 4px margin
    } else {
      // Fallback: wybierz najlepszą dostępną opcję
      if (spaceAbove > spaceBelow) {
        position = "top";
        top = Math.max(8, inputRect.top - calendarHeight - 4);
        left = inputRect.left;
      } else if (spaceRight > spaceLeft) {
        position = "right";
        top = inputRect.top;
        left = Math.min(viewportWidth - calendarWidth - 8, inputRect.right + 4);
      } else {
        position = "left";
        top = inputRect.top;
        left = Math.max(8, inputRect.left - calendarWidth - 4);
      }
    }
    
    // Upewnij się, że kalendarz nie wychodzi poza viewport
    top = Math.max(8, Math.min(top, viewportHeight - calendarHeight - 8));
    left = Math.max(8, Math.min(left, viewportWidth - calendarWidth - 8));
    
    return { top, left };
  };

  // Aktualizuj pozycję gdy kalendarz się otwiera
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Użyj setTimeout aby upewnić się, że DOM jest zaktualizowany
      setTimeout(() => {
        const pos = calculatePosition();
        setCalendarPosition(pos);
        if (pos) {
          // Ustaw również position dla klasy CSS (dla kompatybilności)
          const inputRect = inputRef.current!.getBoundingClientRect();
          if (pos.top > inputRect.bottom) {
            setPosition("bottom");
          } else if (pos.top < inputRect.top) {
            setPosition("top");
          } else if (pos.left > inputRect.right) {
            setPosition("right");
          } else {
            setPosition("left");
          }
        }
      }, 0);
    } else {
      setCalendarPosition(null);
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
        // Sprawdź czy to problem z relatedDate
        if (relatedDate?.type === 'end' && relatedDate.value && dateString < relatedDate.value) {
          addToast({
            type: "error",
            title: "Nieprawidłowa data",
            message: "Data zakończenia musi być późniejsza niż data rozpoczęcia.",
            duration: 3000,
          });
        } else if (relatedDate?.type === 'start' && relatedDate.value && dateString > relatedDate.value) {
          addToast({
            type: "error",
            title: "Nieprawidłowa data",
            message: "Data rozpoczęcia musi być wcześniejsza niż data zakończenia.",
            duration: 3000,
          });
        } else {
          addToast({
            type: "error",
            title: "Data poza zakresem",
            message: "Ta data jest poza zakresem podróży.",
            duration: 3000,
          });
        }
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
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div
              ref={calendarRef}
              className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 w-[240px]"
              style={
                calendarPosition
                  ? {
                      top: `${calendarPosition.top}px`,
                      left: `${calendarPosition.left}px`,
                    }
                  : undefined
              }
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

