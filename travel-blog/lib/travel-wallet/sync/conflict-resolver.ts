/**
 * Conflict Resolver
 * 
 * Wykrywa i rozwiązuje konflikty synchronizacji:
 * - Wykrywanie konfliktów (ta sama encja zmieniona lokalnie i zdalnie)
 * - Strategie rozwiązywania:
 *   - Last-write-wins (domyślna)
 *   - Manual resolution (dla krytycznych danych)
 *   - Merge strategy (gdzie możliwe)
 */

import type {
  SyncConflict,
  ConflictResolutionStrategy,
  ConflictResolutionRequest,
} from "./types";
import type { EntityType } from "../offline/operation-queue";

/**
 * Wykrywa konflikty między lokalnymi i zdalnymi zmianami
 */
export function detectConflicts(
  localOperations: Array<{ entityId: string; entityType: EntityType; timestamp: string; version?: number }>,
  remoteOperations: Array<{ entityId: string; entityType: EntityType; timestamp: string; version?: number }>
): SyncConflict[] {
  const conflicts: SyncConflict[] = [];

  // Grupuj operacje po entityId i entityType
  const localMap = new Map<string, typeof localOperations[0]>();
  localOperations.forEach((op) => {
    const key = `${op.entityType}:${op.entityId}`;
    const existing = localMap.get(key);
    if (!existing || new Date(op.timestamp) > new Date(existing.timestamp)) {
      localMap.set(key, op);
    }
  });

  const remoteMap = new Map<string, typeof remoteOperations[0]>();
  remoteOperations.forEach((op) => {
    const key = `${op.entityType}:${op.entityId}`;
    const existing = remoteMap.get(key);
    if (!existing || new Date(op.timestamp) > new Date(existing.timestamp)) {
      remoteMap.set(key, op);
    }
  });

  // Sprawdź konflikty
  for (const [key, localOp] of localMap.entries()) {
    const remoteOp = remoteMap.get(key);
    
    if (remoteOp) {
      // Ta sama encja została zmieniona lokalnie i zdalnie
      // Sprawdź czy to rzeczywiście konflikt (różne wersje lub różne timestamps)
      const isConflict =
        (localOp.version !== undefined && remoteOp.version !== undefined &&
          localOp.version !== remoteOp.version) ||
        (localOp.timestamp !== remoteOp.timestamp);

      if (isConflict) {
        conflicts.push({
          id: `conflict-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          entityType: localOp.entityType,
          entityId: localOp.entityId,
          localVersion: localOp.version || 0,
          remoteVersion: remoteOp.version || 0,
          localData: localOp as unknown,
          remoteData: remoteOp as unknown,
          localTimestamp: localOp.timestamp,
          remoteTimestamp: remoteOp.timestamp,
          deviceId: "local", // TODO: Pobierz z change tracker
        });
      }
    }
  }

  return conflicts;
}

/**
 * Rozwiązuje konflikt używając strategii last-write-wins
 */
export function resolveConflictLastWriteWins(
  conflict: SyncConflict
): "local" | "remote" {
  const localTime = new Date(conflict.localTimestamp).getTime();
  const remoteTime = new Date(conflict.remoteTimestamp).getTime();

  // Ostatnia zmiana wygrywa
  return localTime > remoteTime ? "local" : "remote";
}

/**
 * Próbuje automatycznie scalić konflikt (gdzie możliwe)
 * 
 * @returns zmergowane dane lub null jeśli merge nie jest możliwy
 */
export function tryMergeConflict(
  conflict: SyncConflict
): unknown | null {
  // Dla większości encji merge nie jest możliwy automatycznie
  // Można dodać specjalną logikę dla konkretnych typów encji
  
  // Na razie zwracamy null - merge wymaga ręcznego rozwiązania
  return null;
}

/**
 * Rozwiązuje konflikt zgodnie z wybraną strategią
 */
export function resolveConflict(
  conflict: SyncConflict,
  strategy: ConflictResolutionStrategy,
  manualResolution?: "local" | "remote" | "merge",
  mergedData?: unknown
): {
  resolution: "local" | "remote" | "merge";
  data: unknown;
} {
  switch (strategy) {
    case "last-write-wins":
      const winner = resolveConflictLastWriteWins(conflict);
      return {
        resolution: winner,
        data: winner === "local" ? conflict.localData : conflict.remoteData,
      };

    case "manual":
      if (!manualResolution) {
        throw new Error(
          "Manual resolution requires manualResolution parameter"
        );
      }

      if (manualResolution === "merge") {
        if (!mergedData) {
          throw new Error("Merge resolution requires mergedData parameter");
        }
        return {
          resolution: "merge",
          data: mergedData,
        };
      }

      return {
        resolution: manualResolution,
        data:
          manualResolution === "local"
            ? conflict.localData
            : conflict.remoteData,
      };

    case "merge":
      const merged = tryMergeConflict(conflict);
      if (merged) {
        return {
          resolution: "merge",
          data: merged,
        };
      }
      // Fallback do last-write-wins jeśli merge nie jest możliwy
      const fallback = resolveConflictLastWriteWins(conflict);
      return {
        resolution: fallback,
        data: fallback === "local" ? conflict.localData : conflict.remoteData,
      };

    default:
      throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
  }
}

/**
 * Waliduje request rozwiązania konfliktu
 */
export function validateConflictResolution(
  request: ConflictResolutionRequest,
  conflict: SyncConflict
): { valid: boolean; error?: string } {
  if (request.conflictId !== conflict.id) {
    return {
      valid: false,
      error: "Conflict ID mismatch",
    };
  }

  if (request.resolution === "merge" && !request.mergedData) {
    return {
      valid: false,
      error: "Merge resolution requires mergedData",
    };
  }

  return { valid: true };
}
