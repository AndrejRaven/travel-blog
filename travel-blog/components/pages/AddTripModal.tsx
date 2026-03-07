"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronDown, ChevronUp, CheckCircle2, Info, Star, Plus, Trash2, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { savePendingTrip, getPendingTrip, clearPendingTrip } from "@/lib/travel-wallet/pending-trip-storage";
import { getErrorMessage, errorMessageIncludes } from "@/lib/utils/error-handling";
import { getCurrencyName, CURRENCY_NAMES } from "@/lib/travel-wallet/currency-names";
import type { Budget } from "@/lib/travel-wallet/types";

const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  PLN: 1,
  USD: 3.57,
  EUR: 3.85,
  GBP: 4.52,
  NOK: 0.33,
  THB: 0.098,
  JPY: 0.024,
  KRW: 0.0026,
  TWD: 0.11,
};

const ALL_CURRENCY_CODES = Object.keys(CURRENCY_NAMES).sort();

function getCurrencySearchText(code: string): string {
  return `${code} ${getCurrencyName(code)}`.toLowerCase();
}

function convertToBase(amount: number, currency: string, baseCurrency: string): number {
  const fromRate = DEFAULT_EXCHANGE_RATES[currency] ?? 1;
  const toRate = DEFAULT_EXCHANGE_RATES[baseCurrency] ?? 1;
  return (amount * fromRate) / toRate;
}

interface AddTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tripData: {
    name: string;
    startDate?: string;
    endDate?: string;
    baseCurrency: string;
    initialBudgets: Budget[];
    userName?: string;
    dashboardMode?: "multi-country" | "single-country" | "single-location" | "auto";
  }) => Promise<void> | void;
  initialValues?: {
    name?: string;
    startDate?: string;
    endDate?: string;
    totalBudget?: string;
    baseCurrency?: string;
    initialBudgets?: Budget[];
    userName?: string;
    dashboardMode?: "multi-country" | "single-country" | "single-location" | "auto";
  };
  /** Faza wysyłania – wyświetlana w przycisku (Sprawdzanie limitu... / Tworzenie...) */
  submitPhase?: "limit" | "creating" | null;
}

