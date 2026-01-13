"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
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
  totalBudget?: number;
}

const AVAILABLE_CURRENCIES = ["PLN", "USD", "EUR", "GBP", "THB", "JPY", "KRW", "TWD"];

export default function AddMultipleCountriesModal({
  isOpen,
  onClose,
  onSave,
  onSwitchToSingleCountry,
  tripStartDate,
  tripEndDate,
  tripData,
  totalBudget,
}: AddMultipleCountriesModalProps) {
  const [countries, setCountries] = useState<CountryFormData[]>([
    {
      name: "",
      startDate: "",
      endDate: "",
      budgets: [{ currency: "PLN", amount: 0 }],
      locations: [],
    },
  ]);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});
  const [showSingleCountryWarning, setShowSingleCountryWarning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCountries([
        {
          name: "",
          startDate: "",
          endDate: "",
          budgets: [{ currency: "PLN", amount: 0 }],
          locations: [],
        },
      ]);
      setErrors({});
    }
  }, [isOpen]);

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
    setCountries([
      ...countries,
      {
        name: "",
        startDate: "",
        endDate: "",
        budgets: [{ currency: "PLN", amount: 0 }],
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

  const updateCountry = (index: number, field: keyof CountryFormData, value: any) => {
    const newCountries = [...countries];
    newCountries[index] = { ...newCountries[index], [field]: value };
    setCountries(newCountries);
    
    // Wyczyść błędy dla tego pola
    if (errors[index]) {
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
    newCountries[countryIndex].budgets.push({ currency: "PLN", amount: 0 });
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

      if (Object.keys(countryErrors).length > 0) {
        newErrors[index] = countryErrors;
      }
    });

    // Sprawdź czy jest minimum 2 wypełnione kraje (bez błędów)
    const validCountries = countries.filter((c, index) => {
      const hasName = c.name.trim();
      const hasBudget = c.budgets.some(b => b.amount > 0);
      const hasNoErrors = !newErrors[index];
      return hasName && hasBudget && hasNoErrors;
    });

    if (validCountries.length < 2) {
      // Pokaż modal z ostrzeżeniem tylko jeśli jest przynajmniej jeden wypełniony kraj
      const filledCountries = countries.filter(c => c.name.trim() && c.budgets.some(b => b.amount > 0));
      if (filledCountries.length > 0) {
        setShowSingleCountryWarning(true);
        return false;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    const countriesToSave = countries.map((country) => {
      const validBudgets = country.budgets.filter((b) => b.amount > 0);
      const calculatedDays = country.startDate && country.endDate 
        ? calculateDays(country.startDate, country.endDate) 
        : 0;

      // Automatycznie dodaj lokalizację jeśli są wypełnione dane
      let finalLocations = [...(country.locations || [])];
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

  const handleSwitchToSingleCountry = () => {
    setShowSingleCountryWarning(false);
    if (onSwitchToSingleCountry && countries.length > 0) {
      // Przekaż pierwszy kraj do callbacka
      const firstCountry = countries[0];
      const validBudgets = firstCountry.budgets.filter((b) => b.amount > 0);
      const calculatedDays = firstCountry.startDate && firstCountry.endDate 
        ? calculateDays(firstCountry.startDate, firstCountry.endDate) 
        : 0;

      const countryData = {
        name: firstCountry.name.trim(),
        location: "",
        days: calculatedDays,
        startDate: firstCountry.startDate || undefined,
        endDate: firstCountry.endDate || undefined,
        status: "upcoming" as const,
        budgets: validBudgets,
        locations: firstCountry.locations || [],
      };

      onSwitchToSingleCountry(countryData);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal z ostrzeżeniem o pojedynczym kraju */}
      {showSingleCountryWarning && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSingleCountryWarning(false);
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-lg shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Za mało krajów dla trybu "Wiele krajów"
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              W trybie "Wiele krajów" musisz dodać co najmniej 2 kraje. Obecnie masz tylko {countries.filter(c => c.name.trim()).length} {countries.filter(c => c.name.trim()).length === 1 ? 'kraj' : 'kraje'}.
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Czy chcesz zmienić tryb podróży na "Jeden kraj" i zapisać ten kraj?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSingleCountryWarning(false)}
              >
                Anuluj
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSwitchToSingleCountry}
              >
                Zmień na tryb "Jeden kraj"
              </Button>
            </div>
          </div>
        </div>
      )}

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

        <h2
          id="add-multiple-countries-modal-title"
          className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6"
        >
          Dodaj kraje
        </h2>

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
                    onChange={(date) => updateCountry(countryIndex, "startDate", date)}
                    min={tripStartDate}
                    max={tripEndDate}
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
                {country.budgets.map((budget, budgetIndex) => (
                  <div key={budgetIndex} className="flex gap-2 mb-2">
                    <select
                      value={budget.currency}
                      onChange={(e) => updateBudget(countryIndex, budgetIndex, "currency", e.target.value)}
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {AVAILABLE_CURRENCIES.map((curr) => (
                        <option key={curr} value={curr}>
                          {curr}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={budget.amount || ""}
                      onChange={(e) => updateBudget(countryIndex, budgetIndex, "amount", parseFloat(e.target.value) || 0)}
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
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
    </>
  );
}

