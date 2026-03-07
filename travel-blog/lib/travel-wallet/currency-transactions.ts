import type { CurrencyTransaction, CurrencyExchange } from "./types";
import { tripEvents } from "./events";
import { getExchanges, getWallet, updateWallet, addExchange, deleteExchange } from "./wallet-storage";
import { executeExchange } from "./exchange-operations";
import { logCurrencyTransactionEdited } from "./activity-log";

/**
 * Konwertuje CurrencyExchange na CurrencyTransaction (dla kompatybilności z komponentami)
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
 * Konwertuje exchanges na CurrencyTransaction[] dla kompatybilności z komponentami
 */
export function getCurrencyTransactions(tripId: string): CurrencyTransaction[] {
  const exchanges = getExchanges(tripId);

  // Konwertuj exchanges na CurrencyTransaction tylko dla kompatybilności z komponentami
  return exchanges.map(convertExchangeToTransaction);
}

/**
 * Pobiera transakcje walutowe dla konkretnego kraju
 */
export function getCurrencyTransactionsByCountry(
  tripId: string,
  countryId: string
): CurrencyTransaction[] {
  const transactions = getCurrencyTransactions(tripId);
  const filtered = transactions.filter((tx) => tx.countryId === countryId);
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
 * Pobiera początkowe salda walutowe z transakcji typu "initial"
 * @param tripId - ID podróży
 * @returns Array z początkowymi saldami { currency: string; amount: number }[]
 */
export function getInitialBalances(tripId: string): Array<{ currency: string; amount: number }> {
  const transactions = getCurrencyTransactions(tripId);
  const initialTransactions = transactions.filter(tx => tx.type === "initial");

  const balancesMap = new Map<string, number>();
  initialTransactions.forEach(tx => {
    const current = balancesMap.get(tx.toCurrency) || 0;
    balancesMap.set(tx.toCurrency, current + tx.toAmount);
  });

  return Array.from(balancesMap.entries()).map(([currency, amount]) => ({
    currency,
    amount,
  }));
}

/**
 * Konwertuje CurrencyTransaction na CurrencyExchange
 */
function convertTransactionToExchange(
  transaction: Omit<CurrencyTransaction, "id" | "tripId" | "rate">,
  tripId: string
): Omit<CurrencyExchange, "id" | "timestamp" | "type"> {
  // Oblicz timestamp z daty i czasu
  let timestamp: Date;
  if (transaction.time) {
    const [hours, minutes] = transaction.time.split(":").map(Number);
    timestamp = new Date(transaction.date);
    timestamp.setHours(hours, minutes, 0, 0);
  } else {
    timestamp = new Date(transaction.date);
    timestamp.setHours(12, 0, 0, 0); // Domyślnie południe jeśli brak czasu
  }

  return {
    tripId,
    fromCurrency: transaction.fromCurrency,
    fromAmount: transaction.fromAmount,
    toCurrency: transaction.toCurrency,
    toAmount: transaction.toAmount,
    transactionRate: transaction.fromAmount ? transaction.toAmount / transaction.fromAmount : 0,
    fee: transaction.fee,
    feeCurrency: transaction.feeCurrency,
    note: transaction.note,
    location: transaction.location,
    countryId: transaction.countryId,
  };
}

/**
 * Dodaje transakcję walutową (konwertuje CurrencyTransaction na CurrencyExchange i zapisuje)
 * @param tripId - ID podróży
 * @param transactionData - dane transakcji (bez id, tripId, rate)
 * @returns true jeśli sukces, false jeśli błąd
 */
export function addCurrencyTransaction(
  tripId: string,
  transactionData: Omit<CurrencyTransaction, "id" | "tripId" | "rate">
): boolean {
  try {
    // Konwertuj CurrencyTransaction na CurrencyExchange
    const exchangeData = convertTransactionToExchange(transactionData, tripId);
    if (transactionData.fromAmount) {
      exchangeData.transactionRate = transactionData.toAmount / transactionData.fromAmount;
    }

    // Jeśli nowy system wallet jest dostępny, wykonaj transakcję w portfelu
    try {
      const wallet = getWallet(tripId);
      if (wallet) {
        const result = executeExchange(wallet, exchangeData);
        if (!result.success) {
          console.error("[addCurrencyTransaction] Failed to execute exchange in wallet:", result.error);
          return false;
        }
        updateWallet(tripId, result.newWallet);
      }
    } catch (error) {
      console.warn("[addCurrencyTransaction] Wallet system not available, continuing with exchange storage:", error);
    }

    // Zapisz exchange do storage
    const newExchange = addExchange(tripId, exchangeData);

    return newExchange !== null;
  } catch (error) {
    console.error("[addCurrencyTransaction] Error adding currency transaction:", error);
    return false;
  }
}

/**
 * Aktualizuje transakcję walutową
 * @param tripId - ID podróży
 * @param transactionId - ID transakcji do aktualizacji
 * @param transactionData - nowe dane transakcji
 * @returns true jeśli sukces, false jeśli błąd
 */
export function updateCurrencyTransaction(
  tripId: string,
  transactionId: string,
  transactionData: Omit<CurrencyTransaction, "id" | "tripId" | "rate">
): boolean {
  try {
    // Pobierz starą transakcję przed usunięciem (dla logowania)
    const oldTransaction = getCurrencyTransactionById(tripId, transactionId);

    // Najpierw usuń starą transakcję
    const deleted = deleteCurrencyTransaction(tripId, transactionId);
    if (!deleted) {
      return false;
    }

    // Następnie dodaj nową transakcję
    const success = addCurrencyTransaction(tripId, transactionData);

    // Loguj edycję jeśli się powiodła
    if (success && oldTransaction) {
      logCurrencyTransactionEdited(
        tripId,
        transactionId,
        {
          fromCurrency: oldTransaction.fromCurrency,
          fromAmount: oldTransaction.fromAmount,
          toCurrency: oldTransaction.toCurrency,
          toAmount: oldTransaction.toAmount,
          date: oldTransaction.date,
          countryId: oldTransaction.countryId,
          location: oldTransaction.location,
          fee: oldTransaction.fee,
          feeCurrency: oldTransaction.feeCurrency,
          type: oldTransaction.type,
        },
        {
          fromCurrency: transactionData.fromCurrency,
          fromAmount: transactionData.fromAmount,
          toCurrency: transactionData.toCurrency,
          toAmount: transactionData.toAmount,
          date: transactionData.date,
          countryId: transactionData.countryId,
          location: transactionData.location,
          fee: transactionData.fee,
          feeCurrency: transactionData.feeCurrency,
          type: transactionData.type,
        }
      );
    }

    return success;
  } catch (error) {
    console.error("[updateCurrencyTransaction] Error updating currency transaction:", error);
    return false;
  }
}

/**
 * Usuwa transakcję walutową (używa deleteExchange z wallet-storage)
 */
export function deleteCurrencyTransaction(
  tripId: string,
  transactionId: string
): boolean {
  return deleteExchange(tripId, transactionId);
}

