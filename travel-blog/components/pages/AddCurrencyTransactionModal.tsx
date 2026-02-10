"use client";

import { useState, useEffect, useMemo } from "react";
import { X, ArrowRight, Search } from "lucide-react";
import Button from "@/components/ui/Button";
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
import { getCurrencyBalance } from "@/lib/travel-wallet/wallet-operations";

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

// Pełna lista nazw walut ISO 4217 w języku polskim (skopiowane z kursy/page.tsx)
const currencyNames: Record<string, string> = {
  // Główne waluty
  PLN: "Polski złoty",
  USD: "Dolar amerykański",
  EUR: "Euro",
  GBP: "Funt brytyjski",
  JPY: "Jen japoński",
  CHF: "Frank szwajcarski",
  AUD: "Dolar australijski",
  CAD: "Dolar kanadyjski",
  CNY: "Yuan chiński",
  HKD: "Dolar hongkoński",
  NZD: "Dolar nowozelandzki",
  SGD: "Dolar singapurski",
  MOP: "Pataca makauńska",
  
  // Azja
  THB: "Baht tajski",
  KRW: "Won południowokoreański",
  TWD: "Dolar tajwański",
  INR: "Rupia indyjska",
  IDR: "Rupia indonezyjska",
  PHP: "Peso filipińskie",
  MYR: "Ringgit malezyjski",
  VND: "Dong wietnamski",
  PKR: "Rupia pakistańska",
  BDT: "Taka bengalska",
  LKR: "Rupia lankijska",
  NPR: "Rupia nepalska",
  MMK: "Kiat birmański",
  KHR: "Riel kambodżański",
  LAK: "Kip laotański",
  MNT: "Tugrik mongolski",
  MVR: "Rufija malediwska",
  
  // Europa
  SEK: "Korona szwedzka",
  NOK: "Korona norweska",
  DKK: "Korona duńska",
  ISK: "Korona islandzka",
  CZK: "Korona czeska",
  HUF: "Forint węgierski",
  RON: "Lej rumuński",
  BGN: "Lew bułgarski",
  HRK: "Kuna chorwacka",
  RSD: "Dinar serbski",
  BAM: "Marka zamienna Bośni i Hercegowiny",
  MKD: "Denar macedoński",
  ALL: "Lek albański",
  MDL: "Lej mołdawski",
  UAH: "Hrywna ukraińska",
  BYN: "Rubel białoruski",
  RUB: "Rubel rosyjski",
  GEL: "Lari gruziński",
  AMD: "Dram armeński",
  AZN: "Manat azerski",
  KZT: "Tenge kazachski",
  KGS: "Som kirgiski",
  UZS: "Som uzbecki",
  TJS: "Somoni tadżycki",
  TMT: "Manat turkmeński",
  
  // Bliski Wschód
  ILS: "Szekel izraelski",
  AED: "Dirham ZEA",
  SAR: "Rijal saudyjski",
  QAR: "Rijal katarski",
  KWD: "Dinar kuwejcki",
  BHD: "Dinar bahrajński",
  OMR: "Rial omański",
  JOD: "Dinar jordański",
  LBP: "Funt libański",
  SYP: "Funt syryjski",
  IQD: "Dinar iracki",
  IRR: "Rial irański",
  AFN: "Afgani afgański",
  YER: "Rial jemeński",
  
  // Afryka
  ZAR: "Rand południowoafrykański",
  EGP: "Funt egipski",
  NGN: "Naira nigeryjska",
  KES: "Szyling kenijski",
  UGX: "Szyling ugandyjski",
  TZS: "Szyling tanzański",
  ETB: "Birr etiopski",
  GHS: "Cedi ghański",
  XOF: "Frank CFA BCEAO",
  XAF: "Frank CFA BEAC",
  MAD: "Dirham marokański",
  TND: "Dinar tunezyjski",
  DZD: "Dinar algierski",
  LYD: "Dinar libijski",
  SDG: "Funt sudański",
  SSP: "Funt południowosudański",
  AOA: "Kwanza angolska",
  MZN: "Metical mozambicki",
  ZMW: "Kwacha zambijska",
  BWP: "Pula botswańska",
  MUR: "Rupia maurytyjska",
  SCR: "Rupia seszelska",
  MGA: "Ariary malgaska",
  
  // Ameryka Północna i Środkowa
  MXN: "Peso meksykańskie",
  GTQ: "Quetzal gwatemalski",
  BZD: "Dolar belizeński",
  HNL: "Lempira honduraska",
  NIO: "Córdoba nikaraguańska",
  CRC: "Colón kostarykański",
  PAB: "Balboa panamska",
  DOP: "Peso dominikańskie",
  HTG: "Gourde haitański",
  JMD: "Dolar jamajski",
  BBD: "Dolar barbadoski",
  BSD: "Dolar bahamski",
  XCD: "Dolar wschodniokaraibski",
  TTD: "Dolar trynidadzki",
  AWG: "Florin arubański",
  ANG: "Gulden antylski",
  CUP: "Peso kubańskie",
  
  // Ameryka Południowa
  BRL: "Real brazylijski",
  ARS: "Peso argentyńskie",
  CLP: "Peso chilijskie",
  COP: "Peso kolumbijskie",
  PEN: "Sol peruwiański",
  UYU: "Peso urugwajskie",
  PYG: "Guarani paragwajski",
  BOB: "Boliviano",
  VES: "Bolívar wenezuelski",
  GYD: "Dolar gujański",
  SRD: "Dolar surinamski",
  FKP: "Funt falklandzki",
  
  // Oceania
  FJD: "Dolar fidżyjski",
  PGK: "Kina papuaska",
  SBD: "Dolar Wysp Salomona",
  TOP: "Pa'anga tongijska",
  WST: "Tala samoańska",
  VUV: "Vatu vanuackie",
  XPF: "Frank CFP",
  
  // Inne
  TRY: "Lira turecka",
  BND: "Dolar brunejski",
  KYD: "Dolar kajmański",
  BMD: "Dolar bermudzki",
  GIP: "Funt gibraltarski",
  SHP: "Funt Świętej Heleny",
  ERN: "Nakfa erytrejska",
  DJF: "Frank dżibutyjski",
  SOS: "Szyling somalijski",
  KMF: "Frank komoryjski",
  RWF: "Frank rwandyjski",
  BIF: "Frank burundyjski",
  MWK: "Kwacha malawijska",
  ZWL: "Dolar Zimbabwe",
  STN: "Dobra Wysp Świętego Tomasza i Książęcej",
  CVE: "Escudo zielonoprzylądkowe",
  GMD: "Dalasi gambijska",
  GNF: "Frank gwinejski",
  SLL: "Leone sierraleoński",
  SLE: "Leone sierraleoński",
  LRD: "Dolar liberyjski",
  CDF: "Frank kongijski",
  SZL: "Lilangeni suazyjski",
  LSL: "Loti lesotyjski",
  NAD: "Dolar namibijski",
  BTN: "Ngultrum bhutański",
  CLF: "Unidad de Fomento chilijska",
  CNH: "Yuan chiński (offshore)",
  FOK: "Korona Wysp Owczych",
  GGP: "Funt Guernsey",
  IMP: "Funt Man",
  JEP: "Funt Jersey",
  KID: "Dolar kiribatyjski",
  MRU: "Ugija mauretańska",
  TVD: "Dolar tuvalu",
  XCG: "Korona wschodniokaraibska",
  ZWG: "Dolar Zimbabwe (2009)",
};

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
  const name = currencyNames[currency] || currency;
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
  
  console.log('[AddCurrencyTransactionModal] Props received:', {
    walletCurrencies,
    walletCurrenciesLength: walletCurrencies.length,
    availableCurrencies: propAvailableCurrencies?.length,
  });
  
  const [type, setType] = useState<"exchange" | "withdrawal" | "initial">("exchange");
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

  // Pobierz dostępne waluty z API
  useEffect(() => {
    if (propAvailableCurrencies) {
      // Upewnij się, że PLN jest zawsze w liście (jeśli nie ma, dodaj na początku)
      const currenciesWithPLN = propAvailableCurrencies.includes('PLN') 
        ? propAvailableCurrencies 
        : ['PLN', ...propAvailableCurrencies];
      console.log('[AddCurrencyTransactionModal] Using propAvailableCurrencies:', {
        count: currenciesWithPLN.length,
        hasPLN: currenciesWithPLN.includes('PLN'),
        currencies: currenciesWithPLN.slice(0, 10), // pierwsze 10 dla debugowania
      });
      setAvailableCurrencies(currenciesWithPLN);
      setIsLoadingCurrencies(false);
      return;
    }

    const fetchCurrencies = async () => {
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
            console.log('[AddCurrencyTransactionModal] Fetched currencies from API:', {
              count: currenciesWithPLN.length,
              hasPLN: currenciesWithPLN.includes('PLN'),
              currencies: currenciesWithPLN.slice(0, 10), // pierwsze 10 dla debugowania
            });
            setAvailableCurrencies(currenciesWithPLN);
          }
        }
      } catch (error) {
        console.error("Error fetching currencies:", error);
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
          console.log("[AddCurrencyTransactionModal] Fetched exchange rates:", {
            success: data.success,
            ratesCount: data.rates?.length || 0,
            rates: data.rates?.slice(0, 5), // pierwsze 5 dla debugowania
          });
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

  // Filtruj dostępne waluty dla "Z waluty" (fromCurrency) - tylko waluty z portfela (dla exchange/withdrawal)
  const filteredAvailableCurrenciesFrom = useMemo(() => {
    // Dla typu "initial" - pokaż wszystkie waluty
    if (type === "initial") {
      return availableCurrencies;
    }
    
    // Dla exchange/withdrawal - tylko waluty z portfela
    // Jeśli brak walletCurrencies, nie pokazuj żadnych walut (użytkownik musi najpierw dodać budżet)
    if (!walletCurrencies || walletCurrencies.length === 0) {
      console.warn('[AddCurrencyTransactionModal] walletCurrencies is empty or undefined, type:', type);
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
    
    console.log('[AddCurrencyTransactionModal] Filtering currencies:', {
      type,
      walletCurrenciesCount: walletCurrencies.length,
      walletCurrencies,
      availableCurrenciesCount: availableCurrencies.length,
      availableCurrenciesHasPLN: availableCurrencies.includes('PLN'),
      availableCurrenciesHasEUR: availableCurrencies.includes('EUR'),
      filteredCount: currenciesToShow.length,
      filtered: currenciesToShow,
      filteredHasPLN: currenciesToShow.includes('PLN'),
      filteredHasEUR: currenciesToShow.includes('EUR'),
    });
    
    return currenciesToShow;
  }, [type, availableCurrencies, walletCurrencies]);

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
        name: currencyNames[code] || code,
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
        name: currencyNames[code] || code,
        symbol: CURRENCY_SYMBOLS[code] || code,
        isPreferred: true,
      }));

    const others = filteredAvailableCurrenciesFrom
      .filter(code => !preferredCurrencies.has(code))
      .map(code => ({
        code,
        name: currencyNames[code] || code,
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
        name: currencyNames[code] || code,
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
        name: currencyNames[code] || code,
        symbol: CURRENCY_SYMBOLS[code] || code,
        isPreferred: true,
      }));

    const others = filteredAvailableCurrenciesTo
      .filter(code => !preferredCurrencies.has(code))
      .map(code => ({
        code,
        name: currencyNames[code] || code,
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
        const rate = to / from;
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

    // Walidacja walut w portfelu (dla exchange/withdrawal)
    if (type === "exchange" || type === "withdrawal") {
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
        if (tripId && slug) {
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
              // Jeśli nie ma salda, sprawdź budżet początkowy
              console.warn(`[AddCurrencyTransactionModal] No balance found for ${fromCurrency}, checking initial balances`);
            }
          }
        }
        // "Na walutę" może być dowolna - nie sprawdzamy
      }
    }

    const transactionData: Omit<CurrencyTransaction, "id" | "tripId" | "rate"> = {
      type,
      date,
      time: time || undefined,
      fromCurrency,
      fromAmount: from,
      toCurrency,
      toAmount: to,
      rate: to / from,
      fee: feeValue,
      feeCurrency: feeValue ? feeCurrency : undefined,
      note: note || undefined,
      location: location || undefined,
      countryId,
    };

    // Weryfikacja kursu tylko dla wymiany i wypłaty (nie dla stanu początkowego)
    if (type === "exchange" || type === "withdrawal") {
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
      const usdToPlnRate = exchangeRates.find(r => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency);
      const reverseRate = exchangeRates.find(r => r.fromCurrency === toCurrency && r.toCurrency === fromCurrency);
      console.log("[AddCurrencyTransactionModal] Verifying rate:", {
        transactionRate: `${transactionRate.toFixed(4)} ${toCurrency} za 1 ${fromCurrency}`,
        fromCurrency,
        toCurrency,
        fromAmount: from,
        toAmount: to,
        exchangeRatesCount: exchangeRates.length,
        date,
        directRate: usdToPlnRate ? `${usdToPlnRate.rate} ${usdToPlnRate.toCurrency} za 1 ${usdToPlnRate.fromCurrency}` : "not found",
        reverseRate: reverseRate ? `${(1/reverseRate.rate).toFixed(4)} ${reverseRate.fromCurrency} za 1 ${reverseRate.toCurrency}` : "not found",
        sampleRates: exchangeRates.slice(0, 5).map(r => `${r.fromCurrency}/${r.toCurrency}: ${r.rate}`),
      });
      
      const verification = verifyExchangeRate(
        transactionRate,
        fromCurrency,
        toCurrency,
        exchangeRates,
        date
      );

      console.log("[AddCurrencyTransactionModal] Verification result:", {
        isValid: verification.isValid,
        transactionRate: verification.transactionRate,
        referenceRate: verification.referenceRate,
        differencePercent: verification.differencePercent,
        isAboveLimit: verification.isAboveLimit,
        isBelowLimit: verification.isBelowLimit,
      });

      // Jeśli kurs jest poza granicami ±10%, pokaż modal weryfikacji
      // Również jeśli nie znaleziono kursu referencyjnego (referenceRate === null), 
      // ale to nie powinno się zdarzyć jeśli mamy kursy w API
      if (!verification.isValid) {
        console.log("[AddCurrencyTransactionModal] Rate is invalid, showing verification modal");
        setPendingTransactionData(transactionData);
        setVerificationResult(verification);
        setIsVerificationModalOpen(true);
        return;
      } else {
        console.log("[AddCurrencyTransactionModal] Rate is valid, proceeding with save");
      }
    } else {
      console.log("[AddCurrencyTransactionModal] Skipping verification:", {
        type,
        exchangeRatesLength: exchangeRates.length,
        isLoadingRates,
        shouldVerify: (type === "exchange" || type === "withdrawal") && !isLoadingRates && exchangeRates.length > 0,
      });
    }

    // Jeśli kurs jest OK lub to stan początkowy, zapisz bezpośrednio
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
    if (type === "initial" || exchangeRates.length === 0) {
      return null;
    }
    
    // Użyj najnowszego kursu (bez filtrowania po dacie jeśli data jest w przyszłości)
    const useDate = date && new Date(date) <= new Date() ? date : undefined;
    return getReferenceRate(exchangeRates, fromCurrency, toCurrency, useDate);
  };

  const apiRate = getApiRate();

  // Filtrowanie walut na podstawie zapytania wyszukiwania
  const filteredCurrenciesFrom = useMemo(() => {
    console.log('[AddCurrencyTransactionModal] filteredCurrenciesFrom calculation:', {
      sortedCurrenciesFromCount: sortedCurrenciesFrom.length,
      sortedCurrenciesFrom: sortedCurrenciesFrom.map(c => c.code),
      searchQueryFrom,
    });
    const filtered = sortedCurrenciesFrom.filter((curr) => {
      const searchText = getCurrencySearchText(curr.code);
      return searchText.includes(searchQueryFrom.toLowerCase());
    });
    console.log('[AddCurrencyTransactionModal] filteredCurrenciesFrom result:', {
      filteredCount: filtered.length,
      filtered: filtered.map(c => c.code),
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
    if (!fromCurrency || type === "initial" || !tripId) {
      return null;
    }

    try {
      // Dla nowego systemu wallet, użyj danych z portfela bezpośrednio
      const wallet = getWallet(tripId);
      if (wallet) {
        const balance = getCurrencyBalance(wallet, fromCurrency);
        console.log(`[AddCurrencyTransactionModal] Available balance for ${fromCurrency}:`, balance, 'refreshTrigger:', refreshTrigger);
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
  }, [fromCurrency, type, tripId, slug, countryId, refreshTrigger]);

  // Odśwież balance gdy modal się otwiera lub zmienia się fromCurrency
  useEffect(() => {
    if (isOpen && fromCurrency && type !== "initial") {
      // Małe opóźnienie aby upewnić się że portfel jest zaktualizowany
      const timer = setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fromCurrency, type]);

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

  // Wypełnij formularz danymi transakcji w trybie edycji
  useEffect(() => {
    if (transaction && isOpen) {
      setType(transaction.type);
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
      setSearchQueryFrom(`${transaction.fromCurrency} - ${currencyNames[transaction.fromCurrency] || transaction.fromCurrency}`);
      setSearchQueryTo(`${transaction.toCurrency} - ${currencyNames[transaction.toCurrency] || transaction.toCurrency}`);
    } else if (!transaction && isOpen) {
      // Reset formularza gdy nie ma transakcji (tryb dodawania)
      setType("exchange");
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
      setSearchQueryFrom("");
      setSearchQueryTo("");
    }
  }, [transaction, isOpen, walletCurrencies]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resetuj waluty gdy zmienia się typ transakcji (jeśli nie są dostępne w portfelu)
  useEffect(() => {
    if (type === "initial") {
      // Dla initial - wszystkie waluty są dostępne, nie resetuj
      return;
    }
    
    // Nie ustawiamy domyślnych wartości - pola pozostają puste
    // Użytkownik musi wybrać waluty ręcznie
  }, [type, walletCurrencies, fromCurrency]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ustaw wartość wyszukiwania gdy zmienia się waluta (tylko jeśli waluta jest wybrana)
  useEffect(() => {
    if (fromCurrency && !transaction) {
      const expectedValue = `${fromCurrency} - ${currencyNames[fromCurrency] || fromCurrency}`;
      if (searchQueryFrom !== expectedValue) {
        setSearchQueryFrom(expectedValue);
      }
    } else if (!fromCurrency) {
      // Jeśli waluta jest pusta, wyczyść też pole wyszukiwania
      setSearchQueryFrom("");
    }
  }, [fromCurrency, transaction]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ustaw wartość wyszukiwania dla "Na walutę" gdy zmienia się waluta
  useEffect(() => {
    if (toCurrency && !transaction) {
      const expectedValue = `${toCurrency} - ${currencyNames[toCurrency] || toCurrency}`;
      if (searchQueryTo !== expectedValue) {
        setSearchQueryTo(expectedValue);
      }
    } else if (!toCurrency) {
      // Jeśli waluta jest pusta, wyczyść też pole wyszukiwania
      setSearchQueryTo("");
    }
  }, [toCurrency, transaction]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (toCurrency && !transaction) {
      const expectedValue = `${toCurrency} - ${currencyNames[toCurrency] || toCurrency}`;
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Typ transakcji
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setType("exchange")}
                className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                  type === "exchange"
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300"
                    : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                Wymiana
              </button>
              <button
                onClick={() => setType("withdrawal")}
                className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                  type === "withdrawal"
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300"
                    : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                Wypłata z bankomatu
              </button>
              <button
                onClick={() => setType("initial")}
                className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                  type === "initial"
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300"
                    : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                Stan początkowy
              </button>
            </div>
          </div>

          {/* From/To Currencies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="relative currency-select-from">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {type === "initial" ? "Waluta" : "Z waluty"}
              </label>
              {availableBalance !== null && fromCurrency && type !== "initial" && (
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
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md mt-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {type !== "initial" && (
              <>
                <div className="flex justify-center pb-8">
                  <ArrowRight className="w-6 h-6 text-gray-400" />
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
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md mt-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </>
            )}
          </div>

          {/* Exchange Rate */}
          {type !== "initial" && (
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
              {apiRate === null && exchangeRates.length > 0 && !isLoadingRates && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-md p-3 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    ⚠️ Nie znaleziono kursu z API dla pary {fromCurrency}/{toCurrency}
                  </p>
                </div>
              )}
            </div>
          )}

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
                step="0.01"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
          </div>

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

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Anuluj
          </Button>
          <Button variant="primary" onClick={handleSave} className="flex-1">
            {transaction ? "Zapisz zmiany" : "Zapisz transakcję"}
          </Button>
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
