"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import type { Country, Expense } from "@/lib/travel-wallet/types";

interface AddExpenseModalProps {
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
  country: Country;
  initialDate?: string; // YYYY-MM-DD
  tripId?: string;
  expense?: Expense; // Wydatek do edycji (opcjonalny)
  onAddLocation?: (date: string) => void; // Callback do otwierania modala dodawania lokalizacji z datą
}

const EXPENSE_CATEGORIES = ["Jedzenie", "Noclegi", "Transport", "Aktywności"];

export default function AddExpenseModal({
  isOpen,
  onClose,
  onSave,
  country,
  initialDate,
  tripId,
  expense,
  onAddLocation,
}: AddExpenseModalProps) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Jedzenie");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(
    country.budgets[0]?.currency || "PLN"
  );
  const [date, setDate] = useState(initialDate || "");
  const [note, setNote] = useState("");
  const [location, setLocation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset formularza gdy modal się otwiera/zamyka lub gdy expense się zmienia
  useEffect(() => {
    if (isOpen) {
      if (expense) {
        // Tryb edycji - wypełnij formularz danymi z expense
        setDescription(expense.description || "");
        setCategory(expense.category);
        setAmount(expense.amount.toString());
        setCurrency(expense.currency);
        setDate(expense.date);
        setNote(expense.note || "");
        setLocation(expense.location || "");
      } else {
        // Tryb dodawania - reset formularza
        setDescription("");
        setCategory("Jedzenie");
        setAmount("");
        setCurrency(country.budgets[0]?.currency || "PLN");
        setDate(initialDate || "");
        setNote("");
        setLocation("");
      }
      setErrors({});
    }
  }, [isOpen, initialDate, country.budgets, expense]);

  // Ustaw datę z initialDate gdy się zmienia
  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate]);

  // Znajdź lokalizację dla wybranej daty
  const findLocationForDate = useMemo(() => {
    return (dateString: string): string => {
      if (!dateString || !country.locations) return "";
      
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
  }, [country.locations]);

  // Automatycznie ustaw lokalizację na podstawie daty (również przy inicjalizacji)
  useEffect(() => {
    if (date && !expense) {
      const autoLocation = findLocationForDate(date);
      if (autoLocation) {
        // Ustaw lokalizację tylko jeśli nie jest już ustawiona lub jeśli obecna nie pasuje do daty
        if (!location || location !== autoLocation) {
          setLocation(autoLocation);
        }
      } else if (location) {
        // Jeśli data nie pasuje do wybranej lokalizacji, wyczyść lokalizację
        const selectedLoc = country.locations?.find((loc) => {
          const locName = typeof loc === "string" ? loc : loc.name;
          return locName === location;
        });
        if (selectedLoc && typeof selectedLoc !== "string") {
          const start = new Date(selectedLoc.startDate);
          const end = new Date(selectedLoc.endDate);
          const selectedDate = new Date(date);
          if (selectedDate < start || selectedDate > end) {
            setLocation("");
          }
        }
      }
    }
  }, [date, expense, location, country.locations, findLocationForDate]);

  // Ustaw lokalizację przy inicjalizacji modala z datą
  useEffect(() => {
    if (isOpen && date && !expense) {
      const autoLocation = findLocationForDate(date);
      if (autoLocation && !location) {
        setLocation(autoLocation);
      }
    }
  }, [isOpen, date, expense, findLocationForDate, location]);

  // Ustaw lokalizację gdy country.locations się zmienia (np. po dodaniu nowej lokalizacji)
  useEffect(() => {
    if (isOpen && date && !expense && country.locations) {
      const autoLocation = findLocationForDate(date);
      if (autoLocation) {
        setLocation(autoLocation);
      }
    }
  }, [isOpen, date, expense, country.locations, findLocationForDate]);

  // Pobierz zakres dat dla wybranej lokalizacji
  const selectedLocationDateRange = useMemo(() => {
    if (!location || !country.locations) return null;
    
    const locations = country.locations.filter((loc) => typeof loc !== "string") as Array<{ name: string; startDate: string; endDate: string }>;
    const selectedLoc = locations.find((loc) => loc.name === location);
    
    if (selectedLoc) {
      return {
        min: selectedLoc.startDate,
        max: selectedLoc.endDate,
      };
    }
    
    return null;
  }, [location, country.locations]);

  // Sprawdź czy można dodać lokalizację (brak lokalizacji lub data nie pasuje do żadnej)
  const canAddLocation = useMemo(() => {
    if (!date) return false;
    const locationForDate = findLocationForDate(date);
    return !locationForDate;
  }, [date, findLocationForDate]);

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

    if (!validate()) {
      return;
    }

    onSave({
      id: expense?.id,
      countryId: country.id,
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100">
            {expense ? "Edytuj wydatek" : "Dodaj wydatek"}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              >
                {country.budgets.map((budget) => (
                  <option key={budget.currency} value={budget.currency}>
                    {budget.currency.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lokalizacja */}
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
                      onAddLocation(date);
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

          {/* Data */}
          <div>
            <DatePicker
              id="date"
              label="Data"
              value={date}
              onChange={(newDate) => setDate(newDate)}
              min={selectedLocationDateRange?.min || country.startDate || undefined}
              max={selectedLocationDateRange?.max || country.endDate || undefined}
              required
              error={errors.date}
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

