"use client";

import { Suspense, type PropsWithChildren } from "react";
import dynamic from "next/dynamic";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import NavigationProgressProvider from "@/components/providers/NavigationProgressProvider";
import NotificationProvider from "@/components/providers/NotificationProvider";
import AuthProvider from "@/components/providers/AuthProvider";
import AbortErrorHandler from "@/components/providers/AbortErrorHandler";
import SyncOnPageUnload from "@/components/providers/SyncOnPageUnload";
import TopLoadingBar from "@/components/ui/TopLoadingBar";
import { ToastContainer } from "@/components/ui/Toast";
import { SpeedInsights } from "@vercel/speed-insights/next";

const CookieBanner = dynamic(() => import("@/components/ui/CookieBanner"), {
  ssr: false,
  loading: () => null,
});

const ScrollToTop = dynamic(() => import("@/components/ui/ScrollToTop"), {
  ssr: false,
  loading: () => null,
});

const OfflineIndicator = dynamic(
  () => import("@/components/ui/OfflineIndicator"),
  {
    ssr: false,
    loading: () => null,
  },
);

const BackgroundSyncProvider = dynamic(
  () => import("@/components/providers/BackgroundSyncProvider"),
  {
    ssr: false,
    loading: () => null,
  },
);

const VisualEditing = dynamic(
  () => import("next-sanity").then((mod) => ({ default: mod.VisualEditing })),
  {
    ssr: false,
    loading: () => null,
  },
);

function LazyClientWidgets() {
  return (
    <Suspense fallback={null}>
      <CookieBanner />
      <ScrollToTop />
      <OfflineIndicator />
    </Suspense>
  );
}

function DraftVisualEditing({ isDraftMode }: { isDraftMode: boolean }) {
  if (!isDraftMode) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <VisualEditing />
    </Suspense>
  );
}

type ClientShellProps = PropsWithChildren<{
  isDraftMode: boolean;
}>;

export default function ClientShell({
  children,
  isDraftMode,
}: ClientShellProps) {
  return (
    <ThemeProvider>
      <AnalyticsProvider>
        <AuthProvider>
          <Suspense fallback={null}>
            <NavigationProgressProvider>
              <NotificationProvider>
                <AbortErrorHandler />
                <TopLoadingBar />
                {children}
                <LazyClientWidgets />
                <SyncOnPageUnload />
                <ToastContainer />
                <SpeedInsights />
                <DraftVisualEditing isDraftMode={isDraftMode} />
                <BackgroundSyncProvider />
              </NotificationProvider>
            </NavigationProgressProvider>
          </Suspense>
        </AuthProvider>
      </AnalyticsProvider>
    </ThemeProvider>
  );
}
