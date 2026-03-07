/**
 * Trip Sync Manager
 * 
 * Specjalizowany manager synchronizacji dla podróży z Supabase
 * - Pull changes z Supabase
 * - Push changes do Supabase
 * - Conflict resolution (Last Write Wins)
 */

import type { Trip } from "../types";
import { getTripsFromSupabase, createTripInSupabase, updateTripInSupabase, deleteTripFromSupabase } from "@/lib/supabase/trips";
import { getAllTrips, getTripsDataFromStorage, saveTripsDataAndSyncDerived, updateTrip } from "../trips-storage";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";
import { hasLocalChanges, getLastSyncTime } from "./sync-cache";
import { withSyncLock } from "./sync-mutex";

export interface SyncResult {
  success: boolean;
  pulled: number; // Liczba podróży pobranych z Supabase
  pushed: number; // Liczba podróży wysłanych do Supabase
  conflicts: number; // Liczba konfliktów rozwiązanych
  errors: string[];
}

/**
 * Sprawdza czy są zmiany na serwerze (lightweight check)
 */
async function hasRemoteChanges(userId: string, lastSyncAt: number | null): Promise<boolean> {
  if (!lastSyncAt) {
    // Brak ostatniej synchronizacji - zakładamy że są zmiany
    return true;
  }

  try {
    // Pobierz wszystkie podróże z Supabase i sprawdź updated_at
    const supabaseTrips = await getTripsFromSupabase(userId);
    const lastSyncDate = new Date(lastSyncAt);
    
    // Sprawdź czy jakakolwiek podróż została zaktualizowana po ostatniej synchronizacji
    const hasChanges = supabaseTrips.some(trip => {
      if (!trip.updatedAt) return false;
      const updatedAt = new Date(trip.updatedAt);
      return updatedAt > lastSyncDate;
    });

    return hasChanges;
  } catch (error) {
    console.error("[TripSyncManager] Error checking remote changes:", error);
    // W przypadku błędu, zakładamy że są zmiany (bezpieczniejsze)
    return true;
  }
}

/**
 * Pobiera zmiany z Supabase i merguje z localStorage (Last Write Wins)
 */
