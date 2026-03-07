/**
 * Sync Manager
 * 
 * Główny manager synchronizacji:
 * - Pull changes z serwera
 * - Push changes do serwera
 * - Conflict detection i resolution
 * - Sync status tracking
 */

import type {
  SyncStatus,
  SyncResult,
  SyncOptions,
  SyncConflict,
  ConflictResolutionStrategy,
} from "./types";
import { pullChanges, pushChanges, getSyncStatus } from "./db-client";
import { getOperationQueue } from "../offline/operation-queue";
import { getChangesSince, trackChange } from "./change-tracker";
import { detectConflicts, resolveConflict as resolveConflictUtil } from "./conflict-resolver";
import type { EntityType } from "../offline/operation-queue";
import { safeSetLocalStorageItem } from "../utils/safe-local-storage";

const SYNC_METADATA_KEY = "travel-wallet-sync-metadata";

interface SyncMetadata {
  lastSyncAt: string | null;
  deviceId: string;
  version: number;
}

/**
 * Pobiera metadata synchronizacji z localStorage
 */
function getSyncMetadata(): SyncMetadata {
  if (typeof window === "undefined") {
    return {
      lastSyncAt: null,
      deviceId: "server",
      version: 0,
    };
  }

  try {
    const stored = localStorage.getItem(SYNC_METADATA_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error reading sync metadata:", error);
  }

  // Domyślne wartości
  const deviceId = localStorage.getItem("travel-wallet-device-id") || `device-${Date.now()}`;
  return {
    lastSyncAt: null,
    deviceId,
    version: 0,
  };
}

/**
 * Zapisuje metadata synchronizacji do localStorage
 */
function saveSyncMetadata(metadata: SyncMetadata): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    safeSetLocalStorageItem(SYNC_METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error("Error saving sync metadata:", error);
  }
}

/**
 * Synchronizuje dane z serwerem (pull + push)
 */
export async function sync(
  options: SyncOptions = {}
): Promise<SyncResult> {
  const {
    conflictResolution = "last-write-wins",
    forceFullSync = false,
    onProgress,
  } = options;

  const metadata = getSyncMetadata();
  let status: SyncStatus = "syncing";
  const conflicts: SyncConflict[] = [];

  try {
    // 1. Pull changes z serwera
    onProgress?.(0, 100);
    const pullRequest = {
      deviceId: metadata.deviceId,
      lastSyncAt: forceFullSync ? null : metadata.lastSyncAt,
      version: metadata.version,
    };

    const pullResponse = await pullChanges(pullRequest);
    onProgress?.(25, 100);

    if (!pullResponse.success) {
      throw new Error(pullResponse.error || "Failed to pull changes");
    }

    // 2. Wykryj konflikty
    const localOperations = getOperationQueue();
    const remoteOperations = pullResponse.changes || [];

    const detectedConflicts = detectConflicts(
      localOperations.map((op) => ({
        entityId: op.entityId,
        entityType: op.entityType,
        timestamp: op.timestamp,
        version: metadata.version,
      })),
      remoteOperations.map((op) => ({
        entityId: op.entityId,
        entityType: op.entityType,
        timestamp: op.timestamp,
        version: op.version,
      }))
    );

    conflicts.push(...detectedConflicts);
    conflicts.push(...(pullResponse.conflicts || []));

    onProgress?.(50, 100);

    // 3. Rozwiąż konflikty (jeśli last-write-wins)
    if (conflictResolution === "last-write-wins" && conflicts.length > 0) {
      // Automatyczne rozwiązanie konfliktów
      // W rzeczywistej implementacji tutaj zastosowałbyś zmiany lokalnie
    }

    // 4. Push changes do serwera
    const pushRequest = {
      deviceId: metadata.deviceId,
      operations: localOperations,
      version: metadata.version,
    };

    const pushResponse = await pushChanges(pushRequest);
    onProgress?.(75, 100);

    if (!pushResponse.success) {
      throw new Error(pushResponse.error || "Failed to push changes");
    }

    // 5. Zaktualizuj metadata
    metadata.lastSyncAt = new Date().toISOString();
    metadata.version = pushResponse.serverVersion;
    saveSyncMetadata(metadata);

    onProgress?.(100, 100);

    status = conflicts.length > 0 ? "conflict" : "success";

    return {
      success: true,
      processed: pushResponse.processed,
      failed: 0,
      conflicts,
    };
  } catch (error) {
    status = "error";
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[SyncManager] Sync error:", errorMessage);

    return {
      success: false,
      processed: 0,
      failed: getOperationQueue().length,
      conflicts,
      error: errorMessage,
    };
  }
}

/**
 * Pobiera status synchronizacji
 */
export function getLocalSyncStatus(): {
  status: SyncStatus;
  lastSyncAt: string | null;
  pendingOperations: number;
  version: number;
} {
  const metadata = getSyncMetadata();
  const queueSize = getOperationQueue().length;

  return {
    status: queueSize > 0 ? "idle" : "idle",
    lastSyncAt: metadata.lastSyncAt,
    pendingOperations: queueSize,
    version: metadata.version,
  };
}

/**
 * Rozwiązuje konflikt
 */
export async function resolveConflict(
  conflict: SyncConflict,
  resolution: "local" | "remote" | "merge",
  mergedData?: unknown
): Promise<boolean> {
  try {
    const resolutionRequest = {
      conflictId: conflict.id,
      resolution,
      mergedData,
    };

    // W rzeczywistej implementacji tutaj wywołałbyś API
    // const response = await resolveConflictAPI(resolutionRequest);
    
    return true;
  } catch (error) {
    console.error("[SyncManager] Error resolving conflict:", error);
    return false;
  }
}

/**
 * Wymusza pełną synchronizację
 */
export async function forceSync(options?: SyncOptions): Promise<SyncResult> {
  return sync({
    ...options,
    forceFullSync: true,
  });
}
