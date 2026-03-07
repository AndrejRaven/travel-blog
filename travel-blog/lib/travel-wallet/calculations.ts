import type { TravelWalletData, Country, ExpenseCategory, Wallet, Expense, Trip } from "./types";
import { getAllExpenses, convertExpenseToPLN, convertExpenseToBaseByTripId, getExpensesByCountryId } from "./expenses";
import { convertToBaseCurrency } from "./reference-rates";
import { getCurrencyTransactions } from "./currency-transactions";
import { calculateMainBudget as calculateWalletMainBudget } from "./wallet-operations";
import { getWallet, getExchanges } from "./wallet-storage";
import { getTripById } from "./trips-storage";
import { calculatePlannedTotal } from "./countries";
import { calculateTotalActualCost, calculateTotalActualCostByTripId, calculateTravelDays as calculateTravelDaysFromDates } from "./country-calculations";

/**
 * Kursy walut do PLN (przykładowe, później można pobrać z API)
 */
const exchangeRates: Record<string, number> = {
  PLN: 1,
  USD: 4.0,
  EUR: 4.3,
  JPY: 0.027,
  THB: 0.11,
  GBP: 5.1,
  KRW: 0.003,
  TWD: 0.13,
  KZT: 0.007,
  AED: 1.09,
  NOK: 0.36,
};

/**
 * Konwertuje kwotę do waluty bazowej: gdy jest data.wallet używa reference rates, inaczej fallback na PLN.
 */
function convertToBase(
  amount: number,
  currency: string,
  data?: TravelWalletData | null
): number {
  if (data?.wallet) {
    return convertToBaseCurrency(
      amount,
      currency,
      data.wallet.baseCurrency,
      data.wallet.referenceRates
    );
  }
  const rate = exchangeRates[currency.toUpperCase()] || 1;
  return amount * rate;
}

/**
 * Oblicza całkowity budżet (całkowity zaplanowany budżet podróży)
 *
 * Priority:
 * 1. calculateMainBudget from wallet (gdy wallet i tripId)
 * 2. data.totalBudget – legacy (gdy użytkownik jawnie ustawił budżet)
 * 3. Sum of country budgets (w walucie bazowej)
 */
export function calculateTotalBudget(data: TravelWalletData, tripId?: string): number {
  // 1. Budżet z wallet (wallet.balances) – główne źródło
  if (data.wallet && tripId) {
    try {
      const walletBudget = calculateWalletMainBudget(data.wallet, tripId);
      if (walletBudget > 0) {
        return walletBudget;
      }
    } catch (error) {
      console.warn("[calculateTotalBudget] Error calculating from wallet, falling back:", error);
    }
  }

  // 2. Legacy: jawnie ustawiony budżet podróży
  if (data.totalBudget !== undefined && data.totalBudget > 0) {
    return data.totalBudget;
  }

  // 3. Fallback: suma budżetów krajów w walucie bazowej
  let total = 0;
  data.countries.forEach((country) => {
    country.budgets.forEach((budget) => {
      total += convertToBase(budget.amount, budget.currency, data);
    });
  });
  if (total > 0) return total;

  return data.totalBudget ?? 0;
}

/**
 * Oblicza całkowite faktyczne wydatki (suma actualSpending dla wszystkich krajów)
 * @param data - dane podróży
 * @param tripId - opcjonalne ID podróży (jeśli podane, używa rzeczywistych wydatków i transakcji)
 */
export function calculateTotalSpent(data: TravelWalletData, tripId?: string): number {
  // Jeśli tripId jest podane, użyj rzeczywistych wydatków i transakcji
  if (tripId) {
    const expensesTotal = calculateTotalSpentFromExpenses(tripId, data);
    const transactionsTotal = calculateTotalSpentFromTransactions(tripId, data);
    return expensesTotal + transactionsTotal;
  }

  // W przeciwnym razie użyj starej logiki (dla backward compatibility)
  let total = 0;
  data.countries.forEach((country) => {
    if (country.actualSpending !== undefined) {
      total += country.actualSpending;
    } else {
      // Jeśli nie ma actualSpending, użyj sumy kategorii
      if (country.categories) {
        const categoryTotal = country.categories.reduce(
          (sum, cat) => sum + cat.amount,
          0
        );
        total += categoryTotal;
      }
    }
  });
  return total;
}

