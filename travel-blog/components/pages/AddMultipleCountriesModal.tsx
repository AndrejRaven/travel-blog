"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, ArrowLeft, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import { getCurrencyName } from "@/lib/travel-wallet/currency-names";
import type { Budget, TravelWalletData } from "@/lib/travel-wallet/types";

interface CountryFormData {
  name: string;
  startDate: string;
  endDate: string;
  budgets: Budget[];
  locations?: Array<{ name: string; startDate: string; endDate: string }>;
}

interface AddMultipleCountriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (countries: Array<{
    name: string;
    location?: string;
    days: number;
    startDate?: string;
    endDate?: string;
    status: "visited" | "current" | "upcoming";
    budgets: Budget[];
    locations?: Array<{ name: string; startDate: string; endDate: string }>;
  }>) => void;
  onSwitchToSingleCountry?: (countryData?: {
    name: string;
    location?: string;
    days: number;
    startDate?: string;
    endDate?: string;
    status: "visited" | "current" | "upcoming";
    budgets: Budget[];
    locations?: Array<{ name: string; startDate: string; endDate: string }>;
  }) => void;
  tripStartDate?: string;
  tripEndDate?: string;
  tripData?: TravelWalletData;
  /** Całkowity budżet podróży w walucie bazowej (do walidacji sumy krajów) */
  totalBudget?: number;
  /** Waluta główna budżetu (np. PLN, USD). Używana do przeliczania i komunikatów. */
  baseCurrency?: string;
  onBack?: () => void;
}

/** W step 2 do wyboru są wyłącznie waluty z podróży (initialBudgets). */
/**
 * Kursy walut do PLN (muszą być takie same jak w calculations.ts)
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
 * Konwertuje kwotę do waluty bazowej (domyślnie PLN)
 */
function convertToBase(amount: number, currency: string, baseCurrency: string = "PLN"): number {
  const fromRate = exchangeRates[currency.toUpperCase()] || 1;
  const toRate = exchangeRates[baseCurrency] ?? 1;
  return (amount * fromRate) / toRate;
}

/**
 * Oblicza budżet kraju w walucie bazowej (suma budżetów przeliczona)
 */
function calculateCountryBudgetInBase(budgets: Budget[], baseCurrency: string = "PLN"): number {
  return budgets.reduce((sum, budget) => sum + convertToBase(budget.amount, budget.currency, baseCurrency), 0);
}

/** Legacy: w PLN */
function calculateCountryBudgetInPLN(budgets: Budget[]): number {
  return calculateCountryBudgetInBase(budgets, "PLN");
}