export async function pullChangesFromSupabase(userId: string, forcePull: boolean = false): Promise<SyncResult> {
  return withSyncLock(async () => {
    const result: SyncResult = {
      success: true,
      pulled: 0,
      pushed: 0,
      conflicts: 0,
      errors: [],
    };

    // Sprawdź czy są zmiany remote przed pull (opcjonalnie)
    if (!forcePull) {
      const lastSync = getLastSyncTime(userId);
      const hasChanges = await hasRemoteChanges(userId, lastSync);
      
      if (!hasChanges) {
        return result;
      }
    }

    try {
    // Pobierz podróże z Supabase
    const supabaseTrips = await getTripsFromSupabase(userId);
    const localTrips = getAllTrips();
    
    // Merge strategy: Last Write Wins
    const localTripsBySlug = new Map(localTrips.map(t => [t.slug, t]));
    const tripsData = getTripsDataFromStorage();
    let hasChanges = false;
    
    for (const supabaseTrip of supabaseTrips) {
      const localTrip = localTripsBySlug.get(supabaseTrip.slug);
      
      if (!localTrip) {
        // Podróż istnieje tylko w Supabase - dodaj do localStorage.
        // Zawsze przypisz ownerUserId = userId, żeby lokalna kopia była jednoznacznie powiązana z właścicielem.
        tripsData.trips.push({
          ...supabaseTrip,
          ownerUserId: userId,
          lastSyncedAt: new Date().toISOString(),
          syncStatus: 'synced' as const,
        });
        hasChanges = true;
        result.pulled++;
      } else {
        // Podróż istnieje w obu miejscach - Last Write Wins
        const supabaseUpdated = new Date(supabaseTrip.updatedAt).getTime();
        const localUpdated = new Date(localTrip.updatedAt).getTime();
        
        if (supabaseUpdated > localUpdated) {
          // Supabase ma nowszą wersję - aktualizuj localStorage
          const index = tripsData.trips.findIndex(t => t.id === localTrip.id);
          if (index !== -1) {
            tripsData.trips[index] = {
              ...supabaseTrip,
              id: localTrip.id, // Zachowaj lokalne ID
              ownerUserId: userId,
              lastSyncedAt: new Date().toISOString(),
              syncStatus: 'synced' as const,
            };
            hasChanges = true;
            result.pulled++;
            result.conflicts++;
          }
        } else if (localUpdated > supabaseUpdated) {
          // Różnica tylko w czasie (local newer) – nie twórz pending ani konfliktu.
          // Pending tylko gdy użytkownik faktycznie ma zmiany (syncStatus już pending/error).
          const index = tripsData.trips.findIndex(t => t.id === localTrip.id);
          if (index !== -1) {
            const current = tripsData.trips[index];
            if (current.syncStatus !== 'pending' && current.syncStatus !== 'error') {
              tripsData.trips[index] = {
                ...current,
                ownerUserId: userId,
                lastSyncedAt: new Date().toISOString(),
                syncStatus: 'synced' as const,
              };
              hasChanges = true;
            }
          }
        } else {
          // Równe - tylko zaktualizuj sync metadata
          const index = tripsData.trips.findIndex(t => t.id === localTrip.id);
          if (index !== -1 && tripsData.trips[index].lastSyncedAt !== new Date().toISOString()) {
            tripsData.trips[index] = {
              ...tripsData.trips[index],
              ownerUserId: userId,
              lastSyncedAt: new Date().toISOString(),
              syncStatus: 'synced' as const,
            };
            hasChanges = true;
          }
        }
      }
    }
    
    if (hasChanges) {
      saveTripsDataAndSyncDerived(tripsData);
    }
    } catch (error) {
      result.success = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Pull failed: ${errorMessage}`);
      console.error("[TripSyncManager] Error pulling changes:", error);
    }

    return result;
  });
}

/**
 * Wysyła zmiany z localStorage do Supabase
 */
export async function pushChangesToSupabase(userId: string, forcePush: boolean = false): Promise<SyncResult> {
  return withSyncLock(async () => {
    const result: SyncResult = {
      success: true,
      pulled: 0,
      pushed: 0,
      conflicts: 0,
      errors: [],
    };

    // Sprawdź czy są lokalne zmiany przed push
    if (!forcePush && !hasLocalChanges()) {
      return result;
    }

    try {
    const localTrips = getAllTrips();
    const supabaseTrips = await getTripsFromSupabase(userId);
    const supabaseTripsBySlug = new Map(supabaseTrips.map(t => [t.slug, t]));
    const tripsData = getTripsDataFromStorage();
    
    for (const localTrip of localTrips) {
      // Nie wypychaj podróży, które nie mają przypisanego właściciela (ownerUserId)
      // albo należą do innego użytkownika niż aktualnie zalogowany.
      // To są dane gościa lub lokalne-only dla innych kont – nigdy nie powinny trafić do Supabase dla tego usera.
      if (!localTrip.ownerUserId) {
        continue;
      }
      if (localTrip.ownerUserId !== userId) {
        console.warn(
          "[TripSyncManager] Skipping trip with foreign ownerUserId during push:",
          {
            tripSlug: localTrip.slug,
            tripId: localTrip.id,
            ownerUserId: localTrip.ownerUserId,
            currentUserId: userId,
          }
        );
        continue;
      }

      // Synchronizuj tylko podróże które są pending lub nie istnieją w Supabase
      if (localTrip.syncStatus === 'pending' || !supabaseTripsBySlug.has(localTrip.slug)) {
        try {
          const supabaseTrip = supabaseTripsBySlug.get(localTrip.slug);
          
          if (!supabaseTrip) {
            // Spróbuj utworzyć podróż w Supabase.
            // Jeśli w międzyczasie powstał duplikat (unikalny slug), obsłuż to niżej w catch.
            await createTripInSupabase({
              slug: localTrip.slug,
              name: localTrip.name,
              startDate: localTrip.startDate,
              endDate: localTrip.endDate,
              data: localTrip.data,
            }, userId);

            // Zaktualizuj lokalną podróż z sync metadata
            const index = tripsData.trips.findIndex(t => t.id === localTrip.id);
            if (index !== -1) {
              tripsData.trips[index] = {
                ...tripsData.trips[index],
                lastSyncedAt: new Date().toISOString(),
                syncStatus: 'synced' as const,
              };
            }

            result.pushed++;
          } else {
            // Podróż istnieje w Supabase - sprawdź Last Write Wins
            const supabaseUpdated = new Date(supabaseTrip.updatedAt).getTime();
            const localUpdated = new Date(localTrip.updatedAt).getTime();
            
            if (localUpdated > supabaseUpdated) {
              // localStorage ma nowszą wersję - aktualizuj Supabase
              await updateTripInSupabase(supabaseTrip.id, {
                name: localTrip.name,
                startDate: localTrip.startDate,
                endDate: localTrip.endDate,
                data: localTrip.data,
              }, userId);
              
              // Zaktualizuj lokalną podróż z sync metadata
              const index = tripsData.trips.findIndex(t => t.id === localTrip.id);
              if (index !== -1) {
                tripsData.trips[index] = {
                  ...tripsData.trips[index],
                  lastSyncedAt: new Date().toISOString(),
                  syncStatus: 'synced' as const,
                };
              }
              
              result.pushed++;
              result.conflicts++;
            } else if (supabaseUpdated > localUpdated) {
              // Supabase ma nowszą wersję - nie pushuj, tylko zaktualizuj metadata
              const index = tripsData.trips.findIndex(t => t.id === localTrip.id);
              if (index !== -1) {
                tripsData.trips[index] = {
                  ...tripsData.trips[index],
                  lastSyncedAt: new Date().toISOString(),
                  syncStatus: 'synced' as const,
                };
              }
              result.conflicts++;
            } else {
              // Równe - tylko zaktualizuj sync metadata
              const index = tripsData.trips.findIndex(t => t.id === localTrip.id);
              if (index !== -1) {
                tripsData.trips[index] = {
                  ...tripsData.trips[index],
                  lastSyncedAt: new Date().toISOString(),
                  syncStatus: 'synced' as const,
                };
              }
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          // Jeśli podczas inserta dostaliśmy błąd unikalności slug (23505),
          // potraktuj to jako „już istnieje w Supabase” i oznacz jako zsynchronizowane.
          if (error instanceof Error && (errorMessage.includes('23505') || errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint'))) {
            const index = tripsData.trips.findIndex(t => t.id === localTrip.id);
            if (index !== -1) {
              tripsData.trips[index] = {
                ...tripsData.trips[index],
                lastSyncedAt: new Date().toISOString(),
                syncStatus: 'synced' as const,
              };
            }
          } else {
            result.errors.push(`Failed to sync trip "${localTrip.name}": ${errorMessage}`);
            console.error(`[TripSyncManager] Error syncing trip "${localTrip.name}":`, error);
            
            // Oznacz jako error w sync metadata
            const index = tripsData.trips.findIndex(t => t.id === localTrip.id);
            if (index !== -1) {
              tripsData.trips[index] = {
                ...tripsData.trips[index],
                syncStatus: 'error' as const,
              };
            }
          }
        }
      }
    }
    
    // Zapisz zmiany w localStorage oraz odśwież indeks/activeTrip
    saveTripsDataAndSyncDerived(tripsData);
    } catch (error) {
      result.success = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Push failed: ${errorMessage}`);
      console.error("[TripSyncManager] Error pushing changes:", error);
    }

    return result;
  });
}

