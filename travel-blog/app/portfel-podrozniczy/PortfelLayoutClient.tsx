"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useOnlineStatus } from "@/lib/travel-wallet/hooks/useOnlineStatus";
import { getAllTrips } from "@/lib/travel-wallet/trips-storage";
import type { Trip } from "@/lib/travel-wallet/types";
import WalletStatusBanner from "@/components/ui/WalletStatusBanner";

export default function PortfelLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const sync = () => setTrips(getAllTrips());
    sync();
    window.addEventListener("portfel-trips-updated", sync);
    return () => window.removeEventListener("portfel-trips-updated", sync);
  }, []);

  const showStickyBanner =
    isOnline && !user && trips.length > 0;

  const loginHref = pathname ? `/logowanie?redirect=${encodeURIComponent(pathname)}` : "/logowanie";
  const registerHref = pathname ? `/rejestracja?redirect=${encodeURIComponent(pathname)}` : "/rejestracja";

  return (
    <>
      {showStickyBanner && (
        <div className="sticky top-0 z-10 shrink-0">
          <WalletStatusBanner
            variant="loggedOutWithData"
            compact
            className="rounded-none border-x-0 border-t-0"
            loginHref={loginHref}
            registerHref={registerHref}
          />
        </div>
      )}
      {children}
    </>
  );
}
