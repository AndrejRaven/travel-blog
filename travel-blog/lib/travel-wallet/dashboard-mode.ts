import type { TravelWalletData } from "./types";

/**
 * Wykrywa tryb dashboardu na podstawie danych podróży
 */
export function detectDashboardMode(
  data: TravelWalletData
): "multi-country" | "single-country" | "single-location" {
  if (data.countries.length === 0) return "multi-country";
  if (data.countries.length > 1) return "multi-country";

  const country = data.countries[0];
  if (country.locations && country.locations.length === 1) {
    return "single-location";
  }

  return "single-country";
}

/**
 * Zwraca efektywny tryb dashboardu (uwzględniając ustawienie "auto")
 */
export function getEffectiveDashboardMode(
  data: TravelWalletData
): "multi-country" | "single-country" | "single-location" {
  if (data.dashboardMode && data.dashboardMode !== "auto") {
    return data.dashboardMode;
  }

  return detectDashboardMode(data);
}

/**
 * Sprawdza czy można zmienić tryb dashboardu
 * Nie można zmienić na single-country jeśli jest więcej niż 1 kraj
 * Nie można zmienić na single-location jeśli nie ma dokładnie 1 lokalizacji
 */
export function canChangeMode(
  data: TravelWalletData,
  targetMode: "multi-country" | "single-country" | "single-location"
): boolean {
  if (targetMode === "multi-country") return true;

  if (targetMode === "single-country") {
    return data.countries.length <= 1;
  }

  if (targetMode === "single-location") {
    if (data.countries.length !== 1) return false;
    const country = data.countries[0];
    return !!(country.locations && country.locations.length === 1);
  }

  return false;
}

