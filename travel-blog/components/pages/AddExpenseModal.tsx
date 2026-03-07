"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import type { Country, Expense } from "@/lib/travel-wallet/types";
import { getCurrencyBalance, getBalancesWithBaseCurrency, getBalancesForCountry } from "@/lib/travel-wallet/wallet-operations";
import { getWallet } from "@/lib/travel-wallet/wallet-storage";
import { formatCurrency } from "@/lib/travel-wallet/formatters";
import { useToast } from "@/components/ui/Toast";
import { ACCOMMODATION_TYPES, ACCOMMODATION_TYPES_ALLOWING_ZERO } from "@/lib/travel-wallet/constants";

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
    endDate?: string;
    note?: string;
    location?: string;
    tripId?: string;
    accommodationType?: string;
    paymentMethod?: {
      type: "card" | "cash" | "bank-withdrawal";
      sourceCurrency?: string;
    };
  }) => void;
  country: Country;
  initialDate?: string; // YYYY-MM-DD
  tripId?: string;
  expense?: Expense; // Wydatek do edycji (opcjonalny)
  onAddLocation?: (date: string) => void; // Callback do otwierania modala dodawania lokalizacji z datą
}

const EXPENSE_CATEGORIES = [
  "Jedzenie",
  "Noclegi",
  "Transport",
  "Aktywności",
  "Alkohol i imprezy",
  "Kosmetyki i chemia",
  "Ubrania i obuwie",
  "Zdrowie i leki",
  "Pamiątki i prezenty",
  "Komunikacja (SIM, internet)",
  "Inne",
];

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
  const { addToast } = useToast();
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
  const [paymentType, setPaymentType] = useState<"card" | "cash" | "bank-withdrawal">("card");
  const [sourceCurrency, setSourceCurrency] = useState("PLN");
  const [accommodationType, setAccommodationType] = useState("");
  const [spreadEndDate, setSpreadEndDate] = useState<string>("");

  // Pobierz dostępne waluty z portfela
  const availableWalletCurrencies = useMemo(() => {
    if (!tripId) return [];
    
    try {
      const wallet = getWallet(tripId);
      if (!wallet) return [];
      
      // Użyj getBalancesWithBaseCurrency, aby uzyskać wszystkie salda
      const balances = getBalancesWithBaseCurrency(wallet, tripId);
      
      // Pobierz wszystkie waluty z saldem > 0.01
      const currencies = balances
        .filter((balance) => balance.amount > 0.01)
        .map((balance) => balance.currency);
      
      return currencies;
    } catch (error) {
      console.warn("[AddExpenseModal] Error getting wallet currencies:", error);
      return [];
    }
  }, [tripId]);

  // Pobierz dostępne waluty (z portfela + z budżetu kraju)
  const availableCurrencies = useMemo(() => {
    const currenciesSet = new Set<string>();
    
    // Zawsze dodaj waluty z portfela
    availableWalletCurrencies.forEach((curr) => currenciesSet.add(curr));
    
    // Dodaj waluty z budżetu kraju
    if (country.budgets) {
      country.budgets.forEach((budget) => {
        currenciesSet.add(budget.currency);
      });
    }
    
    // Jeśli brak walut, dodaj PLN jako domyślną
    if (currenciesSet.size === 0) {
      currenciesSet.add("PLN");
    }
    
    return Array.from(currenciesSet).sort((a, b) => {
      // PLN zawsze pierwsza
      if (a === "PLN") return -1;
      if (b === "PLN") return 1;
      return a.localeCompare(b);
    });
  }, [availableWalletCurrencies, country.budgets]);

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
        setPaymentType(expense.paymentMethod?.type || "card");
        setSourceCurrency(expense.paymentMethod?.sourceCurrency || "PLN");
        setAccommodationType(expense.category === "Noclegi" ? (expense.accommodationType || "") : "");
        if (expense.endDate && expense.endDate !== expense.date) {
          setSpreadEndDate(expense.endDate);
        } else {
          setSpreadEndDate("");
        }
      } else {
        // Tryb dodawania - reset formularza
        setDescription("");
        setCategory("Jedzenie");
        setAmount("");
        // Ustaw pierwszą dostępną walutę z portfela lub z budżetu kraju lub PLN jako domyślną
        const defaultCurrency = availableCurrencies.length > 0 ? availableCurrencies[0] : (country.budgets[0]?.currency || "PLN");
        setCurrency(defaultCurrency);
        setDate(initialDate || "");
        setNote("");
        setLocation("");
        setAccommodationType("");
        setPaymentType("card");
        setSourceCurrency("PLN");
        setSpreadEndDate("");
      }
      setErrors({});
    }
  }, [isOpen, initialDate, country.budgets, expense, availableCurrencies]);

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

  // Pobierz dostępne saldo dla wybranej waluty
  const availableBalance = useMemo(() => {
    if (!currency || !tripId || !country) return null;
    
    try {
      const wallet = getWallet(tripId);
      if (!wallet) return null;
      
      // Zawsze używaj sald dla tego kraju (modal jest używany na stronie kraju)
      const countryBalances = getBalancesForCountry(wallet, tripId, country.id);
      const balance = countryBalances.find(b => b.currency === currency);
      
      // Fallback do globalnego salda jeśli nie znaleziono dla kraju
      return balance ? balance.amount : getCurrencyBalance(wallet, currency);
    } catch (error) {
      console.warn("[AddExpenseModal] Error getting balance:", error);
      return null;
    }
  }, [currency, tripId, country]);

  // Pobierz wszystkie dostępne salda (wszystkie waluty z portfela)
  const allAvailableBalances = useMemo(() => {
    if (!tripId) {
      return [];
    }
    
    try {
      const wallet = getWallet(tripId);
      if (!wallet) {
        return [];
      }
      
      const balances = getBalancesWithBaseCurrency(wallet, tripId);
      
      const result = balances
        .filter((balance) => balance.amount >= 0) // Zmieniono: pokazuj wszystkie salda >= 0
        .map((balance) => ({
          currency: balance.currency,
          amount: balance.amount,
        }))
        .sort((a, b) => {
          // PLN zawsze pierwsza
          if (a.currency === "PLN") return -1;
          if (b.currency === "PLN") return 1;
          return a.currency.localeCompare(b.currency);
        });
      
      return result;
    } catch (error) {
      console.warn("[AddExpenseModal] Error getting all balances:", error);
      return [];
    }
  }, [tripId]);

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

    if (category === "Noclegi" && !accommodationType) {
      newErrors.accommodationType = "Wybierz typ noclegu";
    }

    // Walidacja kwoty
    const amountValue = parseFloat(amount);
    const allowZeroAmount =
      category === "Noclegi" &&
      ACCOMMODATION_TYPES_ALLOWING_ZERO.includes(accommodationType);
    if (!amount && amount !== "0") {
      newErrors.amount = "Kwota jest wymagana";
    } else if (isNaN(amountValue)) {
      newErrors.amount = "Podaj prawidłową kwotę";
    } else if (amountValue < 0) {
      newErrors.amount = "Kwota nie może być ujemna";
    } else if (amountValue === 0 && !allowZeroAmount) {
      newErrors.amount = "Kwota musi być większa od 0 (0 zł tylko dla Namiot/Kemping)";
    } else if (amountValue > 0 && amountValue < 0.01) {
      newErrors.amount = "Kwota musi być co najmniej 0.01";
    } else if (amountValue > 0) {
      // Sprawdź dostępne saldo - zawsze sprawdź jeśli mamy tripId
      if (tripId) {
        try {
          const wallet = getWallet(tripId);
          if (wallet) {
            // Użyj sald dla kraju (ten modal jest zawsze używany na stronie kraju)
            const countryBalances = getBalancesForCountry(wallet, tripId, country.id);
            const balance = countryBalances.find(b => b.currency === currency);
            const currentBalance = balance ? balance.amount : getCurrencyBalance(wallet, currency);
            if (amountValue > currentBalance) {
              const errorMessage = `Niewystarczające środki. Dostępne: ${formatCurrency(currentBalance, currency)}`;
              newErrors.amount = errorMessage;
              // Pokaż toast z informacją o błędzie
              addToast({
                type: "error",
                title: "Niewystarczające środki",
                message: errorMessage,
              });
            }
          }
        } catch (error) {
          console.warn("[AddExpenseModal] Error checking balance in validate:", error);
        }
      } else if (availableBalance !== null && amountValue > availableBalance) {
        // Fallback do cached balance jeśli nie ma tripId
        const errorMessage = `Niewystarczające środki. Dostępne: ${formatCurrency(availableBalance, currency)}`;
        newErrors.amount = errorMessage;
        // Pokaż toast z informacją o błędzie
        addToast({
          type: "error",
          title: "Niewystarczające środki",
          message: errorMessage,
        });
      }
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

    const amountValue = parseFloat(amount);
    const allowZeroAmount =
      category === "Noclegi" &&
      ACCOMMODATION_TYPES_ALLOWING_ZERO.includes(accommodationType);
    if (isNaN(amountValue) || amountValue < 0 || (amountValue === 0 && !allowZeroAmount)) {
      return;
    }

    const roundedTo2Decimals = Math.round(amountValue * 100) / 100;
    const normalizedAmount =
      amountValue === 0
        ? 0
        : Math.abs(roundedTo2Decimals - Math.round(roundedTo2Decimals)) < 0.001
          ? Math.round(roundedTo2Decimals)
          : roundedTo2Decimals;

    // Ostatnie sprawdzenie dostępnego salda przed zapisaniem (tylko gdy kwota > 0)
    if (tripId && normalizedAmount > 0) {
      try {
        const wallet = getWallet(tripId);
        if (wallet) {
          // Użyj sald dla kraju (ten modal jest zawsze używany na stronie kraju)
          const countryBalances = getBalancesForCountry(wallet, tripId, country.id);
          const balance = countryBalances.find(b => b.currency === currency);
          const currentBalance = balance ? balance.amount : getCurrencyBalance(wallet, currency);
          if (normalizedAmount > currentBalance) {
            setErrors({
              ...errors,
              amount: `Niewystarczające środki. Dostępne: ${formatCurrency(currentBalance, currency)}`,
            });
            return; // Blokuj zapisanie
          }
        }
      } catch (error) {
        console.warn("[AddExpenseModal] Error checking balance before save:", error);
      }
    }

    if (spreadEndDate && spreadEndDate < date) {
      setErrors((e) => ({ ...e, spreadEndDate: "Data do nie może być wcześniejsza niż data od" }));
      return;
    }
    const endDate =
      spreadEndDate && spreadEndDate > date ? spreadEndDate : undefined;

    onSave({
      id: expense?.id,
      countryId: country.id,
      description: description.trim(),
      category,
      amount: normalizedAmount,
      currency,
      date,
      endDate,
      note: note.trim() || undefined,
      location: location.trim() || undefined,
      tripId: tripId,
      accommodationType: category === "Noclegi" ? accommodationType || undefined : undefined,
      paymentMethod: {
        type: paymentType,
        sourceCurrency: paymentType !== "cash" ? sourceCurrency : undefined,
      },
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
              onChange={(e) => {
                const v = e.target.value;
                setCategory(v);
                if (v !== "Noclegi") setAccommodationType("");
              }}
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {category === "Noclegi" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Typ noclegu *
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ACCOMMODATION_TYPES).map(([code, label]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setAccommodationType(code)}
                    className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                      accommodationType === code
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300"
                        : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {errors.accommodationType && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.accommodationType}
                </p>
              )}
            </div>
          )}

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
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  setAmount(value);
                  // Resetuj błąd kwoty gdy użytkownik zaczyna wpisywać
                  if (errors.amount) {
                    setErrors({ ...errors, amount: "" });
                  }
                }}
                onKeyDown={(e) => {
                  // Blokuj strzałki góra/dół i PageUp/PageDown
                  if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "PageUp" || e.key === "PageDown") {
                    e.preventDefault();
                  }
                }}
                onWheel={(e) => {
                  // Blokuj scroll na polu number
                  e.currentTarget.blur();
                }}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
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
                onChange={(e) => {
                  setCurrency(e.target.value);
                  // Resetuj błąd kwoty gdy zmienia się waluta
                  if (errors.amount) {
                    setErrors({ ...errors, amount: "" });
                  }
                }}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                {availableCurrencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr.toUpperCase()}
                  </option>
                ))}
              </select>
              {availableBalance !== null ? (
                <p className="mt-1 text-xs text-gray-700 dark:text-gray-300 font-medium">
                  Dostępne: {formatCurrency(availableBalance, currency)}
                </p>
              ) : tripId ? (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Brak dostępnych środków
                </p>
              ) : null}
            </div>
          </div>

          {/* Metoda płatności */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Metoda płatności
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType("card")}
                  className={`flex-1 px-3 py-2 rounded-md border transition-colors text-sm ${
                    paymentType === "card"
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300"
                      : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  Karta
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType("cash")}
                  className={`flex-1 px-3 py-2 rounded-md border transition-colors text-sm ${
                    paymentType === "cash"
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300"
                      : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  Gotówka
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType("bank-withdrawal")}
                  className={`flex-1 px-3 py-2 rounded-md border transition-colors text-sm ${
                    paymentType === "bank-withdrawal"
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300"
                      : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  Bankomat
                </button>
              </div>
              {paymentType !== "cash" && (
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Waluta źródłowa
                  </label>
                  <select
                    value={sourceCurrency}
                    onChange={(e) => setSourceCurrency(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
                  >
                    {availableCurrencies.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Miejsce */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Miejsce
            </label>
            {location ? (
              <div className="px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                {location}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex-1">
                  Brak miejsc dla wybranej daty
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
                    Dodaj miejsce
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Data od */}
          <div>
            <DatePicker
              id="date"
              label="Data od"
              value={date}
              onChange={(newDate) => {
                setDate(newDate);
                if (spreadEndDate && newDate && spreadEndDate < newDate) setSpreadEndDate("");
              }}
              min={selectedLocationDateRange?.min || country.startDate || undefined}
              max={selectedLocationDateRange?.max || country.endDate || undefined}
              required
              error={errors.date}
            />
          </div>

          {/* Data do (rozłożenie wydatku na dni) */}
          <div>
            <DatePicker
              id="spreadEndDate"
              label="Data do (opcjonalnie)"
              value={spreadEndDate}
              onChange={(newEndDate) => {
                setSpreadEndDate(newEndDate || "");
                if (errors.spreadEndDate) setErrors((e) => ({ ...e, spreadEndDate: "" }));
              }}
              min={date || undefined}
              max={country.endDate || undefined}
              error={errors.spreadEndDate}
            />
            {date && spreadEndDate && spreadEndDate > date && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {(() => {
                  const start = new Date(date);
                  const end = new Date(spreadEndDate);
                  const days = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
                  const fmt = (d: Date) => d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" });
                  return (
                    <>
                      <strong>{days}</strong> {days === 1 ? "dzień" : "dni"} ({fmt(start)} – {fmt(end)}). Kwota rozłoży się równo na każdy dzień.
                    </>
                  );
                })()}
              </p>
            )}
            {(!date || !spreadEndDate || spreadEndDate === date) && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Np. hotel na 3 noce lub wynajem auta na tydzień – podaj datę od i do, kwota rozłoży się równo na każdy dzień.
              </p>
            )}
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

