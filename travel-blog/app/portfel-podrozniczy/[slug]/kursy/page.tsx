"use client";

import { useState, useEffect, use } from "react";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import Link from "@/components/ui/Link";
import { useTripData } from "@/lib/travel-wallet/hooks/useTripData";
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Minus, Plus, X, Search, Edit, Check, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useToast } from "@/components/ui/Toast";
import BackToHome from "@/components/shared/BackToHome";

interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: string;
  source: string;
}

interface ExchangeRatesResponse {
  success: boolean;
  rates: ExchangeRate[];
  baseCurrency: string;
  date: string;
}

// Pełna lista nazw walut ISO 4217 w języku polskim
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

const currencySymbols: Record<string, string> = {
  PLN: "zł",
  EUR: "€",
  USD: "$",
  GBP: "£",
  THB: "฿",
  JPY: "¥",
  KRW: "₩",
  TWD: "NT$",
  AUD: "A$",
  CAD: "C$",
  MXN: "$",
  BRL: "R$",
  CNY: "¥",
  HKD: "$",
  SGD: "$",
  NZD: "$",
  CHF: "CHF",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  INR: "₹",
  IDR: "Rp",
  PHP: "₱",
  MYR: "RM",
  VND: "₫",
  ZAR: "R",
  TRY: "₺",
  RUB: "₽",
  ILS: "₪",
  AED: "د.إ",
  SAR: "﷼",
  ARS: "$",
  CLP: "$",
  COP: "$",
  PEN: "S/",
  UAH: "₴",
  CZK: "Kč",
  HUF: "Ft",
  RON: "lei",
  BGN: "лв",
  HRK: "kn",
  ISK: "kr",
};

// Dostępne waluty będą pobierane dynamicznie z API
// Fallback lista dla przypadku gdy API nie działa
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

// Domyślne wybrane pary
const DEFAULT_SELECTED_PAIRS: CurrencyPair[] = [
  { fromCurrency: "USD", toCurrency: "PLN" },
  { fromCurrency: "EUR", toCurrency: "PLN" },
];

function getStorageKey(slug: string): string {
  return `exchange-rates-selected-pairs-${slug}`;
}

