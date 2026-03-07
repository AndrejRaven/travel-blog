import type { Wallet, SimpleCurrencyBalance, Budget } from "./types";
import {
  convertToBaseCurrency,
  convertAmount as convertAmountWithRates,
  getDefaultReferenceRates,
} from "./reference-rates";
import { fetchRevolutRates } from "./revolut-rates";
import { getExchanges } from "./wallet-storage";
import { calculateCurrencyBalances } from "./currency-balances";
import { getTripBySlug, getTripById } from "./trips-storage";

/**
 * Gets actual exchange rate from transactions for converting currency to base currency
 * @param currency - currency to convert from
 * @param baseCurrency - base currency to convert to
 * @param exchanges - array of currency exchanges
 * @returns actual exchange rate or null if not found
 */
function getActualExchangeRate(
  currency: string,
  baseCurrency: string,
  exchanges: Array<{ fromCurrency: string; toCurrency: string; transactionRate: number; timestamp: string }>
): number | null {
  if (currency === baseCurrency) {
    return 1;
  }

  // Find the most recent exchange that involves this currency and base currency
  // Look for exchanges: baseCurrency -> currency (rate = transactionRate)
  // Or: currency -> baseCurrency (rate = 1/transactionRate)
  const relevantExchanges = exchanges
    .filter(ex =>
      (ex.fromCurrency === baseCurrency && ex.toCurrency === currency) ||
      (ex.fromCurrency === currency && ex.toCurrency === baseCurrency)
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (relevantExchanges.length === 0) {
    return null;
  }

  const latestExchange = relevantExchanges[0];

  // If exchange is baseCurrency -> currency, rate is transactionRate
  // If exchange is currency -> baseCurrency, rate is 1/transactionRate
  if (latestExchange.fromCurrency === baseCurrency && latestExchange.toCurrency === currency) {
    // 1 baseCurrency = transactionRate currency
    // So 1 currency = 1/transactionRate baseCurrency
    return 1 / latestExchange.transactionRate;
  } else {
    // 1 currency = transactionRate baseCurrency
    return latestExchange.transactionRate;
  }
}

/**
 * Calculates main budget as sum of all currency balances converted to base currency
 * Uses actual exchange rates from transactions if available, falls back to API rates
 * @param wallet - wallet state
 * @param tripId - optional trip ID to get actual exchange rates from transactions
 * @returns main budget in base currency
 */
export function calculateMainBudget(wallet: Wallet, tripId?: string): number {
  // If tripId is provided, try to use actual exchange rates from transactions
  if (tripId) {
    try {
      const exchanges = getExchanges(tripId);

      if (exchanges && exchanges.length > 0) {
        return wallet.balances.reduce((total, balance) => {
          if (balance.currency === wallet.baseCurrency) {
            return total + balance.amount;
          }

          // Try to find actual exchange rate from transactions
          const actualRate = getActualExchangeRate(
            balance.currency,
            wallet.baseCurrency,
            exchanges
          );

          if (actualRate !== null) {
            // Convert using actual exchange rate
            const converted = balance.amount * actualRate;
            return total + converted;
          }

          // Fallback to API rate if no transaction found
          const converted = convertToBaseCurrency(
            balance.amount,
            balance.currency,
            wallet.baseCurrency,
            wallet.referenceRates
          );
          return total + converted;
        }, 0);
      }
    } catch (error) {
      console.warn("[calculateMainBudget] Error getting exchanges, using API rates:", error);
    }
  }

  // Default: use API rates
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
 * Gets currency balances for a specific country
 * Filters transactions by countryId before calculating balances
 * @param wallet - wallet state
 * @param tripId - trip ID to get transactions
 * @param countryId - country ID to filter transactions
 * @returns array of balances with converted values for the country
 */
export function getBalancesForCountry(
  wallet: Wallet,
  tripId: string,
  countryId: string
): Array<SimpleCurrencyBalance & { amountInBase: number }> {
  try {
    // Try to get trip by ID first, then by slug
    let trip = getTripById(tripId);
    if (!trip) {
      // If tripId is actually a slug, try that
      trip = getTripBySlug(tripId);
    }

    if (!trip) {
      console.warn("[getBalancesForCountry] Trip not found, using wallet balances");
      return getBalancesWithBaseCurrency(wallet, tripId);
    }

    // Use calculateCurrencyBalances with countryId filter
    const balances = calculateCurrencyBalances(trip, countryId);

    // Convert to format expected by TravelWalletHeader
    return balances
      .filter((b: { amount: number }) => b.amount > 0.01)
      .map((balance: { currency: string; amount: number }) => {
        // Convert to base currency using reference rates
        const amountInBase = convertToBaseCurrency(
          balance.amount,
          balance.currency,
          wallet.baseCurrency,
          wallet.referenceRates
        );

        return {
          currency: balance.currency,
          amount: balance.amount,
          amountInBase,
        };
      });
  } catch (error) {
    console.warn("[getBalancesForCountry] Error calculating country balances, using wallet balances:", error);
    return getBalancesWithBaseCurrency(wallet, tripId);
  }
}

/**
 * Gets all currency balances with their values in base currency
 * Uses actual exchange rates from transactions if available, falls back to API rates
 * @param wallet - wallet state
 * @param tripId - optional trip ID to get actual exchange rates from transactions
 * @returns array of balances with converted values
 */
export function getBalancesWithBaseCurrency(
  wallet: Wallet,
  tripId?: string
): Array<SimpleCurrencyBalance & { amountInBase: number }> {
  // If tripId is provided, try to use actual exchange rates from transactions
  if (tripId) {
    try {
      const exchanges = getExchanges(tripId);

      if (exchanges && exchanges.length > 0) {
        return wallet.balances.map((balance) => {
          if (balance.currency === wallet.baseCurrency) {
            return {
              ...balance,
              amountInBase: balance.amount,
            };
          }

          // Try to find actual exchange rate from transactions
          const actualRate = getActualExchangeRate(
            balance.currency,
            wallet.baseCurrency,
            exchanges
          );

          if (actualRate !== null) {
            // Convert using actual exchange rate
            const amountInBase = balance.amount * actualRate;
            return {
              ...balance,
              amountInBase,
            };
          }

          // Fallback to API rate if no transaction found
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
    } catch (error) {
      console.warn("[getBalancesWithBaseCurrency] Error getting exchanges, using API rates:", error);
    }
  }

  // Default: use API rates
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
 * Agreguje listę budżetów (wiele walut) do sald per waluta.
 */
export function balancesFromBudgets(budgets: Budget[]): SimpleCurrencyBalance[] {
  const map = new Map<string, number>();
  budgets.forEach((b) => {
    if (b.amount > 0) {
      map.set(b.currency, (map.get(b.currency) ?? 0) + b.amount);
    }
  });
  return Array.from(map.entries()).map(([currency, amount]) => ({ currency, amount }));
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
