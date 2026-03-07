"use client";

import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { syncTrips } from "@/lib/travel-wallet/sync/trip-sync-manager";
import { getAllTrips } from "@/lib/travel-wallet/trips-storage";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";

interface SyncStatusProps {
  className?: string;
}

export default function SyncStatus({ className = "" }: SyncStatusProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Sprawdź czy użytkownik jest zalogowany
    getCurrentUser()
      .then(user => setIsAuthenticated(!!user))
      .catch(() => setIsAuthenticated(false));

    // Aktualizuj status co 10 sekund
    const updateStatus = () => {
      const trips = getAllTrips();
      const pending = trips.filter(t => t.syncStatus === 'pending').length;
      const errors = trips.filter(t => t.syncStatus === 'error').length;
      
      // Znajdź najnowszą lastSyncedAt
      const syncedTrips = trips.filter(t => t.lastSyncedAt);
      const latestSync = syncedTrips.length > 0
        ? syncedTrips.reduce((latest, trip) => {
            const tripTime = new Date(trip.lastSyncedAt!).getTime();
            const latestTime = latest ? new Date(latest).getTime() : 0;
            return tripTime > latestTime ? trip.lastSyncedAt! : latest;
          }, null as string | null)
        : null;
      
      setPendingCount(pending);
      setErrorCount(errors);
      setLastSyncTime(latestSync);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 10000); // Co 10 sekund

    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      await syncTrips();
      // Odśwież status po synchronizacji
      setTimeout(() => {
        const trips = getAllTrips();
        const pending = trips.filter(t => t.syncStatus === 'pending').length;
        const errors = trips.filter(t => t.syncStatus === 'error').length;
        setPendingCount(pending);
        setErrorCount(errors);
      }, 500);
    } catch (error) {
      console.error("[SyncStatus] Manual sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Nie pokazuj statusu sync dla niezalogowanych użytkowników
  }

  const formatLastSync = (timestamp: string | null): string => {
    if (!timestamp) return "Nigdy";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Teraz";
    if (diffMins < 60) return `${diffMins} min temu`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} godz. temu`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dni temu`;
  };

  const getStatusColor = (): string => {
    if (errorCount > 0) return "text-red-600 dark:text-red-400";
    if (pendingCount > 0) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const getStatusIcon = () => {
    if (isSyncing) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    if (errorCount > 0) {
      return <AlertCircle className="w-4 h-4" />;
    }
    if (pendingCount > 0) {
      return <RefreshCw className="w-4 h-4" />;
    }
    return <CheckCircle2 className="w-4 h-4" />;
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <button
        onClick={handleManualSync}
        disabled={isSyncing}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
          isSyncing
            ? "bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
            : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        }`}
        title="Synchronizuj ręcznie"
      >
        {getStatusIcon()}
        <span className="hidden sm:inline">
          {isSyncing
            ? "Synchronizowanie..."
            : pendingCount > 0
            ? `${pendingCount} oczekujących`
            : errorCount > 0
            ? `${errorCount} błędów`
            : "Zsynchronizowane"}
        </span>
      </button>
      
      {lastSyncTime && (
        <span className={`text-xs ${getStatusColor()}`}>
          {formatLastSync(lastSyncTime)}
        </span>
      )}
    </div>
  );
}
