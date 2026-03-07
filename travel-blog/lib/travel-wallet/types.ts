/**
 * Typy dla portfela podróżniczego
 */

export interface Budget {
  currency: string;
  amount: number;
}

export interface ExpenseCategory {
  name: string; // np. "Jedzenie", "Noclegi", "Transport", "Aktywności"
  amount: number; // faktyczne wydatki
  plannedAmount: number; // planowane wydatki
}

export interface Location {
  name: string;
  startDate: string; // data rozpoczęcia pobytu w lokalizacji (ISO format YYYY-MM-DD)
  endDate: string; // data zakończenia pobytu w lokalizacji (ISO format YYYY-MM-DD)
}

export interface Country {
  id: string;
  slug: string; // URL-friendly slug (np. "tajlandia", "tajlandia-2")
  name: string;
  days: number;
  location?: string; // miasto/region (przestarzałe, używaj locations)
  locations?: Location[]; // lista dostępnych lokalizacji w kraju z datami odwiedzenia
  budgets: Budget[];
  /** Waluta wyświetlania dla tego kraju (tylko podróże wielokrajowe). Gdy brak – używana jest waluta główna podróży. */
  displayCurrency?: string;
  actualSpending?: number; // faktyczne wydatki (w głównej walucie lub przeliczone na PLN)
  startDate?: string; // data rozpoczęcia podróży (ISO format)
  endDate?: string; // data zakończenia podróży (ISO format)
  status: "visited" | "current" | "upcoming";
  categories?: ExpenseCategory[]; // kategorie wydatków
}

/**
 * Metoda płatności
 */
export type PaymentMethod =
  | { type: "card"; currency: string } // karta (np. PLN)
  | { type: "cash"; currency: string } // gotówka w danej walucie
  | { type: "bank-withdrawal"; currency: string }; // wypłata z bankomatu

/**
 * Transakcja walutowa (wymiana, wypłata z bankomatu, stan początkowy)
 */
export interface CurrencyTransaction {
  id: string;
  tripId: string;
  countryId?: string; // opcjonalne powiązanie z krajem
  type: "exchange" | "withdrawal" | "initial"; // typ transakcji
  date: string; // data transakcji (ISO format YYYY-MM-DD)
  time?: string; // godzina transakcji (format HH:mm, opcjonalne)
  fromCurrency: string; // waluta źródłowa (np. "USD")
  fromAmount: number; // kwota źródłowa
  toCurrency: string; // waluta docelowa (np. "THB")
  toAmount: number; // kwota docelowa
  rate: number; // kurs wymiany (toAmount / fromAmount)
  fee?: number; // prowizja (opcjonalna)
  feeCurrency?: string; // waluta prowizji
  note?: string; // notatka
  location?: string; // lokalizacja transakcji
}

/**
 * Saldo walutowe (legacy - for backward compatibility)
 */
export interface CurrencyBalance {
  currency: string; // kod waluty (np. "PLN", "USD")
  amount: number; // aktualne saldo
  initial: number; // początkowy stan
  spent: number; // wydane (z expenses)
  exchangedOut: number; // wymienione na inne waluty (-)
  exchangedIn: number; // otrzymane z wymian (+)
  withdrawals: number; // wypłaty z bankomatu (-)
}

/**
 * Base currency configuration
 */
export interface BaseCurrencyConfig {
  code: string; // e.g., "PLN"
  symbol: string; // e.g., "zł"
}

/**
 * Reference exchange rate (can change over time)
 */
export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number; // rate to convert fromCurrency to toCurrency
  effectiveDate: string; // ISO date when rate became effective
  source?: string; // e.g., "NBP", "manual"
}

/**
 * Currency balance (simplified - new model)
 */
export interface SimpleCurrencyBalance {
  currency: string;
  amount: number; // current balance
}

/**
 * Wallet state
 */
export interface Wallet {
  baseCurrency: string;
  balances: SimpleCurrencyBalance[]; // all currency balances
  referenceRates: ExchangeRate[]; // current reference rates
}

/**
 * Currency exchange transaction (new model)
 */
export interface CurrencyExchange {
  id: string;
  tripId: string;
  type: "exchange";
  timestamp: string; // ISO datetime
  fromCurrency: string;
  fromAmount: number;
  toCurrency: string;
  toAmount: number;
  transactionRate: number; // actual rate used in transaction
  fee?: number;
  feeCurrency?: string;
  note?: string;
  location?: string;
  countryId?: string;
}

/**
 * Budget adjustment
 */
export interface BudgetAdjustment {
  id: string;
  tripId: string;
  type: "increase" | "decrease";
  amount: number;
  currency: string; // always base currency
  timestamp: string;
  note?: string;
}

