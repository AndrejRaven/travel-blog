"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronDown, ChevronUp, ArrowLeft, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import { getCurrencyName } from "@/lib/travel-wallet/currency-names";
import type { Country, Budget, TravelWalletData } from "@/lib/travel-wallet/types";
import {
  calculateTotalSpent,
  calculateTotalPlannedSpending,
} from "@/lib/travel-wallet/calculations";

interface AddCountryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (countryData: {
    name: string;
    location?: string;
    days: number;
    startDate?: string;
    endDate?: string;
    status: "visited" | "current" | "upcoming";
    budgets: Budget[];
    locations?: Array<{ name: string; startDate: string; endDate: string }>;
  }) => void;
  initialStartDate?: string;
  initialEndDate?: string;
  tripStartDate?: string;
  tripEndDate?: string;
  existingCountries?: Country[];
  tripData?: TravelWalletData;
  totalBudget?: number;
  baseCurrency?: string;
  onBack?: () => void;
}

/**
 * W Add Country do wyboru są wyłącznie waluty z podróży (initialBudgets).
 */
const exchangeRates: Record<string, number> = {
  PLN: 1,
  USD: 4.0,
  EUR: 4.3,
  JPY: 0.027,
  THB: 0.11,
  GBP: 5.1,
  KRW: 0.003,
  TWD: 0.13,
  NOK: 0.36,
};

/**
 * Konwertuje kwotę w danej walucie na PLN
 */
function convertToPLN(amount: number, currency: string): number {
  const rate = exchangeRates[currency.toUpperCase()] || 1;
  return amount * rate;
}

/**
 * Oblicza budżet kraju w PLN (suma wszystkich budżetów przeliczona na PLN)
 */
function calculateCountryBudgetInPLN(budgets: Budget[]): number {
  return budgets.reduce((sum, budget) => {
    return sum + convertToPLN(budget.amount, budget.currency);
  }, 0);
}