/**
 * Oblicza całkowite wydatki z rzeczywistych danych (expenses) przeliczone na walutę bazową podróży
 */
export function calculateTotalSpentFromExpenses(tripId?: string, data?: TravelWalletData): number {
  if (!tripId) return 0;

  const expenses = getAllExpenses(tripId);
  const wallet = data?.wallet ?? getWallet(tripId);
  if (wallet) {
    return expenses.reduce((total, expense) => {
      return total + convertExpenseToBaseByTripId(expense, tripId);
    }, 0);
  }
  return expenses.reduce((total, expense) => {
    return total + convertExpenseToPLN(expense);
  }, 0);
}

/**
 * Oblicza całkowite wydatki z transakcji walutowych które zmniejszają budżet w PLN
 * (wymiany PLN na inne waluty, wypłaty z PLN, prowizje w PLN)
 * 
 * NOTE: In new wallet system, exchanges do NOT decrease budget - only fees from exchanges count as spending.
 * This function is kept for backward compatibility with old system.
 */
export function calculateTotalSpentFromTransactions(
  tripId?: string,
  data?: TravelWalletData
): number {
  if (!tripId) return 0;

  // New wallet system: exchanges don't count as spending, only fees
  if (data?.wallet) {
    const exchanges = getExchanges(tripId);
    let total = 0;

    exchanges.forEach((exchange: { fee?: number; feeCurrency?: string }) => {
      // Only count fees as spending (in base currency)
      if (exchange.fee && exchange.feeCurrency) {
        const feeInBase = convertToBaseCurrency(
          exchange.fee,
          exchange.feeCurrency,
          data.wallet.baseCurrency,
          data.wallet.referenceRates
        );
        total += feeInBase;
      }
    });

    return total;
  }

  // Old system: backward compatibility
  // Używamy bezpośrednio trip.data.currencyTransactions, nie getCurrencyTransactions()
  // bo getCurrencyTransactions() teraz zwraca również exchanges z nowego systemu
  const trip = getTripById(tripId);
  if (!trip) return 0;

  const transactions = trip.data.currencyTransactions || [];
  let total = 0;
  const baseCurrency = trip.data.wallet?.baseCurrency ?? "PLN";

  transactions.forEach((tx: { fromCurrency: string; type: string; fromAmount: number; fee?: number; feeCurrency?: string }) => {
    // Wymiana walut NIE jest wydatkiem - tylko komisja jest wydatkiem
    if (tx.fromCurrency === baseCurrency && tx.type === "withdrawal") {
      total += tx.fromAmount;
    }
    if (tx.fee && tx.feeCurrency === baseCurrency) {
      total += tx.fee;
    }
  });

  return total;
}

/**
 * Oblicza sumę budżetów zaplanowanych na kraje (w walucie bazowej)
 */
export function calculateTotalPlannedCountryBudgets(data: TravelWalletData): number {
  let total = 0;
  data.countries.forEach((country) => {
    country.budgets.forEach((budget) => {
      total += convertToBase(budget.amount, budget.currency, data);
    });
  });
  return total;
}

/**
 * Oblicza niezaplanowany budżet (całkowity budżet - suma budżetów zaplanowanych na kraje)
 * @param data - dane podróży
 * @param tripId - opcjonalne ID podróży (nieużywane, dla zgodności API)
 * @returns niezaplanowany budżet w PLN (różnica między całkowitym budżetem a zaplanowanym na kraje)
 */
export function calculateUnplannedBudget(data: TravelWalletData, tripId?: string): number {
  const totalBudget = calculateTotalBudget(data, tripId);
  const plannedCountryBudgets = calculateTotalPlannedCountryBudgets(data);
  return Math.max(0, totalBudget - plannedCountryBudgets);
}

/**
 * Oblicza pozostały budżet
 * Pozostały budżet = całkowity budżet - wydatki (bez odejmowania zaplanowanych na kraje)
 * @param data - dane podróży
 * @param tripId - opcjonalne ID podróży (jeśli podane, używa rzeczywistych wydatków i transakcji)
 */
