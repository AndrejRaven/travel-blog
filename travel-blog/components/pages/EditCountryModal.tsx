"use client";

import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import type { Country, Budget, TravelWalletData } from "@/lib/travel-wallet/types";
import {
  calculateTotalSpent,
  calculateTotalPlannedSpending,
} from "@/lib/travel-wallet/calculations";
import { getCurrencyName } from "@/lib/travel-wallet/currency-names";

interface EditCountryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (countryId: string, updates: Partial<Country>) => void;
  country: Country | null;
  tripStartDate?: string;
  tripEndDate?: string;
  tripData?: TravelWalletData;
  totalBudget?: number;
}

const AVAILABLE_CURRENCIES = ["PLN", "USD", "EUR", "GBP", "NOK", "THB", "JPY", "KRW", "TWD"];

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

export default function EditCountryModal({
  isOpen,
  onClose,
  onSave,
  country,
  tripStartDate,
  tripEndDate,
  tripData,
  totalBudget,
}: EditCountryModalProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budgets, setBudgets] = useState<Budget[]>([{ currency: "PLN", amount: 0 }]);
  const [budgetInputValues, setBudgetInputValues] = useState<string[]>([""]);
  const [displayCurrency, setDisplayCurrency] = useState<string>(""); // "" = użyj waluty podróży
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Wypełnij formularz danymi z kraju
  useEffect(() => {
    if (isOpen && country) {
      setName(country.name || "");
      setStartDate(country.startDate || "");
      setEndDate(country.endDate || "");
      setBudgets(country.budgets && country.budgets.length > 0 ? country.budgets : [{ currency: "PLN", amount: 0 }]);
      setBudgetInputValues(
        country.budgets && country.budgets.length > 0
          ? country.budgets.map((b) => (b.amount === 0 ? "" : b.amount.toString()))
          : [""]
      );
      setDisplayCurrency(country.displayCurrency ?? "");
      setErrors({});
    }
  }, [isOpen, country]);

  // Oblicz maksymalną możliwą kwotę do zaplanowania
  const maxAvailableBudget = useMemo(() => {
    if (totalBudget === undefined || !tripData || !country) return undefined;
    
    const totalSpent = calculateTotalSpent(tripData);
    const totalPlanned = calculateTotalPlannedSpending(tripData);
    const currentCountryBudget = calculateCountryBudgetInPLN(country.budgets || []);
    const remainingBudget = totalBudget - totalSpent;
    
    // Maksymalna możliwa kwota = pozostały budżet - już zaplanowane wydatki + obecny budżet kraju
    return Math.max(0, remainingBudget - totalPlanned + currentCountryBudget);
  }, [totalBudget, tripData, country]);

  // Funkcja obliczająca liczbę dni na podstawie dat
  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 bo włączamy obie daty
  };

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

    // Walidacja budżetu: sprawdź czy zmiana budżetu kraju nie przekroczy całkowitego budżetu
    if (totalBudget !== undefined && tripData && validBudgets.length > 0 && country) {
      const newCountryBudget = calculateCountryBudgetInPLN(validBudgets);
      const currentCountryBudget = calculateCountryBudgetInPLN(country.budgets || []);
      const totalSpent = calculateTotalSpent(tripData);
      const totalPlanned = calculateTotalPlannedSpending(tripData);
      const remainingBudget = totalBudget - totalSpent;
      
      // Oblicz różnicę w budżecie kraju
      const budgetDifference = newCountryBudget - currentCountryBudget;
      
      // Sprawdź czy nowy budżet kraju + już zaplanowane wydatki nie przekroczy pozostałego budżetu
      if (totalPlanned + budgetDifference > remainingBudget) {
        const canPlanMore = Math.max(0, remainingBudget - totalPlanned);
        newErrors.budgets = `Budżet kraju (${Math.round(newCountryBudget)} zł) wraz z już zaplanowanymi wydatkami (${Math.round(totalPlanned)} zł) przekracza pozostały budżet (${Math.round(remainingBudget)} zł). Możesz jeszcze zaplanować maksymalnie ${Math.round(canPlanMore + currentCountryBudget)} zł. Aby zapisać zmiany, zwiększ całkowity budżet podróży lub zmniejsz budżet tego kraju.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!country) return;
    
    if (validate()) {
      const validBudgets = budgets.filter((b) => b.amount > 0);
      const calculatedDays = startDate && endDate ? calculateDays(startDate, endDate) : country.days;
      
      const updates: Partial<Country> = {
        name: name.trim(),
        days: calculatedDays,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        budgets: validBudgets,
      };
      if (tripData?.countries && tripData.countries.length > 1) {
        updates.displayCurrency = displayCurrency || undefined;
      } else {
        updates.displayCurrency = undefined;
      }
      onSave(country.id, updates);
    }
  };

  const handleAddBudget = () => {
    setBudgets([...budgets, { currency: "PLN", amount: 0 }]);
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

  if (!isOpen || !country) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100">
            Edytuj kraj
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nazwa kraju */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nazwa kraju *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="np. Tajlandia"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Daty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data rozpoczęcia
              </label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                min={tripStartDate}
                max={endDate || tripEndDate}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data zakończenia
              </label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                min={startDate || tripStartDate}
                max={tripEndDate}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Budżety */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Budżety *
              </label>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddBudget}
                className="text-sm"
              >
                Dodaj budżet
              </Button>
            </div>
            <div className="space-y-3">
              {budgets.map((budget, index) => (
                <div key={index} className="flex items-center gap-3">
                  <select
                    value={budget.currency}
                    onChange={(e) => handleBudgetChange(index, "currency", e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {AVAILABLE_CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={budgetInputValues[index]}
                    onChange={(e) => {
                      const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                      handleBudgetChange(index, "amount", value);
                    }}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    onKeyDown={(e) => {
                      if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "PageUp" || e.key === "PageDown") {
                        e.preventDefault();
                      }
                    }}
                    onWheel={(e) => {
                      e.currentTarget.blur();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  {budgets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBudget(index)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.budgets && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.budgets}</p>
            )}
            {maxAvailableBudget !== undefined && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Maksymalnie możesz zaplanować: {Math.round(maxAvailableBudget)} zł
              </p>
            )}
          </div>

          {/* Waluta wyświetlania – tylko przy podróży wielokrajowej */}
          {tripData?.countries && tripData.countries.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Waluta wyświetlania w tym kraju
              </label>
              <select
                value={displayCurrency}
                onChange={(e) => setDisplayCurrency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">
                  Tak jak podróż ({tripData?.wallet?.baseCurrency ?? "PLN"} – {getCurrencyName(tripData?.wallet?.baseCurrency ?? "PLN")})
                </option>
                {AVAILABLE_CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code} – {getCurrencyName(code)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Kwoty na stronie tego kraju będą pokazywane w wybranej walucie (przeliczenie z waluty głównej podróży).
              </p>
            </div>
          )}

          {/* Przyciski */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" variant="primary">
              Zapisz zmiany
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
