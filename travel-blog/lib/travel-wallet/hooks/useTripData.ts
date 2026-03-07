import { useState, useEffect, useCallback } from "react";
import { getTripBySlug, getTripBySlugAsync, getTripsIndex } from "@/lib/travel-wallet/trips-storage";
import { updateWalletRates } from "@/lib/travel-wallet/wallet-storage";
import type { Trip } from "@/lib/travel-wallet/types";
import { tripEvents } from "@/lib/travel-wallet/events";
import { useOnlineStatus } from "@/lib/travel-wallet/hooks/useOnlineStatus";

/**
 * Hook for loading and caching trip data with automatic refresh on changes
 * 
 * Features:
 * - Automatic caching in React state
 * - Automatic refresh on data changes via event system
 * - Optimized to avoid unnecessary re-renders
 * - Supports Supabase sync for logged-in users
 * 
 * @param slug - Trip slug to load
 * @returns Trip data, loading state, status oraz funkcja odświeżenia
 */
export function useTripData(slug: string) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<"loading" | "ready" | "offlineIndexOnly" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useOnlineStatus();

  // Cache trip data in React state to avoid repeated localStorage reads
  const loadTrip = useCallback(async () => {
    setIsLoading(true);
    setStatus("loading");
    setError(null);
    try {
      // Użyj async wersji która sprawdza Supabase dla zalogowanych użytkowników
      const foundTrip = await getTripBySlugAsync(slug);
      setTrip(foundTrip);
      if (foundTrip) {
        setStatus("ready");
        setIsLoading(false);
        return foundTrip;
      }

      // Brak pełnych danych podróży – sprawdź, czy istnieje wpis w indeksie.
      if (typeof window !== "undefined") {
        const index = getTripsIndex();
        const indexItem = index.find((item) => item.slug === slug);
        if (indexItem && !isOnline) {
          // Podróż istnieje w indeksie, ale nie mamy pełnych danych i jesteśmy offline.
          setTrip(null);
          setStatus("offlineIndexOnly");
          setIsLoading(false);
          return null;
        }
      }

      // Jeśli nie znaleziono nawet w indeksie (lub jesteśmy online a brak danych), traktuj jako błąd.
      setStatus("error");
      setIsLoading(false);
      return null;
    } catch (error) {
      console.error("[useTripData] Error loading trip:", error);
      setError(error instanceof Error ? error.message : String(error));
      // Fallback do localStorage
      const foundTrip = getTripBySlug(slug);
      setTrip(foundTrip);
      setStatus(foundTrip ? "ready" : "error");
      setIsLoading(false);
      return foundTrip;
    }
  }, [slug, isOnline]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  // Gdy online – odśwież kursy z API i zapisz w portfelu (na wypadek offline)
  useEffect(() => {
    if (!trip?.id || !trip?.data?.wallet || !isOnline) return;
    updateWalletRates(trip.id)
      .then((success) => {
        if (success) loadTrip();
      })
      .catch(() => {});
  }, [trip?.id, isOnline, loadTrip]);

  // Listen for trip data changes and refresh automatically
  useEffect(() => {
    if (!trip?.id) return;

    const handleTripUpdate = (updatedTripId: string) => {
      if (updatedTripId === trip.id) {
        loadTrip();
      }
    };

    // Subscribe to all relevant events
    const unsubscribeTripUpdated = tripEvents.on("trip:updated", handleTripUpdate);
    const unsubscribeExpenseAdded = tripEvents.on("expense:added", handleTripUpdate);
    const unsubscribeExpenseUpdated = tripEvents.on("expense:updated", handleTripUpdate);
    const unsubscribeExpenseDeleted = tripEvents.on("expense:deleted", handleTripUpdate);
    const unsubscribeTransactionAdded = tripEvents.on("currency_transaction:added", handleTripUpdate);
    const unsubscribeTransactionDeleted = tripEvents.on("currency_transaction:deleted", handleTripUpdate);
    const unsubscribeCountryAdded = tripEvents.on("country:added", handleTripUpdate);
    const unsubscribeCountryUpdated = tripEvents.on("country:updated", handleTripUpdate);
    const unsubscribeCountryDeleted = tripEvents.on("country:deleted", handleTripUpdate);
    const unsubscribeLocationAdded = tripEvents.on("location:added", handleTripUpdate);
    const unsubscribeLocationUpdated = tripEvents.on("location:updated", handleTripUpdate);
    const unsubscribeLocationDeleted = tripEvents.on("location:deleted", handleTripUpdate);
    const unsubscribeWalletUpdated = tripEvents.on("wallet:updated", handleTripUpdate);

    // Cleanup subscriptions
    return () => {
      unsubscribeTripUpdated();
      unsubscribeExpenseAdded();
      unsubscribeExpenseUpdated();
      unsubscribeExpenseDeleted();
      unsubscribeTransactionAdded();
      unsubscribeTransactionDeleted();
      unsubscribeCountryAdded();
      unsubscribeCountryUpdated();
      unsubscribeCountryDeleted();
      unsubscribeLocationAdded();
      unsubscribeLocationUpdated();
      unsubscribeLocationDeleted();
      unsubscribeWalletUpdated();
    };
  }, [trip?.id, loadTrip]);

  return { trip, isLoading, status, error, refreshTrip: loadTrip };
}
