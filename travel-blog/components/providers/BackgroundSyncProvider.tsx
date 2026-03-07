"use client";

import { useEffect } from "react";
import { useBackgroundSync } from "@/lib/travel-wallet/sync/useBackgroundSync";

/**
 * Provider dla automatycznej synchronizacji w tle
 */
export default function BackgroundSyncProvider() {
  useBackgroundSync({
    syncInterval: 5 * 60 * 1000, // 5 minut
    syncOnOnline: true,
  });

  return null;
}
