import { getAllTrips, deleteTrip, generateUniqueSlug, getFailedDeleteSlugs, getTripsDataFromStorage, saveTripsDataToStorage, applyTripConflictResolution } from '@/lib/travel-wallet/trips-storage';
import { mergeTripWithRemote } from '@/lib/travel-wallet/sync/trip-merge';
import type { SyncConflict } from '@/lib/travel-wallet/sync/types';
import { createTripInSupabase, getTripSlugsFromSupabase, updateTripInSupabase } from './trips';
import type { Trip } from '@/lib/travel-wallet/types';

/**
 * Migruje podróż z localStorage do Supabase
 */
export async function migrateLocalTripToSupabase(
  trip: Trip,
  userId: string
): Promise<Trip | null> {
  try {
    // Sprawdź czy podróż już istnieje w Supabase (po slug)
    const { getTripsFromSupabase } = await import('./trips');
    const existingTrips = await getTripsFromSupabase(userId);
    
    // Sprawdź czy podróż o tym samym slug już istnieje
    const existingTrip = existingTrips.find(t => t.slug === trip.slug);
    
    if (existingTrip) {
      return existingTrip; // Zwróć istniejącą podróż zamiast tworzyć duplikat
    }

    // Slug unikalny względem Supabase (unikamy 409)
    const supabaseSlugs = await getTripSlugsFromSupabase(userId);
    const existingSlugs = new Set(supabaseSlugs);
    let slugToUse = existingSlugs.has(trip.slug)
      ? generateUniqueSlug(trip.name, existingSlugs)
      : trip.slug;

    const payload = {
      slug: slugToUse,
      name: trip.name,
      startDate: trip.startDate,
      endDate: trip.endDate,
      data: trip.data,
    };

    let migratedTrip: Trip | null = null;
    try {
      migratedTrip = await createTripInSupabase(payload, userId);
    } catch (insertError) {
      const err = insertError as { code?: string };
      if (err?.code === '23505') {
        existingSlugs.add(slugToUse);
        slugToUse = generateUniqueSlug(trip.name, existingSlugs);
        migratedTrip = await createTripInSupabase(
          { ...payload, slug: slugToUse },
          userId
        );
      } else {
        throw insertError;
      }
    }

    return migratedTrip;
  } catch (error) {
    console.error('[SyncHelpers] Error migrating trip to Supabase:', error);
    throw error;
  }
}

/**
 * Migruje wszystkie lokalne podróże do Supabase przy pierwszym logowaniu
 * NIE usuwa lokalnych podróży - localStorage jest source of truth
 */
export async function migrateTripsToSupabase(userId: string): Promise<{
  migrated: number;
  failed: number;
  trips: Trip[];
}> {
  const localTrips = getAllTrips();
  const migratedTrips: Trip[] = [];
  let migrated = 0;
  let failed = 0;

  // Najpierw sprawdź które lokalne podróże już istnieją w Supabase
  const { getTripsFromSupabase } = await import('./trips');
  const existingTrips = await getTripsFromSupabase(userId);
  const existingSlugs = new Set(existingTrips.map(t => t.slug));
  
  // Filtruj podróże, które faktycznie trzeba zmigrować (nie istnieją w Supabase)
  const tripsToMigrate = localTrips.filter(trip => !existingSlugs.has(trip.slug));
  
  // Jeśli wszystkie lokalne podróże już istnieją w Supabase, nie ma co migrować
  if (tripsToMigrate.length === 0) {
    // Zaktualizuj metadata sync dla wszystkich lokalnych podróży
    const { updateTrip } = await import('../travel-wallet/trips-storage');
    for (const trip of localTrips) {
      updateTrip(trip.id, {
        lastSyncedAt: new Date().toISOString(),
        syncStatus: 'synced' as const,
      });
    }
    return {
      migrated: 0,
      failed: 0,
      trips: existingTrips.filter(t => localTrips.some(lt => lt.slug === t.slug)),
    };
  }

  // Sprawdź limit tylko dla podróży, które faktycznie trzeba zmigrować
  const { checkTripLimit } = await import('./trips');
  const limitCheck = await checkTripLimit(userId);

  if (!limitCheck.canCreate && tripsToMigrate.length > 0) {
    throw new Error(
      `LIMIT_EXCEEDED: Nie można zmigrować podróży. ` +
      `Masz już ${limitCheck.currentCount} podróż(ży) w Supabase. ` +
      `Limit dla tieru "${limitCheck.tier}" to ${limitCheck.limit === Infinity ? 'nielimitowane' : limitCheck.limit}.`
    );
  }

  // Migruj tylko podróże, które nie istnieją w Supabase
  // NIE USUWAJ lokalnych podróży - localStorage jest source of truth
  for (const trip of tripsToMigrate) {
    try {
      // Sprawdź czy limit nie został przekroczony podczas migracji
      const currentLimitCheck = await checkTripLimit(userId);
      if (!currentLimitCheck.canCreate) {
        console.warn(`[SyncHelpers] Limit reached, stopping migration at trip "${trip.name}"`);
        break;
      }

      const migratedTrip = await migrateLocalTripToSupabase(trip, userId);
      
      // migratedTrip może być null jeśli podróż już istnieje (nie duplikujemy)
      if (migratedTrip) {
        migratedTrips.push(migratedTrip);
        migrated++;
        
        // Zaktualizuj lokalną podróż z metadata synchronizacji (NIE USUWAJ)
        const { updateTrip } = await import('../travel-wallet/trips-storage');
        updateTrip(trip.id, {
          lastSyncedAt: new Date().toISOString(),
          syncStatus: 'synced' as const,
        });
      } else {
        // Podróż już istnieje w Supabase - zaktualizuj metadata sync
        const { updateTrip } = await import('../travel-wallet/trips-storage');
        updateTrip(trip.id, {
          lastSyncedAt: new Date().toISOString(),
          syncStatus: 'synced' as const,
        });
      }
    } catch (error) {
      console.error(`[SyncHelpers] Failed to migrate trip "${trip.name}":`, error);
      failed++;
      
      // Oznacz jako error w sync metadata
      try {
        const { updateTrip } = await import('../travel-wallet/trips-storage');
        updateTrip(trip.id, {
          syncStatus: 'error' as const,
        });
      } catch (updateError) {
        console.error(`[SyncHelpers] Failed to update sync status:`, updateError);
      }
      
      // Jeśli błąd to limit exceeded, przerwij migrację
      if (error instanceof Error && error.message.includes('LIMIT_EXCEEDED')) {
        break;
      }
    }
  }

  return {
    migrated,
    failed,
    trips: migratedTrips,
  };
}

