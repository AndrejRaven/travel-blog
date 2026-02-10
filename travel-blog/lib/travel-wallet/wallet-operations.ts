import type { Wallet, SimpleCurrencyBalance } from "./types";
import {
  convertToBaseCurrency,
  convertAmount as convertAmountWithRates,
  getDefaultReferenceRates,
} from "./reference-rates";
import { fetchRevolutRates } from "./revolut-rates";

/**
 * Calculates main budget as sum of all currency balances converted to base currency
 * @param wallet - wallet state
 * @returns main budget in base currency
 */
export function calculateMainBudget(wallet: Wallet): number {
  return wallet.balances.reduce((total, balance) => {
    const converted = convertToBaseCurrency(
      balance.amount,
      balance.currency,
      wallet.baseCurrency,
      wallet.referenceRates
    );
    return total + converted;
  }, 0);
}

/**
 * Gets balance for a specific currency
 * @param wallet - wallet state
 * @param currency - currency code
 * @returns balance amount or 0 if currency not found
 */
export function getCurrencyBalance(
  wallet: Wallet,
  currency: string
): number {
  const balance = wallet.balances.find((b) => b.currency === currency);
  return balance?.amount ?? 0;
}

/**
 * Checks if wallet has enough balance in a specific currency
 * @param wallet - wallet state
 * @param currency - currency code
 * @param amount - amount to check
 * @returns true if balance is sufficient
 */
export function hasEnoughBalance(
  wallet: Wallet,
  currency: string,
  amount: number
): boolean {
  const balance = getCurrencyBalance(wallet, currency);
  return balance >= amount;
}

/**
 * Updates balance for a specific currency
 * @param wallet - wallet state
 * @param currency - currency code
 * @param amount - new balance amount
 * @returns updated wallet
 */
export function updateCurrencyBalance(
  wallet: Wallet,
  currency: string,
  amount: number
): Wallet {
  const balances = [...wallet.balances];
  const index = balances.findIndex((b) => b.currency === currency);

  if (index >= 0) {
    balances[index] = { currency, amount };
  } else {
    balances.push({ currency, amount });
  }

  return {
    ...wallet,
    balances,
  };
}

/**
 * Adjusts balance for a specific currency (adds or subtracts)
 * @param wallet - wallet state
 * @param currency - currency code
 * @param delta - amount to add (positive) or subtract (negative)
 * @returns updated wallet
 */
export function adjustCurrencyBalance(
  wallet: Wallet,
  currency: string,
  delta: number
): Wallet {
  const currentBalance = getCurrencyBalance(wallet, currency);
  const newBalance = currentBalance + delta;

  // Prevent negative balances
  if (newBalance < 0) {
    throw new Error(
      `Insufficient balance in ${currency}. Current: ${currentBalance}, Required: ${Math.abs(delta)}`
    );
  }

  return updateCurrencyBalance(wallet, currency, newBalance);
}

/**
 * Converts amount between currencies using reference rates
 * @param amount - amount to convert
 * @param fromCurrency - source currency
 * @param toCurrency - target currency
 * @param wallet - wallet state
 * @returns converted amount
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  wallet: Wallet
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // First convert to base currency, then to target currency
  const inBase = convertToBaseCurrency(
    amount,
    fromCurrency,
    wallet.baseCurrency,
    wallet.referenceRates
  );

  if (toCurrency === wallet.baseCurrency) {
    return inBase;
  }

  // Convert from base to target
  return convertAmountWithRates(
    inBase,
    wallet.baseCurrency,
    toCurrency,
    wallet.referenceRates
  );
}

/**
 * Gets all currency balances with their values in base currency
 * @param wallet - wallet state
 * @returns array of balances with converted values
 */
export function getBalancesWithBaseCurrency(
  wallet: Wallet
): Array<SimpleCurrencyBalance & { amountInBase: number }> {
  return wallet.balances.map((balance) => {
    const amountInBase = convertToBaseCurrency(
      balance.amount,
      balance.currency,
      wallet.baseCurrency,
      wallet.referenceRates
    );
    return {
      ...balance,
      amountInBase,
    };
  });
}

/**
 * Creates a new wallet with default settings (synchronous version for migrations)
 * @param baseCurrency - base currency code (default: "PLN")
 * @returns new wallet
 */
export function createWallet(baseCurrency: string = "PLN"): Wallet {
  return {
    baseCurrency,
    balances: [],
    referenceRates: getDefaultReferenceRates(baseCurrency),
  };
}

/**
 * Creates a new wallet with current rates from API (async version)
 * @param baseCurrency - base currency code (default: "PLN")
 * @returns new wallet with current exchange rates
 */
export async function createWalletWithCurrentRates(baseCurrency: string = "PLN"): Promise<Wallet> {
  try {
    // Spróbuj pobrać aktualne kursy z API
    const rates = await fetchRevolutRates(baseCurrency);
    return {
      baseCurrency,
      balances: [],
      referenceRates: rates,
    };
  } catch (error) {
    console.error("Error fetching rates for new wallet, using defaults:", error);
    // Fallback do domyślnych kursów
    return createWallet(baseCurrency);
  }
}

/**
 * Initializes wallet with initial balances (synchronous version for migrations)
 * @param baseCurrency - base currency code
 * @param initialBalances - array of initial balances
 * @returns new wallet
 */
export function initializeWallet(
  baseCurrency: string,
  initialBalances: SimpleCurrencyBalance[]
): Wallet {
  return {
    baseCurrency,
    balances: initialBalances,
    referenceRates: getDefaultReferenceRates(baseCurrency),
  };
}

/**
 * Initializes wallet with initial balances and current rates from API (async version)
 * @param baseCurrency - base currency code
 * @param initialBalances - array of initial balances
 * @returns new wallet with current exchange rates
 */
export async function initializeWalletWithCurrentRates(
  baseCurrency: string,
  initialBalances: SimpleCurrencyBalance[]
): Promise<Wallet> {
  try {
    // Spróbuj pobrać aktualne kursy z API
    const rates = await fetchRevolutRates(baseCurrency);
    return {
      baseCurrency,
      balances: initialBalances,
      referenceRates: rates,
    };
  } catch (error) {
    console.error("Error fetching rates for wallet initialization, using defaults:", error);
    // Fallback do domyślnych kursów
    return initializeWallet(baseCurrency, initialBalances);
  }
}