function loadSelectedPairs(slug: string): CurrencyPair[] {
  if (typeof window === "undefined") return DEFAULT_SELECTED_PAIRS;
  try {
    const stored = localStorage.getItem(getStorageKey(slug));
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Migracja ze starego formatu (string[]) do nowego (CurrencyPair[])
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

function saveSelectedPairs(slug: string, pairs: CurrencyPair[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(slug), JSON.stringify(pairs));
  } catch (error) {
    console.error("Error saving selected pairs:", error);
  }
}

function getCurrencySearchText(currency: string): string {
  const name = currencyNames[currency] || currency;
  return `${currency} ${name}`.toLowerCase();
}

function formatRate(rate: number, currency?: string): string {
  if (currency && (currency === "JPY" || currency === "KRW")) {
    return new Intl.NumberFormat("pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(rate);
  }
  return new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(rate);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

interface SortableCurrencyPairProps {
  id: string;
  pair: CurrencyPair;
  rate: ExchangeRate;
  change: {
    icon: typeof TrendingUp;
    color: string;
    text: string;
  } | null;
  isEditing: boolean;
  onEdit: (pair: CurrencyPair) => void;
  onRemove: (pair: CurrencyPair) => void;
}

function SortableCurrencyPair({
  id,
  pair,
  rate,
  change,
  isEditing,
  onEdit,
  onRemove,
}: SortableCurrencyPairProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const rateKey = `${pair.fromCurrency}-${pair.toCurrency}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      {/* Główny wiersz: ikona chwytu, nazwa po lewej, kurs i przyciski po prawej */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-none"
            title="Przeciągnij, aby zmienić kolejność"
          >
            <GripVertical className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {pair.fromCurrency} / {pair.toCurrency}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {currencyNames[pair.fromCurrency] || pair.fromCurrency} →{" "}
              {currencyNames[pair.toCurrency] || pair.toCurrency}
            </p>
          </div>
        </div>
        <div className="ml-4 flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatRate(rate.rate)}{" "}
              {currencySymbols[pair.toCurrency] || pair.toCurrency}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              1 {pair.fromCurrency} = {formatRate(rate.rate)}{" "}
              {pair.toCurrency}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(pair)}
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Edytuj parę"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onRemove(pair)}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Usuń z listy"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dodatkowe informacje pod spodem */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
        {change && (
          <div className="flex items-center gap-2">
            <change.icon className={`w-4 h-4 ${change.color}`} />
            <span className={`text-sm ${change.color}`}>
              {change.text}
            </span>
          </div>
        )}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 ml-auto">
          <span>
            Źródło: <span className="font-medium">
              {rate.source === "NBP" ? "NBP" : "ExchangeRate API"}
            </span>
          </span>
          <span>
            Data: <span className="font-medium">{formatDate(rate.effectiveDate)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ExchangeRatesPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const resolvedParams = use(params);
  const { trip, isLoading } = useTripData(resolvedParams.slug);
  const { addToast } = useToast();
  const [ratesData, setRatesData] = useState<ExchangeRatesResponse | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [previousRates, setPreviousRates] = useState<Map<string, number>>(new Map());
  const [selectedPairs, setSelectedPairs] = useState<CurrencyPair[]>(() => 
    loadSelectedPairs(resolvedParams.slug)
  );
  const [editingPair, setEditingPair] = useState<CurrencyPair | null>(null);
  const [editFromCurrency, setEditFromCurrency] = useState<string>("");
  const [editToCurrency, setEditToCurrency] = useState<string>("");
  const [editSearchQueryFrom, setEditSearchQueryFrom] = useState("");
  const [editSearchQueryTo, setEditSearchQueryTo] = useState("");
  const [isEditDropdownOpenFrom, setIsEditDropdownOpenFrom] = useState(false);
  const [isEditDropdownOpenTo, setIsEditDropdownOpenTo] = useState(false);
  const [searchQueryFrom, setSearchQueryFrom] = useState("");
  const [searchQueryTo, setSearchQueryTo] = useState("");
  const [selectedFromCurrency, setSelectedFromCurrency] = useState<string>("");
  const [selectedToCurrency, setSelectedToCurrency] = useState<string>("");
  const [isDropdownOpenFrom, setIsDropdownOpenFrom] = useState(false);
  const [isDropdownOpenTo, setIsDropdownOpenTo] = useState(false);
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>(FALLBACK_CURRENCIES);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);

  // Sensors dla drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handler dla zakończenia przeciągania
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedPairs((items) => {
        const oldIndex = items.findIndex(
          (item) => `${item.fromCurrency}-${item.toCurrency}` === active.id
        );
        const newIndex = items.findIndex(
          (item) => `${item.fromCurrency}-${item.toCurrency}` === over.id
        );

        const newOrder = arrayMove(items, oldIndex, newIndex);
        saveSelectedPairs(resolvedParams.slug, newOrder);
        return newOrder;
      });
    }
  };

  // Oblicz kursy dla wybranych par
  const calculateRateForPair = (pair: CurrencyPair, rates: ExchangeRate[]): ExchangeRate | null => {
    if (!rates || rates.length === 0) return null;

    // Jeśli para to X/PLN, użyj bezpośredniego kursu
    if (pair.toCurrency === "PLN") {
      const directRate = rates.find(
        (r) => r.fromCurrency === pair.fromCurrency && r.toCurrency === "PLN"
      );
      if (directRate) return directRate;
    }

    // Jeśli para to PLN/X, oblicz odwrotność
    if (pair.fromCurrency === "PLN") {
      const reverseRate = rates.find(
        (r) => r.fromCurrency === pair.toCurrency && r.toCurrency === "PLN"
      );
      if (reverseRate) {
        return {
          fromCurrency: "PLN",
          toCurrency: pair.toCurrency,
          rate: 1 / reverseRate.rate,
          effectiveDate: reverseRate.effectiveDate,
          source: reverseRate.source,
        };
      }
    }

    // Dla innych par, oblicz przez PLN
    const fromToPln = rates.find(
      (r) => r.fromCurrency === pair.fromCurrency && r.toCurrency === "PLN"
    );
    const toToPln = rates.find(
      (r) => r.fromCurrency === pair.toCurrency && r.toCurrency === "PLN"
    );

    // Jeśli mamy oba kursy do PLN, oblicz przez PLN
    if (fromToPln && toToPln) {
      return {
        fromCurrency: pair.fromCurrency,
        toCurrency: pair.toCurrency,
        rate: fromToPln.rate / toToPln.rate,
        effectiveDate: fromToPln.effectiveDate,
        source: fromToPln.source,
      };
    }

    return null;
  };

  const fetchRates = async () => {
    setIsLoadingRates(true);
    setError(null);
    try {
      const response = await fetch("/api/exchange-rates");
      if (!response.ok) {
        throw new Error("Nie udało się pobrać kursów walut");
      }
      const data: ExchangeRatesResponse = await response.json();
      
      // Zapisz poprzednie kursy dla porównania
      if (ratesData) {
        const prevMap = new Map<string, number>();
        selectedPairs.forEach((pair) => {
          const rate = calculateRateForPair(pair, ratesData.rates);
          if (rate) {
            prevMap.set(`${pair.fromCurrency}-${pair.toCurrency}`, rate.rate);
          }
        });
        setPreviousRates(prevMap);
      }
      
      setRatesData(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setIsLoadingRates(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  // Pobierz listę wszystkich dostępnych walut
  useEffect(() => {
    const fetchCurrencies = async () => {
      setIsLoadingCurrencies(true);
      try {
        const response = await fetch("/api/currencies");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.currencies) {
            const currencyCodes = data.currencies.map((c: { code: string }) => c.code);
            // Usuń duplikaty używając Set i upewnij się, że PLN jest tylko raz
            const uniqueCurrencies = Array.from(new Set(currencyCodes));
            // Filtruj PLN - zostaw tylko pierwszy
            const filteredCurrencies = uniqueCurrencies.filter((code, index) => 
              code !== "PLN" || uniqueCurrencies.indexOf("PLN") === index
            );
            setAvailableCurrencies(filteredCurrencies);
            
            // Rozszerz currencyNames o nowe waluty (z fallbackiem do kodu waluty)
            // Nazwy będą dodawane dynamicznie gdy użytkownik będzie ich potrzebował
          }
        }
      } catch (error) {
        console.error("Error fetching currencies:", error);
        // Użyj fallback listy
        setAvailableCurrencies(FALLBACK_CURRENCIES);
      } finally {
        setIsLoadingCurrencies(false);
      }
    };

    fetchCurrencies();
  }, []);


  // Zamknij dropdown po kliknięciu poza nim
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.currency-select-from') && !target.closest('.currency-select-to')) {
        setIsDropdownOpenFrom(false);
        setIsDropdownOpenTo(false);
      }
      if (!target.closest('.currency-select-edit-from') && !target.closest('.currency-select-edit-to')) {
        setIsEditDropdownOpenFrom(false);
        setIsEditDropdownOpenTo(false);
      }
    };
    if (isDropdownOpenFrom || isDropdownOpenTo || isEditDropdownOpenFrom || isEditDropdownOpenTo) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpenFrom, isDropdownOpenTo, isEditDropdownOpenFrom, isEditDropdownOpenTo]);

  const handleAddPair = () => {
    if (selectedFromCurrency && selectedToCurrency && selectedFromCurrency !== selectedToCurrency) {
      const pair: CurrencyPair = {
        fromCurrency: selectedFromCurrency,
        toCurrency: selectedToCurrency,
      };
      // Sprawdź czy para już nie istnieje
      const exists = selectedPairs.some(
        (p) => p.fromCurrency === pair.fromCurrency && p.toCurrency === pair.toCurrency
      );
      if (!exists) {
        setSelectedPairs([...selectedPairs, pair]);
        saveSelectedPairs(resolvedParams.slug, [...selectedPairs, pair]);
        setSelectedFromCurrency("");
        setSelectedToCurrency("");
        setSearchQueryFrom("");
        setSearchQueryTo("");
        setIsDropdownOpenFrom(false);
        setIsDropdownOpenTo(false);
        addToast({
          type: "success",
          title: "Dodano parę walut",
          message: `${pair.fromCurrency} / ${pair.toCurrency}`,
        });
      }
    }
  };

  const handleRemovePair = (pair: CurrencyPair) => {
    setSelectedPairs(
      selectedPairs.filter(
        (p) => !(p.fromCurrency === pair.fromCurrency && p.toCurrency === pair.toCurrency)
      )
    );
    saveSelectedPairs(
      resolvedParams.slug,
      selectedPairs.filter(
        (p) => !(p.fromCurrency === pair.fromCurrency && p.toCurrency === pair.toCurrency)
      )
    );
    addToast({
      type: "success",
      title: "Usunięto parę walut",
      message: `${pair.fromCurrency} / ${pair.toCurrency}`,
    });
  };

  const handleEditPair = (pair: CurrencyPair) => {
    setEditingPair(pair);
    setEditFromCurrency(pair.fromCurrency);
    setEditToCurrency(pair.toCurrency);
    setEditSearchQueryFrom(`${pair.fromCurrency} - ${currencyNames[pair.fromCurrency] || pair.fromCurrency}`);
    setEditSearchQueryTo(`${pair.toCurrency} - ${currencyNames[pair.toCurrency] || pair.toCurrency}`);
  };

  const handleUpdatePair = () => {
    if (!editingPair) return;
    if (editFromCurrency && editToCurrency && editFromCurrency !== editToCurrency) {
      const newPair: CurrencyPair = {
        fromCurrency: editFromCurrency,
        toCurrency: editToCurrency,
      };
      // Sprawdź czy nowa para już nie istnieje (oprócz edytowanej)
      const exists = selectedPairs.some(
        (p) =>
          p.fromCurrency === newPair.fromCurrency &&
          p.toCurrency === newPair.toCurrency &&
          !(p.fromCurrency === editingPair.fromCurrency && p.toCurrency === editingPair.toCurrency)
      );
      if (!exists) {
        setSelectedPairs(
          selectedPairs.map((p) =>
            p.fromCurrency === editingPair.fromCurrency && p.toCurrency === editingPair.toCurrency
              ? newPair
              : p
          )
        );
        saveSelectedPairs(
          resolvedParams.slug,
          selectedPairs.map((p) =>
            p.fromCurrency === editingPair.fromCurrency && p.toCurrency === editingPair.toCurrency
              ? newPair
              : p
          )
        );
        setEditingPair(null);
        setEditFromCurrency("");
        setEditToCurrency("");
        setEditSearchQueryFrom("");
        setEditSearchQueryTo("");
        setIsEditDropdownOpenFrom(false);
        setIsEditDropdownOpenTo(false);
        addToast({
          type: "success",
          title: "Zaktualizowano parę walut",
          message: `${newPair.fromCurrency} / ${newPair.toCurrency}`,
        });
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingPair(null);
    setEditFromCurrency("");
    setEditToCurrency("");
    setEditSearchQueryFrom("");
    setEditSearchQueryTo("");
    setIsEditDropdownOpenFrom(false);
    setIsEditDropdownOpenTo(false);
  };

  const filteredCurrenciesFrom = availableCurrencies.filter((currency) => {
    const searchText = getCurrencySearchText(currency);
    return searchText.includes(searchQueryFrom.toLowerCase());
  });

  const filteredCurrenciesTo = availableCurrencies.filter((currency) => {
    const searchText = getCurrencySearchText(currency);
    return searchText.includes(searchQueryTo.toLowerCase());
  });

  const filteredEditCurrenciesFrom = availableCurrencies.filter((currency) => {
    const searchText = getCurrencySearchText(currency);
    return searchText.includes(editSearchQueryFrom.toLowerCase());
  });

  const filteredEditCurrenciesTo = availableCurrencies.filter((currency) => {
    const searchText = getCurrencySearchText(currency);
    return searchText.includes(editSearchQueryTo.toLowerCase());
  });

  const displayedRates = selectedPairs
    .map((pair) => {
      const rate = ratesData ? calculateRateForPair(pair, ratesData.rates) : null;
      return rate ? { pair, rate } : null;
    })
    .filter((item): item is { pair: CurrencyPair; rate: ExchangeRate } => item !== null);

  const getRateChange = (rateKey: string, currentRate: number): {
    icon: typeof TrendingUp;
    color: string;
    text: string;
  } | null => {
    if (previousRates.size === 0) return null;
    
    const prevRate = previousRates.get(rateKey);
    if (prevRate === undefined) return null;
    
    const change = currentRate - prevRate;
    const changePercent = (change / prevRate) * 100;
    
    if (Math.abs(change) < 0.0001) {
      return {
        icon: Minus,
        color: "text-gray-500 dark:text-gray-400",
        text: "bez zmian",
      };
    }
    
    if (change > 0) {
      return {
        icon: TrendingUp,
        color: "text-red-600 dark:text-red-400",
        text: `+${formatRate(change)} (+${changePercent.toFixed(2)}%)`,
      };
    } else {
      return {
        icon: TrendingDown,
        color: "text-green-600 dark:text-green-400",
        text: `${formatRate(change)} (${changePercent.toFixed(2)}%)`,
      };
    }
  };

  if (isLoading) {
    return (
      <PageLayout maxWidth="4xl">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Ładowanie...</p>
        </div>
      </PageLayout>
    );
  }

  if (!trip) {
    return (
      <PageLayout maxWidth="4xl">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Nie udało się załadować danych podróży.
          </p>
          <BackToHome className="mt-6" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth="4xl">
      <div className="mb-6">
        <Link
          href={`/portfel-podrozniczy/${resolvedParams.slug}`}
          variant="default"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Powrót do podróży
        </Link>
      </div>

      <PageHeader
        title="Kursy walut"
        subtitle={`Aktualne kursy wymiany względem ${currencyNames["PLN"] || "PLN"}`}
      />

      {/* Dodawanie nowych par walut */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* From Currency - Searchable Select */}
            <div className="flex-1 relative currency-select-from">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Z waluty
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Wpisz kod lub nazwę (np. USD, dolar)..."
                  value={searchQueryFrom}
                  onChange={(e) => {
                    setSearchQueryFrom(e.target.value);
                    setIsDropdownOpenFrom(true);
                    if (e.target.value && filteredCurrenciesFrom.length > 0) {
                      setSelectedFromCurrency(filteredCurrenciesFrom[0]);
                    }
                  }}
                  onFocus={() => setIsDropdownOpenFrom(true)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {isDropdownOpenFrom && filteredCurrenciesFrom.length > 0 && (
                  <div 
                    className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {filteredCurrenciesFrom.map((currency) => (
                      <button
                        key={currency}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFromCurrency(currency);
                          setSearchQueryFrom(`${currency} - ${currencyNames[currency] || currency}`);
                          setIsDropdownOpenFrom(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <div className="font-medium">
                          {currency} - {currencyNames[currency] || currency}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* To Currency - Searchable Select */}
            <div className="flex-1 relative currency-select-to">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Do waluty
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
                    if (e.target.value && filteredCurrenciesTo.length > 0) {
                      setSelectedToCurrency(filteredCurrenciesTo[0]);
                    }
                  }}
                  onFocus={() => setIsDropdownOpenTo(true)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {isDropdownOpenTo && filteredCurrenciesTo.length > 0 && (
                  <div 
                    className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {filteredCurrenciesTo.map((currency) => (
                      <button
                        key={currency}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedToCurrency(currency);
                          setSearchQueryTo(`${currency} - ${currencyNames[currency] || currency}`);
                          setIsDropdownOpenTo(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <div className="font-medium">
                          {currency} - {currencyNames[currency] || currency}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAddPair}
                disabled={
                  !selectedFromCurrency ||
                  !selectedToCurrency ||
                  selectedFromCurrency === selectedToCurrency ||
                  selectedPairs.some(
                    (p) =>
                      p.fromCurrency === selectedFromCurrency &&
                      p.toCurrency === selectedToCurrency
                  )
                }
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap h-[42px]"
              >
                <Plus className="w-4 h-4" />
                Dodaj parę
              </button>
            </div>
          </div>
          {selectedFromCurrency === selectedToCurrency && selectedFromCurrency && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Nie można wybrać tej samej waluty dla obu pól
            </p>
          )}
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={fetchRates}
            disabled={isLoadingRates}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoadingRates ? "animate-spin" : ""}`}
            />
            Odśwież kursy
          </button>
          {lastUpdate && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ostatnia aktualizacja: {lastUpdate.toLocaleTimeString("pl-PL")}
            </p>
          )}
        </div>
        {ratesData && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Data kursów: {formatDate(ratesData.date)}
          </p>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {isLoadingRates && !ratesData ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Ładowanie kursów...</p>
        </div>
      ) : ratesData && ratesData.success ? (
        <div className="space-y-4">
          {displayedRates.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400">
                {selectedPairs.length === 0
                  ? "Nie wybrano żadnych par walut. Dodaj pary powyżej."
                  : "Brak dostępnych kursów dla wybranych par walut."}
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayedRates.map(({ pair }) => `${pair.fromCurrency}-${pair.toCurrency}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {displayedRates.map(({ pair, rate }) => {
                    const rateKey = `${pair.fromCurrency}-${pair.toCurrency}`;
                    const change = getRateChange(rateKey, rate.rate);
                    const isEditing = editingPair?.fromCurrency === pair.fromCurrency && editingPair?.toCurrency === pair.toCurrency;
                    
                    if (isEditing) {
                  return (
                    <div
                      key={rateKey}
                      className="bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-500 dark:border-blue-600 p-4"
                    >
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Edytuj parę walut
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* From Currency - Searchable Select */}
                          <div className="relative currency-select-edit-from">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Z waluty
                            </label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Wpisz kod lub nazwę..."
                                value={editSearchQueryFrom}
                                onChange={(e) => {
                                  setEditSearchQueryFrom(e.target.value);
                                  setIsEditDropdownOpenFrom(true);
                                  if (e.target.value && filteredEditCurrenciesFrom.length > 0) {
                                    setEditFromCurrency(filteredEditCurrenciesFrom[0]);
                                  }
                                }}
                                onFocus={() => setIsEditDropdownOpenFrom(true)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {isEditDropdownOpenFrom && filteredEditCurrenciesFrom.length > 0 && (
                                <div 
                                  className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {filteredEditCurrenciesFrom.map((currency) => (
                                    <button
                                      key={currency}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditFromCurrency(currency);
                                        setEditSearchQueryFrom(`${currency} - ${currencyNames[currency] || currency}`);
                                        setIsEditDropdownOpenFrom(false);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    >
                                      <div className="font-medium">
                                        {currency} - {currencyNames[currency] || currency}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* To Currency - Searchable Select */}
                          <div className="relative currency-select-edit-to">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Do waluty
                            </label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Wpisz kod lub nazwę..."
                                value={editSearchQueryTo}
                                onChange={(e) => {
                                  setEditSearchQueryTo(e.target.value);
                                  setIsEditDropdownOpenTo(true);
                                  if (e.target.value && filteredEditCurrenciesTo.length > 0) {
                                    setEditToCurrency(filteredEditCurrenciesTo[0]);
                                  }
                                }}
                                onFocus={() => setIsEditDropdownOpenTo(true)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {isEditDropdownOpenTo && filteredEditCurrenciesTo.length > 0 && (
                                <div 
                                  className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {filteredEditCurrenciesTo.map((currency) => (
                                    <button
                                      key={currency}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditToCurrency(currency);
                                        setEditSearchQueryTo(`${currency} - ${currencyNames[currency] || currency}`);
                                        setIsEditDropdownOpenTo(false);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    >
                                      <div className="font-medium">
                                        {currency} - {currencyNames[currency] || currency}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleUpdatePair}
                          disabled={
                            !editFromCurrency ||
                            !editToCurrency ||
                            editFromCurrency === editToCurrency
                          }
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Zapisz
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors"
                        >
                          Anuluj
                        </button>
                      </div>
                    </div>
                  );
                }

                    return (
                      <SortableCurrencyPair
                        key={rateKey}
                        id={rateKey}
                        pair={pair}
                        rate={rate}
                        change={change}
                        isEditing={isEditing}
                        onEdit={handleEditPair}
                        onRemove={handleRemovePair}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            Nie udało się pobrać kursów walut.
          </p>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Uwaga:</strong> Kursy są aktualizowane automatycznie z NBP API i ExchangeRate API.
          Kursy mogą się różnić od rzeczywistych kursów wymiany w bankach i kantorach.
        </p>
      </div>
    </PageLayout>
  );
}
