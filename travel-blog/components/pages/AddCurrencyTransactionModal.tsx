"use client";

import { useState, useEffect, useMemo } from "react";
import { X, ArrowRight, Search, ChevronDown, ChevronUp, Info, Star, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import ExchangeRateVerificationModal from "./ExchangeRateVerificationModal";
import { useToast } from "@/components/ui/Toast";
import type { CurrencyTransaction } from "@/lib/travel-wallet/types";
import type { ExchangeRate } from "@/lib/travel-wallet/types";
import { verifyExchangeRate } from "@/lib/travel-wallet/rate-verification";
import type { RateVerificationResult } from "@/lib/travel-wallet/rate-verification";
import { getReferenceRate } from "@/lib/travel-wallet/reference-rates";
import { CURRENCY_SYMBOLS } from "@/lib/travel-wallet/constants";
import { calculateCurrencyBalances, getBalanceForCurrency } from "@/lib/travel-wallet/currency-balances";
import { getTripBySlug } from "@/lib/travel-wallet/trips-storage";
import { formatCurrency } from "@/lib/travel-wallet/formatters";
import { getWallet } from "@/lib/travel-wallet/wallet-storage";
import { getCurrencyBalance, getBalancesForCountry } from "@/lib/travel-wallet/wallet-operations";
import { CURRENCY_NAMES } from "@/lib/travel-wallet/currency-names";

interface AddCurrencyTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<CurrencyTransaction, "id" | "tripId" | "rate">, transactionId?: string) => void;
  countryId?: string;
  availableCurrencies?: string[];
  slug?: string;
  transaction?: CurrencyTransaction; // Transakcja do edycji (opcjonalne)
  walletCurrencies?: string[]; // Waluty dostępne w portfelu (z saldem > 0)
  tripId?: string; // ID podróży dla walidacji sald
}

const FALLBACK_CURRENCIES = [
  "PLN", "USD", "EUR", "GBP", "THB", "JPY", "KRW", "TWD", "AUD", "CAD",
  "MXN", "BRL", "CNY", "HKD", "SGD", "NZD", "CHF", "SEK", "NOK", "DKK",
  "INR", "IDR", "PHP", "MYR", "VND", "ZAR", "TRY", "RUB", "ILS", "AED",
  "SAR", "ARS", "CLP", "COP", "PEN", "UAH", "CZK", "HUF", "RON", "BGN",
  "HRK", "ISK"
];

interface CurrencyPair {
  fromCurrency: string;
  toCurrency: string;
}

const DEFAULT_SELECTED_PAIRS: CurrencyPair[] = [
  { fromCurrency: "USD", toCurrency: "PLN" },
  { fromCurrency: "EUR", toCurrency: "PLN" },
];

function getStorageKey(slug: string): string {
  return `exchange-rates-selected-pairs-${slug}`;
}

function loadSelectedPairs(slug: string): CurrencyPair[] {
  if (typeof window === "undefined" || !slug) return DEFAULT_SELECTED_PAIRS;
  try {
    const stored = localStorage.getItem(getStorageKey(slug));
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof parsed[0] === "string") {
          return parsed.map((currency: string) => ({
            fromCurrency: currency,
            toCurrency: "PLN",
          }));
        }
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error loading selected pairs:", error);
  }
  return DEFAULT_SELECTED_PAIRS;
}

function getCurrencySearchText(currency: string): string {
  const name = CURRENCY_NAMES[currency] || currency;
  return `${currency} ${name}`.toLowerCase();
}

