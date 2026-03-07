import type { TravelWalletData, Country, Location } from "./types";
import { createWallet } from "./wallet-operations";
import { safeSetLocalStorageItem } from "./utils/safe-local-storage";

const STORAGE_KEY = "travel-wallet-data";

/**
 * Konwertuje location (string) na locations (tablica obiektów Location) z datami
 */
function convertLocationToLocations(
  location: string,
  countryStartDate: string,
  countryEndDate: string
): Location[] {
  const locations = location
    .split(",")
    .map((loc) => loc.trim())
    .filter((loc) => loc.length > 0);
  
  if (locations.length === 0) return [];
  
  const start = new Date(countryStartDate);
  const end = new Date(countryEndDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysPerLocation = Math.floor(totalDays / locations.length);
  
  return locations.map((name, index) => {
    const locationStart = new Date(start);
    locationStart.setDate(start.getDate() + index * daysPerLocation);
    
    const locationEnd = new Date(locationStart);
    if (index === locations.length - 1) {
      // Ostatnia lokalizacja kończy się w dniu zakończenia kraju
      locationEnd.setTime(end.getTime());
    } else {
      locationEnd.setDate(locationStart.getDate() + daysPerLocation - 1);
    }
    
    return {
      name,
      startDate: locationStart.toISOString().split('T')[0],
      endDate: locationEnd.toISOString().split('T')[0],
    };
  });
}

/**
 * Przykładowe dane domyślne
 */
const defaultData: TravelWalletData = {
  totalBudget: 15000,
  userName: "Sarah",
  countries: [
    {
      id: "1",
      slug: "tajlandia",
      name: "Tajlandia",
      days: 19,
      locations: convertLocationToLocations("Bangkok, Phuket", "2026-06-15", "2026-07-02"),
      status: "upcoming",
      startDate: "2026-06-15",
      endDate: "2026-07-02",
      actualSpending: 2850,
      budgets: [
        { currency: "PLN", amount: 2500 },
        { currency: "THB", amount: 35000 },
        { currency: "USD", amount: 800 },
      ],
      categories: [
        { name: "Jedzenie", amount: 950, plannedAmount: 800 },
        { name: "Noclegi", amount: 1200, plannedAmount: 1000 },
        { name: "Transport", amount: 500, plannedAmount: 400 },
        { name: "Aktywności", amount: 200, plannedAmount: 300 },
      ],
    },
    {
      id: "2",
      slug: "wietnam",
      name: "Wietnam",
      days: 18,
      locations: convertLocationToLocations("Ho Chi Minh, Hanoi", "2026-07-03", "2026-07-20"),
      status: "upcoming",
      startDate: "2026-07-03",
      endDate: "2026-07-20",
      actualSpending: 1900,
      budgets: [
        { currency: "PLN", amount: 2000 },
        { currency: "USD", amount: 500 },
      ],
      categories: [
        { name: "Jedzenie", amount: 600, plannedAmount: 650 },
        { name: "Noclegi", amount: 800, plannedAmount: 900 },
        { name: "Transport", amount: 350, plannedAmount: 300 },
        { name: "Aktywności", amount: 150, plannedAmount: 150 },
      ],
    },
    {
      id: "3",
      slug: "japonia",
      name: "Japonia",
      days: 20,
      locations: convertLocationToLocations("Tokio, Kioto, Osaka", "2026-07-21", "2026-08-12"),
      status: "upcoming",
      startDate: "2026-07-21",
      endDate: "2026-08-12",
      actualSpending: 3700,
      budgets: [
        { currency: "PLN", amount: 4000 },
        { currency: "JPY", amount: 150000 },
        { currency: "USD", amount: 1200 },
      ],
      categories: [
        { name: "Jedzenie", amount: 1200, plannedAmount: 1400 },
        { name: "Noclegi", amount: 1800, plannedAmount: 2000 },
        { name: "Transport", amount: 500, plannedAmount: 400 },
        { name: "Aktywności", amount: 200, plannedAmount: 200 },
      ],
    },
    {
      id: "4",
      slug: "korea-poludniowa",
      name: "Korea Południowa",
      days: 16,
      locations: convertLocationToLocations("Seul, Busan", "2026-08-13", "2026-08-28"),
      status: "upcoming",
      startDate: "2026-08-13",
      endDate: "2026-08-28",
      budgets: [
        { currency: "PLN", amount: 3500 },
        { currency: "KRW", amount: 1000000 },
      ],
      categories: [
        { name: "Jedzenie", amount: 0, plannedAmount: 1100 },
        { name: "Noclegi", amount: 0, plannedAmount: 1600 },
        { name: "Transport", amount: 0, plannedAmount: 500 },
        { name: "Aktywności", amount: 0, plannedAmount: 300 },
      ],
    },
    {
      id: "5",
      slug: "tajwan",
      name: "Tajwan",
      days: 13,
      locations: convertLocationToLocations("Taipej, Kaohsiung", "2026-08-29", "2026-09-10"),
      status: "upcoming",
      startDate: "2026-08-29",
      endDate: "2026-09-10",
      budgets: [
        { currency: "PLN", amount: 2000 },
        { currency: "TWD", amount: 15000 },
      ],
      categories: [
        { name: "Jedzenie", amount: 0, plannedAmount: 650 },
        { name: "Noclegi", amount: 0, plannedAmount: 900 },
        { name: "Transport", amount: 0, plannedAmount: 300 },
        { name: "Aktywności", amount: 0, plannedAmount: 150 },
      ],
    },
  ],
  wallet: createWallet("PLN"),
  expenses: [],
  activityLogs: [],
};

/**
 * Waliduje dane z localStorage
 */
function validateData(data: unknown): data is TravelWalletData {
  if (!data || typeof data !== "object") return false;
  if (!("countries" in data)) return false;
  if (!Array.isArray((data as TravelWalletData).countries)) return false;

  const countries = (data as TravelWalletData).countries;
  return countries.every((country) => {
    if (!country || typeof country !== "object") return false;
    if (
      typeof country.id !== "string" ||
      typeof country.name !== "string" ||
      typeof country.days !== "number"
    )
      return false;
    if (!Array.isArray(country.budgets)) return false;
    const budgetsValid = country.budgets.every(
      (budget) =>
        budget &&
        typeof budget === "object" &&
        typeof budget.currency === "string" &&
        typeof budget.amount === "number"
    );
    if (!budgetsValid) return false;

    // Walidacja opcjonalnych pól
    if (
      "status" in country &&
      country.status !== "visited" &&
      country.status !== "current" &&
      country.status !== "upcoming"
    )
      return false;
    if ("actualSpending" in country && typeof country.actualSpending !== "number")
      return false;
    if ("startDate" in country && typeof country.startDate !== "string")
      return false;
    if ("endDate" in country && typeof country.endDate !== "string")
      return false;
    if ("categories" in country) {
      if (!Array.isArray(country.categories)) return false;
      const categoriesValid = country.categories.every(
        (cat) =>
          cat &&
          typeof cat === "object" &&
          typeof cat.name === "string" &&
          typeof cat.amount === "number" &&
          typeof cat.plannedAmount === "number"
      );
      if (!categoriesValid) return false;
    }

    return true;
  });
}

/**
 * Pobiera dane z localStorage lub zwraca dane domyślne
 * 
 * @deprecated Use trips-storage.ts instead. This file is only used for migration purposes.
 * This file will be removed in v5. Use getAllTrips() and getTripById() from trips-storage.ts.
 */
export function getTravelWalletData(): TravelWalletData {
  if (typeof window === "undefined") {
    // SSR - zwróć dane domyślne
    return defaultData;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultData;
    }

    const parsed = JSON.parse(stored);
    if (validateData(parsed)) {
      return parsed;
    }

    // Jeśli dane są nieprawidłowe, zwróć domyślne
    console.warn("Invalid travel wallet data in localStorage, using defaults");
    return defaultData;
  } catch (error) {
    console.error("Error reading travel wallet data from localStorage:", error);
    return defaultData;
  }
}

/**
 * Zapisuje dane do localStorage
 * 
 * @deprecated Use trips-storage.ts instead. This file is only used for migration purposes.
 * This file will be removed in v5. Use createTrip() and updateTrip() from trips-storage.ts.
 */
export function saveTravelWalletData(data: TravelWalletData): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    if (!validateData(data)) {
      console.error("Invalid data structure");
      return false;
    }

    const ok = safeSetLocalStorageItem(STORAGE_KEY, JSON.stringify(data));
    return !!ok;
  } catch (error) {
    console.error("Error saving travel wallet data to localStorage:", error);
    return false;
  }
}

/**
 * Resetuje dane do domyślnych wartości
 * 
 * @deprecated Use trips-storage.ts instead. This file is only used for migration purposes.
 * This file will be removed in v5.
 */
export function resetTravelWalletData(): boolean {
  return saveTravelWalletData(defaultData);
}

