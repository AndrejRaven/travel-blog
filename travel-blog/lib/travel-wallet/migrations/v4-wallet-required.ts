import type { Trip, TripsData } from "../types";
import { createWallet } from "../wallet-operations";
import { updateTrip } from "../trips-storage";

const MIGRATION_FLAG_KEY = "travel-wallet-v4-migration-done";
const STORAGE_KEY = "travel-wallet-trips";

/**
 * Pobiera dane tripów bezpośrednio z localStorage bez wywoływania migracji
 * (używane tylko w migracjach aby uniknąć rekurencji)
 */
function getTripsDataFromStorageDirect(): TripsData {
  if (typeof window === "undefined") {
    return { trips: [], currentTripId: undefined };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { trips: [], currentTripId: undefined };
    }

    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.trips)) {
      return {
        trips: parsed.trips || [],
        currentTripId: parsed.currentTripId || null,
      };
    }

    return { trips: [], currentTripId: undefined };
  } catch (error) {
    console.error("[Migration v4] Error reading trips from storage:", error);
    return { trips: [], currentTripId: undefined };
  }
}

/**
 * Migracja v4: Uczynienie wallet zawsze wymaganym
 * Dodaje domyślny wallet do wszystkich tripów, które go nie mają
 */
export function migrateToV4(): void {
  if (typeof window === "undefined") return;

  // Sprawdź czy migracja już została wykonana
  const migrationDone = localStorage.getItem(MIGRATION_FLAG_KEY);
  if (migrationDone === "true") {
    return;
  }

  try {
    // Użyj bezpośredniego odczytu z localStorage aby uniknąć rekurencji
    const tripsData = getTripsDataFromStorageDirect();
    const trips = tripsData.trips;
    let migratedCount = 0;

    trips.forEach((trip) => {
      // Jeśli trip nie ma wallet, dodaj domyślny
      if (!trip.data.wallet) {
        const defaultWallet = createWallet("PLN");
        defaultWallet.balances = [{ currency: "PLN", amount: 0 }];

        const success = updateTrip(trip.id, {
          data: {
            ...trip.data,
            wallet: defaultWallet,
            exchanges: trip.data.exchanges || [],
            budgetAdjustments: trip.data.budgetAdjustments || [],
          },
        });

        if (success) {
          migratedCount++;
        }
      }
    });

    // Oznacz migrację jako wykonaną
    localStorage.setItem(MIGRATION_FLAG_KEY, "true");
  } catch (error) {
    console.error("[Migration v4] Error during migration:", error);
  }
}
