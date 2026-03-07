"use client";

import { useEffect, useState } from "react";
import { useOnlineStatus } from "@/lib/travel-wallet/hooks/useOnlineStatus";
import { getQueueSize } from "@/lib/travel-wallet/offline/operation-queue";
import { Wifi, WifiOff } from "lucide-react";

interface OfflineIndicatorProps {
  /**
   * Liczba operacji oczekujących w queue (opcjonalne)
   * Jeśli nie podano, pobiera automatycznie z queue
   */
  pendingOperationsCount?: number;
  /**
   * Klasa CSS dla kontenera
   */
  className?: string;
}

/**
 * Komponent wyświetlający status online/offline
 * Pokazuje badge z liczbą operacji oczekujących w queue (jeśli dostępne)
 */
export default function OfflineIndicator({
  pendingOperationsCount: externalCount,
  className = "",
}: OfflineIndicatorProps) {
  const { isOnline, isOffline } = useOnlineStatus();
  const [pendingOperationsCount, setPendingOperationsCount] = useState(
    externalCount ?? 0
  );

  // Aktualizuj queue size jeśli nie podano zewnętrznie
  useEffect(() => {
    if (externalCount !== undefined) {
      setPendingOperationsCount(externalCount);
      return;
    }

    // Pobierz początkowy rozmiar queue
    setPendingOperationsCount(getQueueSize());

    // Aktualizuj co sekundę
    const interval = setInterval(() => {
      setPendingOperationsCount(getQueueSize());
    }, 1000);

    return () => clearInterval(interval);
  }, [externalCount]);

  if (isOnline && pendingOperationsCount === 0) {
    // Ukryj gdy online i brak oczekujących operacji
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
        isOffline
          ? "bg-yellow-500 dark:bg-yellow-600 text-white"
          : "bg-blue-500 dark:bg-blue-600 text-white"
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      {isOffline ? (
        <>
          <WifiOff className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-medium">Tryb offline</span>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-medium">Online</span>
        </>
      )}
      {pendingOperationsCount > 0 && (
        <span className="ml-2 px-2 py-0.5 bg-white/20 dark:bg-black/20 rounded-full text-xs font-semibold">
          {pendingOperationsCount}
        </span>
      )}
    </div>
  );
}