/**
 * Liczy podróże w localStorage
 */
export function getLocalTripsCount(): number {
  try {
    const trips = getAllTrips();
    return trips.length;
  } catch (error) {
    console.error('[SyncHelpers] Error counting local trips:', error);
    return 0;
  }
}

const SESSION_SYNCED_USER_KEY = 'travel-wallet-session-synced-user';

/**
 * Zwraca ID użytkownika, dla którego w tej sesji (karcie) już wykonano sync migracji.
 * Dzięki temu przy odświeżeniu strony nie uruchamiamy ponownie pull+push bez potrzeby.
 */
export function getSessionSyncedUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(SESSION_SYNCED_USER_KEY);
  } catch {
    return null;
  }
}

export function setSessionSyncedUserId(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_SYNCED_USER_KEY, userId);
  } catch {
    // ignore
  }
}

export function clearSessionSyncedUserId(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_SYNCED_USER_KEY);
  } catch {
    // ignore
  }
}

/**
 * Czy są lokalne zmiany do wypchnięcia (podróże z syncStatus pending/error).
 */
function hasPendingTripChanges(): boolean {
  const trips = getAllTrips();
  return trips.some((t) => t.syncStatus === 'pending' || t.syncStatus === 'error');
}

/**
 * Czy powinniśmy uruchomić pełną migrację (pull + push).
 * Zwraca true tylko gdy użytkownik ma lokalne zmiany do wypchnięcia (syncStatus pending/error).
 * Reload ani zmiany automatyczne nie wywołują sync.
 */
export async function shouldRunMigrationSync(userId: string): Promise<boolean> {
  const localCount = getLocalTripsCount();
  if (localCount === 0) {
    return false;
  }
  if (!hasPendingTripChanges()) {
    return false; // Sync tylko przy zmianach użytkownika; reload nie uruchamia sync
  }
  return true;
}

/**
 * Sprawdza czy powinno synchronizować do Supabase (użytkownik zalogowany i ma podróże).
 */
export async function shouldSyncToSupabase(): Promise<boolean> {
  const { getCurrentUser } = await import('./auth-helpers');
  const user = await getCurrentUser();
  
  if (!user) {
    return false; // Użytkownik nie jest zalogowany
  }

  const localCount = getLocalTripsCount();
  if (localCount === 0) {
    return false; // Brak podróży do synchronizacji
  }

  return true;
}

/**
 * Migruje podróże z Supabase do localStorage (pull).
 * Konflikty (obie wersje zmodyfikowane) rozwiązywane automatycznie: local wins, lokalna wersja wypychana do Supabase.
 */
