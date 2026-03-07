"use client";

import type { SyncConflict } from "./types";
import { safeSetLocalStorageItem } from "../utils/safe-local-storage";

const SYNC_CACHE_PREFIX = 'travel-wallet-last-sync-';
const PENDING_CONFLICTS_KEY = 'travel-wallet-pending-conflicts';
const MIN_SYNC_INTERVAL_MS = 60 * 1000; // 1 minuta minimum między synchronizacjami

interface SyncCache {
  lastSyncAt: number; // Timestamp w milisekundach
  lastSyncUserId: string;
  consecutiveErrors: number; // Liczba kolejnych błędów (dla exponential backoff)
  lastSyncResult?: 'success' | 'error'; // Ostatni wynik synchronizacji
}

const BASE_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minut bazowy interwał
const MAX_SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 godzina maksymalny interwał

/**
 * Pobiera cache synchronizacji dla użytkownika
 */
function getSyncCache(userId: string): SyncCache | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = `${SYNC_CACHE_PREFIX}${userId}`;
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    return JSON.parse(cached);
  } catch (error) {
    console.error('[SyncCache] Error reading sync cache:', error);
    return null;
  }
}

/**
 * Zapisuje cache synchronizacji dla użytkownika
 */
function setSyncCache(userId: string, cache: SyncCache): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${SYNC_CACHE_PREFIX}${userId}`;
    safeSetLocalStorageItem(key, JSON.stringify(cache));
  } catch (error) {
    console.error('[SyncCache] Error saving sync cache:', error);
  }
}

/**
 * Pobiera czas ostatniej synchronizacji dla użytkownika
 */
export function getLastSyncTime(userId: string): number | null {
  const cache = getSyncCache(userId);
  return cache?.lastSyncAt || null;
}

/**
 * Zapisuje czas ostatniej synchronizacji dla użytkownika
 */
export function setLastSyncTime(userId: string, timestamp: number): void {
  const existing = getSyncCache(userId);
  const cache: SyncCache = {
    lastSyncAt: timestamp,
    lastSyncUserId: userId,
    consecutiveErrors: existing?.consecutiveErrors || 0,
    lastSyncResult: 'success',
  };
  setSyncCache(userId, cache);
}

/**
 * Sprawdza czy powinna być synchronizacja (czy minęło wystarczająco czasu)
 */
export function shouldSync(userId: string, minIntervalMs: number = MIN_SYNC_INTERVAL_MS): boolean {
  const lastSync = getLastSyncTime(userId);
  if (!lastSync) {
    // Brak ostatniej synchronizacji - synchronizuj
    return true;
  }
  
  const now = Date.now();
  const timeSinceLastSync = now - lastSync;
  
  return timeSinceLastSync >= minIntervalMs;
}

/**
 * Zwiększa licznik błędów synchronizacji (dla exponential backoff)
 */
export function incrementSyncError(userId: string): void {
  const existing = getSyncCache(userId);
  const cache: SyncCache = {
    lastSyncAt: existing?.lastSyncAt || 0,
    lastSyncUserId: userId,
    consecutiveErrors: (existing?.consecutiveErrors || 0) + 1,
    lastSyncResult: 'error',
  };
  setSyncCache(userId, cache);
}

/**
 * Resetuje licznik błędów synchronizacji
 */
export function resetSyncError(userId: string): void {
  const existing = getSyncCache(userId);
  if (existing) {
    const cache: SyncCache = {
      ...existing,
      consecutiveErrors: 0,
      lastSyncResult: 'success',
    };
    setSyncCache(userId, cache);
  }
}

/**
 * Zwraca interwał synchronizacji z exponential backoff
 */
export function getSyncInterval(userId: string): number {
  const cache = getSyncCache(userId);
  const errors = cache?.consecutiveErrors || 0;
  
  if (errors === 0) {
    return BASE_SYNC_INTERVAL_MS; // 5 minut
  } else if (errors === 1) {
    return 10 * 60 * 1000; // 10 minut
  } else if (errors === 2) {
    return 20 * 60 * 1000; // 20 minut
  } else {
    return MAX_SYNC_INTERVAL_MS; // 60 minut (max)
  }
}

/**
 * Sprawdza czy są lokalne zmiany do synchronizacji
 */
export function hasLocalChanges(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // Sprawdź czy są pending operations w operation queue
    const operationQueue = localStorage.getItem('travel-wallet-operation-queue');
    if (operationQueue) {
      const operations = JSON.parse(operationQueue);
      if (Array.isArray(operations) && operations.length > 0) {
        return true;
      }
    }
    
    // Sprawdź czy są podróże z lokalnymi zmianami (syncStatus pending/error)
    const tripsData = localStorage.getItem('travel-wallet-trips');
    if (tripsData) {
      const data = JSON.parse(tripsData);
      if (data?.trips && Array.isArray(data.trips)) {
        const unsavedTrips = data.trips.filter((trip: { syncStatus?: string }) => {
          return trip.syncStatus === 'pending' || trip.syncStatus === 'error';
        });
        return unsavedTrips.length > 0;
      }
    }
    
    return false;
  } catch (error) {
    console.error('[SyncCache] Error checking local changes:', error);
    return false;
  }
}

/**
 * Sprawdza jakość połączenia sieciowego
 */
export function isConnectionGood(): boolean {
  if (typeof window === 'undefined') return true;
  
  // Sprawdź czy navigator.connection jest dostępne
  const nav = navigator as Navigator & { connection?: { effectiveType?: string }; mozConnection?: { effectiveType?: string }; webkitConnection?: { effectiveType?: string } };
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  
  if (!connection) {
    // API nie dostępne - zakładamy że połączenie jest dobre
    return true;
  }
  
  // Sprawdź effectiveType
  const effectiveType = connection.effectiveType;
  if (!effectiveType) {
    return true;
  }
  
  // Nie synchronizuj gdy połączenie jest wolne
  const slowConnections = ['slow-2g', '2g'];
  return !slowConnections.includes(effectiveType);
}

/**
 * Sprawdza czy strona jest widoczna
 */
export function isPageVisible(): boolean {
  if (typeof document === 'undefined') return true;
  return document.visibilityState === 'visible';
}

/**
 * Konflikty wykryte przy sync – do pokazania w ConflictResolver
 */
export function getPendingConflicts(): SyncConflict[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(PENDING_CONFLICTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setPendingConflicts(conflicts: SyncConflict[]): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PENDING_CONFLICTS_KEY, JSON.stringify(conflicts));
  } catch (e) {
    console.error('[SyncCache] Error saving pending conflicts:', e);
  }
}

export function clearPendingConflicts(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(PENDING_CONFLICTS_KEY);
  } catch {
    // ignore
  }
}
