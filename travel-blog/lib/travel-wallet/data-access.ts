/**
 * CENTRALNE API DOSTĘPU DO DANYCH
 * 
 * Single Source of Truth Pattern:
 * - Wszystkie operacje CRUD przez to API
 * - Wszystkie dane w Trip.data
 * - Brak duplikacji danych
 * 
 * Użycie:
 * import { DataAccess } from './data-access';
 * const trip = DataAccess.getTrip(tripId);
 * const wallet = DataAccess.getWallet(tripId);
 */

import type {
  Trip,
  Wallet,
  Expense,
  CurrencyExchange,
  BudgetAdjustment,
  Country,
} from "./types";
import { ACCOMMODATION_TYPES_ALLOWING_ZERO } from "./constants";
import {
  getTripById,
  getAllTrips as getAllTripsStorage,
  updateTrip,
  createTrip as createTripStorage,
} from "./trips-storage";
import {
  getWallet as getWalletStorage,
  updateWallet as updateWalletStorage,
} from "./wallet-storage";
import {
  getAllExpenses,
  getExpenseById,
  addExpense as addExpenseStorage,
  saveExpense as saveExpenseStorage,
  deleteExpense as deleteExpenseStorage,
} from "./expenses";
import {
  getExchanges,
  addExchange,
  deleteExchange,
  getBudgetAdjustments,
  addBudgetAdjustment,
  deleteBudgetAdjustment,
} from "./wallet-storage";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Centralne API dostępu do danych
 */
