"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { useCookies } from "@/lib/useCookies";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { isAllowed, isLoaded } = useCookies();
  const [shouldLoadAnalytics, setShouldLoadAnalytics] = useState(false);

  useEffect(() => {
    // Poczekaj aż cookies są załadowane, potem sprawdź zgodę
    if (isLoaded && isAllowed("analytics")) {
      setShouldLoadAnalytics(true);
    } else {
      setShouldLoadAnalytics(false);
    }
  }, [isAllowed, isLoaded]);

  return (
    <>
      {children}
      {shouldLoadAnalytics && <Analytics />}
    </>
  );
}