export default function AddCountryModal({
  isOpen,
  onClose,
  onSave,
  initialStartDate,
  initialEndDate,
  tripStartDate,
  tripEndDate,
  existingCountries = [],
  tripData,
  totalBudget,
  baseCurrency = "PLN",
  onBack,
}: AddCountryModalProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budgets, setBudgets] = useState<Budget[]>([{ currency: "PLN", amount: 0 }]);
  const [budgetInputValues, setBudgetInputValues] = useState<string[]>([""]);
  const [locations, setLocations] = useState<Array<{ name: string; startDate: string; endDate: string }>>([]);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationStartDate, setNewLocationStartDate] = useState("");
  const [newLocationEndDate, setNewLocationEndDate] = useState("");
  const [locationErrors, setLocationErrors] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLocationsExpanded, setIsLocationsExpanded] = useState(false);
  const [assignAllRemaining, setAssignAllRemaining] = useState(false);
  const [openCurrencyDropdownIndex, setOpenCurrencyDropdownIndex] = useState<number | null>(null);
  const [currencyFilterText, setCurrencyFilterText] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  const currencyTriggerRef = useRef<HTMLInputElement>(null);

  // Wyłącznie waluty z podróży (do wyboru przy budżecie kraju)
  const tripCurrencies = useMemo(
    () => tripData?.initialBudgets?.map((b) => b.currency) ?? (baseCurrency ? [baseCurrency] : ["PLN"]),
    [tripData?.initialBudgets, baseCurrency]
  );

  // Pozostały budżet do zaplanowania per waluta (initialBudgets minus już przypisane do krajów)
  const remainingByCurrency = useMemo(() => {
    const initial = tripData?.initialBudgets ?? [];
    if (initial.length === 0) return [];
    return initial.map((ib) => {
      const planned = (existingCountries ?? []).reduce(
        (sum, c) => sum + (c.budgets?.filter((b) => b.currency === ib.currency).reduce((s, b) => s + b.amount, 0) ?? 0),
        0
      );
      return { currency: ib.currency, amount: Math.max(0, ib.amount - planned) };
    });
  }, [tripData?.initialBudgets, existingCountries]);

  // Lista walut do wyboru = wyłącznie waluty z podróży (bez innych)
  const orderedCurrencies = useMemo(() => [...tripCurrencies], [tripCurrencies]);

  const filteredCurrencies = useMemo(() => {
    const q = currencyFilterText.trim().toLowerCase();
    if (!q) return orderedCurrencies;
    return orderedCurrencies.filter(
      (code) => `${code} ${getCurrencyName(code)}`.toLowerCase().includes(q)
    );
  }, [orderedCurrencies, currencyFilterText]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (currencyDropdownRef.current?.contains(target)) return;
      if (target && (target as Element).nodeType === 1 && (target as Element).closest?.("[data-currency-dropdown]")) return;
      setOpenCurrencyDropdownIndex(null);
    };
    if (openCurrencyDropdownIndex !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openCurrencyDropdownIndex]);

  useEffect(() => {
    if (openCurrencyDropdownIndex === null) {
      setDropdownPosition(null);
      return;
    }
    const measure = () => {
      const el = currencyTriggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };
    measure();
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [openCurrencyDropdownIndex]);

  // Oblicz maksymalną możliwą kwotę do zaplanowania (w walucie bazowej)
  const maxAvailableBudget = useMemo(() => {
    if (totalBudget === undefined || !tripData) return undefined;
    const totalSpent = calculateTotalSpent(tripData);
    const totalPlanned = calculateTotalPlannedSpending(tripData);
    const remainingBudget = totalBudget - totalSpent;
    return Math.max(0, remainingBudget - totalPlanned);
  }, [totalBudget, tripData]);

  // Funkcja obliczająca liczbę dni na podstawie dat
  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 bo włączamy obie daty
  };

  useEffect(() => {
    if (isOpen) {
      setName("");
      setStartDate(initialStartDate || "");
      setEndDate(initialEndDate || "");
      const initial = tripData?.initialBudgets;
      if (initial && initial.length > 0) {
        setBudgets(initial.map((b) => ({ currency: b.currency, amount: 0 })));
        setBudgetInputValues(initial.map(() => ""));
      } else {
        setBudgets([{ currency: baseCurrency || "PLN", amount: 0 }]);
        setBudgetInputValues([""]);
      }
      setAssignAllRemaining(false);
      setLocations([]);
      setNewLocationName("");
      setNewLocationStartDate("");
      setNewLocationEndDate("");
      setLocationErrors({});
      setErrors({});
    }
    // Usuń initialStartDate i initialEndDate z zależności, aby nie resetować formularza gdy się zmieniają
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Synchronizuj budgetInputValues z budgets przy zmianie liczby budżetów
  useEffect(() => {
    // Tylko synchronizuj gdy liczba się zmienia (dodanie/usunięcie)
    // Aktualizacje wartości są obsługiwane przez handleBudgetChange
    if (budgetInputValues.length !== budgets.length) {
      setBudgetInputValues(budgets.map((budget) => 
        budget.amount === 0 ? "" : budget.amount.toString()
      ));
    }
  }, [budgets.length, budgetInputValues.length]); // Tylko gdy zmienia się liczba budżetów

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Nazwa kraju jest wymagana";
    } else if (name.trim().length < 2) {
      newErrors.name = "Nazwa kraju musi mieć co najmniej 2 znaki";
    }

    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        newErrors.endDate = "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia";
      } else {
        const calculatedDays = calculateDays(startDate, endDate);
        if (calculatedDays <= 0) {
          newErrors.endDate = "Nieprawidłowy zakres dat";
        }
      }
    }

    const validBudgets = budgets.filter((b) => b.amount > 0);
    if (validBudgets.length === 0) {
      newErrors.budgets = "Dodaj co najmniej jeden budżet z kwotą większą od zera";
    }

    // Walidacja budżetu: sprawdź czy dodanie nowego kraju nie przekroczy całkowitego budżetu
    if (totalBudget !== undefined && tripData && validBudgets.length > 0) {
      const newCountryBudget = calculateCountryBudgetInPLN(validBudgets);
      const totalSpent = calculateTotalSpent(tripData);
      const totalPlanned = calculateTotalPlannedSpending(tripData);
      const remainingBudget = totalBudget - totalSpent;
      
      // Sprawdź czy nowy budżet kraju + już zaplanowane wydatki nie przekroczy pozostałego budżetu
      if (newCountryBudget + totalPlanned > remainingBudget) {
        const canPlanMore = Math.max(0, remainingBudget - totalPlanned);
        newErrors.budgets = `Budżet kraju (${Math.round(newCountryBudget)} zł) wraz z już zaplanowanymi wydatkami (${Math.round(totalPlanned)} zł) przekracza pozostały budżet (${Math.round(remainingBudget)} zł). Możesz jeszcze zaplanować maksymalnie ${Math.round(canPlanMore)} zł. Aby dodać ten kraj, zwiększ całkowity budżet podróży lub zmniejsz budżet tego kraju.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const validBudgets = budgets.filter((b) => b.amount > 0);
      const calculatedDays = startDate && endDate ? calculateDays(startDate, endDate) : 0;
      
      // Sprawdź czy są wypełnione dane lokalizacji, które nie zostały jeszcze dodane
      const finalLocations = [...(locations || [])];
      
      const trimmedLocationName = newLocationName.trim();
      if (trimmedLocationName && newLocationStartDate && newLocationEndDate) {
        // Sprawdź czy lokalizacja o tej nazwie już nie istnieje
        const existingNames = finalLocations.map((loc) => loc.name.toLowerCase());
        if (!existingNames.includes(trimmedLocationName.toLowerCase())) {
          // Walidacja dat
          if (new Date(newLocationStartDate) <= new Date(newLocationEndDate)) {
            // Walidacja zakresu dat kraju
            const isDateValid = 
              (!startDate || newLocationStartDate >= startDate) &&
              (!endDate || newLocationEndDate <= endDate);
            
            // Sprawdź czy zakres dat nie nakłada się na inne lokalizacje
            const hasOverlap = hasDateOverlap(newLocationStartDate, newLocationEndDate, finalLocations);
            
            if (isDateValid && !hasOverlap) {
              // Automatycznie dodaj lokalizację
              const autoLocation = {
                name: trimmedLocationName,
                startDate: newLocationStartDate,
                endDate: newLocationEndDate,
              };
              finalLocations.push(autoLocation);
            }
          }
        }
      }
      
      const countryData = {
        name: name.trim(),
        location: "",
        days: calculatedDays,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: "upcoming" as const,
        budgets: validBudgets,
        locations: finalLocations,
      };
      
      onSave(countryData);
    }
  };

  const handleAddBudget = () => {
    const used = new Set(budgets.map((b) => b.currency));
    const nextCurrency = tripCurrencies.find((c) => !used.has(c)) ?? tripCurrencies[0] ?? baseCurrency ?? "PLN";
    setBudgets([...budgets, { currency: nextCurrency, amount: 0 }]);
    setBudgetInputValues([...budgetInputValues, ""]);
  };

  const handleRemoveBudget = (index: number) => {
    if (budgets.length > 1) {
      setBudgets(budgets.filter((_, i) => i !== index));
      setBudgetInputValues(budgetInputValues.filter((_, i) => i !== index));
    }
  };

  const handleBudgetChange = (index: number, field: "currency" | "amount", value: string | number) => {
    const updated = [...budgets];
    updated[index] = { ...updated[index], [field]: value };
    setBudgets(updated);
    
    // Synchronizuj budgetInputValues dla amount
    if (field === "amount") {
      const newInputValues = [...budgetInputValues];
      newInputValues[index] = value === 0 ? "" : value.toString();
      setBudgetInputValues(newInputValues);
    }
  };

  // Funkcja sprawdzająca czy zakres dat nakłada się na inne zakresy
  const hasDateOverlap = (
    newStartDate: string,
    newEndDate: string,
    existingLocations: Array<{ name: string; startDate: string; endDate: string }>
  ): boolean => {
    const newStart = new Date(newStartDate);
    const newEnd = new Date(newEndDate);

    return existingLocations.some((loc) => {
      const locStart = new Date(loc.startDate);
      const locEnd = new Date(loc.endDate);
      
      // Sprawdź czy zakresy się nakładają
      // Nakładanie występuje gdy: newStart <= locEnd && newEnd >= locStart
      return newStart <= locEnd && newEnd >= locStart;
    });
  };

  // Generuj listę wszystkich zajętych dat przez lokalizacje
  const occupiedDates = useMemo(() => {
    const dates: string[] = [];
    
    locations.forEach((loc) => {
      const start = new Date(loc.startDate);
      const end = new Date(loc.endDate);
      const current = new Date(start);
      
      while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, "0");
        const day = String(current.getDate()).padStart(2, "0");
        dates.push(`${year}-${month}-${day}`);
        current.setDate(current.getDate() + 1);
      }
    });
    
    return dates;
  }, [locations]);

  // Generuj listę wszystkich zajętych dat przez inne kraje
  const occupiedCountryDates = useMemo(() => {
    if (!existingCountries || existingCountries.length === 0) return [];
    
    const dates: string[] = [];
    
    existingCountries.forEach((country) => {
      if (country.startDate && country.endDate) {
        const start = new Date(country.startDate);
        const end = new Date(country.endDate);
        const current = new Date(start);
        
        while (current <= end) {
          const year = current.getFullYear();
          const month = String(current.getMonth() + 1).padStart(2, "0");
          const day = String(current.getDate()).padStart(2, "0");
          dates.push(`${year}-${month}-${day}`);
          current.setDate(current.getDate() + 1);
        }
      }
    });
    
    return dates;
  }, [existingCountries]);

  const handleAddLocation = () => {
    const newErrors: Record<string, string> = {};
    const trimmedName = newLocationName.trim();

    if (!trimmedName) {
      newErrors.name = "Nazwa lokalizacji jest wymagana";
      setLocationErrors(newErrors);
      return;
    }

    // Sprawdź czy lokacja już istnieje
    const existingNames = locations.map((loc) => loc.name.toLowerCase());
    if (existingNames.includes(trimmedName.toLowerCase())) {
      newErrors.name = "Miejsce o tej nazwie już istnieje";
      setLocationErrors(newErrors);
      return;
    }

    // Walidacja dat - daty są wymagane
    if (!newLocationStartDate) {
      newErrors.startDate = "Data rozpoczęcia jest wymagana";
      setLocationErrors(newErrors);
      return;
    }

    if (!newLocationEndDate) {
      newErrors.endDate = "Data zakończenia jest wymagana";
      setLocationErrors(newErrors);
      return;
    }

    if (new Date(newLocationStartDate) > new Date(newLocationEndDate)) {
      newErrors.endDate = "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia";
      setLocationErrors(newErrors);
      return;
    }

    // Walidacja zakresu dat kraju
    if (startDate && newLocationStartDate < startDate) {
      newErrors.startDate = "Data rozpoczęcia nie może być wcześniejsza niż data rozpoczęcia podróży";
      setLocationErrors(newErrors);
      return;
    }
    if (endDate && newLocationEndDate > endDate) {
      newErrors.endDate = "Data zakończenia nie może być późniejsza niż data zakończenia podróży";
      setLocationErrors(newErrors);
      return;
    }

    // Sprawdź czy zakres dat nakłada się na inne miejsca
    if (hasDateOverlap(newLocationStartDate, newLocationEndDate, locations)) {
      newErrors.startDate = "Zakres dat nakłada się na daty innego miejsca";
      newErrors.endDate = "Zakres dat nakłada się na daty innego miejsca";
      setLocationErrors(newErrors);
      return;
    }

    // Dodaj lokację
    const newLocation: { name: string; startDate: string; endDate: string } = {
      name: trimmedName,
      startDate: newLocationStartDate,
      endDate: newLocationEndDate,
    };
    const updatedLocations = [...locations, newLocation];
    setLocations(updatedLocations);
    setNewLocationName("");
    setNewLocationStartDate("");
    setNewLocationEndDate("");
    setLocationErrors({});
  };

  const handleRemoveLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-country-modal-title"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Zamknij"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Wróć"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
          <h2
            id="add-country-modal-title"
            className="text-xl font-bold text-gray-900 dark:text-gray-100"
          >
            Dodaj kraj
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Nazwa kraju *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Daty podróży */}
          {tripStartDate && tripEndDate ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <DatePicker
                  id="startDate"
                  label="Data rozpoczęcia"
                  value={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    if (errors.startDate) {
                      setErrors({ ...errors, startDate: "" });
                    }
                  }}
                  min={tripStartDate}
                  max={tripEndDate}
                  disabledDates={occupiedCountryDates}
                  error={errors.startDate}
                />
              </div>
              <div>
                <DatePicker
                  id="endDate"
                  label="Data zakończenia"
                  value={endDate}
                  onChange={(date) => {
                    setEndDate(date);
                    if (errors.endDate) {
                      setErrors({ ...errors, endDate: "" });
                    }
                  }}
                  min={tripStartDate}
                  max={tripEndDate}
                  relatedDate={startDate ? { type: 'end', value: startDate } : undefined}
                  disabledDates={occupiedCountryDates}
                  error={errors.endDate}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Data rozpoczęcia
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Data zakończenia
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.endDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>
          )}

          {/* Miejsca - zwijana sekcja */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-md">
            <button
              type="button"
              onClick={() => setIsLocationsExpanded(!isLocationsExpanded)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-md"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Dodaj miejsce
              </span>
              {isLocationsExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </button>

            {isLocationsExpanded && (
              <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
                {/* Lista dodanych lokacji */}
                {locations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Dodane miejsca
                    </h4>
                    <div className="space-y-2">
                      {locations.map((loc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                              {loc.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(loc.startDate).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" })} - {new Date(loc.endDate).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" })}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveLocation(index)}
                            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            aria-label="Usuń lokalizację"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formularz dodawania lokacji */}
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLocationName}
                      onChange={(e) => {
                        setNewLocationName(e.target.value);
                        if (locationErrors.name) {
                          setLocationErrors({ ...locationErrors, name: "" });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddLocation();
                        }
                      }}
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nazwa lokalizacji"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddLocation}
                      className="whitespace-nowrap"
                    >
                      Dodaj
                    </Button>
                  </div>
                  {locationErrors.name && (
                    <p className="text-red-500 text-xs">{locationErrors.name}</p>
                  )}

                  {/* Daty lokalizacji */}
                  {startDate && endDate && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        Daty lokalizacji
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <DatePicker
                            id="newLocationStartDate"
                            label="Data rozpoczęcia"
                            value={newLocationStartDate}
                            onChange={(date) => {
                              setNewLocationStartDate(date);
                              if (locationErrors.startDate) {
                                setLocationErrors({ ...locationErrors, startDate: "" });
                              }
                            }}
                            min={startDate}
                            max={endDate}
                            disabledDates={occupiedDates}
                            required
                            error={locationErrors.startDate}
                          />
                        </div>
                        <div>
                          <DatePicker
                            id="newLocationEndDate"
                            label="Data zakończenia"
                            value={newLocationEndDate}
                            onChange={(date) => {
                              setNewLocationEndDate(date);
                              if (locationErrors.endDate) {
                                setLocationErrors({ ...locationErrors, endDate: "" });
                              }
                            }}
                            min={startDate}
                            max={endDate}
                            disabledDates={occupiedDates}
                            required
                            error={locationErrors.endDate}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {(!startDate || !endDate) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Aby dodać miejsca, najpierw ustaw daty rozpoczęcia i zakończenia podróży w kraju.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>


          <div ref={currencyDropdownRef}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Planowany budżet *
              </label>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddBudget}
                className="text-sm"
              >
                + Dodaj budżet
              </Button>
            </div>
            {totalBudget !== undefined && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Budżet całkowity: <span className="font-semibold">{Math.round(totalBudget).toLocaleString("pl-PL")} {baseCurrency}</span>
              </p>
            )}
            {remainingByCurrency.length > 0 && (
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignAllRemaining}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAssignAllRemaining(checked);
                    if (checked) {
                      setBudgets(remainingByCurrency.map((r) => ({ currency: r.currency, amount: r.amount })));
                      setBudgetInputValues(
                        remainingByCurrency.map((r) => (r.amount === 0 ? "" : r.amount.toString()))
                      );
                    } else {
                      const initial = tripData?.initialBudgets;
                      if (initial && initial.length > 0) {
                        setBudgets(initial.map((b) => ({ currency: b.currency, amount: 0 })));
                        setBudgetInputValues(initial.map(() => ""));
                      } else {
                        setBudgets([{ currency: baseCurrency || "PLN", amount: 0 }]);
                        setBudgetInputValues([""]);
                      }
                    }
                  }}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Przydziel cały pozostały budżet (wszystkie niezaplanowane pieniądze na ten kraj)
                </span>
              </label>
            )}
            {budgets.map((budget, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-[1]" />
                  <input
                    type="text"
                    ref={openCurrencyDropdownIndex === index ? currencyTriggerRef : undefined}
                    readOnly={openCurrencyDropdownIndex !== index}
                    value={openCurrencyDropdownIndex === index ? currencyFilterText : `${budget.currency} - ${getCurrencyName(budget.currency)}`}
                    onChange={(e) => {
                      setCurrencyFilterText(e.target.value);
                      setOpenCurrencyDropdownIndex(index);
                    }}
                    onFocus={() => {
                      setOpenCurrencyDropdownIndex(index);
                      setCurrencyFilterText("");
                    }}
                    placeholder="Wpisz kod lub nazwę waluty..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <input
                  type="number"
                  value={budgetInputValues[index] || ""}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    // Aktualizuj lokalny stan dla wartości input
                    const newInputValues = [...budgetInputValues];
                    newInputValues[index] = inputValue;
                    setBudgetInputValues(newInputValues);
                    
                    // Konwertuj na number i zaktualizuj budgets
                    const numValue = inputValue === "" ? 0 : parseFloat(inputValue);
                    if (!isNaN(numValue) && numValue >= 0) {
                      handleBudgetChange(index, "amount", numValue);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "PageUp" || e.key === "PageDown") {
                      e.preventDefault();
                    }
                  }}
                  onWheel={(e) => {
                    e.currentTarget.blur();
                  }}
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  step="0.01"
                  min="0"
                  placeholder="Kwota"
                />
                {budgets.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRemoveBudget(index)}
                    className="px-3"
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            {errors.budgets && (
              <p className="text-red-500 text-xs mt-1">{errors.budgets}</p>
            )}
            {maxAvailableBudget !== undefined && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Maksymalna możliwa suma: <span className="font-semibold">{Math.round(maxAvailableBudget).toLocaleString("pl-PL")} zł</span> (pozostało niezaplanowane)
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" variant="primary">
              Dodaj kraj
            </Button>
          </div>
        </form>
      </div>
      {typeof document !== "undefined" &&
        dropdownPosition &&
        openCurrencyDropdownIndex !== null &&
        createPortal(
          <div
            data-currency-dropdown
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto z-[9999]"
            style={{
              position: "fixed",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              minWidth: 200,
            }}
          >
            {filteredCurrencies.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  handleBudgetChange(openCurrencyDropdownIndex, "currency", code);
                  setOpenCurrencyDropdownIndex(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                {code} - {getCurrencyName(code)}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

