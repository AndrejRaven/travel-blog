"use client";

import { safeSetLocalStorageItem } from "./utils/safe-local-storage";

const PENDING_TRIP_KEY = 'pending_trip_data';

export interface PendingTripData {
  name: string;
  startDate?: string;
  endDate?: string;
  /** @deprecated Use baseCurrency + initialBudgets */
  totalBudget?: number;
  baseCurrency?: string;
  initialBudgets?: Array<{ currency: string; amount: number }>;
  userName?: string;
  dashboardMode?: "multi-country" | "single-country" | "single-location" | "auto";
  timestamp: number;
}

/**
 * Zapisuje dane podróży do localStorage (gdy limit jest przekroczony)
 */
export function savePendingTrip(tripData: Omit<PendingTripData, 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const data: PendingTripData = {
      ...tripData,
      timestamp: Date.now(),
    };

    safeSetLocalStorageItem(PENDING_TRIP_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[PendingTripStorage] Error saving pending trip:', error);
  }
}

/**
 * Pobiera zapisane dane podróży z localStorage
 */
export function getPendingTrip(): PendingTripData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(PENDING_TRIP_KEY);
    if (!cached) return null;
    
    const data: PendingTripData = JSON.parse(cached);
    return data;
  } catch (error) {
    console.error('[PendingTripStorage] Error reading pending trip:', error);
    return null;
  }
}

/**
 * Czyści zapisane dane podróży
 */
export function clearPendingTrip(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(PENDING_TRIP_KEY);
  } catch (error) {
    console.error('[PendingTripStorage] Error clearing pending trip:', error);
  }
}
