/**
 * Wspólna logika mergowania podróży (local vs remote) – LWW po updatedAt.
 * Różne updatedAt = potrzeba syncu (pull lub push), nie konflikt. Ten sam updatedAt = brak zmian.
 */

import type { Trip } from "../types";
import type { SyncConflict } from "./types";

export type MergeOutcome =
  | "add"
  | "use_remote"
  | "use_local"
  | "sync_metadata"
  | "conflict"; // obie wersje zmodyfikowane – nie nadpisujemy, zwracamy konflikt do UI

export interface TripMergeResult {
  outcome: MergeOutcome;
  /** Trip do zapisania w localStorage (przy conflict = lokalna, bez zmian) */
  trip: Trip;
  localId?: string;
  /** Ustawione gdy outcome === 'conflict' – do pokazania w ConflictResolver */
  conflict?: SyncConflict;
}

const DEVICE_ID_PLACEHOLDER = "local";

function buildTripConflict(remote: Trip, local: Trip): SyncConflict {
  return {
    id: `trip-conflict-${local.slug}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    entityType: "trip",
    entityId: local.id,
    localVersion: new Date(local.updatedAt).getTime(),
    remoteVersion: new Date(remote.updatedAt).getTime(),
    localData: local,
    remoteData: remote,
    localTimestamp: local.updatedAt,
    remoteTimestamp: remote.updatedAt,
    deviceId: DEVICE_ID_PLACEHOLDER,
  };
}

/**
 * Merguje podróż zdalną z lokalną. Last Write Wins.
 * Różne updatedAt = sync (use_remote lub use_local). Ten sam updatedAt = sync_metadata.
 */
export function mergeTripWithRemote(
  remote: Trip,
  local: Trip | null,
  _options?: { reportConflictWhenDiffer?: boolean }
): TripMergeResult {
  if (!local) {
    return {
      outcome: "add",
      trip: {
        ...remote,
        lastSyncedAt: new Date().toISOString(),
        syncStatus: "synced",
      },
    };
  }

  const remoteTime = new Date(remote.updatedAt).getTime();
  const localTime = new Date(local.updatedAt).getTime();

  if (remoteTime > localTime) {
    return {
      outcome: "use_remote",
      trip: {
        ...remote,
        id: local.id,
        lastSyncedAt: new Date().toISOString(),
        syncStatus: "synced",
      },
      localId: local.id,
    };
  }

  if (localTime > remoteTime) {
    return {
      outcome: "use_local",
      trip: {
        ...local,
        syncStatus: "pending",
      },
      localId: local.id,
    };
  }

  return {
    outcome: "sync_metadata",
    trip: {
      ...local,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: "synced",
    },
    localId: local.id,
  };
}
