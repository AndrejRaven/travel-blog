"use client";

import { useEffect, useRef } from "react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { getLocalSyncStatus } from "./sync-manager";
import type { SyncOptions } from "./types";
import {
  shouldSync,
  getLastSyncTime,
  hasLocalChanges,
  isConnectionGood,
  isPageVisible,
  getSyncInterval,
} from "./sync-cache";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";
import { withSyncLock } from "./sync-mutex";
import { syncTrips } from "./trip-sync-manager";

interface UseBackgroundSyncOptions {
  /**
   * Czas między automatycznymi synchronizacjami (ms)
   * Domyślnie 5 minut
   */
  syncInterval?: number;
  /**
   * Czy synchronizować automatycznie po powrocie online
   * Domyślnie true
   */
  syncOnOnline?: boolean;
  /**
   * Opcje synchronizacji
   */
  syncOptions?: SyncOptions;
  /**
   * Callback wywoływany po synchronizacji
   */
  onSyncComplete?: (success: boolean) => void;
}

/**
 * Hook do automatycznej synchronizacji w tle
 * 
 * - Synchronizuje okresowo gdy aplikacja jest online
 * - Synchronizuje automatycznie po powrocie online
 * - Debouncing dla częstych zmian
 */
export function useBackgroundSync(options: UseBackgroundSyncOptions = {}) {
  const {
    syncInterval = 5 * 60 * 1000, // 5 minut
    syncOnOnline = true,
    syncOptions = {},
    onSyncComplete,
  } = options;

  const { isOnline } = useOnlineStatus();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTimeRef = useRef<number>(0);
  
  const DEBOUNCE_MS = 30 * 1000; // 30 sekund debouncing
  const THROTTLE_MS = 2 * 60 * 1000; // 2 minuty throttling

  /**
   * Wykonuje synchronizację z sprawdzaniem warunków
   */
  const performSync = async () => {
    if (!isOnline) {
      return;
    }

    // Throttling - nie synchronizuj zbyt często
    const now = Date.now();
    if (now - lastSyncTimeRef.current < THROTTLE_MS) {
      return;
    }

    // Sprawdź czy strona jest widoczna
    if (!isPageVisible()) {
      return;
    }

    // Sprawdź jakość połączenia
    if (!isConnectionGood()) {
      return;
    }

    // Sprawdź czy użytkownik jest zalogowany i czy powinna być synchronizacja
    try {
      const user = await getCurrentUser();
      if (!user) {
        return;
      }

      // Sprawdź czy minęło wystarczająco czasu od ostatniej synchronizacji
      const minInterval = 60 * 1000; // Minimum 1 minuta
      if (!shouldSync(user.id, minInterval)) {
        return;
      }

      // Sprawdź czy są lokalne zmiany lub minęło dużo czasu
      const lastSync = getLastSyncTime(user.id);
      const timeSinceLastSync = lastSync ? Date.now() - lastSync : Infinity;
      const longTimeSinceSync = timeSinceLastSync > 15 * 60 * 1000; // 15 minut

      const status = getLocalSyncStatus();
      const hasPendingOps = status.pendingOperations > 0;

      if (!hasPendingOps && !hasLocalChanges() && !longTimeSinceSync) {
        return;
      }
    } catch (error) {
      console.error("[useBackgroundSync] Error checking sync conditions:", error);
      return;
    }

    // Debouncing - sprawdź czy minęło wystarczająco czasu od ostatniej próby
    if (now - lastSyncTimeRef.current < DEBOUNCE_MS) {
      return;
    }

    lastSyncTimeRef.current = now;

    await withSyncLock(async () => {
      try {
        const result = await syncTrips();
        onSyncComplete?.(result.success);
      } catch (error) {
        console.error("[useBackgroundSync] Sync error (trips):", error);
        onSyncComplete?.(false);
      }
    });
  };

  /**
   * Ustawia następną synchronizację z dynamicznym interwałem
   */
  const scheduleNextSync = async () => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    if (!isOnline) {
      return;
    }

    // Pobierz dynamiczny interwał synchronizacji (z exponential backoff)
    let interval = syncInterval;
    try {
      const user = await getCurrentUser();
      if (user) {
        interval = getSyncInterval(user.id);
      }
    } catch (error) {
      console.error("[useBackgroundSync] Error getting sync interval:", error);
    }

    syncTimeoutRef.current = setTimeout(() => {
      performSync().finally(() => {
        scheduleNextSync(); // Zaplanuj następną synchronizację
      });
    }, interval);
  };

  /**
   * Obsługuje powrót online
   */
  useEffect(() => {
    if (!syncOnOnline) {
      return;
    }

    const handleOnline = () => {
      performSync().finally(() => {
        scheduleNextSync();
      });
    };

    if (isOnline) {
      // Opóźnienie aby upewnić się że połączenie jest stabilne
      const timeout = setTimeout(handleOnline, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, syncOnOnline]);

  /**
   * Uruchamia okresową synchronizację
   */
  useEffect(() => {
    if (!isOnline) {
      return;
    }

    // Pierwsza synchronizacja po załadowaniu
    scheduleNextSync();

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isOnline]);

  return {
    /**
     * Wymusza synchronizację ręcznie
     */
    forceSync: async () => {
      await performSync();
      scheduleNextSync();
    },
  };
}
