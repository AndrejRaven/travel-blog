import type {
  Trip,
  TravelWalletData,
  Wallet,
  CurrencyExchange,
  BudgetAdjustment,
  SimpleCurrencyBalance,
} from "../types";
import { getAllTrips, updateTrip } from "../trips-storage";
import { getDefaultReferenceRates } from "../reference-rates";
import {
  initializeWallet,
  calculateMainBudget,
  adjustCurrencyBalance,
} from "../wallet-operations";
import { getAllExpenses } from "../expenses";

const MIGRATION_FLAG_KEY = "travel-wallet-v2-migration-done";

/**
 * Checks if v2 migration has been completed
 */
export function isV2MigrationDone(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MIGRATION_FLAG_KEY) === "true";
}

/**
 * Marks v2 migration as done
 */
function markMigrationDone(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MIGRATION_FLAG_KEY, "true");
}

/**
 * Migrates a single trip to v2 wallet system
 */
export function migrateTripToV2(trip: Trip): Trip | null {
  // Skip if already migrated
  if (trip.data.wallet) {
    return trip;
  }

  const data = trip.data;
  const baseCurrency = "PLN"; // Default base currency

  // Step 1: Collect initial balances
  const initialBalances: SimpleCurrencyBalance[] = [];

  // From initialBalances (old system)
  if (data.initialBalances) {
    data.initialBalances.forEach((balance) => {
      const existing = initialBalances.find(
        (b) => b.currency === balance.currency
      );
      if (existing) {
        existing.amount += balance.amount;
      } else {
        initialBalances.push({
          currency: balance.currency,
          amount: balance.amount,
        });
      }
    });
  }

  // From currencyTransactions with type "initial"
  if (data.currencyTransactions) {
    data.currencyTransactions
      .filter((tx) => tx.type === "initial")
      .forEach((tx) => {
        const existing = initialBalances.find(
          (b) => b.currency === tx.toCurrency
        );
        if (existing) {
          existing.amount += tx.toAmount;
        } else {
          initialBalances.push({
            currency: tx.toCurrency,
            amount: tx.toAmount,
          });
        }
      });
  }

  // From country budgets (add all budgets from all countries)
  if (data.countries) {
    data.countries.forEach((country) => {
      if (country.budgets) {
        country.budgets.forEach((budget) => {
          if (budget.amount > 0) {
            const existing = initialBalances.find(
              (b) => b.currency === budget.currency
            );
            if (existing) {
              existing.amount += budget.amount;
            } else {
              initialBalances.push({
                currency: budget.currency,
                amount: budget.amount,
              });
            }
          }
        });
      }
    });
  }

  // If no initial balances, create empty wallet
  if (initialBalances.length === 0) {
    initialBalances.push({ currency: baseCurrency, amount: 0 });
  }

  // Step 2: Create wallet with initial balances
  const wallet = initializeWallet(baseCurrency, initialBalances);

  // Step 3: Process currency transactions (exchanges)
  const exchanges: CurrencyExchange[] = [];
  let currentWallet = wallet;

  if (data.currencyTransactions) {
    data.currencyTransactions
      .filter((tx) => tx.type === "exchange")
      .forEach((tx) => {
        // Convert old CurrencyTransaction to new CurrencyExchange
        const exchange: CurrencyExchange = {
          id: tx.id,
          tripId: trip.id,
          type: "exchange",
          timestamp: new Date(tx.date).toISOString(),
          fromCurrency: tx.fromCurrency,
          fromAmount: tx.fromAmount,
          toCurrency: tx.toCurrency,
          toAmount: tx.toAmount,
          transactionRate: tx.rate,
          fee: tx.fee,
          feeCurrency: tx.feeCurrency,
          note: tx.note,
          location: tx.location,
          countryId: tx.countryId,
        };
        exchanges.push(exchange);

        // Apply exchange to wallet (simulate)
        // Subtract fromCurrency
        const fromBalance = currentWallet.balances.find(
          (b) => b.currency === tx.fromCurrency
        );
        if (fromBalance) {
          fromBalance.amount -= tx.fromAmount;
        }

        // Add toCurrency
        const toBalance = currentWallet.balances.find(
          (b) => b.currency === tx.toCurrency
        );
        if (toBalance) {
          toBalance.amount += tx.toAmount;
        } else {
          currentWallet.balances.push({
            currency: tx.toCurrency,
            amount: tx.toAmount,
          });
        }

        // Handle fee
        if (tx.fee && tx.feeCurrency) {
          const feeBalance = currentWallet.balances.find(
            (b) => b.currency === tx.feeCurrency
          );
          if (feeBalance) {
            feeBalance.amount -= tx.fee;
          }
        }
      });
  }

  // Step 4: Process expenses (they decrease balances)
  const expenses = getAllExpenses(trip.id);
  expenses.forEach((expense) => {
    // Decrease currency balance for each expense
    const expenseBalance = currentWallet.balances.find(
      (b) => b.currency === expense.currency
    );
    if (expenseBalance) {
      expenseBalance.amount -= expense.amount;
    } else {
      // If currency doesn't exist, create it with negative balance
      // (this shouldn't happen in normal flow, but handle it for migration)
      currentWallet.balances.push({
        currency: expense.currency,
        amount: -expense.amount,
      });
    }
  });

  // Step 5: Create budget adjustment from old totalBudget if it exists
  const budgetAdjustments: BudgetAdjustment[] = [];
  if (data.totalBudget !== undefined) {
    const currentMainBudget = calculateMainBudget(currentWallet);
    const difference = data.totalBudget - currentMainBudget;

    if (Math.abs(difference) > 0.01) {
      // Create adjustment to match old totalBudget
      budgetAdjustments.push({
        id: `adj-${trip.id}-initial`,
        tripId: trip.id,
        type: difference > 0 ? "increase" : "decrease",
        amount: Math.abs(difference),
        currency: baseCurrency,
        timestamp: trip.createdAt,
        note: "Migrated from v1 totalBudget",
      });

      // Apply adjustment to wallet
      const baseBalance = currentWallet.balances.find(
        (b) => b.currency === baseCurrency
      );
      if (baseBalance) {
        baseBalance.amount += difference;
      } else {
        currentWallet.balances.push({
          currency: baseCurrency,
          amount: difference,
        });
      }
    }
  }

  // Step 6: Update trip data
  const updatedData: TravelWalletData = {
    ...data,
    wallet: currentWallet,
    exchanges: exchanges.length > 0 ? exchanges : undefined,
    budgetAdjustments:
      budgetAdjustments.length > 0 ? budgetAdjustments : undefined,
  };

  const migratedTrip = {
    ...trip,
    data: updatedData,
  };

  // Save migrated trip
  updateTrip(trip.id, { data: updatedData });

  return migratedTrip;
}

/**
 * Migrates all trips to v2 wallet system
 */
export function migrateAllTripsToV2(): { migrated: number; errors: number } {
  if (isV2MigrationDone()) {
    return { migrated: 0, errors: 0 };
  }

  const trips = getAllTrips();
  let migrated = 0;
  let errors = 0;

  trips.forEach((trip) => {
    try {
      const migratedTrip = migrateTripToV2(trip);
      if (migratedTrip && migratedTrip.data.wallet) {
        if (updateTrip(trip.id, { data: migratedTrip.data })) {
          migrated++;
        } else {
          errors++;
        }
      }
    } catch (error) {
      console.error(`Error migrating trip ${trip.id}:`, error);
      errors++;
    }
  });

  if (errors === 0) {
    markMigrationDone();
  }

  return { migrated, errors };
}

/**
 * Auto-migrates trips to v2 on first load
 */
export function autoMigrateToV2(): void {
  if (typeof window === "undefined") return;
  if (isV2MigrationDone()) return;

  try {
    migrateAllTripsToV2();
  } catch (error) {
    console.error("Error during auto-migration to v2:", error);
  }
}
