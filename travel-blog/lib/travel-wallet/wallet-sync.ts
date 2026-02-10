import type { Trip, TravelWalletData, SimpleCurrencyBalance } from "./types";
import { getTripById } from "./trips-storage";
import { getWallet, updateWallet } from "./wallet-storage";
import { initializeWallet } from "./wallet-operations";
import { getCurrencyTransactions } from "./currency-transactions";
import { getAllExpenses } from "./expenses";
import { executeExchange } from "./exchange-operations";

/**
 * Synchronizuje portfel z budżetami krajów i transakcjami
 * Tworzy portfel jeśli nie istnieje, lub aktualizuje istniejący
 * @param tripId - ID podróży
 * @returns true jeśli synchronizacja się powiodła
 */
export function syncWalletWithBudgets(tripId: string): boolean {
  const trip = getTripById(tripId);
  if (!trip) return false;

  const data = trip.data;
  const baseCurrency = "PLN"; // Default base currency

  // Step 1: Collect initial balances from country budgets
  const initialBalances: SimpleCurrencyBalance[] = [];

  // From country budgets (add all budgets from all countries)
  if (data.countries) {
    data.countries.forEach((country) => {
      if (country.budgets) {
        country.budgets.forEach((budget) => {
          if (budget.amount > 0) {
            const existing = initialBalances.find(
              (b) => b.currency === budget.currency
            );
            if (existing) {
              existing.amount += budget.amount;
            } else {
              initialBalances.push({
                currency: budget.currency,
                amount: budget.amount,
              });
            }
          }
        });
      }
    });
  }

  // If no budgets, create empty wallet with base currency
  if (initialBalances.length === 0) {
    initialBalances.push({ currency: baseCurrency, amount: 0 });
  }

  // Step 2: Always rebuild wallet from scratch to ensure consistency
  // Start with budgets, then apply all exchanges and expenses in order
  const freshWallet = initializeWallet(baseCurrency, initialBalances);

  // Step 3: Apply all exchanges to wallet
  const exchanges = data.exchanges || [];
  let currentWallet = freshWallet;

  exchanges.forEach((exchange) => {
    const result = executeExchange(currentWallet, {
      fromCurrency: exchange.fromCurrency,
      fromAmount: exchange.fromAmount,
      toCurrency: exchange.toCurrency,
      toAmount: exchange.toAmount,
      transactionRate: exchange.transactionRate,
      fee: exchange.fee,
      feeCurrency: exchange.feeCurrency,
      note: exchange.note,
      location: exchange.location,
      countryId: exchange.countryId,
    });

    if (result.success) {
      currentWallet = result.newWallet;
    }
  });

  // Step 4: Apply expenses (decrease balances)
  const expenses = getAllExpenses(tripId);
  expenses.forEach((expense) => {
    const balance = currentWallet.balances.find(
      (b) => b.currency === expense.currency
    );
    if (balance) {
      balance.amount -= expense.amount;
      // Prevent negative balances
      if (balance.amount < 0) {
        balance.amount = 0;
      }
    }
  });

  // Step 5: Update wallet in storage
  return updateWallet(tripId, currentWallet);
}
