"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { pushChangesToSupabase } from "@/lib/travel-wallet/sync/trip-sync-manager";
import { hasLocalChanges } from "@/lib/travel-wallet/sync/sync-cache";

/**
 * Provider, który próbuje wypchnąć lokalne zmiany do Supabase
 * przy zamykaniu / ukrywaniu strony.
 */
export default function SyncOnPageUnload() {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePageHide = () => {
      if (!user?.id) return;
      if (!window.navigator.onLine) return;

      // Lekka heurystyka, żeby nie odpalać requestu bez potrzeby,
      // ale nawet jeśli hasLocalChanges() zwróci false, push jest bezpieczny.
      const hasChanges = hasLocalChanges();
      if (!hasChanges) return;

      try {
        void pushChangesToSupabase(user.id);
      } catch {
        // Ignorujemy błędy przy zamykaniu strony
      }
    };

    // pagehide jest lepiej wspierane dla SPA niż beforeunload
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [user?.id]);

  return null;
}