export function calculateRemainingBudget(data: TravelWalletData, tripId?: string): number {
  const totalBudget = calculateTotalBudget(data, tripId);

  if (tripId) {
    const expensesTotal = calculateTotalSpentFromExpenses(tripId, data);
    const transactionsTotal = calculateTotalSpentFromTransactions(tripId, data);
    const totalSpent = expensesTotal + transactionsTotal;

    // Pozostały budżet = całkowity budżet - wydatki (wszystko oprócz wydanej kasy)
    return Math.max(0, totalBudget - totalSpent);
  }

  // W przeciwnym razie użyj starej logiki (dla backward compatibility)
  const totalSpent = calculateTotalSpent(data);
  return Math.max(0, totalBudget - totalSpent);
}

/**
 * Oblicza liczbę odwiedzonych krajów
 */
export function calculateCountriesVisited(data: TravelWalletData): number {
  return data.countries.filter(
    (country) => country.status === "visited" || country.status === "current"
  ).length;
}

/**
 * Oblicza całkowitą liczbę krajów
 */
export function calculateTotalCountries(data: TravelWalletData): number {
  return data.countries.length;
}

/**
 * Oblicza całkowitą liczbę dni podróży
 */
export function calculateTravelDays(data: TravelWalletData): number {
  return data.countries.reduce((sum, country) => sum + country.days, 0);
}

/**
 * Oblicza średnie dzienne wydatki
 * @param data - dane podróży
 * @param tripId - opcjonalne ID podróży (jeśli podane, używa rzeczywistych wydatków)
 */
export function calculateAverageDailySpend(data: TravelWalletData, tripId?: string): number {
  const totalSpent = calculateTotalSpent(data, tripId);
  const totalDays = calculateTravelDays(data);
  if (totalDays === 0) return 0;
  return totalSpent / totalDays;
}

/**
 * Oblicza szacowaną liczbę pozostałych dni (na podstawie pozostałego budżetu i średnich dziennych wydatków)
 */
export function calculateEstimatedDaysLeft(data: TravelWalletData): number {
  const remaining = calculateRemainingBudget(data);
  const avgDaily = calculateAverageDailySpend(data);
  if (avgDaily === 0) return 0;
  return Math.floor(remaining / avgDaily);
}

/**
 * Oblicza liczbę dni w podróży (od daty rozpoczęcia do dziś lub do daty zakończenia, jeśli podróż już się odbyła)
 */
