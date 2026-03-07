"use client";

import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, LogOut, ChevronDown, Crown, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import Link from "@/components/ui/Link";
import { pushChangesToSupabase } from "@/lib/travel-wallet/sync/trip-sync-manager";
import { hasLocalChanges } from "@/lib/travel-wallet/sync/sync-cache";
import { useToast } from "@/components/ui/Toast";

const UpgradeToPremiumModal = lazy(
  () => import("@/components/subscription/UpgradeToPremiumModal"),
);

interface UserProfileMenuProps {
  className?: string;
}

export default function UserProfileMenu({
  className = "",
}: UserProfileMenuProps) {
  const { user, profile, signOut, loading, refreshProfile } = useAuth();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const { addToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safePath =
    typeof pathname === "string" && pathname.trim() !== "" ? pathname : "";
  const loginHref = safePath
    ? `/logowanie?redirect=${encodeURIComponent(safePath)}`
    : "/logowanie";
  const registerHref = safePath
    ? `/rejestracja?redirect=${encodeURIComponent(safePath)}`
    : "/rejestracja";

  // Timeout dla skeleton loadera (max 3 sekundy)
  useEffect(() => {
    if (!loading) {
      setShowSkeleton(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setShowSkeleton(false);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Zamknij menu gdy kliknięto poza nim
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const tier = profile?.subscription_tier || "free";

  // Synchronizacja tier z MailerLite: upgrade (free→premium) gdy w grupie premium,
  // downgrade (premium→free) gdy API zwraca isPremium: false.
  useEffect(() => {
    // Sprawdzaj status premium TYLKO dla zalogowanych użytkowników
    // i maksymalnie raz na 24h na urządzeniu (cache w localStorage).
    if (!user?.email || !user?.id || !refreshProfile) return;

    const CACHE_KEY = "travel-wallet-premium-check-last";
    const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

    const checkPremiumStatus = async () => {
      try {
        // Sprawdź cache, żeby nie pytać API zbyt często
        if (typeof window !== "undefined") {
          const raw = localStorage.getItem(CACHE_KEY);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as {
                userId: string;
                timestamp: number;
              };
              if (
                parsed.userId === user.id &&
                typeof parsed.timestamp === "number" &&
                Date.now() - parsed.timestamp < CACHE_TTL_MS
              ) {
                return;
              }
            } catch {
              // ignore parse errors
            }
          }
        }

        const response = await fetch("/api/premium/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        });
        if (!response.ok) return;
        const data = await response.json();
        const { updateSubscriptionTier } = await import(
          "@/lib/supabase/auth-helpers"
        );
        if (data.isPremium && tier === "free") {
          try {
            await updateSubscriptionTier(user.id, "premium");
            await refreshProfile();
          } catch (error) {
            console.error(
              "[UserProfileMenu] Error syncing premium status:",
              error,
            );
          }
        } else if (!data.isPremium && tier === "premium") {
          try {
            await updateSubscriptionTier(user.id, "free");
            await refreshProfile();
          } catch (error) {
            console.error(
              "[UserProfileMenu] Error syncing downgrade to free:",
              error,
            );
          }
        }

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ userId: user.id, timestamp: Date.now() }),
            );
          } catch {
            // ignore storage errors
          }
        }
      } catch (error) {
        console.debug(
          "[UserProfileMenu] Could not check premium status:",
          error,
        );
      }
    };

    const timeoutId = setTimeout(checkPremiumStatus, 1000);
    return () => clearTimeout(timeoutId);
  }, [user?.id, user?.email, tier, refreshProfile]);

  const handleSignOut = async () => {
    console.log("[UserProfileMenu] handleSignOut clicked");
    setIsOpen(false);
    const targetUrl = "/portfel-podrozniczy?wylogowany=1";
    try {
      // Przed wylogowaniem spróbuj wypchnąć lokalne zmiany do chmury (wydatki, podróże).
      // Robimy to zawsze dla zalogowanego użytkownika z aktywnym połączeniem,
      // nie polegając na heurystyce hasLocalChanges(), żeby nie pominąć żadnej podróży.
      if (
        user?.id &&
        typeof window !== "undefined" &&
        window.navigator.onLine
      ) {
        const hasChanges = hasLocalChanges();
        console.log("[UserProfileMenu] Starting pre-logout sync", {
          hasLocalChanges: hasChanges,
        });
        await Promise.race([
          pushChangesToSupabase(user.id),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Sync timeout")), 5000),
          ),
        ]).catch((err) => {
          if (err?.message === "Sync timeout") {
            console.warn("[UserProfileMenu] Pre-logout sync timeout after 5s");
          } else if (err) {
            console.error("[UserProfileMenu] Pre-logout sync error:", err);
          }
        });
      } else {
        console.log(
          "[UserProfileMenu] Skipping pre-logout sync (no user or offline)",
        );
      }
      console.log("[UserProfileMenu] Calling signOut()");
      const result = await signOut();
      console.log("[UserProfileMenu] signOut() resolved with:", result);

      if (!result.ok) {
        const reason = result.reason || "error";
        console.warn(
          "[UserProfileMenu] signOut failed with reason:",
          reason,
          result.error,
        );
        addToast({
          type: "error",
          title: "Nie udało się wylogować",
          message:
            reason === "timeout"
              ? "Serwer Supabase zbyt długo nie odpowiada. Spróbuj wylogować się ponownie za chwilę."
              : "Wystąpił błąd podczas wylogowywania. Spróbuj ponownie za chwilę.",
          duration: 5000,
        });
        // Przy błędzie/timeoutcie NIE robimy redirecta – użytkownik realnie nadal jest zalogowany.
        return;
      }
    } catch (error) {
      console.error("[UserProfileMenu] Error signing out:", error);
    } finally {
      // Redirect tylko gdy signOut się udał (result.ok === true).
      // W przypadku błędu/timeoutu wyszliśmy wcześniej z funkcji.
      console.log("[UserProfileMenu] Redirecting to:", targetUrl);
      window.location.href = targetUrl;
    }
  };

  // Do pierwszego mountu renderuj ten sam output co „nie zalogowany”, żeby uniknąć
  // hydration mismatch (serwer nie zna auth, rozszerzenia mogą zmieniać DOM).
  if (!mounted) {
    return (
      <Link
        href={loginHref}
        variant="underline"
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
      >
        <User className="w-4 h-4" />
        <span className="text-xs font-medium">Zaloguj się</span>
      </Link>
    );
  }

  // Podczas ładowania pokaż placeholder (skeleton) tylko przez max 3 sekundy
  if (loading && showSkeleton) {
    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 ${className}`}>
        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse hidden sm:block" />
      </div>
    );
  }

  // Jeśli użytkownik nie jest zalogowany, pokaż link do logowania
  if (!user) {
    return (
      <Link
        href={loginHref}
        variant="underline"
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
      >
        <User className="w-4 h-4" />
        <span className="text-xs font-medium">Zaloguj się</span>
      </Link>
    );
  }

  const handleEditProfile = () => {
    setIsOpen(false);
    router.push("/profil");
  };

  const displayName =
    profile?.full_name || user.email?.split("@")[0] || "Użytkownik";

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          {/* Avatar z ikoną korony */}
          <div className="relative">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-6 h-6 rounded-full object-cover border border-gray-200 dark:border-gray-600"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold border border-gray-200 dark:border-gray-600">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {/* Ikona korony na zdjęciu u góry z prawej */}
            {tier === "premium" && (
              <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5 border border-white dark:border-gray-800">
                <Crown className="w-1.5 h-1.5 text-white" />
              </div>
            )}
          </div>
          <span className="text-xs font-medium hidden sm:inline">
            {displayName}
          </span>
        </div>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {/* Avatar z ikoną korony */}
              <div className="relative flex-shrink-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-semibold border-2 border-gray-200 dark:border-gray-700">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Ikona korony na zdjęciu u góry z prawej */}
                {tier === "premium" && (
                  <div className="absolute -top-1.5 -right-1.5 bg-yellow-500 rounded-full p-0.5 border-2 border-white dark:border-gray-800">
                    <Crown className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {/* Badge premium nad imieniem */}
                {tier === "premium" && (
                  <div className="mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                      <Crown className="w-3 h-3" />
                      Premium
                    </span>
                  </div>
                )}
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Edit Profile */}
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/profil");
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Edytuj profil</span>
            </button>

            {/* Upgrade button - pokaż tylko dla free users */}
            {tier !== "premium" && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsUpgradeModalOpen(true);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
              >
                <Crown className="w-4 h-4 text-yellow-500" />
                <span>Przejdź na Premium</span>
              </button>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Wyloguj się</span>
            </button>
          </div>
        </div>
      )}

      {/* Upgrade to Premium Modal */}
      <Suspense fallback={null}>
        <UpgradeToPremiumModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          userEmail={user?.email}
        />
      </Suspense>
    </div>
  );
}