export default function AddMultipleCountriesModal({
  isOpen,
  onClose,
  onSave,
  onSwitchToSingleCountry,
  tripStartDate,
  tripEndDate,
  tripData,
  totalBudget,
  baseCurrency = "PLN",
  onBack,
}: AddMultipleCountriesModalProps) {
  /** Tylko waluty z budżetu podróży (krok 1). */
  const tripCurrencies = useMemo(() => {
    const list = tripData?.initialBudgets?.map((b) => b.currency) ?? [];
    return list.length > 0 ? list : [baseCurrency];
  }, [tripData?.initialBudgets, baseCurrency]);

  const [countries, setCountries] = useState<CountryFormData[]>([
    {
      name: "",
      startDate: "",
      endDate: "",
      budgets: [{ currency: tripCurrencies[0] ?? baseCurrency, amount: 0 }],
      locations: [],
    },
  ]);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

  /** Wyszukiwarka walut: który dropdown jest otwarty i filtr. */
  const [openCurrencyDropdown, setOpenCurrencyDropdown] = useState<{ countryIndex: number; budgetIndex: number } | null>(null);
  const [currencyFilterText, setCurrencyFilterText] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const currencyTriggerRef = useRef<HTMLInputElement | null>(null);

  const filteredCurrencies = useMemo(() => {
    const q = currencyFilterText.trim().toLowerCase();
    if (!q) return tripCurrencies;
    return tripCurrencies.filter(
      (code) => `${code} ${getCurrencyName(code)}`.toLowerCase().includes(q)
    );
  }, [tripCurrencies, currencyFilterText]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (currencyTriggerRef.current === target) return;
      if (target && (target as Element).nodeType === 1 && (target as Element).closest?.("[data-currency-dropdown]")) return;
      setOpenCurrencyDropdown(null);
    };
    if (openCurrencyDropdown !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openCurrencyDropdown]);

  useEffect(() => {
    if (openCurrencyDropdown === null) {
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
  }, [openCurrencyDropdown]);

  useEffect(() => {
    if (isOpen) {
      const initialBudgets: Budget[] = tripCurrencies.map((c) => ({ currency: c, amount: 0 }));
      setCountries([
        {
          name: "",
          startDate: "",
          endDate: "",
          budgets: initialBudgets,
          locations: [],
        },
      ]);
      setErrors({});
      setOpenCurrencyDropdown(null);
      setCurrencyFilterText("");
    }
  }, [isOpen, tripCurrencies]);

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

  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const addCountry = () => {
    const initialBudgets: Budget[] = tripCurrencies.map((c) => ({ currency: c, amount: 0 }));
    setCountries([
      ...countries,
      {
        name: "",
        startDate: "",
        endDate: "",
        budgets: initialBudgets,
        locations: [],
      },
    ]);
  };

  const removeCountry = (index: number) => {
    if (countries.length > 1) {
      const newCountries = countries.filter((_, i) => i !== index);
      setCountries(newCountries);
      const newErrors = { ...errors };
      delete newErrors[index];
      // Przesuń błędy dla krajów po usuniętym
      const updatedErrors: Record<number, Record<string, string>> = {};
      Object.keys(newErrors).forEach((key) => {
        const keyNum = parseInt(key);
        if (keyNum < index) {
          updatedErrors[keyNum] = newErrors[keyNum];
        } else if (keyNum > index) {
          updatedErrors[keyNum - 1] = newErrors[keyNum];
        }
      });
      setErrors(updatedErrors);
    }
  };

  const updateCountry = (index: number, field: keyof CountryFormData, value: CountryFormData[keyof CountryFormData]) => {
    const newCountries = [...countries];
    newCountries[index] = { ...newCountries[index], [field]: value };
    setCountries(newCountries);
    
    // Walidacja daty zakończenia w czasie rzeczywistym
    if (field === "startDate" || field === "endDate") {
      const country = newCountries[index];
      if (country.startDate && country.endDate) {
        if (new Date(country.startDate) > new Date(country.endDate)) {
          const newErrors = { ...errors };
          if (!newErrors[index]) {
            newErrors[index] = {};
          }
          newErrors[index].endDate = "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia";
          setErrors(newErrors);
        } else {
          // Wyczyść błąd jeśli daty są poprawne
          const newErrors = { ...errors };
          if (newErrors[index]?.endDate) {
            const countryErrors = { ...newErrors[index] };
            delete countryErrors.endDate;
            if (Object.keys(countryErrors).length === 0) {
              delete newErrors[index];
            } else {
              newErrors[index] = countryErrors;
            }
            setErrors(newErrors);
          }
        }
      }
    }
    
    // Wyczyść błędy dla tego pola (jeśli nie jest to błąd daty)
    if (errors[index] && field !== "startDate" && field !== "endDate") {
      const newErrors = { ...errors };
      const countryErrors = { ...newErrors[index] };
      delete countryErrors[field as string];
      newErrors[index] = countryErrors;
      setErrors(newErrors);
    }
  };

  const updateBudget = (countryIndex: number, budgetIndex: number, field: "currency" | "amount", value: string | number) => {
    const newCountries = [...countries];
    const budgets = [...newCountries[countryIndex].budgets];
    budgets[budgetIndex] = { ...budgets[budgetIndex], [field]: value };
    newCountries[countryIndex] = { ...newCountries[countryIndex], budgets };
    setCountries(newCountries);
  };

  const addBudget = (countryIndex: number) => {
    const newCountries = [...countries];
    const firstCurrency = tripCurrencies[0] ?? baseCurrency;
    newCountries[countryIndex].budgets.push({ currency: firstCurrency, amount: 0 });
    setCountries(newCountries);
  };

  const removeBudget = (countryIndex: number, budgetIndex: number) => {
    const newCountries = [...countries];
    if (newCountries[countryIndex].budgets.length > 1) {
      newCountries[countryIndex].budgets = newCountries[countryIndex].budgets.filter(
        (_, i) => i !== budgetIndex
      );
      setCountries(newCountries);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<number, Record<string, string>> = {};

    countries.forEach((country, index) => {
      const countryErrors: Record<string, string> = {};

      if (!country.name.trim()) {
        countryErrors.name = "Nazwa kraju jest wymagana";
      }

      if (country.startDate && country.endDate) {
        if (new Date(country.startDate) > new Date(country.endDate)) {
          countryErrors.endDate = "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia";
        }
      }

      const validBudgets = country.budgets.filter((b) => b.amount > 0);
      if (validBudgets.length === 0) {
        countryErrors.budgets = "Dodaj co najmniej jeden budżet z kwotą większą od zera";
      }

      // Walidacja budżetu: sprawdź czy suma budżetów wszystkich krajów nie przekracza całkowitego budżetu
      if (totalBudget !== undefined && validBudgets.length > 0) {
        const currentCountryBudget = calculateCountryBudgetInBase(validBudgets, baseCurrency);
        
        // Oblicz sumę budżetów wszystkich innych krajów
        const otherCountriesBudget = countries.reduce((sum, c, idx) => {
          if (idx !== index) {
            const otherValidBudgets = c.budgets.filter((b) => b.amount > 0);
            return sum + calculateCountryBudgetInBase(otherValidBudgets, baseCurrency);
          }
          return sum;
        }, 0);

        const totalPlannedBudget = otherCountriesBudget + currentCountryBudget;
        
        if (totalPlannedBudget > totalBudget) {
          const availableBudget = Math.max(0, totalBudget - otherCountriesBudget);
          countryErrors.budgets = `Suma budżetów wszystkich krajów (${Math.round(totalPlannedBudget).toLocaleString("pl-PL")} ${baseCurrency}) przekracza budżet całkowity (${Math.round(totalBudget ?? 0).toLocaleString("pl-PL")} ${baseCurrency}). Dla tego kraju możesz zaplanować maksymalnie ${Math.round(availableBudget).toLocaleString("pl-PL")} ${baseCurrency}.`;
        }
      }

      if (Object.keys(countryErrors).length > 0) {
        newErrors[index] = countryErrors;
      }
    });

    setErrors(newErrors);

    const isValid = Object.keys(newErrors).length === 0;
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validate();
    if (!isValid) {
      return;
    }

    // Filtruj tylko wypełnione kraje (z nazwą i budżetem)
    const countriesToSave = countries
      .filter((country) => {
        const hasName = country.name.trim();
        const hasBudget = country.budgets.some(b => b.amount > 0);
        return hasName && hasBudget;
      })
      .map((country) => {
        const validBudgets = country.budgets.filter((b) => b.amount > 0);
        const calculatedDays = country.startDate && country.endDate 
          ? calculateDays(country.startDate, country.endDate) 
          : 0;

        // Automatycznie dodaj lokalizację jeśli są wypełnione dane
        const finalLocations = [...(country.locations || [])];
        // Tutaj można dodać logikę automatycznego dodawania lokalizacji jeśli są wypełnione dane

        return {
          name: country.name.trim(),
          location: "",
          days: calculatedDays,
          startDate: country.startDate || undefined,
          endDate: country.endDate || undefined,
          status: "upcoming" as const,
          budgets: validBudgets,
          locations: finalLocations,
        };
      });

    onSave(countriesToSave);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Główny modal */}
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-multiple-countries-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
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
            id="add-multiple-countries-modal-title"
            className="text-xl font-bold text-gray-900 dark:text-gray-100"
          >
            Dodaj kraje
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {countries.map((country, countryIndex) => (
            <div
              key={countryIndex}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Kraj {countryIndex + 1}
                </h3>
                {countries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCountry(countryIndex)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    aria-label="Usuń kraj"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Nazwa kraju */}
              <div>
                <label
                  htmlFor={`country-name-${countryIndex}`}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Nazwa kraju *
                </label>
                <input
                  type="text"
                  id={`country-name-${countryIndex}`}
                  value={country.name}
                  onChange={(e) => updateCountry(countryIndex, "name", e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors[countryIndex]?.name && (
                  <p className="text-red-500 text-xs mt-1">{errors[countryIndex].name}</p>
                )}
              </div>

              {/* Daty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <DatePicker
                    id={`country-start-${countryIndex}`}
                    label="Data rozpoczęcia"
                    value={country.startDate}
                    onChange={(date) => {
                      updateCountry(countryIndex, "startDate", date);
                      // Jeśli data zakończenia jest wcześniejsza niż nowa data rozpoczęcia, wyczyść ją
                      if (country.endDate && date && new Date(date) > new Date(country.endDate)) {
                        updateCountry(countryIndex, "endDate", "");
                      }
                    }}
                    min={tripStartDate}
                    max={tripEndDate}
                    disabledDates={(() => {
                      // Zbierz wszystkie daty z innych krajów
                      const occupiedDates: string[] = [];
                      countries.forEach((c, idx) => {
                        if (idx !== countryIndex && c.startDate && c.endDate) {
                          const start = new Date(c.startDate);
                          const end = new Date(c.endDate);
                          const current = new Date(start);
                          while (current <= end) {
                            const year = current.getFullYear();
                            const month = String(current.getMonth() + 1).padStart(2, "0");
                            const day = String(current.getDate()).padStart(2, "0");
                            occupiedDates.push(`${year}-${month}-${day}`);
                            current.setDate(current.getDate() + 1);
                          }
                        }
                      });
                      return occupiedDates;
                    })()}
                    error={errors[countryIndex]?.startDate}
                  />
                </div>
                <div>
                  <DatePicker
                    id={`country-end-${countryIndex}`}
                    label="Data zakończenia"
                    value={country.endDate}
                    onChange={(date) => updateCountry(countryIndex, "endDate", date)}
                    min={tripStartDate || country.startDate}
                    max={tripEndDate}
                    disabledDates={(() => {
                      // Zbierz wszystkie daty z innych krajów
                      const occupiedDates: string[] = [];
                      countries.forEach((c, idx) => {
                        if (idx !== countryIndex && c.startDate && c.endDate) {
                          const start = new Date(c.startDate);
                          const end = new Date(c.endDate);
                          const current = new Date(start);
                          while (current <= end) {
                            const year = current.getFullYear();
                            const month = String(current.getMonth() + 1).padStart(2, "0");
                            const day = String(current.getDate()).padStart(2, "0");
                            occupiedDates.push(`${year}-${month}-${day}`);
                            current.setDate(current.getDate() + 1);
                          }
                        }
                      });
                      return occupiedDates;
                    })()}
                    error={errors[countryIndex]?.endDate}
                  />
                </div>
              </div>

              {/* Budżety */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Planowany budżet *
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addBudget(countryIndex)}
                    className="text-sm"
                  >
                    + Dodaj budżet
                  </Button>
                </div>
                {(totalBudget !== undefined || (tripData?.initialBudgets?.length ?? 0) > 0) && (() => {
                  const initialBudgets = tripData?.initialBudgets?.filter((b) => b.amount > 0) ?? [];
                  // Zaplanowane w innych krajach per waluta (suma budżetów w danej walucie)
                  const plannedByCurrency = tripCurrencies.reduce<Record<string, number>>((acc, curr) => {
                    acc[curr] = countries.reduce((sum, c, idx) => {
                      if (idx === countryIndex) return sum;
                      return sum + (c.budgets.filter((b) => b.currency === curr && b.amount > 0).reduce((s, b) => s + b.amount, 0) ?? 0);
                    }, 0);
                    return acc;
                  }, {});
                  // Dostępne per waluta: budżet podróży w walucie minus zaplanowane w innych
                  const availableByCurrency = initialBudgets.map((ib) => ({
                    currency: ib.currency,
                    amount: Math.max(0, ib.amount - (plannedByCurrency[ib.currency] ?? 0)),
                  })).filter((a) => a.amount > 0);
                  const totalBudgetLabel =
                    initialBudgets.length > 0
                      ? initialBudgets
                          .map((b) => `${b.amount.toLocaleString("pl-PL")} ${b.currency}`)
                          .join(" + ")
                      : `${Math.round(totalBudget ?? 0).toLocaleString("pl-PL")} ${baseCurrency}`;
                  const plannedLabel = Object.entries(plannedByCurrency)
                    .filter(([, v]) => v > 0)
                    .map(([c, v]) => `${Math.round(v).toLocaleString("pl-PL")} ${c}`)
                    .join(" + ");
                  const availableLabel = availableByCurrency
                    .map((a) => `${Math.round(a.amount).toLocaleString("pl-PL")} ${a.currency}`)
                    .join(" + ");
                  const showExtra = plannedLabel || availableLabel;
                  return (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Budżet całkowity: <span className="font-semibold">{totalBudgetLabel}</span>
                      {totalBudget !== undefined && showExtra && (
                        <>
                          {plannedLabel && (
                            <>
                              {" • "}
                              Zaplanowane w innych krajach: <span className="font-semibold">{plannedLabel}</span>
                            </>
                          )}
                          {availableLabel && (
                            <>
                              {" • "}
                              Dostępne: <span className="font-semibold text-green-600 dark:text-green-400">{availableLabel}</span>
                            </>
                          )}
                        </>
                      )}
                    </p>
                  );
                })()}
                {country.budgets.map((budget, budgetIndex) => (
                  <div key={budgetIndex} className="flex gap-2 mb-2">
                    <div className="flex-1 relative">
                      <input
                        ref={openCurrencyDropdown?.countryIndex === countryIndex && openCurrencyDropdown?.budgetIndex === budgetIndex ? currencyTriggerRef : undefined}
                        type="text"
                        readOnly={!(openCurrencyDropdown?.countryIndex === countryIndex && openCurrencyDropdown?.budgetIndex === budgetIndex)}
                        value={openCurrencyDropdown?.countryIndex === countryIndex && openCurrencyDropdown?.budgetIndex === budgetIndex ? currencyFilterText : `${budget.currency} - ${getCurrencyName(budget.currency)}`}
                        onChange={(e) => setCurrencyFilterText(e.target.value)}
                        onFocus={() => {
                          setOpenCurrencyDropdown({ countryIndex, budgetIndex });
                          setCurrencyFilterText("");
                        }}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Wybierz walutę"
                      />
                      <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <input
                      type="number"
                      value={budget.amount || ""}
                      onChange={(e) => updateBudget(countryIndex, budgetIndex, "amount", parseFloat(e.target.value) || 0)}
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
                    {country.budgets.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeBudget(countryIndex, budgetIndex)}
                        className="px-3"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                {errors[countryIndex]?.budgets && (
                  <p className="text-red-500 text-xs mt-1">{errors[countryIndex].budgets}</p>
                )}
              </div>
            </div>
          ))}

          {/* Przycisk dodaj kolejny kraj */}
          <Button
            type="button"
            variant="outline"
            onClick={addCountry}
            className="w-full flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Dodaj kolejny kraj
          </Button>

          {/* Przyciski akcji */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" variant="primary">
              Dodaj wszystkie kraje ({countries.length})
            </Button>
          </div>
        </form>
      </div>
    </div>
    {openCurrencyDropdown !== null &&
      dropdownPosition &&
      typeof document !== "undefined" &&
      createPortal(
        <div
          data-currency-dropdown
          className="fixed z-[60] py-1 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 max-h-48 overflow-y-auto"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
        >
          {filteredCurrencies.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Brak walut</div>
          ) : (
            filteredCurrencies.map((code) => (
              <button
                key={code}
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={() => {
                  updateBudget(openCurrencyDropdown.countryIndex, openCurrencyDropdown.budgetIndex, "currency", code);
                  setOpenCurrencyDropdown(null);
                }}
              >
                <span className="font-medium">{code}</span>
                <span className="text-gray-500 dark:text-gray-400">{getCurrencyName(code)}</span>
              </button>
            ))
          )}
        </div>,
        document.body
      )}
    </>
  );
}