/**
 * Pełna synchronizacja dwukierunkowa
 */
export async function syncTrips(forceFullSync: boolean = false): Promise<SyncResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        pulled: 0,
        pushed: 0,
        conflicts: 0,
        errors: ['User not authenticated'],
      };
    }

    // Sprawdź czy są lokalne zmiany lub czy minęło dużo czasu od ostatniej synchronizacji
    const lastSync = getLastSyncTime(user.id);
    const timeSinceLastSync = lastSync ? Date.now() - lastSync : Infinity;
    const longTimeSinceSync = timeSinceLastSync > 15 * 60 * 1000; // 15 minut

    // Jeśli brak lokalnych zmian i niedawna synchronizacja, pomiń synchronizację
    if (!forceFullSync && !hasLocalChanges() && !longTimeSinceSync) {
      return {
        success: true,
        pulled: 0,
        pushed: 0,
        conflicts: 0,
        errors: [],
      };
    }

    // 1. Pull changes z Supabase (tylko jeśli są zmiany remote lub forceFullSync)
    const pullResult = await pullChangesFromSupabase(user.id, forceFullSync);
    
    // 2. Push changes do Supabase (tylko jeśli są lokalne zmiany lub forceFullSync)
    const pushResult = await pushChangesToSupabase(user.id, forceFullSync);
    
    // 3. Połącz wyniki
    return {
      success: pullResult.success && pushResult.success,
      pulled: pullResult.pulled,
      pushed: pushResult.pushed,
      conflicts: pullResult.conflicts + pushResult.conflicts,
      errors: [...pullResult.errors, ...pushResult.errors],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[TripSyncManager] Sync error:", error);
    return {
      success: false,
      pulled: 0,
      pushed: 0,
      conflicts: 0,
      errors: [errorMessage],
    };
  }
}
