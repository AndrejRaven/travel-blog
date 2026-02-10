import type { Wallet, CurrencyExchange } from "./types";
import {
  hasEnoughBalance,
  adjustCurrencyBalance,
  getCurrencyBalance,
} from "./wallet-operations";

/**
 * Validates if an exchange can be executed
 * @param wallet - wallet state
 * @param fromCurrency - source currency
 * @param fromAmount - amount to exchange
 * @param fee - optional fee amount
 * @param feeCurrency - optional fee currency
 * @returns validation result
 */
export function validateExchange(
  wallet: Wallet,
  fromCurrency: string,
  fromAmount: number,
  fee?: number,
  feeCurrency?: string
): { valid: boolean; error?: string } {
  // Validate fromAmount
  if (fromAmount <= 0) {
    return { valid: false, error: "Exchange amount must be greater than 0" };
  }

  // Validate sufficient balance in fromCurrency
  if (!hasEnoughBalance(wallet, fromCurrency, fromAmount)) {
    const balance = getCurrencyBalance(wallet, fromCurrency);
    return {
      valid: false,
      error: `Insufficient balance in ${fromCurrency}. Available: ${balance}, Required: ${fromAmount}`,
    };
  }

  // Validate fee if provided
  if (fee && fee > 0) {
    if (!feeCurrency) {
      return {
        valid: false,
        error: "Fee currency must be specified when fee is provided",
      };
    }
    if (fee <= 0) {
      return { valid: false, error: "Fee must be greater than 0" };
    }
    if (!hasEnoughBalance(wallet, feeCurrency, fee)) {
      const balance = getCurrencyBalance(wallet, feeCurrency);
      return {
        valid: false,
        error: `Insufficient balance for fee in ${feeCurrency}. Available: ${balance}, Required: ${fee}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Calculates exchange result (toAmount and netFromAmount after fee)
 * @param fromAmount - amount to exchange
 * @param transactionRate - exchange rate used in transaction
 * @param fee - optional fee amount
 * @returns exchange result
 */
export function calculateExchangeResult(
  fromAmount: number,
  transactionRate: number,
  fee?: number
): { toAmount: number; netFromAmount: number } {
  const toAmount = fromAmount * transactionRate;
  const netFromAmount = fee ? fromAmount + fee : fromAmount;
  return { toAmount, netFromAmount };
}

/**
 * Executes a currency exchange
 * Exchange does NOT change the total budget - it only changes internal currency structure
 * @param wallet - current wallet state
 * @param exchange - exchange data (without id and timestamp)
 * @returns result with updated wallet or error
 */
export function executeExchange(
  wallet: Wallet,
  exchange: Omit<CurrencyExchange, "id" | "timestamp" | "type">
): { success: boolean; newWallet: Wallet; error?: string } {
  // Validate exchange
  const validation = validateExchange(
    wallet,
    exchange.fromCurrency,
    exchange.fromAmount,
    exchange.fee,
    exchange.feeCurrency
  );

  if (!validation.valid) {
    return {
      success: false,
      newWallet: wallet,
      error: validation.error,
    };
  }

  // Validate transaction rate
  if (exchange.transactionRate <= 0) {
    return {
      success: false,
      newWallet: wallet,
      error: "Transaction rate must be greater than 0",
    };
  }

  // Validate toAmount matches transaction rate
  const expectedToAmount = exchange.fromAmount * exchange.transactionRate;
  if (Math.abs(exchange.toAmount - expectedToAmount) > 0.01) {
    return {
      success: false,
      newWallet: wallet,
      error: `toAmount (${exchange.toAmount}) does not match transaction rate calculation (${expectedToAmount})`,
    };
  }

  try {
    let newWallet = wallet;

    // Subtract fromCurrency amount
    newWallet = adjustCurrencyBalance(
      newWallet,
      exchange.fromCurrency,
      -exchange.fromAmount
    );

    // Add toCurrency amount
    const toBalance = getCurrencyBalance(newWallet, exchange.toCurrency);
    newWallet = adjustCurrencyBalance(
      newWallet,
      exchange.toCurrency,
      exchange.toAmount
    );

    // Handle fee if provided
    if (exchange.fee && exchange.feeCurrency) {
      newWallet = adjustCurrencyBalance(
        newWallet,
        exchange.feeCurrency,
        -exchange.fee
      );
    }

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
 * Validates exchange data before execution
 * @param wallet - wallet state
 * @param fromCurrency - source currency
 * @param fromAmount - amount to exchange
 * @param toCurrency - target currency
 * @param transactionRate - exchange rate
 * @param fee - optional fee
 * @param feeCurrency - optional fee currency
 * @returns validation result
 */
export function validateExchangeData(
  wallet: Wallet,
  fromCurrency: string,
  fromAmount: number,
  toCurrency: string,
  transactionRate: number,
  fee?: number,
  feeCurrency?: string
): { valid: boolean; error?: string } {
  // Basic validations
  if (fromCurrency === toCurrency) {
    return { valid: false, error: "Cannot exchange same currency" };
  }

  if (fromAmount <= 0) {
    return { valid: false, error: "From amount must be greater than 0" };
  }

  if (transactionRate <= 0) {
    return { valid: false, error: "Transaction rate must be greater than 0" };
  }

  // Validate balance
  const balanceValidation = validateExchange(
    wallet,
    fromCurrency,
    fromAmount,
    fee,
    feeCurrency
  );

  if (!balanceValidation.valid) {
    return balanceValidation;
  }

  return { valid: true };
}