export function calculateDaysInTravel(tripStartDate?: string, tripEndDate?: string): number {
  if (!tripStartDate) return 0;

  const start = new Date(tripStartDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  // Jeśli podróż jeszcze się nie rozpoczęła (start > today), zwróć 0
  if (start > today) {
    return 0;
  }

  // Jeśli podróż już się odbyła (endDate < today), użyj endDate zamiast today
  let endDate = today;
  if (tripEndDate) {
    const end = new Date(tripEndDate);
    end.setHours(0, 0, 0, 0);
    if (end < today) {
      // Podróż już się odbyła - użyj daty zakończenia
      endDate = end;
    }
  }

  // Użyj tej samej logiki co w calculateTotalTripDays dla spójności
  const diffTime = endDate.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 aby uwzględnić dzień startowy

  return Math.max(0, diffDays);
}

/**
 * Oblicza liczbę pozostałych dni do końca podróży (od dziś do daty zakończenia)
 * Zwraca 0 jeśli podróż już się odbyła
 */
export function calculateDaysRemaining(tripEndDate?: string): number {
  if (!tripEndDate) return 0;

  const end = new Date(tripEndDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  // Jeśli podróż już się odbyła, zwróć 0
  if (end < today) {
    return 0;
  }

  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Oblicza liczbę dni do początku podróży (od dziś do daty rozpoczęcia)
 * Zwraca 0 jeśli podróż już się zaczęła
 */
export function calculateDaysUntilStart(tripStartDate?: string): number {
  if (!tripStartDate) return 0;

  const start = new Date(tripStartDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  // Jeśli podróż już się zaczęła, zwróć 0
  if (start <= today) {
    return 0;
  }

  const diffTime = start.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Oblicza całkowitą liczbę dni podróży (od daty rozpoczęcia do daty zakończenia)
 */
export function calculateTotalTripDays(tripStartDate?: string, tripEndDate?: string): number {
  if (!tripStartDate || !tripEndDate) return 0;

  const start = new Date(tripStartDate);
  const end = new Date(tripEndDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 aby uwzględnić dzień startowy

  return Math.max(0, diffDays);
}

/**
 * Oblicza całkowite planowane wydatki (suma planowanych wydatków ze wszystkich krajów, w walucie bazowej)
 */
export function calculateTotalPlannedSpending(data: TravelWalletData): number {
  return data.countries.reduce((sum, country) => {
    return sum + calculatePlannedSpending(country, data);
  }, 0);
}

/**
 * Oblicza niewydane planowane wydatki (suma max(0, plannedAmount - amount) dla wszystkich kategorii)
 * To jest kwota, którą jeszcze można wydać zgodnie z planem
 */
export function calculateUnspentPlannedSpending(data: TravelWalletData): number {
  return data.countries.reduce((sum, country) => {
    if (!country.categories) return sum;

    const countryUnspent = country.categories.reduce((catSum, category) => {
      // Oblicz niewydaną część planowanego wydatku
      const unspent = Math.max(0, category.plannedAmount - category.amount);
      return catSum + unspent;
    }, 0);

    return sum + countryUnspent;
  }, 0);
}

/**
 * Oblicza burn rate (procent, o ile szybciej/wolniej wydajemy niż planowano)
 * @param data - dane podróży
 * @param tripId - opcjonalne ID podróży (jeśli podane, używa rzeczywistych wydatków)
 */
export function calculateBurnRate(data: TravelWalletData, tripId?: string): number {
  const totalSpent = calculateTotalSpent(data, tripId);
  const totalPlanned = data.countries.reduce((sum, country) => {
    let planned = 0;
    if (country.categories) {
      planned = country.categories.reduce(
        (catSum, cat) => catSum + cat.plannedAmount,
        0
      );
    } else {
      planned = country.budgets.reduce(
        (budgetSum, budget) =>
          budgetSum + convertToBase(budget.amount, budget.currency, data),
        0
      );
    }
    return sum + planned;
  }, 0);

  if (totalPlanned === 0) return 0;

  // Burn rate jako procent różnicy: ((actual - planned) / planned) * 100
  const difference = totalSpent - totalPlanned;
  return (difference / totalPlanned) * 100;
}

/**
 * Oblicza variance (różnicę) dla danego kraju (w walucie bazowej gdy podano data)
 */
export function calculateCountryVariance(country: Country, data?: TravelWalletData): number {
  let actual = 0;
  let planned = 0;

  if (country.actualSpending !== undefined) {
    actual = country.actualSpending;
  } else if (country.categories) {
    actual = country.categories.reduce((sum, cat) => sum + cat.amount, 0);
  }

  if (country.categories) {
    planned = country.categories.reduce(
      (sum, cat) => sum + cat.plannedAmount,
      0
    );
  } else {
    planned = country.budgets.reduce(
      (sum, budget) => sum + convertToBase(budget.amount, budget.currency, data ?? null),
      0
    );
  }

  return actual - planned;
}

/**
 * Oblicza średni dzienny koszt dla kraju (planowany; w walucie bazowej gdy podano data)
 */
export function calculateAverageDailyCost(country: Country, data?: TravelWalletData): number {
  let total = 0;
  if (country.categories) {
    total = country.categories.reduce((sum, cat) => sum + cat.plannedAmount, 0);
  } else {
    total = country.budgets.reduce(
      (sum, budget) => sum + convertToBase(budget.amount, budget.currency, data ?? null),
      0
    );
  }
  if (country.days === 0) return 0;
  return total / country.days;
}

/**
 * Oblicza sumy wydatków według kategorii dla wszystkich krajów
 */
export function calculateCategoryTotals(
  data: TravelWalletData
): Record<string, { actual: number; planned: number }> {
  const totals: Record<string, { actual: number; planned: number }> = {};

  data.countries.forEach((country) => {
    if (country.categories) {
      country.categories.forEach((category) => {
        if (!totals[category.name]) {
          totals[category.name] = { actual: 0, planned: 0 };
        }
        totals[category.name].actual += category.amount;
        totals[category.name].planned += category.plannedAmount;
      });
    }
  });

  return totals;
}

/**
 * Oblicza planowane wydatki dla kraju (suma budżetów lub kategorii; w walucie bazowej gdy podano data)
 */
export function calculatePlannedSpending(country: Country, data?: TravelWalletData): number {
  if (country.categories) {
    return country.categories.reduce(
      (sum, cat) => sum + cat.plannedAmount,
      0
    );
  }
  return country.budgets.reduce(
    (sum, budget) => sum + convertToBase(budget.amount, budget.currency, data ?? null),
    0
  );
}

/**
 * Oblicza faktyczne wydatki dla kraju
 */
export function calculateActualSpending(country: Country): number {
  if (country.actualSpending !== undefined) {
    return country.actualSpending;
  }
  if (country.categories) {
    return country.categories.reduce((sum, cat) => sum + cat.amount, 0);
  }
  return 0;
}

/**
 * Oblicza pozostały budżet kraju: suma budżetów kraju - wydatki w kraju (w walucie bazowej gdy tripId/data)
 */
export function calculateCountryRemainingBudget(
  country: Country,
  expenses: Expense[],
  tripId?: string,
  data?: TravelWalletData
): number {
  const planned = calculatePlannedTotal(country, data ?? (tripId ? getTripById(tripId)?.data : undefined));
  const actual = tripId
    ? calculateTotalActualCostByTripId(expenses, tripId)
    : calculateTotalActualCost(expenses, data?.wallet?.baseCurrency, data?.wallet?.referenceRates);
  return Math.max(0, planned - actual);
}

/**
 * Oblicza całkowite wydatki w kraju (w walucie bazowej podróży)
 */
export function calculateCountryTotalSpent(countryId: string, tripId: string, data?: TravelWalletData): number {
  const expenses = getExpensesByCountryId(countryId, tripId);
  return calculateTotalActualCostByTripId(expenses, tripId);
}

/**
 * Oblicza liczbę dni w kraju na podstawie dat start i end
 */
export function calculateDaysInCountry(country: Country): number {
  return calculateTravelDaysFromDates(country.startDate, country.endDate);
}

/**
 * Oblicza średnie dzienne wydatki w kraju
 */
export function calculateCountryAverageDailySpend(
  countryId: string,
  tripId: string,
  daysInCountry: number
): number {
  if (daysInCountry === 0) return 0;
  const totalSpent = calculateCountryTotalSpent(countryId, tripId);
  return totalSpent / daysInCountry;
}

/**
 * Oblicza dni do rozpoczęcia pobytu w kraju
 */
export function calculateDaysUntilCountryStart(country: Country): number {
  if (!country.startDate) return 0;
  const startDate = new Date(country.startDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  const diffTime = startDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Oblicza dni do zakończenia pobytu w kraju
 */
export function calculateDaysUntilCountryEnd(country: Country): number {
  if (!country.endDate) return 0;
  const endDate = new Date(country.endDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Grupuje wydatki w kraju według waluty
 */
export function getCountryExpensesByCurrency(
  countryId: string,
  tripId: string
): Record<string, number> {
  const expenses = getExpensesByCountryId(countryId, tripId);
  return expenses.reduce((acc: Record<string, number>, expense) => {
    const currency = expense.currency || "PLN";
    acc[currency] = (acc[currency] || 0) + expense.amount;
    return acc;
  }, {});
}

/**
 * Zwraca liczbę dni do najbliższej nadchodzącej podróży (startDate > dziś).
 * Jeśli brak nadchodzących podróży, zwraca null.
 */
export function getDaysUntilNextTrip(trips: Trip[]): number | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let minDays: number | null = null;
  for (const trip of trips) {
    if (!trip.startDate) continue;
    const start = new Date(trip.startDate);
    start.setHours(0, 0, 0, 0);
    if (start <= today) continue;
    const days = Math.ceil((start.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    if (minDays === null || days < minDays) minDays = days;
  }
  return minDays;
}
