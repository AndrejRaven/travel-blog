/**
 * Change Tracker
 *
 * Śledzi zmiany lokalne w aplikacji:
 * - Timestamp każdej zmiany
 * - Typ operacji (CREATE, UPDATE, DELETE)
 * - Metadata (userId, deviceId, timestamp)
 * - Change log w localStorage
 * - Cleanup starych zmian
 */

import type { EntityType } from "../offline/operation-queue";
import { safeSetLocalStorageItem } from "../utils/safe-local-storage";

export type ChangeOperationType = "CREATE" | "UPDATE" | "DELETE";

export interface ChangeRecord {
  id: string;
  entityType: EntityType;
  entityId: string;
  operationType: ChangeOperationType;
  timestamp: string; // ISO timestamp
  deviceId: string;
  userId?: string; // Opcjonalne - dla przyszłej autentykacji
  data?: unknown; // Opcjonalne - snapshot danych przed zmianą (dla UPDATE/DELETE)
}

const CHANGE_LOG_STORAGE_KEY = "travel-wallet-change-log";
const MAX_CHANGE_LOG_AGE_DAYS = 30; // Przechowuj zmiany przez 30 dni

/**
 * Generuje unikalne ID dla rekordu zmiany
 */
function generateChangeId(): string {
  return `change-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Pobiera deviceId z localStorage
 */
function getDeviceId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  const DEVICE_ID_KEY = "travel-wallet-device-id";
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    safeSetLocalStorageItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

/**
 * Pobiera change log z localStorage
 */
export function getChangeLog(): ChangeRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(CHANGE_LOG_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const changes: ChangeRecord[] = JSON.parse(stored);
    return changes;
  } catch (error) {
    console.error("Error reading change log:", error);
    return [];
  }
}

/**
 * Zapisuje change log do localStorage
 */
function saveChangeLog(changes: ChangeRecord[]): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const ok = safeSetLocalStorageItem(
      CHANGE_LOG_STORAGE_KEY,
      JSON.stringify(changes)
    );
    if (!ok) {
      console.error("Error saving change log: localStorage quota exceeded");
    }
    return ok;
  } catch (error) {
    console.error("Error saving change log:", error);
    return false;
  }
}

/**
 * Dodaje rekord zmiany do change log
 */
export function trackChange(
  entityType: EntityType,
  entityId: string,
  operationType: ChangeOperationType,
  data?: unknown
): ChangeRecord {
  const change: ChangeRecord = {
    id: generateChangeId(),
    entityType,
    entityId,
    operationType,
    timestamp: new Date().toISOString(),
    deviceId: getDeviceId(),
    data,
  };

  const changes = getChangeLog();
  changes.push(change);
  saveChangeLog(changes);

  return change;
}

/**
 * Pobiera zmiany dla danego typu encji
 */
export function getChangesByEntityType(
  entityType: EntityType
): ChangeRecord[] {
  const changes = getChangeLog();
  return changes.filter((change) => change.entityType === entityType);
}

/**
 * Pobiera zmiany dla danej encji
 */
export function getChangesByEntityId(
  entityType: EntityType,
  entityId: string
): ChangeRecord[] {
  const changes = getChangeLog();
  return changes.filter(
    (change) => change.entityType === entityType && change.entityId === entityId
  );
}

/**
 * Pobiera zmiany od określonego timestamp
 */
export function getChangesSince(timestamp: string): ChangeRecord[] {
  const changes = getChangeLog();
  return changes.filter((change) => change.timestamp >= timestamp);
}

/**
 * Pobiera zmiany dla danego urządzenia
 */
export function getChangesByDeviceId(deviceId: string): ChangeRecord[] {
  const changes = getChangeLog();
  return changes.filter((change) => change.deviceId === deviceId);
}

/**
 * Usuwa rekord zmiany z change log
 */
export function removeChange(changeId: string): boolean {
  const changes = getChangeLog();
  const filtered = changes.filter((change) => change.id !== changeId);

  if (filtered.length === changes.length) {
    return false; // Rekord nie został znaleziony
  }

  saveChangeLog(filtered);
  return true;
}

/**
 * Czyści stare zmiany (starsze niż MAX_CHANGE_LOG_AGE_DAYS)
 */
export function cleanupOldChanges(): number {
  const changes = getChangeLog();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_CHANGE_LOG_AGE_DAYS);

  const filtered = changes.filter((change) => {
    const changeDate = new Date(change.timestamp);
    return changeDate >= cutoffDate;
  });

  const removedCount = changes.length - filtered.length;
  saveChangeLog(filtered);

  return removedCount;
}

/**
 * Czyści cały change log
 */
export function clearChangeLog(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(CHANGE_LOG_STORAGE_KEY);
}

/**
 * Pobiera ostatnią zmianę dla danej encji
 */
export function getLastChangeForEntity(
  entityType: EntityType,
  entityId: string
): ChangeRecord | null {
  const changes = getChangesByEntityId(entityType, entityId);

  if (changes.length === 0) {
    return null;
  }

  // Sortuj po timestamp (najnowsze pierwsze)
  changes.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return changes[0];
}
