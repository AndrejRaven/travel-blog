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
  totalBudget?: number; // całkowity budżet (w PLN) - legacy, use wallet for new system
  userName?: string; // imię użytkownika dla "Welcome back, [name]"
  dashboardMode?: "multi-country" | "single-country" | "single-location" | "auto"; // tryb dashboardu
  currencyTransactions?: CurrencyTransaction[]; // transakcje walutowe - legacy
  initialBalances?: { currency: string; amount: number }[]; // początkowe salda w walutach - legacy
  // New wallet system
  wallet?: Wallet; // new wallet structure
  exchanges?: CurrencyExchange[]; // currency exchanges (new model)
  budgetAdjustments?: BudgetAdjustment[]; // budget adjustments
}

export interface Expense {
  id: string;
  countryId: string;
  tripId?: string; // ID podróży (opcjonalne dla backward compatibility)
  amount: number; // kwota wydatku
  currency: string; // waluta (np. "PLN", "USD")
  category: string; // kategoria (np. "Jedzenie", "Noclegi", "Transport", "Aktywności")
  description?: string; // opis wydatku
  note?: string; // notatka (opcjonalna)
  date: string; // data wydatku (ISO format YYYY-MM-DD)
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
  id: string; // unikalne ID podróży
  slug: string; // URL-friendly slug (np. "azja-2024")
  name: string; // nazwa podróży (np. "Podróż po Azji 2025")
  startDate?: string; // data rozpoczęcia (ISO format) - opcjonalna
  endDate?: string; // data zakończenia (ISO format) - opcjonalna
  data: TravelWalletData; // obecne dane (countries, totalBudget, userName)
  createdAt: string; // data utworzenia (ISO format)
  updatedAt: string; // data ostatniej aktualizacji (ISO format)
}

/**
 * Dane wszystkich podróży
 */
export interface TripsData {
  trips: Trip[];
  currentTripId?: string; // ID aktualnie wybranej podróży
}

