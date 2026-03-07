import type {
  Wallet,
  CurrencyExchange,
  BudgetAdjustment,
  Trip,
} from "./types";
import { getTripById, updateTrip } from "./trips-storage";
import { updateWalletRatesFromAPI } from "./revolut-rates";
import { tripEvents } from "./events";
import { DataAccess } from "./data-access";

/**
 * Gets wallet for a trip
 * @param tripId - trip ID
 * @returns wallet or null if trip not found
 */
export function getWallet(tripId: string): Wallet | null {
  const trip = getTripById(tripId);
  if (!trip) return null;

  return trip.data.wallet || null;
}

/**
 * Updates wallet for a trip
 * @param tripId - trip ID
 * @param wallet - new wallet state
 * @returns true if successful
 */
export function updateWallet(tripId: string, wallet: Wallet): boolean {
  const trip = getTripById(tripId);
  if (!trip) return false;

  // Walidacja wallet przed zapisem
  const validation = DataAccess.validateWallet(wallet);
  if (!validation.valid) {
    console.error("[updateWallet] Validation failed:", validation.errors);
    return false;
  }

  const success = updateTrip(tripId, {
    data: {
      ...trip.data,
      wallet,
    },
  });
  
  if (success) {
    tripEvents.emit("wallet:updated", tripId);
  }

  return success;
}

/**
 * Updates wallet exchange rates from API
 * @param tripId - trip ID
 * @returns true if successful
 */
export async function updateWalletRates(tripId: string): Promise<boolean> {
  const wallet = getWallet(tripId);
  if (!wallet) return false;

  try {
    const updatedWallet = await updateWalletRatesFromAPI(wallet);
    return updateWallet(tripId, {
      ...wallet,
      ...updatedWallet,
    });
  } catch (error) {
    console.error("Error updating wallet rates:", error);
    return false;
  }
}

/**
 * Gets all currency exchanges for a trip
 * @param tripId - trip ID
 * @returns array of exchanges
 */
export function getExchanges(tripId: string): CurrencyExchange[] {
  const trip = getTripById(tripId);
  if (!trip) return [];

  return trip.data.exchanges || [];
}

/**
 * Adds a currency exchange to a trip
 * @param tripId - trip ID
 * @param exchange - exchange data (without id and timestamp)
 * @returns created exchange or null if failed
 */
export function addExchange(
  tripId: string,
  exchange: Omit<CurrencyExchange, "id" | "timestamp" | "type">
): CurrencyExchange | null {
  const trip = getTripById(tripId);
  if (!trip) return null;

  const newExchange: CurrencyExchange = {
    ...exchange,
    id: generateId(),
    type: "exchange",
    timestamp: new Date().toISOString(),
  };

  const exchanges = trip.data.exchanges || [];
  const updatedExchanges = [...exchanges, newExchange];

  const success = updateTrip(tripId, {
    data: {
      ...trip.data,
      exchanges: updatedExchanges,
    },
  });
  
  if (success) {
    tripEvents.emit("currency_transaction:added", tripId, newExchange);
    return newExchange;
  }

  return null;
}

/**
 * Deletes a currency exchange
 * @param tripId - trip ID
 * @param exchangeId - exchange ID
 * @returns true if successful
 */
export function deleteExchange(tripId: string, exchangeId: string): boolean {
  const trip = getTripById(tripId);
  if (!trip) return false;

  const exchanges = trip.data.exchanges || [];
  const exchangeToDelete = exchanges.find((e) => e.id === exchangeId);
  const filtered = exchanges.filter((e) => e.id !== exchangeId);

  if (filtered.length === exchanges.length) {
    return false; // Exchange not found
  }

  const success = updateTrip(tripId, {
    data: {
      ...trip.data,
      exchanges: filtered,
    },
  });
  
  if (success && exchangeToDelete) {
    tripEvents.emit("currency_transaction:deleted", tripId, exchangeToDelete);
  }

  return success;
}

/**
 * Gets all budget adjustments for a trip
 * @param tripId - trip ID
 * @returns array of budget adjustments
 */
export function getBudgetAdjustments(tripId: string): BudgetAdjustment[] {
  const trip = getTripById(tripId);
  if (!trip) return [];

  return trip.data.budgetAdjustments || [];
}

/**
 * Adds a budget adjustment to a trip
 * @param tripId - trip ID
 * @param adjustment - adjustment data (without id and timestamp)
 * @returns created adjustment or null if failed
 */
export function addBudgetAdjustment(
  tripId: string,
  adjustment: Omit<BudgetAdjustment, "id" | "timestamp">
): BudgetAdjustment | null {
  const trip = getTripById(tripId);
  if (!trip) return null;

  const newAdjustment: BudgetAdjustment = {
    ...adjustment,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  const adjustments = trip.data.budgetAdjustments || [];
  const updatedAdjustments = [...adjustments, newAdjustment];

  if (
    updateTrip(tripId, {
      data: {
        ...trip.data,
        budgetAdjustments: updatedAdjustments,
      },
    })
  ) {
    return newAdjustment;
  }

  return null;
}

/**
 * Deletes a budget adjustment
 * @param tripId - trip ID
 * @param adjustmentId - adjustment ID
 * @returns true if successful
 */
export function deleteBudgetAdjustment(
  tripId: string,
  adjustmentId: string
): boolean {
  const trip = getTripById(tripId);
  if (!trip) return false;

  const adjustments = trip.data.budgetAdjustments || [];
  const filtered = adjustments.filter((a) => a.id !== adjustmentId);

  if (filtered.length === adjustments.length) {
    return false; // Adjustment not found
  }

  return updateTrip(tripId, {
    data: {
      ...trip.data,
      budgetAdjustments: filtered,
    },
  });
}

/**
 * Generates a unique ID
 */
function generateId(): string {
  return `wallet-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
