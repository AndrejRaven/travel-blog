import type { CurrencyBalance, Trip, Expense } from "./types";
import { getCurrencyTransactions, getInitialBalances } from "./currency-transactions";
import { getAllExpenses } from "./expenses";

// Exchange rates (same as in calculations.ts and expenses.ts)
const exchangeRates: Record<string, number> = {
  PLN: 1,
  EUR: 4.3,
  USD: 4.0,
  GBP: 5.0,
  THB: 0.12,
  JPY: 0.027,
  AUD: 2.6,
  CAD: 2.9,
};

/**
 * Konwertuje kwotę w danej walucie na PLN
 */
function convertToPLN(amount: number, currency: string): number {
  const rate = exchangeRates[currency.toUpperCase()] || 1;
  return amount * rate;
}

/**
 * Oblicza salda walutowe dla podróży
 * @param trip - obiekt podróży
 * @param countryId - opcjonalne ID kraju (filtruje transakcje i wydatki)
 * @returns mapa sald per waluta
 */
export function calculateCurrencyBalances(
  trip: Trip,
  countryId?: string
): CurrencyBalance[] {
  const balancesMap = new Map<string, CurrencyBalance>();

  // 1. Początkowe salda (globalne)
  const initialBalances = getInitialBalances(trip.id);
  initialBalances.forEach(({ currency, amount }) => {
    balancesMap.set(currency, {
      currency,
      amount,
      initial: amount,
      spent: 0,
      exchangedOut: 0,
      exchangedIn: 0,
      withdrawals: 0,
    });
  });

  // 1b. Budżety kraju (jeśli countryId jest podane)
  if (countryId && trip.data?.countries) {
    const country = trip.data.countries.find((c) => c.id === countryId);
    if (country && country.budgets) {
      country.budgets.forEach((budget) => {
        if (budget.amount > 0) {
          const existingBalance = balancesMap.get(budget.currency);
          if (existingBalance) {
            existingBalance.initial += budget.amount;
            existingBalance.amount += budget.amount;
          } else {
            balancesMap.set(budget.currency, {
              currency: budget.currency,
              amount: budget.amount,
              initial: budget.amount,
              spent: 0,
              exchangedOut: 0,
              exchangedIn: 0,
              withdrawals: 0,
            });
          }
        }
      });
    }
  }

  // 2. Transakcje walutowe
  let transactions = getCurrencyTransactions(trip.id);
  if (countryId) {
    transactions = transactions.filter((tx) => tx.countryId === countryId);
  }

  transactions.forEach((tx) => {
    // Waluta źródłowa - odejmij
    if (!balancesMap.has(tx.fromCurrency)) {
      balancesMap.set(tx.fromCurrency, {
        currency: tx.fromCurrency,
        amount: 0,
        initial: 0,
        spent: 0,
        exchangedOut: 0,
        exchangedIn: 0,
        withdrawals: 0,
      });
    }
    const fromBalance = balancesMap.get(tx.fromCurrency)!;
    
    if (tx.type === "exchange") {
      fromBalance.exchangedOut += tx.fromAmount;
      fromBalance.amount -= tx.fromAmount;
    } else if (tx.type === "withdrawal") {
      fromBalance.withdrawals += tx.fromAmount;
      fromBalance.amount -= tx.fromAmount;
    }

    // Waluta docelowa - dodaj
    if (!balancesMap.has(tx.toCurrency)) {
      balancesMap.set(tx.toCurrency, {
        currency: tx.toCurrency,
        amount: 0,
        initial: 0,
        spent: 0,
        exchangedOut: 0,
        exchangedIn: 0,
        withdrawals: 0,
      });
    }
    const toBalance = balancesMap.get(tx.toCurrency)!;
    
    if (tx.type === "exchange") {
      toBalance.exchangedIn += tx.toAmount;
      toBalance.amount += tx.toAmount;
    } else if (tx.type === "withdrawal") {
      toBalance.exchangedIn += tx.toAmount;
      toBalance.amount += tx.toAmount;
    } else if (tx.type === "initial") {
      toBalance.initial += tx.toAmount;
      toBalance.amount += tx.toAmount;
    }

    // Prowizja
    if (tx.fee && tx.feeCurrency) {
      if (!balancesMap.has(tx.feeCurrency)) {
        balancesMap.set(tx.feeCurrency, {
          currency: tx.feeCurrency,
          amount: 0,
          initial: 0,
          spent: 0,
          exchangedOut: 0,
          exchangedIn: 0,
          withdrawals: 0,
        });
      }
      const feeBalance = balancesMap.get(tx.feeCurrency)!;
      feeBalance.spent += tx.fee;
      feeBalance.amount -= tx.fee;
    }
  });

  // 3. Wydatki
  let expenses = getAllExpenses(trip.id);
  if (countryId) {
    expenses = expenses.filter((exp) => exp.countryId === countryId);
  }

  expenses.forEach((expense) => {
    const currency = expense.currency;
    
    if (!balancesMap.has(currency)) {
      balancesMap.set(currency, {
        currency,
        amount: 0,
        initial: 0,
        spent: 0,
        exchangedOut: 0,
        exchangedIn: 0,
        withdrawals: 0,
      });
    }
    
    const balance = balancesMap.get(currency)!;
    balance.spent += expense.amount;
    balance.amount -= expense.amount;
  });

  return Array.from(balancesMap.values());
}

