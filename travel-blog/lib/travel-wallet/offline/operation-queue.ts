/**
 * Operation Queue dla operacji offline
 *
 * Przechowuje operacje wymagające synchronizacji z serwerem
 * w localStorage i automatycznie przetwarza je gdy aplikacja wraca online.
 */

import { safeSetLocalStorageItem } from "../utils/safe-local-storage";

export type OperationType = "CREATE" | "UPDATE" | "DELETE";

export type EntityType =
  | "trip"
  | "expense"
  | "exchange"
  | "country"
  | "budget_adjustment";

export interface SyncOperation {
  id: string;
  type: OperationType;
  entityType: EntityType;
  entityId: string;
  data: unknown; // Dane do synchronizacji
  timestamp: string; // ISO timestamp
  deviceId: string; // Unikalne ID urządzenia
  retryCount?: number; // Liczba prób synchronizacji
  lastError?: string; // Ostatni błąd synchronizacji
}

const QUEUE_STORAGE_KEY = "travel-wallet-operation-queue";
const MAX_RETRY_COUNT = 3;

/**
 * Generuje unikalne ID dla operacji
 */
function generateOperationId(): string {
  return `op-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generuje unikalne ID urządzenia (zapisywane w localStorage)
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
 * Pobiera kolejkę operacji z localStorage
 */
export function getOperationQueue(): SyncOperation[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const operations: SyncOperation[] = JSON.parse(stored);
    return operations;
  } catch (error) {
    console.error("Error reading operation queue:", error);
    return [];
  }
}

/**
 * Zapisuje kolejkę operacji do localStorage
 */
function saveOperationQueue(operations: SyncOperation[]): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const ok = safeSetLocalStorageItem(
      QUEUE_STORAGE_KEY,
      JSON.stringify(operations)
    );
    if (!ok) {
      console.error(
        "Error saving operation queue: localStorage quota exceeded"
      );
    }
    return ok;
  } catch (error) {
    console.error("Error saving operation queue:", error);
    return false;
  }
}

/**
 * Dodaje operację do kolejki
 */
export function addOperationToQueue(
  type: OperationType,
  entityType: EntityType,
  entityId: string,
  data: unknown
): SyncOperation {
  const operation: SyncOperation = {
    id: generateOperationId(),
    type,
    entityType,
    entityId,
    data,
    timestamp: new Date().toISOString(),
    deviceId: getDeviceId(),
    retryCount: 0,
  };

  const queue = getOperationQueue();
  queue.push(operation);
  saveOperationQueue(queue);

  return operation;
}

/**
 * Usuwa operację z kolejki
 */
export function removeOperationFromQueue(operationId: string): boolean {
  const queue = getOperationQueue();
  const filtered = queue.filter((op) => op.id !== operationId);

  if (filtered.length === queue.length) {
    return false; // Operacja nie została znaleziona
  }

  saveOperationQueue(filtered);
  return true;
}

/**
 * Pobiera operacje dla danego typu encji
 */
export function getOperationsByEntityType(
  entityType: EntityType
): SyncOperation[] {
  const queue = getOperationQueue();
  return queue.filter((op) => op.entityType === entityType);
}

/**
 * Pobiera operacje dla danej encji
 */
export function getOperationsByEntityId(
  entityType: EntityType,
  entityId: string
): SyncOperation[] {
  const queue = getOperationQueue();
  return queue.filter(
    (op) => op.entityType === entityType && op.entityId === entityId
  );
}

/**
 * Zwiększa licznik prób dla operacji
 */
export function incrementRetryCount(operationId: string): boolean {
  const queue = getOperationQueue();
  const operation = queue.find((op) => op.id === operationId);

  if (!operation) {
    return false;
  }

  operation.retryCount = (operation.retryCount || 0) + 1;
  saveOperationQueue(queue);
  return true;
}

/**
 * Ustawia błąd dla operacji
 */
export function setOperationError(
  operationId: string,
  error: string
): boolean {
  const queue = getOperationQueue();
  const operation = queue.find((op) => op.id === operationId);

  if (!operation) {
    return false;
  }

  operation.lastError = error;
  saveOperationQueue(queue);
  return true;
}

/**
 * Sprawdza czy operacja przekroczyła maksymalną liczbę prób
 */
export function hasExceededMaxRetries(operationId: string): boolean {
  const queue = getOperationQueue();
  const operation = queue.find((op) => op.id === operationId);

  if (!operation) {
    return false;
  }

  return (operation.retryCount || 0) >= MAX_RETRY_COUNT;
}

/**
 * Usuwa operacje które przekroczyły maksymalną liczbę prób
 */
export function removeFailedOperations(): number {
  const queue = getOperationQueue();
  const failed = queue.filter((op) =>
    hasExceededMaxRetries(op.id)
  );
  const remaining = queue.filter(
    (op) => !hasExceededMaxRetries(op.id)
  );

  saveOperationQueue(remaining);
  return failed.length;
}

/**
 * Czyści całą kolejkę operacji
 */
export function clearOperationQueue(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(QUEUE_STORAGE_KEY);
}

/**
 * Pobiera liczbę operacji w kolejce
 */
export function getQueueSize(): number {
  return getOperationQueue().length;
}