export const DataAccess = {
  // ==================== TRIP OPERATIONS ====================
  
  /**
   * Pobiera podróż po ID
   */
  getTrip(tripId: string): Trip | null {
    return getTripById(tripId);
  },

  /**
   * Pobiera wszystkie podróże
   */
  getAllTrips(): Trip[] {
    return getAllTripsStorage();
  },

  /**
   * Tworzy nową podróż
   */
  createTrip(tripData: Omit<Trip, "id" | "slug" | "createdAt" | "updatedAt">): Trip {
    return createTripStorage(tripData);
  },

  /**
   * Aktualizuje podróż
   */
  updateTrip(tripId: string, updates: Partial<Trip>): boolean {
    return updateTrip(tripId, updates);
  },

  // ==================== WALLET OPERATIONS ====================

  /**
   * Pobiera wallet dla podróży
   */
  getWallet(tripId: string): Wallet | null {
    return getWalletStorage(tripId);
  },

  /**
   * Aktualizuje wallet dla podróży
   */
  updateWallet(tripId: string, wallet: Wallet): boolean {
    return updateWalletStorage(tripId, wallet);
  },

  // ==================== EXPENSE OPERATIONS ====================

  /**
   * Pobiera wszystkie wydatki dla podróży
   */
  getExpenses(tripId: string): Expense[] {
    return getAllExpenses(tripId);
  },

  /**
   * Pobiera wydatek po ID
   */
  getExpenseById(expenseId: string, tripId: string): Expense | null {
    return getExpenseById(expenseId, tripId);
  },

  /**
   * Dodaje nowy wydatek
   */
  addExpense(tripId: string, expense: Omit<Expense, "id">): Expense | null {
    try {
      return addExpenseStorage({ ...expense, tripId }, tripId);
    } catch {
      return null;
    }
  },

  /**
   * Aktualizuje wydatek
   */
  updateExpense(expense: Expense, tripId: string): boolean {
    return saveExpenseStorage(expense, tripId);
  },

  /**
   * Usuwa wydatek
   */
  deleteExpense(expenseId: string, tripId: string): boolean {
    return deleteExpenseStorage(expenseId, tripId);
  },

  // ==================== EXCHANGE OPERATIONS ====================

  /**
   * Pobiera wszystkie transakcje walutowe dla podróży
   */
  getExchanges(tripId: string): CurrencyExchange[] {
    return getExchanges(tripId);
  },

  /**
   * Dodaje nową transakcję walutową
   */
  addExchange(
    tripId: string,
    exchange: Omit<CurrencyExchange, "id" | "timestamp" | "type">
  ): CurrencyExchange | null {
    return addExchange(tripId, exchange);
  },

  /**
   * Usuwa transakcję walutową
   */
  deleteExchange(tripId: string, exchangeId: string): boolean {
    return deleteExchange(tripId, exchangeId);
  },

  // ==================== BUDGET ADJUSTMENT OPERATIONS ====================

  /**
   * Pobiera wszystkie korekty budżetu dla podróży
   */
  getBudgetAdjustments(tripId: string): BudgetAdjustment[] {
    return getBudgetAdjustments(tripId);
  },

  /**
   * Dodaje nową korektę budżetu
   */
  addBudgetAdjustment(
    tripId: string,
    adjustment: Omit<BudgetAdjustment, "id" | "timestamp">
  ): BudgetAdjustment | null {
    return addBudgetAdjustment(tripId, adjustment);
  },

  /**
   * Usuwa korektę budżetu
   */
  deleteBudgetAdjustment(tripId: string, adjustmentId: string): boolean {
    return deleteBudgetAdjustment(tripId, adjustmentId);
  },

  // ==================== VALIDATION ====================

  /**
   * Waliduje podróż
   */
  validateTrip(trip: Trip): ValidationResult {
    const errors: string[] = [];

    if (!trip.id) {
      errors.push("Trip ID is required");
    }
    if (!trip.slug) {
      errors.push("Trip slug is required");
    }
    if (!trip.name) {
      errors.push("Trip name is required");
    }
    if (!trip.data) {
      errors.push("Trip data is required");
    } else {
      // Waliduj wallet (zawsze wymagany)
      if (!trip.data.wallet) {
        errors.push("Wallet is required in trip data");
      } else {
        const walletValidation = this.validateWallet(trip.data.wallet);
        if (!walletValidation.valid) {
          errors.push(...walletValidation.errors.map(e => `Wallet: ${e}`));
        }
      }

      // Waliduj countries
      if (!Array.isArray(trip.data.countries)) {
        errors.push("Countries must be an array");
      }

      // Waliduj expenses
      if (!Array.isArray(trip.data.expenses)) {
        errors.push("Expenses must be an array");
      }

      // Waliduj activityLogs
      if (!Array.isArray(trip.data.activityLogs)) {
        errors.push("ActivityLogs must be an array");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Waliduje wallet
   */
  validateWallet(wallet: Wallet): ValidationResult {
    const errors: string[] = [];

    if (!wallet.baseCurrency) {
      errors.push("Base currency is required");
    }
    if (!Array.isArray(wallet.balances)) {
      errors.push("Balances must be an array");
    } else {
      wallet.balances.forEach((balance, index) => {
        if (!balance.currency) {
          errors.push(`Balance[${index}]: currency is required`);
        }
        if (typeof balance.amount !== "number") {
          errors.push(`Balance[${index}]: amount must be a number`);
        }
        if (isNaN(balance.amount)) {
          errors.push(`Balance[${index}]: amount cannot be NaN`);
        }
      });
    }
    if (!Array.isArray(wallet.referenceRates)) {
      errors.push("Reference rates must be an array");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Waliduje wydatek
   */
  validateExpense(expense: Expense, tripId: string): ValidationResult {
    const errors: string[] = [];

    if (!expense.id) {
      errors.push("Expense ID is required");
    }
    if (!expense.countryId) {
      errors.push("Country ID is required");
    }
    if (!expense.tripId) {
      errors.push("Trip ID is required");
    }
    if (expense.tripId !== tripId) {
      errors.push("Expense tripId must match provided tripId");
    }
    const allowZeroAmount =
      expense.category === "Noclegi" &&
      expense.accommodationType &&
      ACCOMMODATION_TYPES_ALLOWING_ZERO.includes(expense.accommodationType);
    if (
      typeof expense.amount !== "number" ||
      expense.amount < 0 ||
      (expense.amount === 0 && !allowZeroAmount)
    ) {
      errors.push("Amount must be a positive number (0 allowed only for Noclegi: namiot/kemping)");
    }
    if (!expense.currency) {
      errors.push("Currency is required");
    }
    if (!expense.category) {
      errors.push("Category is required");
    }
    if (!expense.date) {
      errors.push("Date is required");
    }
    if (expense.endDate && expense.endDate < expense.date) {
      errors.push("endDate must be on or after date");
    }

    // Sprawdź czy kraj istnieje
    const trip = this.getTrip(tripId);
    if (trip) {
      const countryExists = trip.data.countries.some(
        (c) => c.id === expense.countryId
      );
      if (!countryExists) {
        errors.push(`Country with ID ${expense.countryId} does not exist`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
