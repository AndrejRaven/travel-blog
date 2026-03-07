/**
 * Queue Manager
 * 
 * Zarządza kolejką operacji offline:
 * - Dodawanie operacji do queue
 * - Przetwarzanie operacji w batch
 * - Error handling i retry logic
 * - Progress tracking
 */

import {
  SyncOperation,
  getOperationQueue,
  removeOperationFromQueue,
  incrementRetryCount,
  setOperationError,
  hasExceededMaxRetries,
  removeFailedOperations,
  getQueueSize,
  clearOperationQueue,
} from "./operation-queue";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

export interface QueueProcessor {
  /**
   * Przetwarza operację synchronizacji
   * @param operation - operacja do przetworzenia
   * @returns true jeśli operacja została pomyślnie przetworzona
   */
  processOperation(operation: SyncOperation): Promise<boolean>;
}

export interface QueueManagerOptions {
  /**
   * Maksymalna liczba operacji przetwarzanych jednocześnie
   */
  batchSize?: number;
  /**
   * Czas oczekiwania między batchami (ms)
   */
  batchDelay?: number;
  /**
   * Callback wywoływany po przetworzeniu operacji
   */
  onOperationProcessed?: (operation: SyncOperation, success: boolean) => void;
  /**
   * Callback wywoływany po zakończeniu przetwarzania batcha
   */
  onBatchProcessed?: (processed: number, failed: number) => void;
}

/**
 * Przetwarza kolejkę operacji w batchach
 */
export async function processQueue(
  processor: QueueProcessor,
  options: QueueManagerOptions = {}
): Promise<{
  processed: number;
  failed: number;
  remaining: number;
}> {
  const {
    batchSize = 5,
    batchDelay = 1000,
    onOperationProcessed,
    onBatchProcessed,
  } = options;

  let processed = 0;
  let failed = 0;
  const queue = getOperationQueue();

  if (queue.length === 0) {
    return { processed: 0, failed: 0, remaining: 0 };
  }

  // Usuń operacje które przekroczyły maksymalną liczbę prób
  removeFailedOperations();

  // Przetwarzaj operacje w batchach
  for (let i = 0; i < queue.length; i += batchSize) {
    const batch = queue.slice(i, i + batchSize);
    let batchProcessed = 0;
    let batchFailed = 0;

    // Przetwarzaj operacje w batchu równolegle
    const results = await Promise.allSettled(
      batch.map(async (operation) => {
        try {
          const success = await processor.processOperation(operation);

          if (success) {
            removeOperationFromQueue(operation.id);
            batchProcessed++;
            onOperationProcessed?.(operation, true);
            return { operation, success: true };
          } else {
            incrementRetryCount(operation.id);
            batchFailed++;
            onOperationProcessed?.(operation, false);
            return { operation, success: false };
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          setOperationError(operation.id, errorMessage);
          incrementRetryCount(operation.id);

          if (hasExceededMaxRetries(operation.id)) {
            batchFailed++;
            onOperationProcessed?.(operation, false);
          }

          return { operation, success: false };
        }
      })
    );

    // Zlicz wyniki
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        if (result.value.success) {
          processed++;
        } else {
          failed++;
        }
      } else {
        failed++;
      }
    });

    onBatchProcessed?.(batchProcessed, batchFailed);

    // Opóźnienie między batchami (oprócz ostatniego)
    if (i + batchSize < queue.length) {
      await new Promise((resolve) => setTimeout(resolve, batchDelay));
    }
  }

  return {
    processed,
    failed,
    remaining: getQueueSize(),
  };
}

/**
 * Hook do zarządzania kolejką operacji
 */
export function useQueueManager() {
  const { isOnline } = useOnlineStatus();

  return {
    /**
     * Przetwarza kolejkę operacji
     */
    processQueue: async (
      processor: QueueProcessor,
      options?: QueueManagerOptions
    ) => {
      if (!isOnline) {
        console.warn("[QueueManager] Cannot process queue - offline");
        return { processed: 0, failed: 0, remaining: getQueueSize() };
      }

      return processQueue(processor, options);
    },
    /**
     * Pobiera rozmiar kolejki
     */
    getQueueSize,
    /**
     * Czyści kolejkę operacji
     */
    clearQueue: clearOperationQueue,
    /**
     * Sprawdza czy jest online
     */
    isOnline,
  };
}

/**
 * Automatycznie przetwarza kolejkę gdy aplikacja wraca online
 */
export function setupAutoProcessQueue(
  processor: QueueProcessor,
  options?: QueueManagerOptions
): () => void {
  if (typeof window === "undefined") {
    return () => { }; // No-op dla SSR
  }

  const handleOnline = async () => {
    const queueSize = getQueueSize();

    if (queueSize > 0) {
      await processQueue(processor, options);
    }
  };

  window.addEventListener("online", handleOnline);

  // Cleanup function
  return () => {
    window.removeEventListener("online", handleOnline);
  };
}
