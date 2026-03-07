/**
 * Czyszczenie danych portfela podróżniczego przy zmianie użytkownika.
 * Przy wylogowaniu NIE czyścimy localStorage (trips, wydatki) – użytkownik może pracować lokalnie.
 * Nie usuwa klucza travel-wallet-last-user-id (ustawiany przez AuthContext).
 */

const LAST_USER_ID_KEY = "travel-wallet-last-user-id";

const LOCAL_STORAGE_KEYS = [
  "travel-wallet-trips",
  "travel-wallet-data",
  "travel-wallet-migration-done",
  "travel-wallet-failed-delete-slugs",
  "travel-wallet-v4-migration-done",
  "travel-wallet-v2-migration-done",
  "travel-wallet-v3-migration-done",
  "travel-wallet-expenses-migrated",
  "travel-wallet-operation-queue",
  "travel-wallet-change-log",
  "travel-wallet-device-id",
  "travel-wallet-sync-metadata",
  "travel-wallet-exchange-rates-cache",
  "travel-wallet-expenses",
  "pending_trip_data",
  // Nowy model: indeks podróży oraz aktywna podróż z pełnymi danymi
  "travel-wallet-trips-index",
  "travel-wallet-active-trip",
] as const;

const LOCAL_STORAGE_PREFIXES = [
  "travel-wallet-last-sync-",
  "travel-wallet-expenses-",
  "travel-wallet-activity-logs-",
] as const;

const SESSION_STORAGE_KEYS = [
  "travel-wallet-user-cache",
  "travel-wallet-pending-conflicts",
] as const;

export function getLastSignedInUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LAST_USER_ID_KEY);
  } catch {
    return null;
  }
}

export function setLastSignedInUserId(userId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (userId === null) {
      localStorage.removeItem(LAST_USER_ID_KEY);
    } else {
      localStorage.setItem(LAST_USER_ID_KEY, userId);
    }
  } catch {
    // ignore
  }
}

/**
 * Usuwa tylko dane sesji portfela (sessionStorage) – cache użytkownika itd.
 * Używane przy wylogowaniu: localStorage (trips, wydatki) zostaje, żeby można było pracować lokalnie.
 */
export function clearTravelWalletSessionOnly(): void {
  if (typeof window === "undefined") return;
  try {
    SESSION_STORAGE_KEYS.forEach((key) => sessionStorage.removeItem(key));
  } catch (error) {
    console.error("[clearTravelWalletSessionOnly] Error clearing session:", error);
  }
}

/**
 * Usuwa wszystkie dane portfela z localStorage i sessionStorage.
 * Używane przy zmianie użytkownika (inny login) oraz przy „Usuń dane z tego urządzenia”.
 * Nie usuwa travel-wallet-last-user-id (ustawiany przez AuthContext po zalogowaniu).
 * Na końcu dispatchuje event portfel-trips-updated, żeby UI odświeżył listę podróży.
 */
export function clearTravelWalletStorage(): void {
  if (typeof window === "undefined") return;
  try {
    LOCAL_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    LOCAL_STORAGE_PREFIXES.forEach((prefix) => {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(prefix)) localStorage.removeItem(key);
      });
    });
    SESSION_STORAGE_KEYS.forEach((key) => sessionStorage.removeItem(key));
    window.dispatchEvent(new CustomEvent("portfel-trips-updated"));
  } catch (error) {
    console.error("[clearTravelWalletStorage] Error clearing storage:", error);
  }
}
