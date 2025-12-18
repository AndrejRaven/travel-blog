"use client";

import { Analytics } from "@vercel/analytics/react";
import { useCookies } from "@/lib/useCookies";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useCookies();

  // Vercel Analytics jest zgodny z GDPR i nie używa cookies
  // Ładujemy go zawsze, aby liczyć wszystkich użytkowników odwiedzających stronę
  // Custom eventy nadal sprawdzają zgodę w cookie-analytics.ts
  return (
    <>
      {children}
      {isLoaded && <Analytics />}
    </>
  );
}

