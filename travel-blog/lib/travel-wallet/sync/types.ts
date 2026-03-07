/**
 * Typy dla synchronizacji z bazą danych
 */

import type { EntityType } from "../offline/operation-queue";

/**
 * Status synchronizacji
 */
export type SyncStatus =
  | "idle" // Brak aktywnych operacji synchronizacji
  | "syncing" // Synchronizacja w toku
  | "success" // Synchronizacja zakończona sukcesem
  | "error" // Błąd synchronizacji
  | "conflict"; // Wykryto konflikt wymagający rozwiązania

/**
 * Operacja synchronizacji
 */
export interface SyncOperation {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE";
  entityType: EntityType;
  entityId: string;
  data: unknown;
  timestamp: string;
  deviceId: string;
  version?: number; // Wersja danych (dla conflict detection)
}

/**
 * Metadata synchronizacji
 */
export interface SyncMetadata {
  lastSyncAt: string | null; // ISO timestamp ostatniej synchronizacji
  deviceId: string; // Unikalne ID urządzenia
  version: number; // Wersja danych (dla conflict detection)
  pendingOperations: SyncOperation[]; // Operacje oczekujące na synchronizację
}

/**
 * Konflikt synchronizacji
 */
export interface SyncConflict {
  id: string;
  entityType: EntityType;
  entityId: string;
  localVersion: number; // Wersja lokalna
  remoteVersion: number; // Wersja zdalna
  localData: unknown; // Dane lokalne
  remoteData: unknown; // Dane zdalne
  localTimestamp: string; // Timestamp lokalnej zmiany
  remoteTimestamp: string; // Timestamp zdalnej zmiany
  deviceId: string; // ID urządzenia które wprowadziło lokalną zmianę
}

/**
 * Wynik synchronizacji
 */
export interface SyncResult {
  success: boolean;
  processed: number; // Liczba przetworzonych operacji
  failed: number; // Liczba nieudanych operacji
  conflicts: SyncConflict[]; // Wykryte konflikty
  error?: string; // Błąd synchronizacji (jeśli wystąpił)
}

/**
 * Request do synchronizacji (pull)
 */
export interface SyncPullRequest {
  deviceId: string;
  lastSyncAt: string | null; // Timestamp ostatniej synchronizacji
  version: number; // Aktualna wersja danych lokalnych
}

/**
 * Response z synchronizacji (pull)
 */
export interface SyncPullResponse {
  success: boolean;
  changes: SyncOperation[]; // Zmiany do zastosowania lokalnie
  conflicts?: SyncConflict[]; // Wykryte konflikty
  serverVersion: number; // Wersja danych na serwerze
  error?: string;
}

/**
 * Request do synchronizacji (push)
 */
export interface SyncPushRequest {
  deviceId: string;
  operations: SyncOperation[]; // Operacje do wysłania na serwer
  version: number; // Aktualna wersja danych lokalnych
}

/**
 * Response z synchronizacji (push)
 */
export interface SyncPushResponse {
  success: boolean;
  processed: number; // Liczba przetworzonych operacji
  conflicts?: SyncConflict[]; // Wykryte konflikty
  serverVersion: number; // Nowa wersja danych na serwerze
  error?: string;
}

/**
 * Request do rozwiązania konfliktu
 */
export interface ConflictResolutionRequest {
  conflictId: string;
  resolution: "local" | "remote" | "merge"; // Strategia rozwiązania
  mergedData?: unknown; // Zmergowane dane (jeśli resolution === "merge")
}

/**
 * Response z rozwiązania konfliktu
 */
export interface ConflictResolutionResponse {
  success: boolean;
  resolvedConflict: SyncConflict;
  error?: string;
}

/**
 * Strategia rozwiązywania konfliktów
 */
export type ConflictResolutionStrategy =
  | "last-write-wins" // Ostatnia zmiana wygrywa (domyślna)
  | "manual" // Wymaga ręcznego rozwiązania przez użytkownika
  | "merge"; // Próba automatycznego scalenia (gdzie możliwe)

/**
 * Opcje synchronizacji
 */
export interface SyncOptions {
  /**
   * Strategia rozwiązywania konfliktów
   */
  conflictResolution?: ConflictResolutionStrategy;
  /**
   * Czy wymusić pełną synchronizację (ignoruj lastSyncAt)
   */
  forceFullSync?: boolean;
  /**
   * Maksymalna liczba operacji w batchu
   */
  batchSize?: number;
  /**
   * Callback wywoływany podczas synchronizacji
   */
  onProgress?: (processed: number, total: number) => void;
}
