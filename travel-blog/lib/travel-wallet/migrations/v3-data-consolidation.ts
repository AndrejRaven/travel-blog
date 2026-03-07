/**
 * Migration V3: Data Consolidation
 * 
 * Cleans up legacy localStorage keys and deprecated fields:
 * - Removes old expense and activity log localStorage keys
 * - Removes currencyTransactions from trips if exchanges exist
 * - Initializes empty expenses and activityLogs arrays if missing
 */

import { getAllTrips, updateTrip } from "../trips-storage";

const MIGRATION_FLAG_KEY = "travel-wallet-v3-migration-done";

/**
 * Checks if V3 migration has been completed
 */
function isMigrationDone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return localStorage.getItem(MIGRATION_FLAG_KEY) === "true";
  } catch (error) {
    console.error("Error checking V3 migration status:", error);
    return false;
  }
}

/**
 * Marks V3 migration as completed
 */
function markMigrationDone(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(MIGRATION_FLAG_KEY, "true");
  } catch (error) {
    console.error("Error marking V3 migration as done:", error);
  }
}


/**
 * Main migration function - cleans up legacy data
 * Should be called once on app initialization
 */
export function migrateToV3(): void {
  if (typeof window === "undefined" || isMigrationDone()) {
    return;
  }

  // Step 1: Clean up old localStorage keys
  const oldExpenseKeys = Object.keys(localStorage).filter(key =>
    key.startsWith("travel-wallet-expenses-") || key === "travel-wallet-expenses"
  );
  oldExpenseKeys.forEach(key => {
    localStorage.removeItem(key);
  });

  const oldActivityLogKeys = Object.keys(localStorage).filter(key =>
    key.startsWith("travel-wallet-activity-logs-")
  );
  oldActivityLogKeys.forEach(key => {
    localStorage.removeItem(key);
  });

  // Step 2: Remove currencyTransactions from all trips if exchanges exist
  const trips = getAllTrips();
  let tripsUpdated = false;
  trips.forEach(trip => {
    const needsUpdate =
      (trip.data.currencyTransactions && trip.data.exchanges && trip.data.exchanges.length > 0) ||
      !trip.data.expenses ||
      !trip.data.activityLogs;

    if (needsUpdate) {
      const updatedData = { ...trip.data };

      // Remove currencyTransactions if exchanges exist
      if (updatedData.currencyTransactions && updatedData.exchanges && updatedData.exchanges.length > 0) {
        delete updatedData.currencyTransactions;
      }

      // Initialize expenses and activityLogs if missing
      if (!updatedData.expenses) {
        updatedData.expenses = [];
      }
      if (!updatedData.activityLogs) {
        updatedData.activityLogs = [];
      }

      updateTrip(trip.id, {
        data: updatedData,
        updatedAt: new Date().toISOString(),
      });
      tripsUpdated = true;
    }
  });

  markMigrationDone();
}

