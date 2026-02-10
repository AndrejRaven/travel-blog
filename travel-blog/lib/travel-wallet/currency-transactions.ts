import type { CurrencyTransaction, CurrencyExchange } from "./types";
import { getTripById } from "./trips-storage";
import { updateTrip } from "./trips-storage";

/**
 * Generuje unikalne ID dla transakcji walutowej
 */
function generateTransactionId(): string {
  return `curr-tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Konwertuje CurrencyExchange (nowy system wallet) na CurrencyTransaction (stary system)
 */
function convertExchangeToTransaction(exchange: CurrencyExchange): CurrencyTransaction {
  const timestamp = new Date(exchange.timestamp);
  const date = timestamp.toISOString().split('T')[0];
  const timeStr = timestamp.toTimeString().split(' ')[0];
  const time = timeStr.substring(0, 5); // HH:mm
  
  return {
    id: exchange.id,
    tripId: exchange.tripId,
    type: "exchange",
    date,
    time,
    fromCurrency: exchange.fromCurrency,
    fromAmount: exchange.fromAmount,
    toCurrency: exchange.toCurrency,
    toAmount: exchange.toAmount,
    rate: exchange.transactionRate,
    fee: exchange.fee,
    feeCurrency: exchange.feeCurrency,
    note: exchange.note,
    location: exchange.location,
    countryId: exchange.countryId,
  };
}

/**
 * Pobiera wszystkie transakcje walutowe dla podróży
 * Łączy transakcje ze starego systemu (currencyTransactions) z nowym systemem wallet (exchanges)
 */
export function getCurrencyTransactions(tripId: string): CurrencyTransaction[] {
  const trip = getTripById(tripId);
  if (!trip) return [];
  
  const oldTransactions = trip.data.currencyTransactions || [];
  
  // Jeśli jest nowy system wallet, pobierz również exchanges i skonwertuj je
  if (trip.data.wallet) {
    const { getExchanges } = require("./wallet-storage");
    const exchanges = getExchanges(tripId);
    console.log("[getCurrencyTransactions] Wallet system detected, exchanges:", exchanges?.length || 0);
    if (exchanges && exchanges.length > 0) {
      const convertedExchanges = exchanges.map(convertExchangeToTransaction);
      console.log("[getCurrencyTransactions] Converted exchanges:", convertedExchanges.length);
      return [...oldTransactions, ...convertedExchanges];
    }
  }
  
  console.log("[getCurrencyTransactions] Returning old transactions only:", oldTransactions.length);
  return oldTransactions;
}

/**
 * Pobiera transakcje walutowe dla konkretnego kraju
 */
export function getCurrencyTransactionsByCountry(
  tripId: string,
  countryId: string
): CurrencyTransaction[] {
  const transactions = getCurrencyTransactions(tripId);
  console.log("[getCurrencyTransactionsByCountry] All transactions:", transactions.length, "countryId:", countryId);
  const filtered = transactions.filter((tx) => tx.countryId === countryId);
  console.log("[getCurrencyTransactionsByCountry] Filtered transactions:", filtered.length);
  console.log("[getCurrencyTransactionsByCountry] Transaction countryIds:", transactions.map(tx => ({ id: tx.id, countryId: tx.countryId })));
  return filtered;
}

/**
 * Pobiera transakcję walutową po ID
 */
export function getCurrencyTransactionById(
  tripId: string,
  transactionId: string
): CurrencyTransaction | null {
  const transactions = getCurrencyTransactions(tripId);
  return transactions.find((tx) => tx.id === transactionId) || null;
}

/**
 * Dodaje nową transakcję walutową
 * @deprecated Use addExchange from wallet-storage for new wallet system
 */
export function addCurrencyTransaction(
  tripId: string,
  transactionData: Omit<CurrencyTransaction, "id" | "tripId">
): boolean {
  const trip = getTripById(tripId);
  if (!trip) {
    console.error("[addCurrencyTransaction] Trip not found:", tripId);
    return false;
  }

  console.log("[addCurrencyTransaction] Trip data:", {
    hasWallet: !!trip.data.wallet,
    transactionType: transactionData.type,
    fromCurrency: transactionData.fromCurrency,
    fromAmount: transactionData.fromAmount,
    toCurrency: transactionData.toCurrency,
    toAmount: transactionData.toAmount,
    countryId: transactionData.countryId,
  });

  // If new wallet system exists, use it for exchanges
  if (trip.data.wallet && transactionData.type === "exchange") {
    console.log("[addCurrencyTransaction] Using new wallet system");
    try {
      const { getWallet, updateWallet, addExchange } = require("./wallet-storage");
      const { executeExchange } = require("./exchange-operations");
      
      const wallet = getWallet(tripId);
      if (wallet) {
        // Round toAmount to avoid floating point precision issues
        // Round to 2 decimal places for most currencies, but preserve exact value if it's a whole number
        const roundToAmount = (amount: number): number => {
          // If it's very close to a whole number (within 0.001), return the whole number
          const rounded = Math.round(amount * 100) / 100;
          if (Math.abs(rounded - Math.round(rounded)) < 0.001) {
            return Math.round(rounded);
          }
          return rounded;
        };
        
        const roundedToAmount = roundToAmount(transactionData.toAmount);
        const transactionRate = roundedToAmount / transactionData.fromAmount;
        
        const exchangeData = {
          fromCurrency: transactionData.fromCurrency,
          fromAmount: transactionData.fromAmount,
          toCurrency: transactionData.toCurrency,
          toAmount: roundedToAmount,
          transactionRate: transactionRate,
          fee: transactionData.fee,
          feeCurrency: transactionData.feeCurrency,
          note: transactionData.note,
          location: transactionData.location,
          countryId: transactionData.countryId,
        };

        const result = executeExchange(wallet, exchangeData);
        console.log("[addCurrencyTransaction] Execute exchange result:", result.success, result.error);
        if (result.success) {
          // Najpierw dodaj exchange do storage
          const addedExchange = addExchange(tripId, exchangeData);
          console.log("[addCurrencyTransaction] Exchange added:", addedExchange?.id || "null");
          if (!addedExchange) {
            console.error("[addCurrencyTransaction] Failed to add exchange to storage");
            return false;
          }
          
          // Potem zsynchronizuj portfel (rebuild from scratch: budgets -> exchanges -> expenses)
          // To zapewnia że portfel jest zawsze spójny
          const { syncWalletWithBudgets } = require("./wallet-sync");
          const synced = syncWalletWithBudgets(tripId);
          console.log("[addCurrencyTransaction] Wallet synced:", synced);
          
          return synced;
        } else {
          console.error("[addCurrencyTransaction] Failed to execute exchange:", result.error);
          return false;
        }
      }
    } catch (error) {
      console.warn("[addCurrencyTransaction] Wallet system not available, using legacy transaction storage:", error);
    }
  } else {
    console.log("[addCurrencyTransaction] Using legacy system - wallet:", !!trip.data.wallet, "type:", transactionData.type);
  }

  // Legacy system for non-exchange transactions or when wallet not available
  console.log("[addCurrencyTransaction] Saving to legacy currencyTransactions");
  const newTransaction: CurrencyTransaction = {
    ...transactionData,
    id: generateTransactionId(),
    tripId,
    rate: transactionData.toAmount / transactionData.fromAmount, // oblicz kurs
  };

  const existingTransactions = trip.data.currencyTransactions || [];
  const updatedTransactions = [...existingTransactions, newTransaction];

  const success = updateTrip(tripId, {
    data: {
      ...trip.data,
      currencyTransactions: updatedTransactions,
    },
  });
  
  console.log("[addCurrencyTransaction] Legacy transaction saved:", success, "Total transactions:", updatedTransactions.length, "countryId:", newTransaction.countryId);
  return success;
}

/**
 * Aktualizuje transakcję walutową
 */
export function updateCurrencyTransaction(
  tripId: string,
  transactionId: string,
  updates: Partial<Omit<CurrencyTransaction, "id" | "tripId">>
): boolean {
  const trip = getTripById(tripId);
  if (!trip) return false;

  const transactions = trip.data.currencyTransactions || [];
  const index = transactions.findIndex((tx) => tx.id === transactionId);
  
  if (index === -1) return false;

  const updatedTransaction = {
    ...transactions[index],
    ...updates,
  };

  // Przelicz kurs jeśli zmieniono kwoty
  if (updates.fromAmount || updates.toAmount) {
    updatedTransaction.rate =
      updatedTransaction.toAmount / updatedTransaction.fromAmount;
  }

  const updatedTransactions = [...transactions];
  updatedTransactions[index] = updatedTransaction;

  return updateTrip(tripId, {
    data: {
      ...trip.data,
      currencyTransactions: updatedTransactions,
    },
  });
}

/**
 * Usuwa transakcję walutową
 * @deprecated Use deleteExchange from wallet-storage for new wallet system
 */
export function deleteCurrencyTransaction(
  tripId: string,
  transactionId: string
): boolean {
  const trip = getTripById(tripId);
  if (!trip) return false;

  const transactions = trip.data.currencyTransactions || [];
  const transactionToDelete = transactions.find((tx) => tx.id === transactionId);
  const filtered = transactions.filter((tx) => tx.id !== transactionId);

  if (filtered.length === transactions.length) {
    return false; // Nie znaleziono transakcji
  }

  // If new wallet system exists and it's an exchange, reverse it in wallet
  if (trip.data.wallet && transactionToDelete && transactionToDelete.type === "exchange") {
    try {
      const { getWallet, updateWallet, deleteExchange } = require("./wallet-storage");
      const { adjustCurrencyBalance } = require("./wallet-operations");
      
      const wallet = getWallet(tripId);
      if (wallet) {
        // Reverse the exchange: add back fromCurrency, subtract toCurrency
        let updatedWallet = adjustCurrencyBalance(
          wallet,
          transactionToDelete.fromCurrency,
          transactionToDelete.fromAmount
        );
        updatedWallet = adjustCurrencyBalance(
          updatedWallet,
          transactionToDelete.toCurrency,
          -transactionToDelete.toAmount
        );
        
        // Handle fee reversal if present
        if (transactionToDelete.fee && transactionToDelete.feeCurrency) {
          updatedWallet = adjustCurrencyBalance(
            updatedWallet,
            transactionToDelete.feeCurrency,
            transactionToDelete.fee
          );
        }
        
        updateWallet(tripId, updatedWallet);
        
        // Delete from exchanges array
        const exchanges = trip.data.exchanges || [];
        const exchangeToDelete = exchanges.find((e) => 
          e.fromCurrency === transactionToDelete.fromCurrency &&
          e.fromAmount === transactionToDelete.fromAmount &&
          e.toCurrency === transactionToDelete.toCurrency &&
          e.toAmount === transactionToDelete.toAmount
        );
        if (exchangeToDelete) {
          deleteExchange(tripId, exchangeToDelete.id);
        }
      }
    } catch (error) {
      console.warn("Wallet system not available, using legacy transaction deletion:", error);
    }
  }

  return updateTrip(tripId, {
    data: {
      ...trip.data,
      currencyTransactions: filtered,
    },
  });
}

/**
 * Pobiera początkowe salda walutowe dla podróży
 */
export function getInitialBalances(
  tripId: string
): { currency: string; amount: number }[] {
  const trip = getTripById(tripId);
  if (!trip) return [];
  return trip.data.initialBalances || [];
}

/**
 * Ustawia początkowe salda walutowe dla podróży
 */
export function setInitialBalances(
  tripId: string,
  balances: { currency: string; amount: number }[]
): boolean {
  const trip = getTripById(tripId);
  if (!trip) return false;

  return updateTrip(tripId, {
    data: {
      ...trip.data,
      initialBalances: balances,
    },
  });
}

/**
 * Dodaje lub aktualizuje początkowe saldo dla waluty
 */
export function setInitialBalanceForCurrency(
  tripId: string,
  currency: string,
  amount: number
): boolean {
  const trip = getTripById(tripId);
  if (!trip) return false;

  const balances = trip.data.initialBalances || [];
  const existingIndex = balances.findIndex((b) => b.currency === currency);

  let updatedBalances: { currency: string; amount: number }[];
  if (existingIndex >= 0) {
    updatedBalances = [...balances];
    updatedBalances[existingIndex] = { currency, amount };
  } else {
    updatedBalances = [...balances, { currency, amount }];
  }

  return updateTrip(tripId, {
    data: {
      ...trip.data,
      initialBalances: updatedBalances,
    },
  });
}