export default function AddCurrencyTransactionModal({
  isOpen,
  onClose,
  onSave,
  countryId,
  availableCurrencies: propAvailableCurrencies,
  slug,
  transaction,
  walletCurrencies = [],
  tripId,
}: AddCurrencyTransactionModalProps) {
  const { addToast } = useToast();
  
  const [fromCurrency, setFromCurrency] = useState("");
  const [fromAmount, setFromAmount] = useState("");
  const [toCurrency, setToCurrency] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [fee, setFee] = useState("");
  const [feeCurrency, setFeeCurrency] = useState("PLN");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>(FALLBACK_CURRENCIES);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState<RateVerificationResult | null>(null);
  const [pendingTransactionData, setPendingTransactionData] = useState<Omit<CurrencyTransaction, "id" | "tripId" | "rate"> | null>(null);
  const [searchQueryFrom, setSearchQueryFrom] = useState("");
  const [searchQueryTo, setSearchQueryTo] = useState("");
  const [isDropdownOpenFrom, setIsDropdownOpenFrom] = useState(false);
  const [isDropdownOpenTo, setIsDropdownOpenTo] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger do odświeżania balance
  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const [expandedDetails, setExpandedDetails] = useState(true); // Sekcja "Szczegóły" domyślnie rozwinięta
  const [expandedAdditional, setExpandedAdditional] = useState(false); // Sekcja "Dodatkowe" domyślnie zwinięta

  // Pobierz dostępne waluty z API
  useEffect(() => {
    if (propAvailableCurrencies) {
      // Upewnij się, że PLN jest zawsze w liście (jeśli nie ma, dodaj na początku)
      const currenciesWithPLN = propAvailableCurrencies.includes('PLN') 
        ? propAvailableCurrencies 
        : ['PLN', ...propAvailableCurrencies];
      setAvailableCurrencies(currenciesWithPLN);
      setIsLoadingCurrencies(false);
      return;
    }

    const fetchCurrencies = async () => {
      // Sprawdź cache najpierw
      const { getCachedCurrencies, setCachedCurrencies } = await import("@/lib/currencies-cache");
      const cached = getCachedCurrencies();
      
      if (cached) {
        setAvailableCurrencies(cached);
        setIsLoadingCurrencies(false);
        return;
      }

      try {
        const response = await fetch("/api/currencies");
        if (response.ok) {
          const data = await response.json();
          if (data.currencies && Array.isArray(data.currencies)) {
            // API zwraca tablicę obiektów { code: "USD" }, konwertuj na tablicę stringów
            const currencyCodes = data.currencies.map((c: { code: string }) => c.code);
            // Upewnij się, że PLN jest zawsze w liście (jeśli nie ma, dodaj na początku)
            const currenciesWithPLN = currencyCodes.includes('PLN') 
              ? currencyCodes 
              : ['PLN', ...currencyCodes];
            setAvailableCurrencies(currenciesWithPLN);
            // Zapisz do cache
            setCachedCurrencies(currenciesWithPLN, data.date);
          }
        }
      } catch (error) {
        console.error("Error fetching currencies:", error);
        // Jeśli błąd, użyj cache nawet jeśli wygasł
        if (cached) {
          setAvailableCurrencies(cached);
        }
      } finally {
        setIsLoadingCurrencies(false);
      }
    };

    fetchCurrencies();
  }, [propAvailableCurrencies]);

  // Pobierz kursy walut z API
  useEffect(() => {
    if (!isOpen) return;

    const fetchRates = async () => {
      setIsLoadingRates(true);
      try {
        const response = await fetch("/api/exchange-rates");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.rates && Array.isArray(data.rates)) {
            setExchangeRates(data.rates);
          }
        } else {
          console.error("[AddCurrencyTransactionModal] Failed to fetch exchange rates:", response.status);
        }
      } catch (error) {
        console.error("[AddCurrencyTransactionModal] Error fetching exchange rates:", error);
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchRates();
  }, [isOpen]);

  // Filtruj dostępne waluty dla "Z waluty" (fromCurrency) - tylko waluty z portfela
  const filteredAvailableCurrenciesFrom = useMemo(() => {
    // Tylko waluty z portfela
    // Jeśli brak walletCurrencies, nie pokazuj żadnych walut (użytkownik musi najpierw dodać budżet)
    if (!walletCurrencies || walletCurrencies.length === 0) {
      console.warn('[AddCurrencyTransactionModal] walletCurrencies is empty or undefined');
      return [];
    }
    
    // Filtruj tylko te waluty które są w portfelu
    // Upewnij się, że wszystkie waluty z walletCurrencies są uwzględnione (nawet jeśli nie ma ich w availableCurrencies)
    const currenciesToShow = walletCurrencies.filter(code => availableCurrencies.includes(code));
    
    // Dodaj brakujące waluty z walletCurrencies (jeśli nie ma ich w API)
    walletCurrencies.forEach(code => {
      if (!currenciesToShow.includes(code)) {
        currenciesToShow.push(code);
      }
    });

    return currenciesToShow;
  }, [availableCurrencies, walletCurrencies]);

  // Filtruj dostępne waluty dla "Na walutę" (toCurrency) - wszystkie dostępne (dla exchange/withdrawal)
  const filteredAvailableCurrenciesTo = useMemo(() => {
    // Zawsze pokaż wszystkie dostępne waluty
    return availableCurrencies;
  }, [availableCurrencies]);

  // Pobierz wybrane pary z localStorage i posortuj waluty dla "Z waluty"
  const sortedCurrenciesFrom = useMemo(() => {
    if (!slug) {
      return filteredAvailableCurrenciesFrom.map(code => ({
        code,
        name: CURRENCY_NAMES[code] || code,
        symbol: CURRENCY_SYMBOLS[code] || code,
      }));
    }

    const selectedPairs = loadSelectedPairs(slug);
    const preferredCurrencies = new Set<string>();
    selectedPairs.forEach(pair => {
      preferredCurrencies.add(pair.fromCurrency);
      preferredCurrencies.add(pair.toCurrency);
    });

    const preferred = filteredAvailableCurrenciesFrom
      .filter(code => preferredCurrencies.has(code))
      .map(code => ({
        code,
        name: CURRENCY_NAMES[code] || code,
        symbol: CURRENCY_SYMBOLS[code] || code,
        isPreferred: true,
      }));

    const others = filteredAvailableCurrenciesFrom
      .filter(code => !preferredCurrencies.has(code))
      .map(code => ({
        code,
        name: CURRENCY_NAMES[code] || code,
        symbol: CURRENCY_SYMBOLS[code] || code,
        isPreferred: false,
      }));

    return [...preferred, ...others];
  }, [filteredAvailableCurrenciesFrom, slug]);

  // Pobierz wybrane pary z localStorage i posortuj waluty dla "Na walutę"
  const sortedCurrenciesTo = useMemo(() => {
    if (!slug) {
      return filteredAvailableCurrenciesTo.map(code => ({
        code,
        name: CURRENCY_NAMES[code] || code,
        symbol: CURRENCY_SYMBOLS[code] || code,
      }));
    }

    const selectedPairs = loadSelectedPairs(slug);
    const preferredCurrencies = new Set<string>();
    selectedPairs.forEach(pair => {
      preferredCurrencies.add(pair.fromCurrency);
      preferredCurrencies.add(pair.toCurrency);
    });

    const preferred = filteredAvailableCurrenciesTo
      .filter(code => preferredCurrencies.has(code))
      .map(code => ({
        code,
        name: CURRENCY_NAMES[code] || code,
        symbol: CURRENCY_SYMBOLS[code] || code,
        isPreferred: true,
      }));

    const others = filteredAvailableCurrenciesTo
      .filter(code => !preferredCurrencies.has(code))
      .map(code => ({
        code,
        name: CURRENCY_NAMES[code] || code,
        symbol: CURRENCY_SYMBOLS[code] || code,
        isPreferred: false,
      }));

    return [...preferred, ...others];
  }, [filteredAvailableCurrenciesTo, slug]);

  // Auto-calculate exchange rate
  useEffect(() => {
    if (fromAmount && toAmount) {
      const from = parseFloat(fromAmount);
      const to = parseFloat(toAmount);
      if (from > 0 && to > 0) {
        const _rate = to / from;
        // Rate is calculated, no need to store separately
      }
    }
  }, [fromAmount, toAmount]);

  // Auto-calculate toAmount when fromAmount changes (for initial guess)
  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    if (value && parseFloat(value) > 0) {
      // Optional: provide estimated toAmount based on typical rates
    }
  };

  const handleSave = () => {
    // Walidacja - sprawdź czy waluty są wybrane
    if (!fromCurrency || !toCurrency) {
      addToast({
        type: "error",
        title: "Błąd walidacji",
        message: "Proszę wybrać waluty dla transakcji.",
      });
      return;
    }

    const from = parseFloat(fromAmount);
    let to = parseFloat(toAmount);
    const feeValue = fee ? parseFloat(fee) : undefined;

    if (!from || !to || from <= 0 || to <= 0) {
      addToast({
        type: "error",
        title: "Błąd walidacji",
        message: "Proszę wprowadzić poprawne kwoty (większe od zera).",
      });
      return;
    }

    // Round toAmount to avoid floating point precision issues
    // Round to 2 decimal places, but preserve exact value if it's a whole number
    const roundedTo = Math.round(to * 100) / 100;
    // If it's very close to a whole number (within 0.001), use the whole number
    if (Math.abs(roundedTo - Math.round(roundedTo)) < 0.001) {
      to = Math.round(roundedTo);
    } else {
      to = roundedTo;
    }

    // Walidacja walut w portfelu
    if (walletCurrencies.length > 0) {
        // Sprawdź czy fromCurrency jest w portfelu (tylko "z waluty" musi być w portfelu)
        if (!walletCurrencies.includes(fromCurrency)) {
          addToast({
            type: "error",
            title: "Błąd walidacji",
            message: `Nie możesz wymieniać waluty ${fromCurrency}, której nie masz w portfelu. Dostępne waluty: ${walletCurrencies.join(", ")}`,
          });
          return;
        }
        
        // Sprawdź czy masz wystarczające środki w portfelu
        // Użyj tego samego systemu co do wyświetlania dostępnych środków (nowy system wallet)
        if (tripId) {
          try {
            // Dla nowego systemu wallet, użyj danych z portfela bezpośrednio
            const wallet = getWallet(tripId);
            if (wallet) {
              // Użyj tej samej logiki co w availableBalance
              let balance: number;
              if (countryId) {
                const countryBalances = getBalancesForCountry(wallet, tripId, countryId);
                const countryBalance = countryBalances.find(b => b.currency === fromCurrency);
                balance = countryBalance ? countryBalance.amount : 0;
              } else {
                balance = getCurrencyBalance(wallet, fromCurrency);
              }
              if (balance < from) {
                addToast({
                  type: "error",
                  title: "Niewystarczające środki",
                  message: `Masz ${balance.toFixed(2)} ${fromCurrency}, a próbujesz wymienić ${from.toFixed(2)} ${fromCurrency}.`,
                });
                return;
              }
            } else {
              // Fallback do starego systemu jeśli nie ma wallet
              if (slug) {
                const trip = getTripBySlug(slug);
                if (trip) {
                  const balances = calculateCurrencyBalances(trip, countryId);
                  const balance = getBalanceForCurrency(balances, fromCurrency);
                  
                  if (balance) {
                    const availableAmount = balance.amount;
                    if (from > availableAmount) {
                      addToast({
                        type: "error",
                        title: "Niewystarczające środki",
                        message: `Masz ${availableAmount.toFixed(2)} ${fromCurrency}, a próbujesz wymienić ${from.toFixed(2)} ${fromCurrency}.`,
                      });
                      return;
                    }
                  } else {
                    console.warn(`[AddCurrencyTransactionModal] No balance found for ${fromCurrency}, checking initial balances`);
                  }
                }
              }
            }
          } catch (error) {
            console.error("[AddCurrencyTransactionModal] Error validating balance:", error);
            // W przypadku błędu, pozwól na kontynuację (walidacja w executeExchange sprawdzi to ponownie)
          }
        }
        // "Na walutę" może być dowolna - nie sprawdzamy
      }

    const transactionData: Omit<CurrencyTransaction, "id" | "tripId" | "rate"> = {
      type: "exchange",
      date,
      time: time || undefined,
      fromCurrency,
      fromAmount: from,
      toCurrency,
      toAmount: to,
      fee: feeValue,
      feeCurrency: feeValue ? feeCurrency : undefined,
      note: note || undefined,
      location: location || undefined,
      countryId: selectedCountryId || undefined,
    };

    // Weryfikacja kursu
    // Jeśli kursy są jeszcze ładowane, poczekaj
    if (isLoadingRates) {
      console.warn("[AddCurrencyTransactionModal] Exchange rates are still loading, please wait...");
      return;
    }

    // Jeśli nie ma kursów, nie można zweryfikować - wymagaj kursów
    if (exchangeRates.length === 0) {
      console.error("[AddCurrencyTransactionModal] No exchange rates available, cannot verify transaction");
      return;
    }

    const transactionRate = to / from;
    
    // Sprawdź czy mamy kurs dla tej pary walut
    const verification = verifyExchangeRate(
      transactionRate,
      fromCurrency,
      toCurrency,
      exchangeRates,
      date
    );

    // Jeśli kurs jest poza granicami ±10%, pokaż modal weryfikacji
    // Również jeśli nie znaleziono kursu referencyjnego (referenceRate === null), 
    // ale to nie powinno się zdarzyć jeśli mamy kursy w API
    if (!verification.isValid) {
      setPendingTransactionData(transactionData);
      setVerificationResult(verification);
      setIsVerificationModalOpen(true);
      return;
    }

    // Jeśli kurs jest OK, zapisz bezpośrednio
    onSave(transactionData, transaction?.id);
    // Odśwież balance po zapisaniu transakcji (małe opóźnienie aby portfel był zaktualizowany)
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 200);
    resetForm();
  };

  const handleConfirmVerification = () => {
    if (pendingTransactionData) {
      onSave(pendingTransactionData, transaction?.id);
      // Odśwież balance po zapisaniu transakcji (małe opóźnienie aby portfel był zaktualizowany)
      setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 200);
      resetForm();
    }
    setIsVerificationModalOpen(false);
    setPendingTransactionData(null);
    setVerificationResult(null);
  };

  const handleCancelVerification = () => {
    setIsVerificationModalOpen(false);
    setPendingTransactionData(null);
    setVerificationResult(null);
  };

  const resetForm = () => {
    setFromAmount("");
    setToAmount("");
    setFee("");
    setNote("");
    setLocation("");
    setTime("");
    setSelectedCountryId(countryId || "");
    setSearchQueryFrom("");
    setSearchQueryTo("");
    setIsDropdownOpenFrom(false);
    setIsDropdownOpenTo(false);
  };

  const calculateRate = () => {
    const from = parseFloat(fromAmount);
    const to = parseFloat(toAmount);
    if (from > 0 && to > 0) {
      return (to / from).toFixed(4);
    }
    return "0";
  };

  // Pobierz kurs z API dla wybranej pary walut
  const getApiRate = (): number | null => {
    if (exchangeRates.length === 0) {
      return null;
    }
    
    // Użyj najnowszego kursu (bez filtrowania po dacie jeśli data jest w przyszłości)
    const useDate = date && new Date(date) <= new Date() ? date : undefined;
    return getReferenceRate(exchangeRates, fromCurrency, toCurrency, useDate);
  };

  const apiRate = getApiRate();

  // Filtrowanie walut na podstawie zapytania wyszukiwania
  const filteredCurrenciesFrom = useMemo(() => {
    const filtered = sortedCurrenciesFrom.filter((curr) => {
      const searchText = getCurrencySearchText(curr.code);
      return searchText.includes(searchQueryFrom.toLowerCase());
    });
    return filtered;
  }, [sortedCurrenciesFrom, searchQueryFrom]);

  const filteredCurrenciesTo = useMemo(() => {
    return sortedCurrenciesTo.filter((curr) => {
      const searchText = getCurrencySearchText(curr.code);
      return searchText.includes(searchQueryTo.toLowerCase());
    });
  }, [sortedCurrenciesTo, searchQueryTo]);

  // Oblicz dostępne środki dla wybranej waluty "Z waluty"
  // Użyj bezpośrednio getWallet aby zawsze mieć aktualne dane
  // Dodaj refreshTrigger do zależności aby odświeżać po zapisaniu transakcji
  const availableBalance = useMemo(() => {
    if (!fromCurrency || !tripId) {
      return null;
    }

    try {
      // Dla nowego systemu wallet
      const wallet = getWallet(tripId);
      if (wallet) {
        // Jeśli countryId jest dostępne, użyj sald dla kraju (podobnie jak w AddExpenseFromDashboardModal)
        if (countryId) {
          const countryBalances = getBalancesForCountry(wallet, tripId, countryId);
          const balance = countryBalances.find(b => b.currency === fromCurrency);
          const balanceAmount = balance ? balance.amount : 0;
          return balanceAmount;
        }
        
        // W przeciwnym razie użyj globalnych sald
        const balance = getCurrencyBalance(wallet, fromCurrency);
        return balance;
      }

      // Dla starego systemu, użyj calculateCurrencyBalances
      if (slug) {
        const trip = getTripBySlug(slug);
        if (!trip) return null;

        const balances = calculateCurrencyBalances(trip, countryId);
        const balance = getBalanceForCurrency(balances, fromCurrency);
        
        return balance ? balance.amount : null;
      }
      
      return null;
    } catch (error) {
      console.error("[AddCurrencyTransactionModal] Error calculating balance:", error);
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshTrigger intentional for manual refresh
  }, [fromCurrency, tripId, slug, countryId, refreshTrigger]);

  // Odśwież balance gdy modal się otwiera lub zmienia się fromCurrency
  useEffect(() => {
    if (isOpen && fromCurrency) {
      // Małe opóźnienie aby upewnić się że portfel jest zaktualizowany
      const timer = setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fromCurrency]);

  // Zamknij dropdown po kliknięciu poza nim
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.currency-select-from') && !target.closest('.currency-select-to')) {
        setIsDropdownOpenFrom(false);
        setIsDropdownOpenTo(false);
      }
    };
    if (isDropdownOpenFrom || isDropdownOpenTo) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpenFrom, isDropdownOpenTo]);

  // Pobierz listę krajów z podróży
  const countries = useMemo(() => {
    if (!slug) return [];
    const trip = getTripBySlug(slug);
    return trip?.data?.countries || [];
  }, [slug]);

  // Przygotuj opcje dla Select (z opcją "Brak przypisania")
  const countryOptions = useMemo(() => {
    return [
      { value: "", label: "Brak przypisania" },
      ...countries.map((country) => ({
        value: country.id,
        label: country.name,
      })),
    ];
  }, [countries]);

  // Funkcja sugerująca kraj na podstawie daty transakcji
  const suggestCountryByDate = useMemo(() => {
    if (!date || !slug) return null;
    const trip = getTripBySlug(slug);
    if (!trip) return null;
    
    const transactionDate = new Date(date);
    transactionDate.setHours(0, 0, 0, 0);
    
    for (const country of trip.data.countries) {
      if (country.startDate && country.endDate) {
        const startDate = new Date(country.startDate);
        const endDate = new Date(country.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        if (transactionDate >= startDate && transactionDate <= endDate) {
          return country.id;
        }
      }
    }
    return null;
  }, [date, slug]);

  // Oblicz progress wypełnienia formularza (0-100%)
  const formProgress = useMemo(() => {
    let filled = 0;
    const total = 6; // waluty (2), kwoty (2), data (1), kraj (1)
    
    if (fromCurrency) filled++;
    if (toCurrency) filled++;
    if (fromAmount) filled++;
    if (toAmount) filled++;
    if (date) filled++;
    if (selectedCountryId) filled++;
    
    return Math.round((filled / total) * 100);
  }, [fromCurrency, toCurrency, fromAmount, toAmount, date, selectedCountryId]);

  // Pobierz miejsca z wybranego kraju dla sugestii
  const countryLocations = useMemo(() => {
    if (!selectedCountryId || !slug) return [];
    const trip = getTripBySlug(slug);
    if (!trip) return [];
    
    const country = trip.data.countries.find(c => c.id === selectedCountryId);
    if (!country || !country.locations) return [];
    
    return country.locations
      .filter(loc => typeof loc !== "string" && loc.name)
      .map(loc => typeof loc === "string" ? loc : loc.name);
  }, [selectedCountryId, slug]);

  // Automatycznie sugeruj kraj na podstawie daty (tylko jeśli kraj nie jest jeszcze wybrany)
  useEffect(() => {
    if (!selectedCountryId && suggestCountryByDate && isOpen && !transaction) {
      setSelectedCountryId(suggestCountryByDate);
    }
  }, [suggestCountryByDate, selectedCountryId, isOpen, transaction]);

  // Wypełnij formularz danymi transakcji w trybie edycji
  useEffect(() => {
    if (transaction && isOpen) {
      setFromCurrency(transaction.fromCurrency);
      setFromAmount(transaction.fromAmount.toString());
      setToCurrency(transaction.toCurrency);
      setToAmount(transaction.toAmount.toString());
      setFee(transaction.fee?.toString() || "");
      setFeeCurrency(transaction.feeCurrency || "PLN");
      setDate(transaction.date);
      setTime(transaction.time || "");
      setLocation(transaction.location || "");
      setNote(transaction.note || "");
      setSelectedCountryId(transaction.countryId || "");
      setSearchQueryFrom(`${transaction.fromCurrency} - ${CURRENCY_NAMES[transaction.fromCurrency] || transaction.fromCurrency}`);
      setSearchQueryTo(`${transaction.toCurrency} - ${CURRENCY_NAMES[transaction.toCurrency] || transaction.toCurrency}`);
    } else if (!transaction && isOpen) {
      // Reset formularza gdy nie ma transakcji (tryb dodawania)
      // Pola walut pozostają puste domyślnie
      setFromCurrency("");
      setFromAmount("");
      setToCurrency("");
      setToAmount("");
      setFee("");
      setFeeCurrency("PLN");
      setDate(new Date().toISOString().split("T")[0]);
      setTime("");
      setLocation("");
      setNote("");
      setSelectedCountryId(countryId || "");
      setSearchQueryFrom("");
      setSearchQueryTo("");
    }
  }, [transaction, isOpen, walletCurrencies, countryId]);

  // Resetuj waluty gdy zmienia się typ transakcji (jeśli nie są dostępne w portfelu)
  useEffect(() => {
    // Nie ustawiamy domyślnych wartości - pola pozostają puste
    // Użytkownik musi wybrać waluty ręcznie
  }, [walletCurrencies, fromCurrency]);

  // Ustaw wartość wyszukiwania gdy zmienia się waluta (tylko jeśli waluta jest wybrana)
  // W trybie edycji (transaction) nie czyścimy pól – wypełnia je efekt wyżej
  useEffect(() => {
    if (fromCurrency && !transaction) {
      const expectedValue = `${fromCurrency} - ${CURRENCY_NAMES[fromCurrency] || fromCurrency}`;
      if (searchQueryFrom !== expectedValue) {
        setSearchQueryFrom(expectedValue);
      }
    } else if (!fromCurrency && !transaction) {
      setSearchQueryFrom("");
    }
  }, [fromCurrency, transaction]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ustaw wartość wyszukiwania dla "Na walutę" gdy zmienia się waluta
  useEffect(() => {
    if (toCurrency && !transaction) {
      const expectedValue = `${toCurrency} - ${CURRENCY_NAMES[toCurrency] || toCurrency}`;
      if (searchQueryTo !== expectedValue) {
        setSearchQueryTo(expectedValue);
      }
    } else if (!toCurrency && !transaction) {
      setSearchQueryTo("");
    }
  }, [toCurrency, transaction]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (toCurrency && !transaction) {
      const expectedValue = `${toCurrency} - ${CURRENCY_NAMES[toCurrency] || toCurrency}`;
      if (searchQueryTo === "" || searchQueryTo !== expectedValue) {
        setSearchQueryTo(expectedValue);
      }
    }
  }, [toCurrency, transaction]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-6">
            <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100">
              {transaction ? "Edytuj transakcję walutową" : "Dodaj transakcję walutową"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Główne informacje - zawsze widoczne */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Główne informacje</h3>
              {fromCurrency && toCurrency && fromAmount && toAmount && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
            </div>
            
            {/* From/To Currencies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="relative currency-select-from">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Z waluty
              </label>
              {availableBalance !== null && fromCurrency && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Dostępne środki: {formatCurrency(availableBalance, fromCurrency)}
                </p>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Wpisz kod lub nazwę (np. USD, dolar)..."
                  value={searchQueryFrom}
                  onChange={(e) => {
                    setSearchQueryFrom(e.target.value);
                    setIsDropdownOpenFrom(true);
                  }}
                  onFocus={() => setIsDropdownOpenFrom(true)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoadingCurrencies}
                />
                {isDropdownOpenFrom && filteredCurrenciesFrom.length > 0 && (
                  <div 
                    className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {filteredCurrenciesFrom.map((curr) => (
                      <button
                        key={curr.code}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFromCurrency(curr.code);
                          setSearchQueryFrom(`${curr.code} - ${curr.name}`);
                          setIsDropdownOpenFrom(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <div className="font-medium">
                          {curr.code} - {curr.name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                placeholder="0.00"
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "PageUp" || e.key === "PageDown") {
                    e.preventDefault();
                  }
                }}
                onWheel={(e) => {
                  e.currentTarget.blur();
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md mt-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div className="flex justify-center pb-8">
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>

            <div className="relative currency-select-to">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Na walutę
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Wpisz kod lub nazwę (np. THB, baht)..."
                  value={searchQueryTo}
                  onChange={(e) => {
                    setSearchQueryTo(e.target.value);
                    setIsDropdownOpenTo(true);
                  }}
                  onFocus={() => setIsDropdownOpenTo(true)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoadingCurrencies}
                />
                {isDropdownOpenTo && filteredCurrenciesTo.length > 0 && (
                  <div 
                    className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {filteredCurrenciesTo.map((curr) => (
                      <button
                        key={curr.code}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setToCurrency(curr.code);
                          setSearchQueryTo(`${curr.code} - ${curr.name}`);
                          setIsDropdownOpenTo(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <div className="font-medium">
                          {curr.code} - {curr.name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="number"
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
                placeholder="0.00"
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "PageUp" || e.key === "PageDown") {
                    e.preventDefault();
                  }
                }}
                onWheel={(e) => {
                  e.currentTarget.blur();
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md mt-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Exchange Rate */}
          <div className="space-y-2">
            {fromAmount && toAmount && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Kurs wymiany: 1 {fromCurrency} = {calculateRate()} {toCurrency}
                </p>
              </div>
            )}
            {apiRate !== null && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-3 border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Kurs z API: 1 {fromCurrency} = {apiRate.toFixed(4)} {toCurrency}
                </p>
                {fromCurrency !== toCurrency && (
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    (1 {toCurrency} = {(1 / apiRate).toFixed(4)} {fromCurrency})
                  </p>
                )}
              </div>
            )}
            {apiRate === null && exchangeRates.length > 0 && !isLoadingRates && fromCurrency && toCurrency && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-md p-3 border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  ⚠️ Nie znaleziono kursu z API dla pary {fromCurrency}/{toCurrency}
                </p>
              </div>
            )}
          </div>

          {/* Fee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prowizja (opcjonalna)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="0.00"
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "PageUp" || e.key === "PageDown") {
                    e.preventDefault();
                  }
                }}
                onWheel={(e) => {
                  e.currentTarget.blur();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <select
                value={feeCurrency}
                onChange={(e) => setFeeCurrency(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={isLoadingCurrencies}
              >
                {sortedCurrenciesTo.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
          </div>

          {/* Przypisanie do kraju - wyróżnione */}
          {countries.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Przypisz do kraju
                </label>
                {selectedCountryId && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pomaga w organizacji wydatków według kraju
              </p>
              <Select
                value={selectedCountryId}
                onChange={setSelectedCountryId}
                options={countryOptions}
                placeholder="Wybierz kraj"
              />
              {selectedCountryId && (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 mt-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Przypisano do {countries.find(c => c.id === selectedCountryId)?.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Szczegóły - rozwijana sekcja */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedDetails(!expandedDetails)}
              className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Szczegóły</h3>
                {date && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
              </div>
              {expandedDetails ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedDetails && (
              <div className="p-5 space-y-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Godzina (opcjonalna)
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Miejsce (opcjonalne)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="np. Bangkok, kantor na Sukhumvit"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  {countryLocations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {countryLocations.slice(0, 3).map((loc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLocation(loc)}
                          className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
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
                {note && (
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
                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notatka (opcjonalna)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Dodatkowe informacje..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          {!selectedCountryId && countries.length > 0 && (
            <div className="px-6 pt-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 Przypisanie do kraju pomoże w lepszej organizacji wydatków
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-3 p-6">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Anuluj
            </Button>
            <Button variant="primary" onClick={handleSave} className="flex-1">
              {transaction ? "Zapisz zmiany" : "Zapisz transakcję"}
            </Button>
          </div>
        </div>
      </div>

      {/* Exchange Rate Verification Modal */}
      {isVerificationModalOpen && verificationResult && pendingTransactionData && (
        <ExchangeRateVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={handleCancelVerification}
          onConfirm={handleConfirmVerification}
          verification={verificationResult}
          fromCurrency={pendingTransactionData.fromCurrency}
          toCurrency={pendingTransactionData.toCurrency}
          fromAmount={pendingTransactionData.fromAmount}
          toAmount={pendingTransactionData.toAmount}
        />
      )}
    </div>
  );
}
