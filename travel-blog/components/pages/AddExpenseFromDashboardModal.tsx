"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import Select from "@/components/ui/Select";
import type { Country, Expense, TravelWalletData } from "@/lib/travel-wallet/types";
import { getCurrencyBalance, getBalancesWithBaseCurrency, getBalancesForCountry } from "@/lib/travel-wallet/wallet-operations";
import { getWallet } from "@/lib/travel-wallet/wallet-storage";
import { formatCurrency } from "@/lib/travel-wallet/formatters";
import { getEffectiveDashboardMode } from "@/lib/travel-wallet/dashboard-mode";
import { useToast } from "@/components/ui/Toast";
import { ACCOMMODATION_TYPES, ACCOMMODATION_TYPES_ALLOWING_ZERO } from "@/lib/travel-wallet/constants";

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
    endDate?: string;
    note?: string;
    location?: string;
    tripId?: string;
    accommodationType?: string;
  }) => void;
  data: TravelWalletData;
  tripId: string;
  initialDate?: string;
  initialCategory?: string;
  expense?: Expense;
  tripStartDate?: string;
  tripEndDate?: string;
  onAddLocation?: (countryId: string, date: string) => void;
  onAddCountry?: () => void;
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

export default function AddExpenseFromDashboardModal({
  isOpen,
  onClose,
  onSave,
  data,
  tripId,
  initialDate,
  initialCategory,
  expense,
  tripStartDate,
  tripEndDate,
  onAddLocation,
  onAddCountry,
}: AddExpenseFromDashboardModalProps) {
  const { addToast } = useToast();
  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Jedzenie");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("PLN");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [location, setLocation] = useState("");
  const [accommodationType, setAccommodationType] = useState("");
  const [spreadEndDate, setSpreadEndDate] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Znajdź kraj dla danej daty
  const findCountryForDate = useMemo(() => {
    return (dateString: string): Country | null => {
      if (!dateString) return null;
      
      const date = new Date(dateString);
      date.setHours(0, 0, 0, 0);
      
      // Znajdź kraj, którego zakres dat zawiera podaną datę
      for (const country of data.countries) {
        if (country.startDate && country.endDate) {
          const start = new Date(country.startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(country.endDate);
          end.setHours(0, 0, 0, 0);
          
          if (date >= start && date <= end) {
            return country;
          }
        }
      }
      
      return null;
    };
  }, [data.countries]);

  // Automatycznie wybierz kraj na podstawie daty lub gdy jest tylko jeden kraj
  useEffect(() => {
    if (initialDate) {
      const countryForDate = findCountryForDate(initialDate);
      if (countryForDate) {
        setSelectedCountryId(countryForDate.id);
      }
    } else if (data.countries.length === 1 && !selectedCountryId) {
      // Jeśli jest tylko jeden kraj i nie ma wybranego kraju, automatycznie go wybierz
      setSelectedCountryId(data.countries[0].id);
    }
  }, [initialDate, findCountryForDate, data.countries, selectedCountryId]);

  // Pobierz wybrany kraj
  const selectedCountry = useMemo(() => {
    return data.countries.find((c) => c.id === selectedCountryId);
  }, [selectedCountryId, data.countries]);

  // Sprawdź czy kraj jest zablokowany (gdy initialDate jest podane i znaleziono kraj)
  const isCountryLocked = useMemo(() => {
    if (!initialDate) return false;
    const countryForDate = findCountryForDate(initialDate);
    return countryForDate !== null;
  }, [initialDate, findCountryForDate]);

  // Pobierz dostępne waluty z portfela
  const availableWalletCurrencies = useMemo(() => {
    if (!tripId) {
      return [];
    }
    
    try {
      const wallet = getWallet(tripId);
      
      if (!wallet) {
        return [];
      }
      
      // Użyj getBalancesWithBaseCurrency, aby uzyskać wszystkie salda (podobnie jak w innych komponentach)
      const balances = getBalancesWithBaseCurrency(wallet, tripId);
      
      // Pobierz wszystkie waluty z portfela (nawet z zerowym saldem, aby pokazać wszystkie dostępne opcje)
      const currencies = balances.map((balance) => balance.currency);
      
      return currencies;
    } catch (error) {
      console.error("[AddExpenseFromDashboardModal] availableWalletCurrencies: Error getting wallet currencies:", error);
      return [];
    }
  }, [tripId]);

  // Pobierz dostępne waluty (z portfela + z budżetu kraju)
  const availableCurrencies = useMemo(() => {
    const currenciesSet = new Set<string>();
    
    // Zawsze dodaj waluty z portfela (nawet jeśli kraj nie jest wybrany)
    availableWalletCurrencies.forEach((curr) => currenciesSet.add(curr));
    
    // Dodaj waluty z budżetu wybranego kraju (jeśli jest wybrany)
    if (selectedCountry && selectedCountry.budgets) {
      selectedCountry.budgets.forEach((budget) => {
        currenciesSet.add(budget.currency);
      });
    }
    
    // Jeśli brak walut, dodaj PLN jako domyślną
    if (currenciesSet.size === 0) {
      currenciesSet.add("PLN");
    }
    
    const result = Array.from(currenciesSet).sort((a, b) => {
      // PLN zawsze pierwsza
      if (a === "PLN") return -1;
      if (b === "PLN") return 1;
      return a.localeCompare(b);
    });
    
    return result;
  }, [availableWalletCurrencies, selectedCountry]);

  // Reset formularza tylko gdy modal się otwiera lub zmienia się kontekst (initialDate, expense, lista krajów).
  // NIE dodawać availableCurrencies – zależy od selectedCountryId, więc po wyborze kraju efekt by się
  // odpalał ponownie i resetował wybór do „Wybierz kraj”.
  useEffect(() => {
    if (isOpen) {
      if (expense) {
        setSelectedCountryId(expense.countryId);
        setDescription(expense.description || "");
        setCategory(expense.category || "Jedzenie");
        setAmount(expense.amount.toString());
        setCurrency(expense.currency || "PLN");
        setDate(expense.date);
        setNote(expense.note || "");
        setLocation(expense.location || "");
        setAccommodationType(expense.category === "Noclegi" ? (expense.accommodationType || "") : "");
        if (expense.endDate && expense.endDate !== expense.date) {
          setSpreadEndDate(expense.endDate);
        } else {
          setSpreadEndDate("");
        }
      } else {
        // Dodawanie nowego wydatku
        if (initialDate) {
          const countryForDate = findCountryForDate(initialDate);
          setSelectedCountryId(countryForDate?.id || "");
        } else if (data.countries.length === 1) {
          setSelectedCountryId(data.countries[0].id);
        } else {
          setSelectedCountryId("");
        }
        setDescription("");
        setCategory(initialCategory || "Jedzenie");
        setAmount("");
        setCurrency("PLN");
        setDate(initialDate || "");
        setNote("");
        setLocation("");
        setAccommodationType("");
        setSpreadEndDate("");
      }
      setErrors({});
    }
  }, [isOpen, initialDate, initialCategory, expense, findCountryForDate, data.countries]);

  // Ustaw datę z initialDate gdy się zmienia
  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate]);

  // Resetuj walutę gdy zmienia się wybrany kraj - użyj pierwszej dostępnej waluty
  // Nie resetuj podczas edycji wydatku
  useEffect(() => {
    if (!expense && selectedCountry && availableCurrencies.length > 0) {
      // Użyj pierwszej dostępnej waluty (PLN ma priorytet)
      const firstAvailable = availableCurrencies[0];
      if (firstAvailable && firstAvailable !== currency) {
        setCurrency(firstAvailable);
      }
    }
  }, [selectedCountry, availableCurrencies, expense]);

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

  // Funkcja pomocnicza do obliczania salda dla waluty (używana w availableBalance i walidacji)
  const getBalanceForCurrency = useMemo(() => {
    return (wallet: ReturnType<typeof getWallet>, currencyCode: string, countryId?: string): number => {
      if (!wallet || !currencyCode) return 0;
      
      try {
        // Sprawdź tryb dashboardu
        const effectiveMode = getEffectiveDashboardMode(data);
        const isSingleMode = effectiveMode === "single-country" || effectiveMode === "single-location";
        
        // W trybie single-country, użyj sald dla wybranego kraju
        if (isSingleMode && (countryId || selectedCountryId)) {
          const targetCountryId = countryId || selectedCountryId;
          const countryBalances = getBalancesForCountry(wallet, tripId, targetCountryId);
          const balance = countryBalances.find(b => b.currency === currencyCode);
          return balance ? balance.amount : 0;
        }
        
        // W trybie multi-country, użyj globalnych sald
        return getCurrencyBalance(wallet, currencyCode);
      } catch (error) {
        console.warn("[AddExpenseFromDashboardModal] Error getting balance:", error);
        return 0;
      }
    };
  }, [tripId, data, selectedCountryId]);

  // Pobierz dostępne saldo dla wybranej waluty
  const availableBalance = useMemo(() => {
    if (!currency || !tripId) return null;
    
    try {
      const wallet = getWallet(tripId);
      if (!wallet) return null;
      
      return getBalanceForCurrency(wallet, currency);
    } catch (error) {
      console.warn("[AddExpenseFromDashboardModal] Error getting balance:", error);
      return null;
    }
  }, [currency, tripId, getBalanceForCurrency]);

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
      console.error("[AddExpenseFromDashboardModal] allAvailableBalances: Error getting all balances:", error);
      return [];
    }
  }, [tripId, isOpen]);

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

    // Jeśli jest tylko jeden kraj, automatycznie użyj go
    const finalCountryId = data.countries.length === 1 
      ? data.countries[0].id 
      : selectedCountryId;

    if (!finalCountryId) {
      newErrors.country = "Kraj jest wymagany";
    }

    if (!description.trim()) {
      newErrors.description = "Tytuł jest wymagany";
    }

    if (category === "Noclegi" && !accommodationType) {
      newErrors.accommodationType = "Wybierz typ noclegu";
    }

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
      // Sprawdź dostępne saldo
      if (tripId) {
        try {
          const wallet = getWallet(tripId);
          if (wallet) {
            const currentBalance = getBalanceForCurrency(wallet, currency, selectedCountryId);
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
          console.warn("[AddExpenseFromDashboardModal] Error checking balance in validate:", error);
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

    // Jeśli jest tylko jeden kraj, użyj go automatycznie
    const finalCountry = data.countries.length === 1 
      ? data.countries[0] 
      : selectedCountry;

    if (!validate() || !finalCountry) {
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

    if (tripId && normalizedAmount > 0) {
      try {
        const wallet = getWallet(tripId);
        if (wallet) {
          const finalCountryId = finalCountry?.id || selectedCountryId;
          const currentBalance = getBalanceForCurrency(wallet, currency, finalCountryId);
          if (normalizedAmount > currentBalance) {
            setErrors({
              ...errors,
              amount: `Niewystarczające środki. Dostępne: ${formatCurrency(currentBalance, currency)}`,
            });
            return; // Blokuj zapisanie
          }
        }
      } catch (error) {
        console.warn("[AddExpenseFromDashboardModal] Error checking balance before save:", error);
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
      countryId: finalCountry.id,
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Wybór kraju */}
          {data.countries.length === 1 ? (
            // Gdy jest tylko jeden kraj, pokaż go jako tekst
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kraj
              </label>
              <div className="px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                {data.countries[0].name}
              </div>
            </div>
          ) : (
            // Gdy jest więcej krajów, pokaż select
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
              <Select
                value={selectedCountryId}
                onChange={setSelectedCountryId}
                disabled={isCountryLocked}
                placeholder="Wybierz kraj"
                options={[
                  { value: "", label: "Wybierz kraj" },
                  ...data.countries.map((country) => ({
                    value: country.id,
                    label: country.name,
                  })),
                ]}
                className={errors.country ? "border-red-500 dark:border-red-400" : ""}
              />
              {errors.country && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.country}
                </p>
              )}
            </div>
          )}

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
            <Select
              value={category}
              onChange={(v) => {
                setCategory(v);
                if (v !== "Noclegi") setAccommodationType("");
              }}
              options={EXPENSE_CATEGORIES.map((cat) => ({
                value: cat,
                label: cat,
              }))}
            />
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
              <Select
                value={currency}
                onChange={(newCurrency) => {
                  setCurrency(newCurrency);
                  // Resetuj błąd kwoty gdy zmienia się waluta
                  if (errors.amount) {
                    setErrors({ ...errors, amount: "" });
                  }
                }}
                disabled={availableCurrencies.length === 0}
                options={availableCurrencies.map((curr) => ({
                  value: curr,
                  label: curr.toUpperCase(),
                }))}
              />
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

          {/* Miejsce */}
          {selectedCountry && (
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
                        if (selectedCountry) {
                          onAddLocation(selectedCountry.id, date);
                        }
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
          )}

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
              min={selectedLocationDateRange?.min || selectedCountry?.startDate || tripStartDate || undefined}
              max={selectedLocationDateRange?.max || selectedCountry?.endDate || tripEndDate || undefined}
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
              max={selectedCountry?.endDate || tripEndDate || undefined}
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