/**
 * Oblicza całkowite saldo we wszystkich walutach przeliczone na PLN
 * @param balances - lista sald walutowych
 * @returns suma w PLN
 */
export function calculateTotalBalanceInPLN(balances: CurrencyBalance[]): number {
  return balances.reduce((total, balance) => {
    return total + convertToPLN(balance.amount, balance.currency);
  }, 0);
}

/**
 * Pobiera saldo dla konkretnej waluty
 * @param balances - lista sald walutowych
 * @param currency - kod waluty
 * @returns saldo dla waluty lub null jeśli nie istnieje
 */
export function getBalanceForCurrency(
  balances: CurrencyBalance[],
  currency: string
): CurrencyBalance | null {
  return balances.find((b) => b.currency === currency) || null;
}

/**
 * Sprawdza czy użytkownik ma wystarczające środki w danej walucie
 * @param balances - lista sald walutowych
 * @param currency - kod waluty
 * @param amount - kwota do sprawdzenia
 * @returns true jeśli środki wystarczające
 */
export function hasEnoughBalance(
  balances: CurrencyBalance[],
  currency: string,
  amount: number
): boolean {
  const balance = getBalanceForCurrency(balances, currency);
  if (!balance) return false;
  return balance.amount >= amount;
}

/**
 * Grupuje wydatki według metody płatności
 * @param expenses - lista wydatków
 * @returns mapa wydatków per metoda płatności
 */
export function groupExpensesByPaymentMethod(expenses: Expense[]): {
  card: Expense[];
  cash: Expense[];
  bankWithdrawal: Expense[];
  unknown: Expense[];
} {
  return expenses.reduce(
    (acc, expense) => {
      if (!expense.paymentMethod) {
        acc.unknown.push(expense);
      } else if (expense.paymentMethod.type === "card") {
        acc.card.push(expense);
      } else if (expense.paymentMethod.type === "cash") {
        acc.cash.push(expense);
      } else if (expense.paymentMethod.type === "bank-withdrawal") {
        acc.bankWithdrawal.push(expense);
      }
      return acc;
    },
    {
      card: [] as Expense[],
      cash: [] as Expense[],
      bankWithdrawal: [] as Expense[],
      unknown: [] as Expense[],
    }
  );
}

/**
 * Oblicza wydatki per waluta i metoda płatności
 * @param expenses - lista wydatków
 * @returns mapa wydatków
 */
export function calculateSpendingByPaymentMethod(expenses: Expense[]): {
  currency: string;
  card: number;
  cash: number;
  bankWithdrawal: number;
  total: number;
}[] {
  const spendingMap = new Map<
    string,
    { card: number; cash: number; bankWithdrawal: number }
  >();

  expenses.forEach((expense) => {
    if (!spendingMap.has(expense.currency)) {
      spendingMap.set(expense.currency, {
        card: 0,
        cash: 0,
        bankWithdrawal: 0,
      });
    }
    
    const spending = spendingMap.get(expense.currency)!;
    
    if (!expense.paymentMethod || expense.paymentMethod.type === "card") {
      spending.card += expense.amount;
    } else if (expense.paymentMethod.type === "cash") {
      spending.cash += expense.amount;
    } else if (expense.paymentMethod.type === "bank-withdrawal") {
      spending.bankWithdrawal += expense.amount;
    }
  });

  return Array.from(spendingMap.entries()).map(([currency, spending]) => ({
    currency,
    ...spending,
    total: spending.card + spending.cash + spending.bankWithdrawal,
  }));
}
