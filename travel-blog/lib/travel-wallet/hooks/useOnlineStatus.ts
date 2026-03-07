"use client";

import { useState, useEffect } from "react";

/**
 * Hook do wykrywania statusu online/offline
 * 
 * Używa browser API do wykrywania statusu połączenia sieciowego
 * i automatycznie aktualizuje state przy zmianie statusu.
 * 
 * @returns Object z statusem online/offline i funkcjami pomocniczymi
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    // Sprawdź początkowy status tylko w przeglądarce
    if (typeof window === "undefined") {
      return true; // Domyślnie online dla SSR
    }
    return navigator.onLine ?? true;
  });

  useEffect(() => {
    // Ustaw początkowy status
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine ?? true);
    }

    // Event listeners dla zmian statusu
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Dodaj event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}
