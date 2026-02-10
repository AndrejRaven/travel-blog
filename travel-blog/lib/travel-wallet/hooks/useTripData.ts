import { useState, useEffect, useCallback } from "react";
import { getTripBySlug } from "@/lib/travel-wallet/trips-storage";
import type { Trip } from "@/lib/travel-wallet/types";

/**
 * Hook for loading and caching trip data
 * @param slug - Trip slug to load
 * @returns Trip data, loading state, and refresh function
 */
export function useTripData(slug: string) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadTrip = useCallback(() => {
    const foundTrip = getTripBySlug(slug);
    setTrip(foundTrip);
    setIsLoading(false);
    return foundTrip;
  }, [slug]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  return { trip, isLoading, refreshTrip: loadTrip };
}
