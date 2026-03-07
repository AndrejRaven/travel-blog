"use client";

import { useState } from "react";
import { X, AlertTriangle, CheckCircle2, GitMerge } from "lucide-react";
import type { SyncConflict } from "@/lib/travel-wallet/sync/types";
import { resolveConflict } from "@/lib/travel-wallet/sync/sync-manager";

interface ConflictResolverProps {
  conflict: SyncConflict;
  onResolve: (conflictId: string, resolution: "local" | "remote" | "merge") => void;
  onClose: () => void;
}

/**
 * Komponent do rozwiązywania konfliktów synchronizacji
 */
export default function ConflictResolver({
  conflict,
  onResolve,
  onClose,
}: ConflictResolverProps) {
  const [selectedResolution, setSelectedResolution] = useState<"local" | "remote" | "merge" | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async (resolution: "local" | "remote" | "merge") => {
    setIsResolving(true);
    try {
      await resolveConflict(conflict, resolution);
      onResolve(conflict.id, resolution);
      onClose();
    } catch (error) {
      console.error("Error resolving conflict:", error);
    } finally {
      setIsResolving(false);
    }
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEntityTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      trip: "Podróż",
      expense: "Wydatek",
      exchange: "Wymiana walut",
      country: "Kraj",
      budget_adjustment: "Korekta budżetu",
    };
    return labels[type] || type;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Konflikt synchronizacji
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Conflict Info */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Ta sama {getEntityTypeLabel(conflict.entityType)} została zmieniona lokalnie i zdalnie.
              Wybierz wersję do zachowania.
            </p>
          </div>

          {/* Local Version */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Wersja lokalna
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(conflict.localTimestamp)}
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm text-gray-700 dark:text-gray-300 font-mono overflow-x-auto">
              <pre>{JSON.stringify(conflict.localData, null, 2)}</pre>
            </div>
            <button
              onClick={() => handleResolve("local")}
              disabled={isResolving}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Zachowaj lokalną wersję</span>
            </button>
          </div>

          {/* Remote Version */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Wersja zdalna
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(conflict.remoteTimestamp)}
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm text-gray-700 dark:text-gray-300 font-mono overflow-x-auto">
              <pre>{JSON.stringify(conflict.remoteData, null, 2)}</pre>
            </div>
            <button
              onClick={() => handleResolve("remote")}
              disabled={isResolving}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Zachowaj zdalną wersję</span>
            </button>
          </div>

          {/* Merge Option (disabled for now) */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 opacity-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Scal obie wersje
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">Niedostępne</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Automatyczne scalanie nie jest jeszcze dostępne dla tego typu danych.
            </p>
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
            >
              <GitMerge className="w-4 h-4" />
              <span>Scal wersje</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
