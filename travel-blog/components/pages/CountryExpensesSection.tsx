"use client";

import { useState, useMemo, useEffect } from "react";
import Button from "@/components/ui/Button";
import { Edit, Trash2, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import type { Country, Expense } from "@/lib/travel-wallet/types";
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  hasExpensesOnDate,
  getExpensesForDate,
  formatDateToYYYYMMDD,
} from "@/lib/travel-wallet/calendar";
import {
  convertExpenseToPLN,
  filterExpensesByLocation,
  getUniqueLocationsFromExpenses,
} from "@/lib/travel-wallet/expenses";

interface CountryExpensesSectionProps {
  country: Country;
  expenses: Expense[];
  onAddExpense?: (date?: string) => void;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expense: Expense) => void;
}

export default function CountryExpensesSection({
  country,
  expenses,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}: CountryExpensesSectionProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [monthChangeError, setMonthChangeError] = useState<string | null>(null);

  // Stan dla wybranego miesiąca
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (country.startDate) {
      const date = new Date(country.startDate);
      return { year: date.getFullYear(), month: date.getMonth() };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Sprawdź czy miesiąc zawiera dni z zakresu dat kraju
  const monthHasCountryDays = useMemo(() => {
    if (!country.startDate || !country.endDate) return true; // Jeśli brak dat, pozwól na wszystkie miesiące
    
    const start = new Date(country.startDate);
    const end = new Date(country.endDate);
    
    // Sprawdź czy pierwszy lub ostatni dzień miesiąca jest w zakresie
    const firstDayOfMonth = new Date(currentMonth.year, currentMonth.month, 1);
    const lastDayOfMonth = new Date(currentMonth.year, currentMonth.month + 1, 0);
    
    // Miesiąc ma dni kraju jeśli:
    // - pierwszy dzień miesiąca jest przed końcem zakresu I ostatni dzień miesiąca jest po początku zakresu
    return firstDayOfMonth <= end && lastDayOfMonth >= start;
  }, [currentMonth.year, currentMonth.month, country.startDate, country.endDate]);

  // Sprawdź czy można przejść do poprzedniego miesiąca
  const canGoToPreviousMonth = useMemo(() => {
    if (!country.startDate || !country.endDate) return true;
    
    const prevMonth = currentMonth.month === 0 
      ? { year: currentMonth.year - 1, month: 11 }
      : { year: currentMonth.year, month: currentMonth.month - 1 };
    
    const start = new Date(country.startDate);
    const end = new Date(country.endDate);
    const firstDayOfPrevMonth = new Date(prevMonth.year, prevMonth.month, 1);
    const lastDayOfPrevMonth = new Date(prevMonth.year, prevMonth.month + 1, 0);
    
    return firstDayOfPrevMonth <= end && lastDayOfPrevMonth >= start;
  }, [currentMonth.year, currentMonth.month, country.startDate, country.endDate]);

  // Sprawdź czy można przejść do następnego miesiąca
  const canGoToNextMonth = useMemo(() => {
    if (!country.startDate || !country.endDate) return true;
    
    const nextMonth = currentMonth.month === 11
      ? { year: currentMonth.year + 1, month: 0 }
      : { year: currentMonth.year, month: currentMonth.month + 1 };
    
    const start = new Date(country.startDate);
    const end = new Date(country.endDate);
    const firstDayOfNextMonth = new Date(nextMonth.year, nextMonth.month, 1);
    const lastDayOfNextMonth = new Date(nextMonth.year, nextMonth.month + 1, 0);
    
    return firstDayOfNextMonth <= end && lastDayOfNextMonth >= start;
  }, [currentMonth.year, currentMonth.month, country.startDate, country.endDate]);

  // Funkcje do przełączania miesiąca
  const goToPreviousMonth = () => {
    if (!canGoToPreviousMonth) return;
    
    // Sprawdź czy wybrana lokalizacja ma daty tylko w jednym miesiącu
    if (selectedLocation && country.locations) {
      const selectedLoc = country.locations.find((loc) => {
        const locName = typeof loc === "string" ? loc : loc.name;
        return locName === selectedLocation;
      });

      if (selectedLoc && typeof selectedLoc !== "string" && selectedLoc.startDate && selectedLoc.endDate) {
        const startDate = new Date(selectedLoc.startDate);
        const endDate = new Date(selectedLoc.endDate);
        const prevMonth = currentMonth.month === 0 
          ? { year: currentMonth.year - 1, month: 11 }
          : { year: currentMonth.year, month: currentMonth.month - 1 };
        
        const prevMonthStart = new Date(prevMonth.year, prevMonth.month, 1);
        const prevMonthEnd = new Date(prevMonth.year, prevMonth.month + 1, 0);
        
        // Sprawdź czy poprzedni miesiąc zawiera daty lokalizacji
        const prevMonthContainsLocation = 
          prevMonthEnd >= startDate && prevMonthStart <= endDate;
        
        // Jeśli poprzedni miesiąc nie zawiera dat lokalizacji, zablokuj przełączanie
        if (!prevMonthContainsLocation) {
          // Sprawdź czy lokalizacja jest tylko w jednym miesiącu
          const startMonth = { year: startDate.getFullYear(), month: startDate.getMonth() };
          const endMonth = { year: endDate.getFullYear(), month: endDate.getMonth() };
          const isSingleMonth = startMonth.year === endMonth.year && startMonth.month === endMonth.month;
          
          if (isSingleMonth) {
            const locationMonthName = startDate.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
            setMonthChangeError(`Wybrana lokalizacja jest dostępna tylko w miesiącu ${locationMonthName}`);
          } else {
            // Lokalizacja jest w wielu miesiącach, ale poprzedni miesiąc jest poza zakresem
            const locationRange = `${startDate.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" })} - ${endDate.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" })}`;
            setMonthChangeError(`Wybrana lokalizacja jest dostępna tylko w zakresie ${locationRange}`);
          }
          setTimeout(() => setMonthChangeError(null), 3000); // Ukryj komunikat po 3 sekundach
          return;
        }
      }
    }
    
    setMonthChangeError(null); // Wyczyść błąd jeśli przełączanie jest możliwe
    setCurrentMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
    setSelectedDate(null); // Resetuj wybraną datę przy zmianie miesiąca
  };

  const goToNextMonth = () => {
    if (!canGoToNextMonth) return;
    
    // Sprawdź czy wybrana lokalizacja ma daty tylko w jednym miesiącu
    if (selectedLocation && country.locations) {
      const selectedLoc = country.locations.find((loc) => {
        const locName = typeof loc === "string" ? loc : loc.name;
        return locName === selectedLocation;
      });

      if (selectedLoc && typeof selectedLoc !== "string" && selectedLoc.startDate && selectedLoc.endDate) {
        const startDate = new Date(selectedLoc.startDate);
        const endDate = new Date(selectedLoc.endDate);
        const nextMonth = currentMonth.month === 11
          ? { year: currentMonth.year + 1, month: 0 }
          : { year: currentMonth.year, month: currentMonth.month + 1 };
        
        const nextMonthStart = new Date(nextMonth.year, nextMonth.month, 1);
        const nextMonthEnd = new Date(nextMonth.year, nextMonth.month + 1, 0);
        
        // Sprawdź czy następny miesiąc zawiera daty lokalizacji
        const nextMonthContainsLocation = 
          nextMonthEnd >= startDate && nextMonthStart <= endDate;
        
        // Jeśli następny miesiąc nie zawiera dat lokalizacji, zablokuj przełączanie
        if (!nextMonthContainsLocation) {
          // Sprawdź czy lokalizacja jest tylko w jednym miesiącu
          const startMonth = { year: startDate.getFullYear(), month: startDate.getMonth() };
          const endMonth = { year: endDate.getFullYear(), month: endDate.getMonth() };
          const isSingleMonth = startMonth.year === endMonth.year && startMonth.month === endMonth.month;
          
          if (isSingleMonth) {
            const locationMonthName = startDate.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
            setMonthChangeError(`Wybrana lokalizacja jest dostępna tylko w miesiącu ${locationMonthName}`);
          } else {
            // Lokalizacja jest w wielu miesiącach, ale następny miesiąc jest poza zakresem
            const locationRange = `${startDate.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" })} - ${endDate.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" })}`;
            setMonthChangeError(`Wybrana lokalizacja jest dostępna tylko w zakresie ${locationRange}`);
          }
          setTimeout(() => setMonthChangeError(null), 3000); // Ukryj komunikat po 3 sekundach
          return;
        }
      }
    }
    
    setMonthChangeError(null); // Wyczyść błąd jeśli przełączanie jest możliwe
    setCurrentMonth((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
    setSelectedDate(null); // Resetuj wybraną datę przy zmianie miesiąca
  };

  // Aktualizuj miesiąc gdy zmieni się startDate kraju (tylko przy pierwszym renderze)
  useEffect(() => {
    if (country.startDate) {
      const date = new Date(country.startDate);
      const newMonth = { year: date.getFullYear(), month: date.getMonth() };
      setCurrentMonth(newMonth);
    }
  }, [country.startDate]);

  // Automatycznie przełącz miesiąc tylko przy pierwszym wyborze lokalizacji
  // Nie resetuj miesiąca gdy użytkownik ręcznie przełącza miesiące
  useEffect(() => {
    // Jeśli wybrano "Wszystkie lokalizacje" (pusta lokalizacja), nie resetuj miesiąca
    // Pozwól użytkownikowi swobodnie przełączać miesiące
    if (!selectedLocation) {
      return;
    }

    // Jeśli wybrano konkretną lokalizację - przełącz tylko przy pierwszym wyborze
    if (!country.locations) return;

    // Znajdź wybraną lokalizację z datami
    const selectedLoc = country.locations.find((loc) => {
      const locName = typeof loc === "string" ? loc : loc.name;
      return locName === selectedLocation;
    });

    // Jeśli lokalizacja nie ma dat (stary format string), nie rób nic
    if (!selectedLoc || typeof selectedLoc === "string") return;

    // Sprawdź czy data rozpoczęcia lokalizacji jest w innym miesiącu niż aktualnie wyświetlany
    // Przełącz tylko jeśli aktualny miesiąc NIE zawiera dat lokalizacji
    if (selectedLoc.startDate && selectedLoc.endDate) {
      const locationStartDate = new Date(selectedLoc.startDate);
      const locationEndDate = new Date(selectedLoc.endDate);
      const currentMonthStart = new Date(currentMonth.year, currentMonth.month, 1);
      const currentMonthEnd = new Date(currentMonth.year, currentMonth.month + 1, 0);
      
      // Sprawdź czy aktualny miesiąc zawiera daty lokalizacji
      const currentMonthContainsLocation = 
        currentMonthEnd >= locationStartDate && currentMonthStart <= locationEndDate;
      
      // Jeśli aktualny miesiąc nie zawiera dat lokalizacji, przełącz na miesiąc z datą rozpoczęcia
      if (!currentMonthContainsLocation) {
        const locationMonth = {
          year: locationStartDate.getFullYear(),
          month: locationStartDate.getMonth(),
        };
        setCurrentMonth(locationMonth);
        setSelectedDate(null); // Resetuj wybraną datę przy zmianie miesiąca
      }
    }
  }, [selectedLocation, country.locations]); // Usunięto currentMonth z dependencies aby uniknąć zapętlenia

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

  // Unikalne lokalizacje z kraju i wydatków z datami
  const availableLocations = useMemo(() => {
    const locationsMap = new Map<string, { name: string; startDate?: string; endDate?: string }>();
    
    // Dodaj lokalizacje z kraju (mają daty)
    (country.locations || []).forEach((loc) => {
      if (typeof loc === "string") {
        if (!locationsMap.has(loc)) {
          locationsMap.set(loc, { name: loc });
        }
      } else {
        locationsMap.set(loc.name, {
          name: loc.name,
          startDate: loc.startDate,
          endDate: loc.endDate,
        });
      }
    });
    
    // Dodaj lokalizacje z wydatków (nie mają dat)
    const expenseLocations = getUniqueLocationsFromExpenses(expenses);
    expenseLocations.forEach((loc) => {
      if (!locationsMap.has(loc)) {
        locationsMap.set(loc, { name: loc });
      }
    });
    
    // Konwertuj na tablicę i sortuj
    const locationsArray = Array.from(locationsMap.values());
    
    // Sortuj: najpierw według daty rozpoczęcia (rosnąco), potem alfabetycznie dla tych bez dat
    return locationsArray.sort((a, b) => {
      // Jeśli obie mają daty, sortuj według daty rozpoczęcia
      if (a.startDate && b.startDate) {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
      // Jeśli tylko a ma datę, a idzie pierwsze
      if (a.startDate && !b.startDate) {
        return -1;
      }
      // Jeśli tylko b ma datę, b idzie pierwsze
      if (!a.startDate && b.startDate) {
        return 1;
      }
      // Jeśli żadna nie ma daty, sortuj alfabetycznie
      return a.name.localeCompare(b.name);
    });
  }, [country.locations, expenses]);
  
  // Funkcja do formatowania daty w formacie (xx - xx)
  const formatLocationDateRange = (startDate?: string, endDate?: string): string => {
    if (!startDate || !endDate) return "";
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startFormatted = start.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
    });
    
    const endFormatted = end.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
    });
    
    return `(${startFormatted} - ${endFormatted})`;
  };

  // Filtruj expenses według lokalizacji i daty
  const displayedExpenses = useMemo(() => {
    let filtered = expenses;

    // Filtruj po lokalizacji
    if (selectedLocation) {
      filtered = filterExpensesByLocation(filtered, selectedLocation);
    }

    // Filtruj po dacie
    if (selectedDate) {
      filtered = getExpensesForDate(selectedDate, filtered);
    }

    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [expenses, selectedLocation, selectedDate]);

  // Generuj listę dat, które są niedostępne gdy wybrana jest lokalizacja z datami
  const disabledDates = useMemo(() => {
    if (!selectedLocation || !country.locations) return [];

    // Znajdź wybraną lokalizację z datami
    const selectedLoc = country.locations.find((loc) => {
      const locName = typeof loc === "string" ? loc : loc.name;
      return locName === selectedLocation;
    });

    // Jeśli lokalizacja nie ma dat (stary format string), zwróć pustą listę
    if (!selectedLoc || typeof selectedLoc === "string") return [];

    // Jeśli lokalizacja ma daty, wygeneruj listę dat poza zakresem
    const dates: string[] = [];
    const start = new Date(selectedLoc.startDate);
    const end = new Date(selectedLoc.endDate);

    // Sprawdź wszystkie dni w zakresie kraju
    if (country.startDate && country.endDate) {
      const countryStart = new Date(country.startDate);
      const countryEnd = new Date(country.endDate);
      const current = new Date(countryStart);

      while (current <= countryEnd) {
        const dateString = formatDateToYYYYMMDD(current);
        // Jeśli data jest poza zakresem lokalizacji, dodaj do disabledDates
        if (current < start || current > end) {
          dates.push(dateString);
        }
        current.setDate(current.getDate() + 1);
      }
    }

    return dates;
  }, [selectedLocation, country.locations, country.startDate, country.endDate]);

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
    }
  };

  const handleToggleAll = () => {
    if (selectedDate !== null) {
      setSelectedDate(null);
    } else if (selectedDate === null && expenses.length > 0) {
      // Jeśli nie ma wybranego dnia, wybierz ostatni dzień z wydatkami
      const lastExpense = expenses.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      if (lastExpense) {
        setSelectedDate(lastExpense.date);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header z filtrem lokalizacji i przyciskiem */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Wydatki
          </h2>
          {availableLocations.length > 0 && (
            <div className="flex-1 max-w-xs">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="">Wszystkie lokalizacje</option>
                {availableLocations.map((location) => {
                  const dateRange = formatLocationDateRange(location.startDate, location.endDate);
                  const displayName = dateRange 
                    ? `${location.name} ${dateRange}`
                    : location.name;
                  return (
                    <option key={location.name} value={location.name}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => onAddExpense?.(selectedDate || undefined)}
          >
            Dodaj wydatek
          </Button>
        </div>
      </div>

      {/* Kalendarz i lista wydatków w jednej sekcji */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              disabled={!canGoToPreviousMonth}
              className={`p-1 rounded-md transition-colors ${
                canGoToPreviousMonth
                  ? "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  : "opacity-30 cursor-not-allowed"
              }`}
              aria-label="Poprzedni miesiąc"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 capitalize min-w-[140px] text-center">
              {monthName}
            </h3>
            <button
              onClick={goToNextMonth}
              disabled={!canGoToNextMonth}
              className={`p-1 rounded-md transition-colors ${
                canGoToNextMonth
                  ? "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  : "opacity-30 cursor-not-allowed"
              }`}
              aria-label="Następny miesiąc"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <Button
            onClick={handleToggleAll}
            variant="outline"
            className="text-[10px] py-0.5 px-1.5 h-5"
          >
            {selectedDate !== null ? "Wszystko" : "Dzień"}
          </Button>
        </div>
        {monthChangeError && (
          <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
              {monthChangeError}
            </p>
          </div>
        )}

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
          {/* Puste komórki przed pierwszym dniem */}
          {Array.from({ length: firstDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="h-10" />
          ))}

          {/* Dni miesiąca */}
          {monthDays.map((date) => {
            const dateString = formatDateToYYYYMMDD(date);
            const isSelected = selectedDate === dateString;

            // Sprawdź czy dzień jest w zakresie kraju
            const isInRange = country.startDate && country.endDate
              ? dateString >= country.startDate && dateString <= country.endDate
              : true;

            // Sprawdź czy data jest zablokowana przez wybraną lokalizację
            const isDisabledByLocation = disabledDates.includes(dateString);

            // Sprawdź czy są wydatki w tym dniu (z uwzględnieniem filtru lokalizacji)
            let dayExpenses = expenses.filter((e) => e.date === dateString);
            if (selectedLocation) {
              dayExpenses = filterExpensesByLocation(dayExpenses, selectedLocation);
            }
            const hasFilteredExpenses = dayExpenses.length > 0;
            const dayTotal = dayExpenses.reduce(
              (sum, e) => sum + convertExpenseToPLN(e),
              0
            );

            // Sprawdź czy dzień jest dostępny (w zakresie kraju i nie zablokowany przez lokalizację)
            const isAvailable = isInRange && !isDisabledByLocation;

            return (
              <button
                key={dateString}
                onClick={() => isAvailable && handleDayClick(date)}
                disabled={!isAvailable}
                className={`
                  h-10 rounded border transition-colors p-0.5
                  ${!isAvailable
                    ? "bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    : isSelected
                    ? "bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400"
                    : hasFilteredExpenses
                    ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }
                `}
              >
                <div className="flex flex-col items-center justify-center h-full gap-0">
                  <span
                    className={`
                      text-[10px] font-semibold leading-none
                      ${!isAvailable
                        ? "text-gray-400 dark:text-gray-600"
                        : isSelected
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-gray-900 dark:text-gray-100"
                      }
                    `}
                  >
                    {date.getDate()}
                  </span>
                  {hasFilteredExpenses && isAvailable && dayTotal > 0 ? (
                    <span
                      className={`
                        text-[8px] font-medium leading-none
                        ${isSelected
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-green-600 dark:text-green-400"
                        }
                      `}
                    >
                      {formatCurrency(dayTotal)} zł
                    </span>
                  ) : isAvailable && !hasFilteredExpenses ? (
                    <span className="text-[7px] text-gray-400 dark:text-gray-500 leading-none">
                      brak wydatków
                    </span>
                  ) : (
                    <span className="text-[8px] leading-none opacity-0">0</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Lista wydatków */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            {selectedDate
              ? `${formatDate(selectedDate)}${selectedLocation ? ` - ${selectedLocation}` : ""}`
              : `Wszystkie wydatki${selectedLocation ? ` - ${selectedLocation}` : ""}`}
          </h3>
          {displayedExpenses.length > 0 ? (
            <div className="space-y-3">
              {displayedExpenses.map((expense) => {
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
                    className="flex justify-between items-start py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
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
                        {expense.location && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                            <MapPin className="w-3 h-3" />
                            {expense.location}
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
                      {!selectedDate && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formattedDate}
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
            <p className="text-gray-600 dark:text-gray-400 text-center py-4">
              {selectedDate
                ? `Brak wydatków dla wybranego dnia${selectedLocation ? ` w lokalizacji ${selectedLocation}` : ""}`
                : `Brak wydatków${selectedLocation ? ` w lokalizacji ${selectedLocation}` : ""}`}
            </p>
          )}
          <div className="mt-4 text-center">
            <Button
              onClick={() => onAddExpense?.(selectedDate || undefined)}
              variant="outline"
              className="text-sm"
            >
              Dodaj wydatek
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}