export default function AddTripModal({
  isOpen,
  onClose,
  onSave,
  initialValues,
  submitPhase = null,
}: AddTripModalProps) {
  const { profile } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("PLN");
  const [initialBudgets, setInitialBudgets] = useState<Budget[]>([{ currency: "PLN", amount: 0 }]);
  const [userName, setUserName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedBudget, setExpandedBudget] = useState(true);
  const [expandedAdditional, setExpandedAdditional] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openCurrencyDropdownIndex, setOpenCurrencyDropdownIndex] = useState<number | null>(null);
  const [currencyFilterText, setCurrencyFilterText] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  const currencyTriggerRef = useRef<HTMLInputElement>(null);

  const filteredCurrencies = useMemo(() => {
    const q = currencyFilterText.trim().toLowerCase();
    if (!q) return ALL_CURRENCY_CODES;
    return ALL_CURRENCY_CODES.filter((code) => getCurrencySearchText(code).includes(q));
  }, [currencyFilterText]);

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

  const totalBudgetInBase = useMemo(() => {
    return initialBudgets.reduce((sum, b) => sum + convertToBase(b.amount, b.currency, baseCurrency), 0);
  }, [initialBudgets, baseCurrency]);
  const hasBudgetFilled = initialBudgets.some((b) => b.amount > 0);

  // Funkcja sugerująca datę zakończenia (+30 dni od startDate)
  const suggestEndDate = (start: string): string => {
    if (!start) return "";
    const startDateObj = new Date(start);
    startDateObj.setDate(startDateObj.getDate() + 30);
    return startDateObj.toISOString().split("T")[0];
  };

  // Oblicz progress wypełnienia formularza (0-100%)
  const formProgress = useMemo(() => {
    let filled = 0;
    const total = 5;
    if (name.trim()) filled++;
    if (startDate) filled++;
    if (endDate) filled++;
    if (hasBudgetFilled) filled++;
    if (userName.trim()) filled++;
    return Math.round((filled / total) * 100);
  }, [name, startDate, endDate, hasBudgetFilled, userName]);

  // Walidacja w czasie rzeczywistym
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "name":
        if (!value.trim()) {
          return "Nazwa podróży jest wymagana";
        }
        if (value.trim().length < 3) {
          return "Nazwa musi mieć co najmniej 3 znaki";
        }
        return "";
      case "endDate":
        if (startDate && value && value < startDate) {
          return "Data zakończenia musi być późniejsza niż data rozpoczęcia";
        }
        return "";
      case "budgets":
        if (!hasBudgetFilled) {
          return "Dodaj co najmniej jedną kwotę budżetu";
        }
        return "";
      default:
        return "";
    }
  };

  // Usunięto automatyczne sugerowanie daty końca - użytkownik sam ustawia datę końca

  // Walidacja w czasie rzeczywistym dla nazwy
  useEffect(() => {
    if (name && name.trim().length > 0) {
      const error = validateField("name", name);
      if (error) {
        setErrors(prev => ({ ...prev, name: error }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.name;
          return newErrors;
        });
      }
    }
  }, [name]);

  // Walidacja w czasie rzeczywistym dla dat
  useEffect(() => {
    if (endDate) {
      const error = validateField("endDate", endDate);
      if (error) {
        setErrors(prev => ({ ...prev, endDate: error }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.endDate;
          return newErrors;
        });
      }
    }
  }, [startDate, endDate]);

  // Walidacja budżetów (przy zmianie initialBudgets)
  useEffect(() => {
    if (initialBudgets.some((b) => b.amount < 0)) {
      setErrors((prev) => ({ ...prev, budgets: "Kwota nie może być ujemna" }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.budgets;
        return next;
      });
    }
  }, [initialBudgets]);

  // Reset formularza gdy modal się otwiera/zamyka lub przywróć zapisane wartości
  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        setName(initialValues.name || "");
        setStartDate(initialValues.startDate || "");
        setEndDate(initialValues.endDate || "");
        setBaseCurrency(initialValues.baseCurrency || "PLN");
        if (initialValues.initialBudgets && initialValues.initialBudgets.length > 0) {
          setInitialBudgets(initialValues.initialBudgets);
        } else if (initialValues.totalBudget !== undefined && initialValues.totalBudget !== "") {
          const num = parseFloat(initialValues.totalBudget);
          if (!isNaN(num) && num >= 0) {
            setInitialBudgets([{ currency: "PLN", amount: num }]);
          }
        } else {
          setInitialBudgets([{ currency: "PLN", amount: 0 }]);
        }
        setUserName(initialValues.userName || "");
      } else {
        setName("");
        setStartDate("");
        setEndDate("");
        setBaseCurrency("PLN");
        setInitialBudgets([{ currency: "PLN", amount: 0 }]);
        setUserName(profile?.full_name || "");
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, initialValues, profile]);

  // Przy zmianie waluty głównej budżetu ustaw też pierwszą walutę w tabeli budżetów
  useEffect(() => {
    setInitialBudgets((prev) => {
      if (prev.length === 0) return prev;
      if (prev[0].currency === baseCurrency) return prev;
      const next = [...prev];
      next[0] = { ...next[0], currency: baseCurrency };
      return next;
    });
  }, [baseCurrency]);

  const handleClose = () => {
    const hasData = name.trim() || startDate || endDate || hasBudgetFilled || userName.trim();
    
    if (hasData) {
      addToast({
        type: "info",
        title: "Anulowano tworzenie podróży",
        message: "Dane podróży nie zostały zapisane.",
        duration: 3000,
      });
    }
    
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Nazwa podróży jest wymagana";
    }

    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = "Data zakończenia musi być późniejsza niż data rozpoczęcia";
    }

    if (!hasBudgetFilled) {
      newErrors.budgets = "Dodaj co najmniej jedną kwotę budżetu (większą od zera)";
    }
    if (initialBudgets.some((b) => b.amount < 0)) {
      newErrors.budgets = "Kwota nie może być ujemna";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addBudgetRow = () => {
    setInitialBudgets((prev) => [...prev, { currency: baseCurrency, amount: 0 }]);
  };
  const updateBudgetRow = (index: number, field: "currency" | "amount", value: string | number) => {
    setInitialBudgets((prev) => {
      const next = [...prev];
      if (field === "amount") next[index] = { ...next[index], amount: typeof value === "number" ? value : parseFloat(String(value)) || 0 };
      else next[index] = { ...next[index], currency: String(value) };
      return next;
    });
  };
  const removeBudgetRow = (index: number) => {
    if (initialBudgets.length <= 1) return;
    setInitialBudgets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const validBudgets = initialBudgets.filter((b) => b.amount > 0);
      const result = onSave({
        name: name.trim(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        baseCurrency,
        initialBudgets: validBudgets,
        userName: userName.trim() || undefined,
        dashboardMode: "auto",
      });
      
      // Jeśli onSave zwraca Promise, poczekaj na wynik z timeoutem (30 sekund)
      if (result instanceof Promise) {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Timeout: Operacja trwa zbyt długo. Sprawdź połączenie z internetem i spróbuj ponownie.'));
          }, 30000); // 30 sekund timeout
        });
        
        await Promise.race([result, timeoutPromise]);
      }
      
      // Sukces - zamknij modal i zresetuj isSubmitting
      setIsSubmitting(false);
      onClose();
    } catch (error: unknown) {
      console.error("Error creating trip:", error);
      const errorMessage = getErrorMessage(error);
      const isLimitError = (error as { isLimitError?: boolean })?.isLimitError || false;
      
      // Obsługa błędów timeout - nie traktuj jako błąd limitu
      if (errorMessageIncludes(error, "Timeout")) {
        addToast({
          type: "error",
          title: "Timeout",
          message: errorMessage || "Operacja trwa zbyt długo. Sprawdź połączenie z internetem i spróbuj ponownie.",
          duration: 5000,
        });
        setIsSubmitting(false);
        return; // Nie zamykaj modala - użytkownik może spróbować ponownie
      }
      // Obsługa błędów limitu podróży (tylko jeśli to nie jest timeout)
      else if (isLimitError || (errorMessageIncludes(error, "LIMIT_EXCEEDED") || errorMessageIncludes(error, "Darmowy plan") || errorMessageIncludes(error, "Przejdź na Premium")) && !errorMessageIncludes(error, "Timeout")) {
        const validBudgets = initialBudgets.filter((b) => b.amount > 0);
        savePendingTrip({
          name: name.trim(),
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          baseCurrency,
          initialBudgets: validBudgets,
          userName: userName.trim() || undefined,
          dashboardMode: "auto",
        });
        
        // Wyczyść "LIMIT_EXCEEDED:" z komunikatu błędu
        const cleanMessage = errorMessage.replace(/^LIMIT_EXCEEDED:\s*/i, '') || 
          "Masz już maksymalną liczbę podróży dla swojego planu. Przejdź na Premium, aby tworzyć nieograniczoną liczbę podróży.";
        
        addToast({
          type: "error",
          title: "Limit podróży przekroczony",
          message: cleanMessage,
          duration: 5000,
        });
        
        // Resetuj isSubmitting przed zamknięciem modala
        setIsSubmitting(false);
        
        // Zamknij modal i pozwól parent component pokazać upgrade prompt
        // Zwiększono opóźnienie, żeby upgrade prompt zdążył się otworzyć
        setTimeout(() => {
          onClose();
        }, 300);
      } else {
        addToast({
          type: "error",
          title: "Błąd",
          message: errorMessage || "Nie udało się utworzyć podróży. Spróbuj ponownie.",
          duration: 4000,
        });
        // Resetuj isSubmitting w przypadku błędu (nie limitu)
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-6">
            <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100">
              Dodaj podróż
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Zamknij"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          {/* Progress Bar */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-300 rounded-full"
                  style={{ width: `${formProgress}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[3rem] text-right">
                {formProgress}%
              </span>
            </div>
          </div>
        </div>

        {/* Formularz */}
        <form id="add-trip-form" onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Główne informacje - zawsze widoczne */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Główne informacje</h3>
              {name.trim() && startDate && endDate && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
            </div>

            {/* Nazwa podróży */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Nazwa podróży
                </label>
                <Star className="w-3 h-3 text-red-500 fill-current" />
                <Info className="w-4 h-4 text-gray-400" aria-label="Nazwa pomoże w identyfikacji podróży" />
                {name.trim() && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                )}
              </div>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                  errors.name ? "border-red-500 dark:border-red-400" : ""
                }`}
                placeholder="np. Podróż po Azji 2025"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Daty */}
            <div className="bg-white dark:bg-gray-700 rounded-md p-4 border border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-2 gap-4">
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
                      // Jeśli endDate jest wcześniejsza niż nowa startDate, zaktualizuj walidację
                      if (endDate && date && date > endDate) {
                        setErrors({ ...errors, endDate: "Data zakończenia musi być późniejsza niż data rozpoczęcia" });
                      } else if (errors.endDate && endDate && date && date <= endDate) {
                        setErrors({ ...errors, endDate: "" });
                      }
                    }}
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
                    relatedDate={startDate ? { type: 'end', value: startDate } : undefined}
                    error={errors.endDate}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Budżet - rozwijana sekcja */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedBudget(!expandedBudget)}
              className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Budżet</h3>
                {hasBudgetFilled && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
              </div>
              {expandedBudget ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedBudget && (
              <div className="p-5 space-y-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700" ref={currencyDropdownRef}>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Waluta główna budżetu
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        ref={openCurrencyDropdownIndex === -1 ? currencyTriggerRef : undefined}
                        readOnly={openCurrencyDropdownIndex !== -1}
                        value={openCurrencyDropdownIndex === -1 ? currencyFilterText : `${baseCurrency} - ${getCurrencyName(baseCurrency)}`}
                        onChange={(e) => {
                          setCurrencyFilterText(e.target.value);
                          setOpenCurrencyDropdownIndex(-1);
                        }}
                        onFocus={() => {
                          setOpenCurrencyDropdownIndex(-1);
                          setCurrencyFilterText("");
                        }}
                        placeholder="Wpisz kod lub nazwę (np. USD, dolar)..."
                        className="w-full pl-10 pr-4 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Budżet całkowity
                    </label>
                    <Button type="button" variant="outline" onClick={addBudgetRow} className="gap-1">
                      <Plus className="w-4 h-4" />
                      Dodaj walutę
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Suma w {baseCurrency}: {totalBudgetInBase.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {baseCurrency}
                  </p>
                  <div className="space-y-2">
                    {initialBudgets.map((budget, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <div className="flex-1 min-w-0 relative">
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
                            className="w-full pl-10 pr-4 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={budget.amount > 0 ? budget.amount : ""}
                          onChange={(e) => updateBudgetRow(index, "amount", e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "PageUp" || e.key === "PageDown") e.preventDefault();
                          }}
                          onWheel={(e) => e.currentTarget.blur()}
                          placeholder="0"
                          className="flex-1 min-w-0 px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        {initialBudgets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBudgetRow(index)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            aria-label="Usuń"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {errors.budgets && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.budgets}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dodatkowe - rozwijana sekcja */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedAdditional(!expandedAdditional)}
              className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Dodatkowe informacje</h3>
                {userName.trim() && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
              </div>
              {expandedAdditional ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedAdditional && (
              <div className="p-5 space-y-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                {/* Imię użytkownika */}
                <div>
                  <label
                    htmlFor="userName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Imię użytkownika
                  </label>
                  <input
                    id="userName"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    placeholder="np. Sarah"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer z przyciskami wewnątrz formularza */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
            {!hasBudgetFilled && (
              <div className="mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 Ustawienie budżetu pomoże w lepszym śledzeniu wydatków
                  </p>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Anuluj
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                className="flex-1"
                disabled={!name.trim() || isSubmitting}
                title={!name.trim() ? "Wprowadź nazwę podróży aby kontynuować" : undefined}
              >
                {isSubmitting
                  ? submitPhase === "limit"
                    ? "Sprawdzanie limitu..."
                    : "Tworzenie..."
                  : "Utwórz"}
              </Button>
            </div>
            {!name.trim() && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Wprowadź nazwę podróży aby móc utworzyć podróż
                </p>
              </div>
            )}
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
                  if (openCurrencyDropdownIndex === -1) {
                    setBaseCurrency(code);
                  } else {
                    updateBudgetRow(openCurrencyDropdownIndex, "currency", code);
                  }
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

