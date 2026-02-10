import type { Wallet, Expense } from "./types";
import {
  hasEnoughBalance,
  adjustCurrencyBalance,
  getCurrencyBalance,
} from "./wallet-operations";
import { convertToBaseCurrency } from "./reference-rates";

/**
 * Validates if an expense can be executed
 * @param wallet - wallet state
 * @param currency - currency of the expense
 * @param amount - expense amount
 * @returns validation result
 */
export function validateExpense(
  wallet: Wallet,
  currency: string,
  amount: number
): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: "Expense amount must be greater than 0" };
  }

  if (!hasEnoughBalance(wallet, currency, amount)) {
    const balance = getCurrencyBalance(wallet, currency);
    return {
      valid: false,
      error: `Insufficient balance in ${currency}. Available: ${balance}, Required: ${amount}`,
    };
  }

  return { valid: true };
}

/**
 * Executes an expense
 * Expense decreases both currency balance AND main budget
 * @param wallet - current wallet state
 * @param expense - expense data (without id)
 * @returns result with updated wallet or error
 */
export function executeExpense(
  wallet: Wallet,
  expense: Omit<Expense, "id">
): { success: boolean; newWallet: Wallet; error?: string } {
  // Validate expense
  const validation = validateExpense(wallet, expense.currency, expense.amount);

  if (!validation.valid) {
    return {
      success: false,
      newWallet: wallet,
      error: validation.error,
    };
  }

  try {
    // Decrease currency balance
    const newWallet = adjustCurrencyBalance(
      wallet,
      expense.currency,
      -expense.amount
    );

    // Note: Main budget is automatically recalculated from balances
    // when calculateMainBudget is called, so we don't need to adjust it separately
    // The decrease in currency balance will automatically decrease the main budget
    // when converted to base currency using reference rates

    return {
      success: true,
      newWallet,
    };
  } catch (error) {
    return {
      success: false,
      newWallet: wallet,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Calculates the impact of an expense on the main budget
 * @param wallet - wallet state
 * @param expense - expense data
 * @returns amount in base currency that will be deducted from main budget
 */
export function calculateExpenseImpactOnBudget(
  wallet: Wallet,
  expense: Omit<Expense, "id">
): number {
  return convertToBaseCurrency(
    expense.amount,
    expense.currency,
    wallet.baseCurrency,
    wallet.referenceRates
  );
}

/**
 * Validates expense data before execution
 * @param wallet - wallet state
 * @param currency - currency of the expense
 * @param amount - expense amount
 * @returns validation result
 */
export function validateExpenseData(
  wallet: Wallet,
  currency: string,
  amount: number
): { valid: boolean; error?: string } {
  return validateExpense(wallet, currency, amount);
}
