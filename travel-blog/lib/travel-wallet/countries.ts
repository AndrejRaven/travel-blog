import type { Country, TravelWalletData } from "./types";
import { getTravelWalletData } from "./storage";
import { getTripById } from "./trips-storage";
import {
  calculatePlannedSpending,
  calculateActualSpending,
} from "./calculations";

/**
 * Pobiera kraj po ID z danych travel wallet
 * @param id - ID kraju
 * @param tripId - opcjonalne ID podróży (jeśli podane, szuka w tej podróży)
 */
export function getCountryById(id: string, tripId?: string): Country | null {
  let data: TravelWalletData;
  if (tripId) {
    const trip = getTripById(tripId);
    if (!trip) return null;
    data = trip.data;
  } else {
    // DEPRECATED: tripId powinno być zawsze podane. Używamy starego systemu tylko dla kompatybilności.
    console.warn("[getCountryById] tripId should always be provided. Using deprecated getTravelWalletData().");
    data = getTravelWalletData();
  }
  const country = data.countries.find((c) => c.id === id);
  return country || null;
}

/**
 * Pobiera kraj po slug z danych travel wallet
 * @param slug - slug kraju
 * @param tripId - ID podróży (wymagane, bo slug musi być unikalny w ramach podróży)
 */
export function getCountryBySlug(slug: string, tripId: string): Country | null {
  const trip = getTripById(tripId);
  if (!trip) return null;
  
  const country = trip.data.countries.find((c) => c.slug === slug);
  return country || null;
}

/**
 * Zwraca etykietę statusu kraju w języku polskim
 */
export function getCountryStatusLabel(status: "visited" | "current" | "upcoming"): string {
  switch (status) {
    case "visited":
      return "Odwiedzony";
    case "current":
      return "Obecny";
    case "upcoming":
      return "Nadchodzący";
    default:
      return status;
  }
}

/**
 * Formatuje zakres dat w formacie polskim
 */
export function formatDateRange(
  startDate?: string,
  endDate?: string
): string {
  if (!startDate || !endDate) return "—";

  const start = new Date(startDate);
  const end = new Date(endDate);

  const startFormatted = start.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  });

  const endFormatted = end.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Oblicza planowany budżet dla kraju (w walucie bazowej gdy podano data)
 */
export function calculatePlannedTotal(country: Country, data?: TravelWalletData): number {
  return calculatePlannedSpending(country, data);
}

/**
 * Oblicza faktyczne wydatki dla kraju (używa istniejącej funkcji)
 */
export function calculateActualTotal(country: Country): number {
  return calculateActualSpending(country);
}

/**
 * Pobiera wszystkie kraje z danych travel wallet
 * @param tripId - opcjonalne ID podróży (jeśli podane, zwraca kraje z tej podróży)
 */
export function getAllCountries(tripId?: string): Country[] {
  let data: TravelWalletData;
  if (tripId) {
    const trip = getTripById(tripId);
    if (!trip) return [];
    data = trip.data;
  } else {
    // DEPRECATED: tripId powinno być zawsze podane. Używamy starego systemu tylko dla kompatybilności.
    console.warn("[getAllCountries] tripId should always be provided. Using deprecated getTravelWalletData().");
    data = getTravelWalletData();
  }
  return data.countries;
}

/**
 * Grupuje kraje według statusu
 */
export function groupCountriesByStatus(
  countries: Country[]
): {
  visited: Country[];
  current: Country[];
  upcoming: Country[];
} {
  return {
    visited: countries.filter((c) => c.status === "visited"),
    current: countries.filter((c) => c.status === "current"),
    upcoming: countries.filter((c) => c.status === "upcoming"),
  };
}

