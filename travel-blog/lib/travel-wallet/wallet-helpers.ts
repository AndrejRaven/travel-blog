import type { TravelWalletData, Trip } from "./types";
import { calculateCurrencyBalances } from "./currency-balances";
import { getEffectiveDashboardMode } from "./dashboard-mode";

/**
 * Oblicza dostępne waluty w portfelu (z saldem > 0.01)
 * Uwzględnia tryb dashboardu i opcjonalne filtrowanie po countryId
 * 
 * @param data - dane podróży
 * @param trip - obiekt podróży (może być null)
 * @param countryId - opcjonalne ID kraju dla filtrowania (używane w multi-country gdy transakcja jest przypisana do kraju)
 * @returns tablica kodów walut dostępnych w portfelu
 */
export function getWalletCurrencies(
  data: TravelWalletData,
  trip: Trip | null,
  countryId?: string
): string[] {
  if (!data) return [];

  // Nowy system wallet
  if (data.wallet) {
    // Jeśli countryId jest podane, użyj calculateCurrencyBalances dla kompatybilności
    // (nowy system wallet nie ma countryId w balances, więc musimy użyć starego systemu)
    if (countryId && trip) {
      const balances = calculateCurrencyBalances(trip, countryId);
      const currencies = balances
        .filter((b) => b.amount > 0.01)
        .map((b) => b.currency);
      
      // Upewnij się, że waluty z budżetu kraju są zawsze uwzględnione (nawet jeśli saldo = 0)
      const country = data.countries.find((c) => c.id === countryId);
      if (country && country.budgets) {
        country.budgets.forEach((budget) => {
          if (budget.amount > 0 && !currencies.includes(budget.currency)) {
            currencies.push(budget.currency);
          }
        });
      }
      
      return currencies;
    }

    // Jeśli brak countryId, użyj globalnych sald z wallet
    const currencies = data.wallet.balances
      .filter((b) => b.amount > 0.01)
      .map((b) => b.currency);
    
    // Upewnij się, że waluty z budżetów wszystkich krajów są uwzględnione
    const budgetCurrencies = new Set<string>();
    data.countries.forEach((country) => {
      country.budgets?.forEach((budget) => {
        if (budget.amount > 0) {
          budgetCurrencies.add(budget.currency);
        }
      });
    });
    budgetCurrencies.forEach((currency) => {
      if (!currencies.includes(currency)) {
        currencies.push(currency);
      }
    });
    
    return currencies;
  }

  // Stary system - użyj calculateCurrencyBalances
  if (!trip) return [];

  // Sprawdź czy to tryb single-country
  const effectiveMode = getEffectiveDashboardMode(data);
  const isSingleMode =
    effectiveMode === "single-country" || effectiveMode === "single-location";

  // W trybie single-country, zawsze użyj countryId pierwszego kraju
  if (isSingleMode && data.countries.length > 0) {
    const singleCountryId = data.countries[0].id;
    const balances = calculateCurrencyBalances(trip, singleCountryId);
    const currencies = balances
      .filter((b) => b.amount > 0.01)
      .map((b) => b.currency);
    
    // Upewnij się, że waluty z budżetu kraju są zawsze uwzględnione
    const country = data.countries[0];
    if (country && country.budgets) {
      country.budgets.forEach((budget) => {
        if (budget.amount > 0 && !currencies.includes(budget.currency)) {
          currencies.push(budget.currency);
        }
      });
    }
    
    return currencies;
  }

  // W trybie multi-country:
  // - Jeśli countryId jest podane (np. z modalu transakcji), użyj go do filtrowania
  // - Jeśli brak countryId, użyj globalnych sald (suma wszystkich krajów)
  const balances = calculateCurrencyBalances(trip, countryId);
  const currencies = balances
    .filter((b) => b.amount > 0.01)
    .map((b) => b.currency);
  
  // Upewnij się, że waluty z budżetów są uwzględnione
  if (countryId) {
    const country = data.countries.find((c) => c.id === countryId);
    if (country && country.budgets) {
      country.budgets.forEach((budget) => {
        if (budget.amount > 0 && !currencies.includes(budget.currency)) {
          currencies.push(budget.currency);
        }
      });
    }
  } else {
    // Dla multi-country bez countryId, dodaj waluty ze wszystkich krajów
    data.countries.forEach((country) => {
      country.budgets?.forEach((budget) => {
        if (budget.amount > 0 && !currencies.includes(budget.currency)) {
          currencies.push(budget.currency);
        }
      });
    });
  }
  
  return currencies;
}
