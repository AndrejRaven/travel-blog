"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import type { Country, Expense, TravelWalletData } from "@/lib/travel-wallet/types";

interface AddExpenseFromDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: {
    id?: string;
    countryId: string;
    description: string;
    category: string;
    amount: number;
    currency: string;
    date: string;
    note?: string;
    location?: string;
    tripId?: string;
  }) => void;
  data: TravelWalletData;
  tripId: string;
  onAddLocation?: (countryId: string, date: string) => void;
  onAddCountry?: () => void;
}

const EXPENSE_CATEGORIES = ["Jedzenie", "Noclegi", "Transport", "Aktywności"];

export default function AddExpenseFromDashboardModal({
  isOpen,
  onClose,
  onSave,
  data,
  tripId,
  onAddLocation,
  onAddCountry,
}: AddExpenseFromDashboardModalProps) {
  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Jedzenie");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("PLN");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [location, setLocation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pobierz wybrany kraj
  const selectedCountry = useMemo(() => {
    return data.countries.find((c) => c.id === selectedCountryId);
  }, [selectedCountryId, data.countries]);

  // Reset formularza gdy modal się otwiera/zamyka
  useEffect(() => {
    if (isOpen) {
      setSelectedCountryId("");
      setDescription("");
      setCategory("Jedzenie");
      setAmount("");
      setCurrency("PLN");
      setDate("");
      setNote("");
      setLocation("");
      setErrors({});
    }
  }, [isOpen]);

  // Resetuj walutę gdy zmienia się wybrany kraj
  useEffect(() => {
    if (selectedCountry && selectedCountry.budgets.length > 0) {
      setCurrency(selectedCountry.budgets[0].currency);
    }
  }, [selectedCountry]);

  // Znajdź lokalizację dla wybranej daty
  const findLocationForDate = useMemo(() => {
    return (dateString: string, country: Country | undefined): string => {
      if (!dateString || !country || !country.locations) return "";
      
      const date = new Date(dateString);
      const locations = country.locations.filter((loc) => typeof loc !== "string") as Array<{ name: string; startDate: string; endDate: string }>;
      
      for (const loc of locations) {
        const start = new Date(loc.startDate);
        const end = new Date(loc.endDate);
        if (date >= start && date <= end) {
          return loc.name;
        }
      }
      
      return "";
    };
  }, []);

  // Automatycznie ustaw lokalizację na podstawie daty
  useEffect(() => {
    if (date && selectedCountry) {
      const autoLocation = findLocationForDate(date, selectedCountry);
      if (autoLocation) {
        setLocation(autoLocation);
      } else {
        setLocation("");
      }
    } else {
      setLocation("");
    }
  }, [date, selectedCountry, findLocationForDate]);

  // Ustaw lokalizację gdy country.locations się zmienia
  useEffect(() => {
    if (isOpen && date && selectedCountry && selectedCountry.locations) {
      const autoLocation = findLocationForDate(date, selectedCountry);
      if (autoLocation) {
        setLocation(autoLocation);
      }
    }
  }, [isOpen, date, selectedCountry, findLocationForDate]);

  // Pobierz zakres dat dla wybranej lokalizacji
  const selectedLocationDateRange = useMemo(() => {
    if (!location || !selectedCountry || !selectedCountry.locations) return null;
    
    const locations = selectedCountry.locations.filter((loc) => typeof loc !== "string") as Array<{ name: string; startDate: string; endDate: string }>;
    const selectedLoc = locations.find((loc) => loc.name === location);
    
    if (selectedLoc) {
      return {
        min: selectedLoc.startDate,
        max: selectedLoc.endDate,
      };
    }
    
    return null;
  }, [location, selectedCountry]);

  // Sprawdź czy można dodać lokalizację
  const canAddLocation = useMemo(() => {
    if (!date || !selectedCountry) return false;
    const locationForDate = findLocationForDate(date, selectedCountry);
    return !locationForDate;
  }, [date, selectedCountry, findLocationForDate]);

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

    if (!selectedCountryId) {
      newErrors.country = "Kraj jest wymagany";
    }

    if (!description.trim()) {
      newErrors.description = "Tytuł jest wymagany";
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = "Kwota musi być większa od 0";
    }

    if (!date) {
      newErrors.date = "Data jest wymagana";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !selectedCountry) {
      return;
    }

    onSave({
      countryId: selectedCountry.id,
      description: description.trim(),
      category,
      amount: parseFloat(amount),
      currency,
      date,
      note: note.trim() || undefined,
      location: location.trim() || undefined,
      tripId: tripId,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100">
            Dodaj wydatek
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Formularz */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Wybór kraju */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="country"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Kraj *
              </label>
              {onAddCountry && (
                <button
                  type="button"
                  onClick={() => {
                    onAddCountry();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Plus className="w-3 h-3" />
                  Dodaj kraj
                </button>
              )}
            </div>
            <select
              id="country"
              value={selectedCountryId}
              onChange={(e) => setSelectedCountryId(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                errors.country ? "border-red-500 dark:border-red-400" : ""
              }`}
            >
              <option value="">Wybierz kraj</option>
              {data.countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
            {errors.country && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.country}
              </p>
            )}
          </div>

          {/* Tytuł (description) */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Tytuł *
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                errors.description
                  ? "border-red-500 dark:border-red-400"
                  : ""
              }`}
              placeholder="np. Obiad w restauracji"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.description}
              </p>
            )}
          </div>

          {/* Kategoria */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Kategoria *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Kwota i Waluta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Kwota *
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                  errors.amount ? "border-red-500 dark:border-red-400" : ""
                }`}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.amount}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="currency"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Waluta *
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                disabled={!selectedCountry || selectedCountry.budgets.length === 0}
              >
                {selectedCountry && selectedCountry.budgets.length > 0 ? (
                  selectedCountry.budgets.map((budget) => (
                    <option key={budget.currency} value={budget.currency}>
                      {budget.currency.toUpperCase()}
                    </option>
                  ))
                ) : (
                  <option value="PLN">PLN</option>
                )}
              </select>
            </div>
          </div>

          {/* Lokalizacja */}
          {selectedCountry && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lokalizacja
              </label>
              {location ? (
                <div className="px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                  {location}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex-1">
                    Brak lokalizacji dla wybranej daty
                  </p>
                  {date && onAddLocation && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedCountry) {
                          onAddLocation(selectedCountry.id, date);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-700 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Plus className="w-4 h-4" />
                      Dodaj lokalizację
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Data */}
          <div>
            <DatePicker
              id="date"
              label="Data"
              value={date}
              onChange={(newDate) => setDate(newDate)}
              min={selectedLocationDateRange?.min || selectedCountry?.startDate || undefined}
              max={selectedLocationDateRange?.max || selectedCountry?.endDate || undefined}
              required
              error={errors.date}
              disabled={!selectedCountry}
            />
          </div>

          {/* Notatka */}
          <div>
            <label
              htmlFor="note"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Notatka (opcjonalna)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Dodatkowe informacje..."
            />
          </div>

          {/* Przyciski */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Zapisz
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

