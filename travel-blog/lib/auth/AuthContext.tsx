"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { getUserProfile } from "@/lib/supabase/auth-helpers";
import {
  saveAuthToCache,
  getAuthFromCache,
  clearAuthCache,
  isAuthCacheValid,
} from "./auth-cache";
import { detectOnlineStatus, syncAuthOnOnline } from "./online-sync";
import {
  getLastSignedInUserId,
  setLastSignedInUserId,
  clearTravelWalletStorage,
  clearTravelWalletSessionOnly,
} from "@/lib/travel-wallet/clear-on-user-switch";

// Debug helper: log wszystkie requesty związane z Supabase/Auth,
// żeby łatwiej było zobaczyć czy signOut faktycznie wysyła zapytanie.
if (typeof window !== "undefined") {
  const w = window as any;
  if (!w.__supabaseFetchLogged) {
    w.__supabaseFetchLogged = true;
    const originalFetch: typeof window.fetch = window.fetch.bind(window);
    window.fetch = ((...args: Parameters<typeof window.fetch>) => {
      const url =
        typeof args[0] === "string"
          ? args[0]
          : (args[0] && (args[0] as Request).url) || "";

      if (url && (url.includes("supabase") || url.includes("/auth/"))) {
        console.log("[fetch] Auth-related request:", url);
      }

      return originalFetch(...args);
    }) as typeof window.fetch;
  }
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: "free" | "premium";
  subscription_status: "active" | "canceled" | "past_due";
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isOnline: boolean;
  signOut: () => Promise<{
    ok: boolean;
    reason?: "timeout" | "error";
    error?: unknown;
  }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook do użycia AuthContext
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Provider dla AuthContext
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  /**
   * Pobiera profil użytkownika (bez zbędnego getUser – email z przekazanego user).
   */
  const loadProfile = useCallback(async (user: User) => {
    try {
      const userEmail = user.email || "";
      const userProfile = await getUserProfile(user.id);
      if (userProfile) {
        setProfile({
          id: userProfile.id,
          email: userEmail,
          full_name: userProfile.full_name,
          avatar_url: userProfile.avatar_url,
          subscription_tier: userProfile.subscription_tier || "free",
          subscription_status: userProfile.subscription_status || "active",
        });
      } else {
        setProfile({
          id: user.id,
          email: userEmail,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: null,
          subscription_tier: "free",
          subscription_status: "active",
        });
      }
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === "AbortError" ||
          error.message?.includes("signal is aborted"))
      ) {
        return;
      }
      console.error("Error loading user profile:", error);
      setProfile(null);
    }
  }, []);

  /**
   * Odświeża profil użytkownika
   */
  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user);
    }
  }, [user, loadProfile]);

  /**
   * Po udanym zalogowaniu przypisz podróże gościa do konta (premium)
   * lub pozostaw je lokalne-only (free). Działa tylko przy pierwszym
   * logowaniu na tym urządzeniu (lastUserId === null).
   */
  const attachGuestTripsOnFirstLogin = useCallback(
    async (signedInUser: User, tier: UserProfile["subscription_tier"]) => {
      try {
        // Działa tylko przy pierwszym logowaniu – jeśli wcześniej był inny user, storage już został wyczyszczony.
        const lastId = getLastSignedInUserId();
        if (lastId !== null) {
          return;
        }

        const { getTripsDataFromStorage, saveTripsDataAndSyncDerived } =
          await import("@/lib/travel-wallet/trips-storage");
        const tripsData = getTripsDataFromStorage();

        if (!tripsData.trips.length) {
          return;
        }

        // Podróże gościa: brak ownerUserId.
        const guestTrips = tripsData.trips.filter((t) => t.ownerUserId == null);
        if (!guestTrips.length) {
          return;
        }

        if (tier === "premium") {
          // Premium: przypisz wszystkie podróże gościa do tego konta i oznacz do syncu.
          const now = new Date().toISOString();
          tripsData.trips = tripsData.trips.map((trip) =>
            trip.ownerUserId == null
              ? {
                  ...trip,
                  ownerUserId: signedInUser.id,
                  syncStatus: "pending" as const,
                  updatedAt: now,
                }
              : trip,
          );
          saveTripsDataAndSyncDerived(tripsData);

          // Push w tle – bez blokowania UI.
          const { pushChangesToSupabase } = await import(
            "@/lib/travel-wallet/sync/trip-sync-manager"
          );
          pushChangesToSupabase(signedInUser.id).catch((error) => {
            console.error(
              "[AuthContext] Error pushing guest trips after premium login:",
              error,
            );
          });
        } else {
          // Free: pozostaw podróże jako lokalne-only (ownerUserId nadal null).
          // Nie trzeba nic zmieniać w strukturze, sync je zignoruje dzięki warunkowi w pushChangesToSupabase.
          return;
        }
      } catch (error) {
        console.error(
          "[AuthContext] Error attaching guest trips on first login:",
          error,
        );
      }
    },
    [],
  );

  /**
   * Wylogowanie – zwraca status powodzenia/niepowodzenia.
   * Przy timeout/błędzie NIE czyści lokalnego stanu – UI pozostaje zalogowany,
   * żeby nie udawać wylogowania gdy Supabase nie zadziałał.
   */
  const signOut = useCallback(async (): Promise<{
    ok: boolean;
    reason?: "timeout" | "error";
    error?: unknown;
  }> => {
    console.log("[AuthContext] signOut called");
    const start = Date.now();
    const timeoutMs = 5000;

    try {
      console.log("[AuthContext] Calling supabase.auth.signOut() now");
      const signOutPromise = supabase.auth.signOut();

      const result = await Promise.race<"ok" | "timeout">([
        signOutPromise
          .then(() => "ok" as const)
          .catch((error) => {
            // Rzuć dalej, żeby trafiło do catch niżej
            throw error;
          }),
        new Promise<"timeout">((resolve) =>
          setTimeout(() => resolve("timeout"), timeoutMs),
        ),
      ]);

      const duration = Date.now() - start;
      if (result === "ok") {
        console.log(
          "[AuthContext] supabase.auth.signOut resolved in",
          duration,
          "ms",
        );
        // Lokalny stan zostanie doczyszczony również przez onAuthStateChange (event SIGNED_OUT),
        // ale czyścimy też tutaj, żeby UI zareagował natychmiast.
        clearAuthCache();
        setUser(null);
        setProfile(null);
        return { ok: true };
      }

      console.warn(
        "[AuthContext] supabase.auth.signOut timeout after",
        timeoutMs,
        "ms – nie czyści lokalnego stanu",
      );
      return { ok: false, reason: "timeout" };
    } catch (error) {
      console.error("[AuthContext] Error signing out:", error);
      return { ok: false, reason: "error", error };
    }
  }, []);

  useEffect(() => {
    // Ustaw mounted flag aby uniknąć hydration mismatch
    setMounted(true);

    // Sprawdź status online/offline
    setIsOnline(detectOnlineStatus());

    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;
    let loadingTimeoutId: NodeJS.Timeout | null = null;

    // Najpierw sprawdź cache (natychmiast)
    const cached = getAuthFromCache();
    if (cached && isAuthCacheValid(cached)) {
      setUser(cached.user);
      setProfile(cached.profile);
      setLoading(false);
    }

    // Opóźnij inicjalizację Supabase do momentu gdy komponent jest zamontowany
    // To pomaga uniknąć AbortError podczas szybkiego unmount/remount
    const initAuth = async () => {
      // Jeśli offline, użyj tylko cache
      if (!detectOnlineStatus()) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        // Timeout dla operacji getSession (2.5 s – szybsze fallback na cache)
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          loadingTimeoutId = setTimeout(() => {
            reject(new Error("Session timeout"));
          }, 2500);
        });

        const {
          data: { session },
          error,
        } = (await Promise.race([sessionPromise, timeoutPromise])) as {
          data: { session: Session | null };
          error: AuthError | null;
        };

        if (loadingTimeoutId) {
          clearTimeout(loadingTimeoutId);
          loadingTimeoutId = null;
        }

        if (!isMounted) return;

        if (error) {
          // Ignoruj AbortError (przerwane żądania podczas unmount)
          if (
            error.name === "AbortError" ||
            error.message?.includes("signal is aborted")
          ) {
            setLoading(false);
            return;
          }
          console.error("[AuthContext] Error getting session:", error);
          // Użyj cache jeśli dostępny
          if (cached && isAuthCacheValid(cached)) {
            setUser(cached.user);
            setProfile(cached.profile);
          }
          setLoading(false);
          return;
        }

        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          saveAuthToCache(session.user, null);
          loadProfile(session.user).catch(() => {});
        } else {
          if (cached) {
            clearAuthCache();
          }
        }
      } catch (error) {
        // Obsłuż błędy które mogą wystąpić podczas getSession
        if (loadingTimeoutId) {
          clearTimeout(loadingTimeoutId);
          loadingTimeoutId = null;
        }

        if (!isMounted) return;

        // Timeout lub błąd - użyj cache jeśli dostępny
        if (error instanceof Error && error.message === "Session timeout") {
          console.warn("[AuthContext] Session loading timeout, using cache");
          if (cached && isAuthCacheValid(cached)) {
            setUser(cached.user);
            setProfile(cached.profile);
          }
        } else if (
          error instanceof Error &&
          (error.name === "AbortError" ||
            error.message?.includes("signal is aborted"))
        ) {
          // Ignoruj AbortError
          if (isMounted) {
            setLoading(false);
          }
          return;
        } else {
          console.error("[AuthContext] Error in getSession:", error);
          // Użyj cache jeśli dostępny
          if (cached && isAuthCacheValid(cached)) {
            setUser(cached.user);
            setProfile(cached.profile);
          }
        }

        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Opóźnij inicjalizację o małą chwilę aby uniknąć konfliktów z szybkim unmount
    const timeoutId = setTimeout(() => {
      initAuth();
    }, 0);

    // Subskrypcja na zmiany auth state
    try {
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        const newUser = session?.user ?? null;
        setUser(newUser);

        if (newUser) {
          const lastId = getLastSignedInUserId();
          // Czyść dane portfela tylko przy przełączeniu na inne konto.
          // Scenariusze:
          // - lastId === null: pierwsze logowanie na tym urządzeniu → zachowaj dane gościa (do ewentualnego przypisania).
          // - lastId === newUser.id: ponowne logowanie tego samego użytkownika → nie czyść.
          // - lastId !== null && lastId !== newUser.id: zmiana użytkownika → wyczyść cały storage portfela.
          if (lastId != null && lastId !== newUser.id) {
            clearTravelWalletStorage();
          }
          setLastSignedInUserId(newUser.id);
          try {
            await loadProfile(newUser);
          } catch (error) {
            // Ignoruj AbortError w loadProfile
            if (
              error instanceof Error &&
              (error.name === "AbortError" ||
                error.message?.includes("signal is aborted"))
            ) {
              return;
            }
            console.error("[AuthContext] Error loading profile:", error);
          }

          // Po załadowaniu profilu spróbuj przypisać podróże gościa do konta
          // (tylko przy pierwszym logowaniu na tym urządzeniu).
          if (profile?.subscription_tier) {
            attachGuestTripsOnFirstLogin(newUser, profile.subscription_tier);
          }
        } else {
          // Wylogowanie: nie czyścimy localStorage (trips) – użytkownik może pracować lokalnie.
          // Nie zerujemy też travel-wallet-last-user-id – zostaje ID ostatniego zalogowanego konta,
          // żeby przy kolejnym logowaniu innego użytkownika zadziałał mechanizm clearTravelWalletStorage().
          clearTravelWalletSessionOnly();
          clearAuthCache();
          setProfile(null);
        }

        setLoading(false);
      });

      subscription = authSubscription;
    } catch (error) {
      // Ignoruj błędy podczas subskrypcji (może być AbortError)
      if (
        error instanceof Error &&
        (error.name === "AbortError" ||
          error.message?.includes("signal is aborted"))
      ) {
        console.debug("[AuthContext] Ignored AbortError during subscription");
      } else {
        console.error(
          "[AuthContext] Error setting up auth subscription:",
          error,
        );
      }
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
      }
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          // Ignoruj błędy podczas unsubscribe
          if (
            error instanceof Error &&
            (error.name === "AbortError" ||
              error.message?.includes("signal is aborted"))
          ) {
            // Ciche ignorowanie
          } else {
            console.error("[AuthContext] Error unsubscribing:", error);
          }
        }
      }
    };
  }, [loadProfile]);

  // Zapisz do cache gdy user lub profile się zmienia
  useEffect(() => {
    if (user || profile) {
      saveAuthToCache(user, profile);
    }
  }, [user, profile]);

  // Obsługa online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Zsynchronizuj stan auth przy powrocie online
      const synced = await syncAuthOnOnline();
      if (synced.isValid) {
        setUser(synced.user);
        setProfile(synced.profile);
      } else {
        // Jeśli synchronizacja nie powiodła się, użyj cache
        const cached = getAuthFromCache();
        if (cached && isAuthCacheValid(cached)) {
          setUser(cached.user);
          setProfile(cached.profile);
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Przy offline używaj tylko cache
      const cached = getAuthFromCache();
      if (cached && isAuthCacheValid(cached)) {
        setUser(cached.user);
        setProfile(cached.profile);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Zawsze renderuj Provider, nawet przed mount, aby uniknąć błędów z useAuth()
  // Wartości będą zaktualizowane po mount
  const value: AuthContextType = {
    user,
    profile,
    loading: !mounted ? true : loading,
    isOnline,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
