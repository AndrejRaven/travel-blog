import type { TravelWalletData, Country, ExpenseCategory, Wallet } from "./types";
import { getAllExpenses, convertExpenseToPLN } from "./expenses";
import { getCurrencyTransactions } from "./currency-transactions";
import { calculateMainBudget as calculateWalletMainBudget } from "./wallet-operations";
import { getWallet } from "./wallet-storage";

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
};

/**
 * Konwertuje kwotę w danej walucie na PLN
 */
function convertToPLN(amount: number, currency: string): number {
  const rate = exchangeRates[currency.toUpperCase()] || 1;
  return amount * rate;
}

/**
 * Oblicza całkowity budżet (suma wszystkich budżetów we wszystkich walutach, przeliczona na PLN)
 * Uses new wallet system if available, falls back to old system for backward compatibility
 */
export function calculateTotalBudget(data: TravelWalletData, tripId?: string): number {
  // Try new wallet system first
  if (tripId && data.wallet) {
    return calculateWalletMainBudget(data.wallet);
  }

  // Fallback to old system
  if (data.totalBudget !== undefined) {
    return data.totalBudget;
  }

  let total = 0;
  data.countries.forEach((country) => {
    country.budgets.forEach((budget) => {
      total += convertToPLN(budget.amount, budget.currency);
    });
  });
  return total;
}

/**
 * Oblicza całkowite faktyczne wydatki (suma actualSpending dla wszystkich krajów)
 * @param data - dane podróży
 * @param tripId - opcjonalne ID podróży (jeśli podane, używa rzeczywistych wydatków i transakcji)
 */
export function calculateTotalSpent(data: TravelWalletData, tripId?: string): number {
  // Jeśli tripId jest podane, użyj rzeczywistych wydatków i transakcji
  if (tripId) {
    const expensesTotal = calculateTotalSpentFromExpenses(tripId);
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
 * Oblicza całkowite wydatki z rzeczywistych danych (expenses) przeliczone na PLN
 */
export function calculateTotalSpentFromExpenses(tripId?: string): number {
  if (!tripId) return 0;
  
  const expenses = getAllExpenses(tripId);
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
    const { getExchanges } = require("./wallet-storage");
    const exchanges = getExchanges(tripId);
    let total = 0;

    exchanges.forEach((exchange) => {
      // Only count fees as spending
      if (exchange.fee && exchange.feeCurrency) {
        // Convert fee to PLN if needed
        const feeInPLN = convertToPLN(exchange.fee, exchange.feeCurrency);
        total += feeInPLN;
      }
    });

    return total;
  }

  // Old system: backward compatibility
  // Używamy bezpośrednio trip.data.currencyTransactions, nie getCurrencyTransactions()
  // bo getCurrencyTransactions() teraz zwraca również exchanges z nowego systemu
  const { getTripById } = require("./trips-storage");
  const trip = getTripById(tripId);
  if (!trip) return 0;
  
  const transactions = trip.data.currencyTransactions || [];
  let total = 0;

  transactions.forEach((tx) => {
    // Wymiana walut NIE jest wydatkiem - tylko komisja jest wydatkiem
    // (W starym systemie wymiana PLN była błędnie liczona jako wydatek, ale to było nieprawidłowe)
    
    // Wypłata z bankomatu PLN na inną walutę = zmniejsza budżet w PLN (old system only)
    if (tx.fromCurrency === "PLN" && tx.type === "withdrawal") {
      total += tx.fromAmount;
    }

    // Prowizja w PLN = zmniejsza budżet w PLN (old system only)
    if (tx.fee && tx.feeCurrency === "PLN") {
      total += tx.fee;
    }
  });

  return total;
}

/**
 * Oblicza pozostały budżet
 * @param data - dane podróży
 * @param tripId - opcjonalne ID podróży (jeśli podane, używa rzeczywistych wydatków i transakcji)
 */
export function calculateRemainingBudget(data: TravelWalletData, tripId?: string): number {
  const totalBudget = calculateTotalBudget(data, tripId);
  
  // Jeśli tripId jest podane, użyj rzeczywistych wydatków
  // W nowym systemie: exchanges NIE zmniejszają budżetu, tylko expenses
  if (tripId) {
    // Try new wallet system
    if (data.wallet) {
      // Main budget is already calculated from current balances (sum of all currencies)
      // Remaining budget = main budget (since balances already reflect expenses)
      // The wallet balances are the current state after all operations
      return Math.max(0, totalBudget);
    }
    
    // Fallback to old system
    const expensesTotal = calculateTotalSpentFromExpenses(tripId);
    const transactionsTotal = calculateTotalSpentFromTransactions(tripId, data);
    const totalSpent = expensesTotal + transactionsTotal;
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
 * Oblicza całkowite planowane wydatki (suma planowanych wydatków ze wszystkich krajów)
 */
export function calculateTotalPlannedSpending(data: TravelWalletData): number {
  return data.countries.reduce((sum, country) => {
    return sum + calculatePlannedSpending(country);
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
    // Oblicz planowane wydatki dla kraju
    let planned = 0;
    if (country.categories) {
      planned = country.categories.reduce(
        (catSum, cat) => catSum + cat.plannedAmount,
        0
      );
    } else {
      // Jeśli nie ma kategorii, użyj sumy budżetów
      planned = country.budgets.reduce(
        (budgetSum, budget) =>
          budgetSum + convertToPLN(budget.amount, budget.currency),
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
 * Oblicza variance (różnicę) dla danego kraju
 */
export function calculateCountryVariance(country: Country): number {
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
      (sum, budget) => sum + convertToPLN(budget.amount, budget.currency),
      0
    );
  }

  return actual - planned;
}

/**
 * Oblicza średni dzienny koszt dla kraju
 */
export function calculateAverageDailyCost(country: Country): number {
  let total = 0;
  if (country.categories) {
    total = country.categories.reduce((sum, cat) => sum + cat.plannedAmount, 0);
  } else {
    total = country.budgets.reduce(
      (sum, budget) => sum + convertToPLN(budget.amount, budget.currency),
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
 * Oblicza planowane wydatki dla kraju (suma budżetów lub kategorii)
 */
export function calculatePlannedSpending(country: Country): number {
  if (country.categories) {
    return country.categories.reduce(
      (sum, cat) => sum + cat.plannedAmount,
      0
    );
  }
  return country.budgets.reduce(
    (sum, budget) => sum + convertToPLN(budget.amount, budget.currency),
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

