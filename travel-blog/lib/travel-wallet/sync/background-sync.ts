/**
 * Background Sync Service
 * 
 * Automatyczna synchronizacja w tle:
 * - Co X minut gdy online (z exponential backoff)
 * - Przy powrocie online (event listener)
 * - Sync status tracking
 * - Smart sync - tylko gdy są zmiany lub minęło wystarczająco czasu
 */

import { syncTrips } from "./trip-sync-manager";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";
import {
  getLastSyncTime,
  setLastSyncTime,
  shouldSync,
  incrementSyncError,
  resetSyncError,
  getSyncInterval,
  hasLocalChanges,
  isConnectionGood,
  isPageVisible,
} from "./sync-cache";
import { withSyncLock } from "./sync-mutex";

let syncIntervalId: NodeJS.Timeout | null = null;
let currentUserId: string | null = null;

/**
 * Wykonuje synchronizację (z zabezpieczeniem przed równoczesnymi wywołaniami)
 * Sprawdza warunki przed synchronizacją (smart sync)
 */
async function performSync(): Promise<void> {
  return withSyncLock(async () => {
    try {
    // 1. Sprawdź czy użytkownik jest zalogowany
    const user = await getCurrentUser();
    if (!user) {
      return;
    }

    currentUserId = user.id;

    // 2. Sprawdź czy strona jest widoczna
    if (!isPageVisible()) {
      return;
    }

    // 3. Sprawdź jakość połączenia
    if (!isConnectionGood()) {
      return;
    }

    // 4. Sprawdź czy minęło wystarczająco czasu od ostatniej synchronizacji
    const minInterval = 60 * 1000; // Minimum 1 minuta
    if (!shouldSync(user.id, minInterval)) {
      return;
    }

    // 5. Sprawdź czy są lokalne zmiany (opcjonalnie - synchronizuj też gdy minęło dużo czasu)
    const lastSync = getLastSyncTime(user.id);
    const timeSinceLastSync = lastSync ? Date.now() - lastSync : Infinity;
    const longTimeSinceSync = timeSinceLastSync > 15 * 60 * 1000; // 15 minut

    if (!hasLocalChanges() && !longTimeSinceSync) {
      return;
    }
    
    const result = await syncTrips();
    
    if (result.success) {
      // Zapisuj czas ostatniej synchronizacji
      setLastSyncTime(user.id, Date.now());
      // Resetuj licznik błędów
      resetSyncError(user.id);
    } else {
      console.error(`[BackgroundSync] Sync failed:`, result.errors);
      // Zwiększ licznik błędów (dla exponential backoff)
      incrementSyncError(user.id);
    }
    } catch (error) {
      console.error("[BackgroundSync] Sync error:", error);
      if (currentUserId) {
        incrementSyncError(currentUserId);
      }
    }
  });
}

/**
 * Uruchamia automatyczną synchronizację co X minut (z exponential backoff)
 */
export function startBackgroundSync(): void {
  if (typeof window === "undefined") {
    return; // Tylko w przeglądarce
  }

  // Zatrzymaj istniejący interval jeśli istnieje
  stopBackgroundSync();

  // Pobierz interwał synchronizacji (z exponential backoff jeśli były błędy)
  const getCurrentSyncInterval = async () => {
    const user = await getCurrentUser();
    if (!user) {
      return 5 * 60 * 1000; // Domyślnie 5 minut
    }
    return getSyncInterval(user.id);
  };

  // Uruchom synchronizację z dynamicznym interwałem
  const scheduleNextSync = async () => {
    const interval = await getCurrentSyncInterval();
    
    // Wykonaj synchronizację
    performSync().catch(error => {
      console.error("[BackgroundSync] Sync error:", error);
    });

    // Zaplanuj następną synchronizację
    syncIntervalId = setTimeout(() => {
      scheduleNextSync();
    }, interval);
  };

  // Rozpocznij pierwszy cykl synchronizacji
  scheduleNextSync();
}

/**
 * Zatrzymuje automatyczną synchronizację
 */
export function stopBackgroundSync(): void {
  if (syncIntervalId) {
    clearTimeout(syncIntervalId);
    syncIntervalId = null;
  }
}

/**
 * Inicjalizuje background sync z event listenerami
 */
export function initializeBackgroundSync(): () => void {
  if (typeof window === "undefined") {
    return () => {}; // Tylko w przeglądarce
  }

  // Uruchom synchronizację przy starcie (tylko jeśli są warunki spełnione)
  startBackgroundSync();

  // Event listener dla powrotu online
  const handleOnline = () => {
    // Sprawdź warunki przed synchronizacją
    performSync().catch(error => {
      console.error("[BackgroundSync] Online sync error:", error);
    });
  };

  // Page Visibility API - synchronizuj tylko gdy strona jest widoczna
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      startBackgroundSync();
    } else {
      stopBackgroundSync();
    }
  };

  window.addEventListener("online", handleOnline);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Cleanup function
  return () => {
    stopBackgroundSync();
    window.removeEventListener("online", handleOnline);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}

/**
 * Wymusza natychmiastową synchronizację
 */
export async function forceSync(): Promise<void> {
  await performSync();
}
