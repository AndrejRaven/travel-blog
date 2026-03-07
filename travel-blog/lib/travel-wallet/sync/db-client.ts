/**
 * Database Client
 * 
 * Abstrakcja dla komunikacji z bazą danych:
 * - API endpoints dla CRUD operacji
 * - Batch operations support
 * - Error handling i retry
 */

import type {
  SyncPullRequest,
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
  ConflictResolutionRequest,
  ConflictResolutionResponse,
} from "./types";

const API_BASE_URL = "/api/travel-wallet/sync";

/**
 * Błąd komunikacji z API
 */
export class SyncAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = "SyncAPIError";
  }
}

/**
 * Wykonuje request do API z retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Jeśli sukces lub błąd klienta (4xx), nie retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Błąd serwera (5xx) - retry
      lastError = new Error(`Server error: ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    // Exponential backoff
    if (attempt < maxRetries - 1) {
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Unknown error");
}

/**
 * Pull changes z serwera
 */
export async function pullChanges(
  request: SyncPullRequest
): Promise<SyncPullResponse> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/pull`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new SyncAPIError(
        `Failed to pull changes: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data: SyncPullResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof SyncAPIError) {
      throw error;
    }

    throw new SyncAPIError(
      `Network error while pulling changes: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Push changes do serwera
 */
export async function pushChanges(
  request: SyncPushRequest
): Promise<SyncPushResponse> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new SyncAPIError(
        `Failed to push changes: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data: SyncPushResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof SyncAPIError) {
      throw error;
    }

    throw new SyncAPIError(
      `Network error while pushing changes: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Rozwiązuje konflikt
 */
export async function resolveConflict(
  request: ConflictResolutionRequest
): Promise<ConflictResolutionResponse> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/resolve-conflict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new SyncAPIError(
        `Failed to resolve conflict: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data: ConflictResolutionResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof SyncAPIError) {
      throw error;
    }

    throw new SyncAPIError(
      `Network error while resolving conflict: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Sprawdza status synchronizacji na serwerze
 */
export async function getSyncStatus(): Promise<{
  lastSyncAt: string | null;
  serverVersion: number;
  pendingConflicts: number;
}> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new SyncAPIError(
        `Failed to get sync status: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof SyncAPIError) {
      throw error;
    }

    throw new SyncAPIError(
      `Network error while getting sync status: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