export async function migrateTripsFromSupabaseToLocal(userId: string): Promise<{
  migrated: number;
  failed: number;
  conflicts: SyncConflict[];
  resolvedConflicts: number;
}> {
  const { getTripsFromSupabase } = await import('./trips');

  let migrated = 0;
  let failed = 0;
  let resolvedConflicts = 0;
  const conflicts: SyncConflict[] = [];

  try {
    const supabaseTrips = await getTripsFromSupabase(userId);
    const localTrips = getAllTrips();
    const localBySlug = new Map(localTrips.map(t => [t.slug, t]));
    const failedDeleteSlugs = getFailedDeleteSlugs(userId);
    const tripsData = getTripsDataFromStorage();
    let changed = false;

    for (const supabaseTrip of supabaseTrips) {
      if (failedDeleteSlugs.has(supabaseTrip.slug)) continue;
      const localTrip = localBySlug.get(supabaseTrip.slug) ?? null;
      const result = mergeTripWithRemote(supabaseTrip, localTrip, { reportConflictWhenDiffer: true });

      if (result.outcome === "conflict" && result.conflict) {
        const conflict = result.conflict;
        const local = conflict.localData as Trip;
        const remote = conflict.remoteData as Trip;
        console.warn("[SyncHelpers] Konflikt (różne updatedAt), auto-resolve local:", local.slug, "localUpdatedAt:", local.updatedAt, "remoteUpdatedAt:", remote.updatedAt);
        try {
          const updated = await updateTripInSupabase(remote.id, {
            name: local.name,
            slug: local.slug,
            startDate: local.startDate,
            endDate: local.endDate,
            data: local.data,
          }, userId);
          applyTripConflictResolution(conflict, "local");
          const { updateTrip } = await import('../travel-wallet/trips-storage');
          updateTrip(local.id, { updatedAt: updated.updatedAt });
          const idx = tripsData.trips.findIndex((t) => t.id === local.id);
          if (idx !== -1) {
            tripsData.trips[idx] = { ...tripsData.trips[idx], updatedAt: updated.updatedAt, lastSyncedAt: updated.updatedAt, syncStatus: "synced" as const };
          }
          changed = true;
          resolvedConflicts++;
        } catch (err) {
          console.error(`[SyncHelpers] Failed to auto-resolve conflict for trip "${local.name}":`, err);
          failed++;
        }
        continue;
      }

      try {
        const { outcome, trip } = result;
        if (outcome === "add") {
          tripsData.trips.push(trip);
          migrated++;
          changed = true;
        } else if (outcome === "use_local" && localTrip) {
          const index = tripsData.trips.findIndex(t => t.id === localTrip.id);
          if (index !== -1) {
            try {
              const updated = await updateTripInSupabase(supabaseTrip.id, {
                name: localTrip.name,
                slug: localTrip.slug,
                startDate: localTrip.startDate,
                endDate: localTrip.endDate,
                data: localTrip.data,
              }, userId);
              tripsData.trips[index] = {
                ...localTrip,
                updatedAt: updated.updatedAt,
                lastSyncedAt: updated.updatedAt,
                syncStatus: "synced",
              };
              changed = true;
            } catch (err) {
              console.error(`[SyncHelpers] Failed to push use_local for trip "${localTrip.name}":`, err);
              tripsData.trips[index] = trip;
              changed = true;
            }
          }
        } else if (localTrip) {
          const index = tripsData.trips.findIndex(t => t.id === localTrip.id);
          if (index !== -1) {
            tripsData.trips[index] = trip;
            if (outcome === "use_remote") migrated++;
            changed = true;
          }
        }
      } catch (err) {
        console.error(`[SyncHelpers] Failed to apply trip "${supabaseTrip.name}" from Supabase:`, err);
        failed++;
      }
    }

    if (changed) saveTripsDataToStorage(tripsData);
  } catch (error) {
    console.error('[SyncHelpers] Error migrating trips from Supabase:', error);
    throw error;
  }

  return { migrated, failed, conflicts, resolvedConflicts };
}

/**
 * Pobiera podróże z obu źródeł (Supabase + localStorage) i merguje je.
 * Opcjonalne: np. widok „tylko chmura” lub raporty. Lista w UI korzysta z localStorage (getAllTripsAsync).
 */
export async function getMergedTrips(userId: string): Promise<Trip[]> {
  const { getTripsFromSupabase } = await import('./trips');
  
  try {
    // Pobierz podróże z Supabase
    const supabaseTrips = await getTripsFromSupabase(userId);
    
    // Pobierz podróże z localStorage
    const localTrips = getAllTrips();
    
    // Merge: Supabase trips mają priorytet (są bardziej aktualne)
    // Sprawdź duplikaty po slug (nie po id, bo lokalne mają inne id)
    const supabaseTripSlugs = new Set(supabaseTrips.map(t => t.slug));
    const localOnlyTrips = localTrips.filter(t => !supabaseTripSlugs.has(t.slug));
    
    // Zwróć podróże z Supabase + lokalne które nie są w Supabase (po slug)
    return [...supabaseTrips, ...localOnlyTrips];
  } catch (error) {
    console.error('[SyncHelpers] Error getting merged trips:', error);
    // Fallback do localStorage jeśli Supabase nie działa
    return getAllTrips();
  }
}
