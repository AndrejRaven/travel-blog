const ONBOARDING_STORAGE_KEY = "wallet_onboarding_seen";

export function getOnboardingSeen(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1";
}

export function setOnboardingSeen(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
}

const TRIP_ONBOARDING_PREFIX = "trip_onboarding_seen_";

export function getTripOnboardingSeen(tripId: string): boolean {
  if (typeof window === "undefined" || !tripId) return false;
  return localStorage.getItem(TRIP_ONBOARDING_PREFIX + tripId) === "1";
}

export function setTripOnboardingSeen(tripId: string): void {
  if (typeof window === "undefined" || !tripId) return;
  localStorage.setItem(TRIP_ONBOARDING_PREFIX + tripId, "1");
}
