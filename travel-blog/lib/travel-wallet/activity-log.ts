/**
 * System logowania zmian w portfelu podróżniczym
 */

import { getTripById, updateTrip } from "./trips-storage";

export type ActivityLogType =
  | "expense_added"
  | "expense_edited"
  | "expense_deleted"
  | "country_added"
  | "country_edited"
  | "country_deleted"
  | "location_added"
  | "location_edited"
  | "location_deleted"
  | "trip_edited"
  | "currency_transaction_added"
  | "currency_transaction_edited"
  | "currency_transaction_deleted";

export type ActivityLogEntityType = "expense" | "currency_transaction" | "country" | "location" | "trip";

export interface ActivityLog {
  id: string;
  tripId: string;
  type: ActivityLogType;
  timestamp: string; // ISO format
  action: string; // Krótki opis akcji (np. "Dodano wydatek")
  entityId: string; // ID wydatku/transakcji/kraju/etc.
  entityType: ActivityLogEntityType; // Typ encji
  // Snapshot danych w momencie logowania
  // Dla expense_edited: old = stara wartość (przed edycją), new = nowa wartość (po edycji)
  snapshot?: {
    // Stara wartość (przed edycją) - dla backward compatibility może być też na poziomie root
    old?: {
      amount?: number;
      currency?: string;
      description?: string;
      date?: string;
      category?: string;
      countryId?: string;
      location?: string;
      note?: string;
      accommodationType?: string;
      // Dla transakcji walutowych
      toAmount?: number;
      toCurrency?: string;
    };
    // Nowa wartość (po edycji) - opcjonalna, dla diff view
    new?: {
      amount?: number;
      currency?: string;
      description?: string;
      date?: string;
      category?: string;
      countryId?: string;
      location?: string;
      note?: string;
      accommodationType?: string;
      // Dla transakcji walutowych
      toAmount?: number;
      toCurrency?: string;
    };
    // Backward compatibility - jeśli snapshot jest bezpośrednio na poziomie root (stary format)
    amount?: number;
    currency?: string;
    description?: string;
    date?: string;
    category?: string;
    countryId?: string;
    location?: string;
    accommodationType?: string;
    // Dla transakcji walutowych
    toAmount?: number;
    toCurrency?: string;
  };
}

/**
 * Pobiera wszystkie logi dla danej podróży z trip.data.activityLogs
 */
export function getActivityLogs(tripId: string): ActivityLog[] {
  if (typeof window === "undefined") {
    return [];
  }

  const trip = getTripById(tripId);
  
  return trip?.data.activityLogs || [];
}

/**
 * Zapisuje log do trip.data.activityLogs
 */
