import type { Wallet, BudgetAdjustment } from "./types";
import {
  hasEnoughBalance,
  adjustCurrencyBalance,
  getCurrencyBalance,
} from "./wallet-operations";

/**
 * Validates if a budget adjustment can be executed
 * @param wallet - wallet state
 * @param type - adjustment type (increase or decrease)
 * @param amount - adjustment amount
 * @returns validation result
 */
export function validateBudgetAdjustment(
  wallet: Wallet,
  type: "increase" | "decrease",
  amount: number
): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return {
      valid: false,
      error: "Adjustment amount must be greater than 0",
    };
  }

  // For decrease, validate sufficient balance in base currency
  if (type === "decrease") {
    if (!hasEnoughBalance(wallet, wallet.baseCurrency, amount)) {
      const balance = getCurrencyBalance(wallet, wallet.baseCurrency);
      return {
        valid: false,
        error: `Insufficient balance in ${wallet.baseCurrency}. Available: ${balance}, Required: ${amount}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Executes a budget adjustment
 * Budget adjustment increases or decreases base currency balance
 * This changes the main budget
 * @param wallet - current wallet state
 * @param adjustment - adjustment data (without id and timestamp)
 * @returns result with updated wallet or error
 */
export function executeBudgetAdjustment(
  wallet: Wallet,
  adjustment: Omit<BudgetAdjustment, "id" | "timestamp">
): { success: boolean; newWallet: Wallet; error?: string } {
  // Validate adjustment
  const validation = validateBudgetAdjustment(
    wallet,
    adjustment.type,
    adjustment.amount
  );

  if (!validation.valid) {
    return {
      success: false,
      newWallet: wallet,
      error: validation.error,
    };
  }

  // Validate currency is base currency
  if (adjustment.currency !== wallet.baseCurrency) {
    return {
      success: false,
      newWallet: wallet,
      error: `Budget adjustments must be in base currency (${wallet.baseCurrency}), got ${adjustment.currency}`,
    };
  }

  try {
    // Adjust base currency balance
    const delta = adjustment.type === "increase" ? adjustment.amount : -adjustment.amount;
    const newWallet = adjustCurrencyBalance(
      wallet,
      wallet.baseCurrency,
      delta
    );

    // Main budget is automatically recalculated from balances
    // when calculateMainBudget is called

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
 * Validates budget adjustment data before execution
 * @param wallet - wallet state
 * @param type - adjustment type
 * @param amount - adjustment amount
 * @param currency - currency (must be base currency)
 * @returns validation result
 */
export function validateBudgetAdjustmentData(
  wallet: Wallet,
  type: "increase" | "decrease",
  amount: number,
  currency: string
): { valid: boolean; error?: string } {
  // Validate currency is base currency
  if (currency !== wallet.baseCurrency) {
    return {
      valid: false,
      error: `Budget adjustments must be in base currency (${wallet.baseCurrency})`,
    };
  }

  return validateBudgetAdjustment(wallet, type, amount);
}