export interface TravelWalletData {
  countries: Country[];
  /**
   * @deprecated Use wallet.balances instead. This field is kept for backward compatibility only.
   * To get total budget, use calculateMainBudget(wallet, tripId) from wallet-operations.ts
   */
  totalBudget?: number; // DEPRECATED: całkowity budżet (w PLN) - użyj wallet.balances zamiast tego
  userName?: string; // imię użytkownika dla "Welcome back, [name]"
  dashboardMode?: "multi-country" | "single-country" | "single-location" | "auto"; // tryb dashboardu
  // New wallet system
  wallet: Wallet; // ZAWSZE wymagane - wallet structure (single source of truth for balances)
  exchanges?: CurrencyExchange[]; // currency exchanges (new model)
  budgetAdjustments?: BudgetAdjustment[]; // budget adjustments
  // Consolidated data storage
  expenses: Expense[]; // wszystkie wydatki
  activityLogs: import("./activity-log").ActivityLog[]; // wszystkie logi aktywności
  /** @deprecated Old system. Use wallet + exchanges instead. Kept for backward compatibility. */
  currencyTransactions?: Array<{
    id?: string;
    date?: string;
    fromCurrency: string;
    type: string;
    fromAmount: number;
    toCurrency?: string;
    toAmount?: number;
    rate?: number;
    fee?: number;
    feeCurrency?: string;
    note?: string;
    location?: string;
    countryId?: string;
  }>;
  /** @deprecated Old system. Used by v2 migration. Kept for backward compatibility. */
  initialBalances?: SimpleCurrencyBalance[];
  /** Budżet całkowity podróży (wiele walut), ustawiany przy tworzeniu/edycji przed krajami. */
  initialBudgets?: Budget[];
}

export interface Expense {
  id: string;
  countryId: string;
  tripId: string; // ID podróży (wymagane)
  amount: number; // kwota wydatku
  currency: string; // waluta (np. "PLN", "USD")
  category: string; // kategoria (np. "Jedzenie", "Noclegi", "Transport", "Aktywności")
  /** Typ noclegu – tylko gdy category === "Noclegi". Zobacz ACCOMMODATION_TYPES w constants. */
  accommodationType?: string;
  description?: string; // opis wydatku
  note?: string; // notatka (opcjonalna)
  date: string; // data wydatku (ISO format YYYY-MM-DD)
  /** Ostatni dzień okresu (włącznie). Gdy ustawione, wydatek rozkładany równo na dni [date, endDate]. */
  endDate?: string; // YYYY-MM-DD
  location?: string; // opcjonalna lokalizacja wydatku (np. "Bangkok", "Phuket")
  paymentMethod?: {
    type: "card" | "cash" | "bank-withdrawal";
    sourceCurrency?: string; // waluta źródłowa (dla karty/bankomatu, jeśli inna niż currency)
  };
}

/**
 * Podróż zawierająca dane portfela podróżniczego
 */
export interface Trip {
  id: string;
  /**
   * Właściciel podróży na tym urządzeniu:
   * - undefined/null: podróż stworzona w trybie gościa (bez przypisania do konta)
   * - string: ID użytkownika Supabase, do którego należy ta podróż (dla lokalnych kopii)
   *
   * Pole używane tylko lokalnie do rozróżnienia danych gościa vs danych zalogowanego użytkownika.
   */
  ownerUserId?: string | null;
  // Sync metadata
  lastSyncedAt?: string; // ISO timestamp ostatniej synchronizacji
  syncStatus?: 'synced' | 'pending' | 'error'; // Status synchronizacji
  localVersion?: number; // Lokalna wersja (increment przy każdej zmianie)
  slug: string; // URL-friendly slug (np. "azja-2024")
  name: string; // nazwa podróży (np. "Podróż po Azji 2025")
  startDate?: string; // data rozpoczęcia (ISO format) - opcjonalna
  endDate?: string; // data zakończenia (ISO format) - opcjonalna
  data: TravelWalletData; // obecne dane (countries, totalBudget, userName)
  createdAt: string; // data utworzenia (ISO format)
  updatedAt: string; // data ostatniej aktualizacji (ISO format)
}

/**
 * Lekki wpis w indeksie podróży przechowywany lokalnie.
 * Służy do listowania i meta-informacji bez pełnych danych `Trip.data`.
 */
export interface TripIndexItem {
  id: string;
  slug: string;
  name: string;
  startDate?: string;
  endDate?: string;
  // Sync metadata (powielone z Trip dla lekkiej listy)
  lastSyncedAt?: string;
  syncStatus?: "synced" | "pending" | "error";
  localVersion?: number;
  /**
   * true = podróż istnieje tylko lokalnie (brak lastSyncedAt / rekordu w Supabase).
   * false = podróż ma kopię w chmurze.
   */
  isLocalOnly?: boolean;
}

/**
 * Dane wszystkich podróży w localStorage.
 *
 * Uwaga:
 * - Historycznie `trips` zawierało pełne obiekty Trip (z `data`) dla wszystkich podróży.
 * - Nowy model używa lekkiego indeksu (`tripsIndex`) + pojedynczej aktywnej podróży.
 * - Pole `trips` pozostaje dla kompatybilności i migracji (legacy).
 */
export interface TripsData {
  trips: Trip[];
  currentTripId?: string; // ID aktualnie wybranej podróży
  /**
   * Lekki indeks wszystkich podróży na urządzeniu (id, slug, nazwa, daty, sync metadata).
   * Docelowo używany przez listy zamiast pełnych obiektów Trip.
   */
  tripsIndex?: TripIndexItem[];
  /**
   * ID aktualnej podróży, dla której w localStorage może być zapisany pełny obiekt Trip
   * (aktywnie edytowana podróż, w pełni offline-ready).
   */
  activeTripId?: string;
}

