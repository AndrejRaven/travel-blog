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

export interface TravelWalletData {
  countries: Country[];
  totalBudget?: number; // całkowity budżet (w PLN)
  userName?: string; // imię użytkownika dla "Welcome back, [name]"
  dashboardMode?: "multi-country" | "single-country" | "single-location" | "auto"; // tryb dashboardu
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

