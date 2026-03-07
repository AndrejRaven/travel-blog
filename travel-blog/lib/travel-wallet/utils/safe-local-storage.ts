/**
 * Wspólne helpery do bezpiecznego zapisu w localStorage
 * z obsługą QuotaExceededError oraz opcjonalnym tostem dla użytkownika.
 */

export const STORAGE_QUOTA_EVENT = "travel-wallet:storage-quota-exceeded";

/**
 * Bezpieczne zapisanie wartości w localStorage z obsługą QuotaExceededError.
 * Zwraca true, jeśli zapis się powiódł, w przeciwnym razie false.
 *
 * Dodatkowo:
 * - loguje błąd do konsoli
 * - jeśli dostępny jest globalny window.addToast, pokazuje użytkownikowi komunikat
 */
export function safeSetLocalStorageItem(key: string, value: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.error(
        "[travel-wallet] localStorage quota exceeded while saving key:",
        key
      );

      try {
        // Event do ewentualnych nasłuchiwaczy
        window.dispatchEvent(
          new CustomEvent(STORAGE_QUOTA_EVENT, { detail: { key } })
        );
      } catch {
        // ignoruj problemy z eventami
      }

      try {
        type AddToastFunction = (toast: {
          type: "error" | "warning" | "info" | "success" | "rate-limit";
          title: string;
          message?: string;
          duration?: number;
        }) => void;

        const win = window as Window & { addToast?: AddToastFunction };
        if (typeof win.addToast === "function") {
          win.addToast({
            type: "error",
            title: "Brak miejsca na dane podróży",
            message:
              "Na tym urządzeniu zabrakło miejsca na zapis danych portfela podróży. Usuń część lokalnych danych lub podróży, aby zwolnić miejsce.",
            duration: 8000,
          });
        }
      } catch {
        // jeśli toast się nie uda, to i tak nic więcej nie zrobimy
      }

      return false;
    }

    console.error(
      "[travel-wallet] Error saving to localStorage key:",
      key,
      error
    );
    return false;
  }
}