function saveActivityLog(log: ActivityLog): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const trip = getTripById(log.tripId);
  
  if (!trip) {
    console.error("Trip not found for activity log:", log.tripId);
    return false;
  }

  const currentLogs = trip.data.activityLogs || [];
  const updatedLogs = [...currentLogs, log];
  
  // Ograniczenie do ostatnich 1000 logów na podróż
  const limitedLogs = updatedLogs.slice(-1000);
  
  return updateTrip(log.tripId, {
    data: {
      ...trip.data,
      activityLogs: limitedLogs,
    },
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Tworzy nowy log
 */
function createLog(
  tripId: string,
  type: ActivityLogType,
  action: string,
  entityId: string,
  entityType: ActivityLogEntityType,
  snapshot?: ActivityLog["snapshot"]
): ActivityLog {
  return {
    id: Math.random().toString(36).substring(2, 11),
    tripId,
    type,
    timestamp: new Date().toISOString(),
    action,
    entityId,
    entityType,
    snapshot,
  };
}

/**
 * Loguje dodanie wydatku
 * @param tripId - ID podróży
 * @param expenseId - ID wydatku
 * @param expense - dane wydatku do zapisania w snapshot
 */
export function logExpenseAdded(
  tripId: string,
  expenseId: string,
  expense?: {
    amount?: number;
    currency?: string;
    description?: string;
    date?: string;
    category?: string;
    countryId?: string;
    location?: string;
    note?: string;
    accommodationType?: string;
  }
): void {
  const snapshot: ActivityLog["snapshot"] = expense ? {
    amount: expense.amount,
    currency: expense.currency,
    description: expense.description,
    date: expense.date,
    category: expense.category,
    countryId: expense.countryId,
    location: expense.location,
    accommodationType: expense.accommodationType,
  } : undefined;

  const log = createLog(
    tripId,
    "expense_added",
    "Dodano wydatek",
    expenseId,
    "expense",
    snapshot
  );
  saveActivityLog(log);
}

/**
 * Loguje edycję wydatku
 * @param tripId - ID podróży
 * @param expenseId - ID wydatku
 * @param oldExpense - stara wartość wydatku (przed edycją) - opcjonalna
 * @param newExpense - nowa wartość wydatku (po edycji) - opcjonalna, dla diff view
 */
export function logExpenseEdited(
  tripId: string,
  expenseId: string,
  oldExpense?: {
    amount?: number;
    currency?: string;
    description?: string;
    date?: string;
    endDate?: string;
    category?: string;
    countryId?: string;
    location?: string;
    note?: string;
    accommodationType?: string;
  },
  newExpense?: {
    amount?: number;
    currency?: string;
    description?: string;
    date?: string;
    endDate?: string;
    category?: string;
    countryId?: string;
    location?: string;
    note?: string;
    accommodationType?: string;
  }
): void {
  const snapshot: ActivityLog["snapshot"] = oldExpense ? {
    old: {
      amount: oldExpense.amount,
      currency: oldExpense.currency,
      description: oldExpense.description,
      date: oldExpense.date,
      category: oldExpense.category,
      countryId: oldExpense.countryId,
      location: oldExpense.location,
      note: oldExpense.note,
      accommodationType: oldExpense.accommodationType,
    },
    new: newExpense ? {
      amount: newExpense.amount,
      currency: newExpense.currency,
      description: newExpense.description,
      date: newExpense.date,
      category: newExpense.category,
      countryId: newExpense.countryId,
      location: newExpense.location,
      note: newExpense.note,
      accommodationType: newExpense.accommodationType,
    } : undefined,
  } : undefined;

  const log = createLog(
    tripId,
    "expense_edited",
    "Edytowano wydatek",
    expenseId,
    "expense",
    snapshot
  );
  saveActivityLog(log);
}

/**
 * Loguje usunięcie wydatku
 */
export function logExpenseDeleted(
  tripId: string,
  expenseId: string
): void {
  const log = createLog(
    tripId,
    "expense_deleted",
    "Usunięto wydatek",
    expenseId,
    "expense"
  );
  saveActivityLog(log);
}

/**
 * Loguje dodanie kraju
 */
export function logCountryAdded(
  tripId: string,
  countryId: string
): void {
  const log = createLog(
    tripId,
    "country_added",
    "Dodano kraj",
    countryId,
    "country"
  );
  saveActivityLog(log);
}

/**
 * Loguje edycję kraju
 */
export function logCountryEdited(
  tripId: string,
  countryId: string
): void {
  const log = createLog(
    tripId,
    "country_edited",
    "Edytowano kraj",
    countryId,
    "country"
  );
  saveActivityLog(log);
}

/**
 * Loguje usunięcie kraju
 */
export function logCountryDeleted(
  tripId: string,
  countryId: string
): void {
  const log = createLog(
    tripId,
    "country_deleted",
    "Usunięto kraj",
    countryId,
    "country"
  );
  saveActivityLog(log);
}

/**
 * Loguje dodanie miejsca
 */
export function logLocationAdded(
  tripId: string,
  countryId: string,
  locationName: string
): void {
  const log = createLog(
    tripId,
    "location_added",
    "Dodano miejsce",
    `${countryId}:${locationName}`, // Composite ID for location
    "location"
  );
  saveActivityLog(log);
}

/**
 * Loguje edycję miejsca
 */
export function logLocationEdited(
  tripId: string,
  countryId: string,
  locationName: string
): void {
  const log = createLog(
    tripId,
    "location_edited",
    "Edytowano miejsce",
    `${countryId}:${locationName}`, // Composite ID for location
    "location"
  );
  saveActivityLog(log);
}

/**
 * Loguje usunięcie miejsca
 */
export function logLocationDeleted(
  tripId: string,
  countryId: string,
  locationName: string
): void {
  const log = createLog(
    tripId,
    "location_deleted",
    "Usunięto miejsce",
    `${countryId}:${locationName}`, // Composite ID for location
    "location"
  );
  saveActivityLog(log);
}

/**
 * Loguje edycję podróży
 */
export function logTripEdited(
  tripId: string
): void {
  const log = createLog(
    tripId,
    "trip_edited",
    "Edytowano podróż",
    tripId, // Use tripId as entityId
    "trip"
  );
  saveActivityLog(log);
}

/**
 * Loguje dodanie transakcji walutowej
 * @param tripId - ID podróży
 * @param transactionId - ID transakcji
 * @param transaction - dane transakcji do zapisania w snapshot
 */
export function logCurrencyTransactionAdded(
  tripId: string,
  transactionId: string,
  transaction?: {
    fromCurrency?: string;
    fromAmount?: number;
    toCurrency?: string;
    toAmount?: number;
    date?: string;
    countryId?: string;
    location?: string;
    fee?: number;
    feeCurrency?: string;
    type?: string;
  }
): void {
  const snapshot: ActivityLog["snapshot"] = transaction ? {
    // Używamy backward compatibility format dla transakcji
    currency: transaction.fromCurrency,
    amount: transaction.fromAmount,
    toCurrency: transaction.toCurrency,
    toAmount: transaction.toAmount,
    // Dodatkowe pola w snapshot
    description: `${transaction.fromAmount} ${transaction.fromCurrency} → ${transaction.toAmount} ${transaction.toCurrency}`,
    date: transaction.date,
    countryId: transaction.countryId,
    location: transaction.location,
  } : undefined;

  const log = createLog(
    tripId,
    "currency_transaction_added",
    "Dodano transakcję walutową",
    transactionId,
    "currency_transaction",
    snapshot
  );
  saveActivityLog(log);
}

/**
 * Loguje edycję transakcji walutowej
 * @param tripId - ID podróży
 * @param transactionId - ID transakcji
 * @param oldTransaction - stara wartość transakcji (przed edycją)
 * @param newTransaction - nowa wartość transakcji (po edycji)
 */
export function logCurrencyTransactionEdited(
  tripId: string,
  transactionId: string,
  oldTransaction?: {
    fromCurrency?: string;
    fromAmount?: number;
    toCurrency?: string;
    toAmount?: number;
    date?: string;
    countryId?: string;
    location?: string;
    fee?: number;
    feeCurrency?: string;
    type?: string;
  },
  newTransaction?: {
    fromCurrency?: string;
    fromAmount?: number;
    toCurrency?: string;
    toAmount?: number;
    date?: string;
    countryId?: string;
    location?: string;
    fee?: number;
    feeCurrency?: string;
    type?: string;
  }
): void {
  const snapshot: ActivityLog["snapshot"] = oldTransaction ? {
    old: {
      currency: oldTransaction.fromCurrency,
      amount: oldTransaction.fromAmount,
      toCurrency: oldTransaction.toCurrency,
      toAmount: oldTransaction.toAmount,
      description: `${oldTransaction.fromAmount} ${oldTransaction.fromCurrency} → ${oldTransaction.toAmount} ${oldTransaction.toCurrency}`,
      date: oldTransaction.date,
      countryId: oldTransaction.countryId,
      location: oldTransaction.location,
    },
    new: newTransaction ? {
      currency: newTransaction.fromCurrency,
      amount: newTransaction.fromAmount,
      toCurrency: newTransaction.toCurrency,
      toAmount: newTransaction.toAmount,
      description: `${newTransaction.fromAmount} ${newTransaction.fromCurrency} → ${newTransaction.toAmount} ${newTransaction.toCurrency}`,
      date: newTransaction.date,
      countryId: newTransaction.countryId,
      location: newTransaction.location,
    } : undefined,
  } : undefined;

  const log = createLog(
    tripId,
    "currency_transaction_edited" as ActivityLogType,
    "Edytowano transakcję walutową",
    transactionId,
    "currency_transaction",
    snapshot
  );
  saveActivityLog(log);
}

/**
 * Loguje usunięcie transakcji walutowej
 */
export function logCurrencyTransactionDeleted(
  tripId: string,
  transactionId: string
): void {
  const log = createLog(
    tripId,
    "currency_transaction_deleted",
    "Usunięto transakcję walutową",
    transactionId,
    "currency_transaction"
  );
  saveActivityLog(log);
}

/**
 * Usuwa wszystkie logi dla danej podróży
 */
export function clearActivityLogs(tripId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const trip = getTripById(tripId);
  
  if (trip) {
    updateTrip(tripId, {
      data: {
        ...trip.data,
        activityLogs: [],
      },
      updatedAt: new Date().toISOString(),
    });
  }
}
