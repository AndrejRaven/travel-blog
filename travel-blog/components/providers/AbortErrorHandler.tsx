"use client";

import { useEffect } from "react";

/**
 * Globalny handler wyciszający techniczne AbortError / „signal is aborted”
 * tak, aby nie zaśmiecały konsoli i nie wyglądały jak realne błędy.
 *
 * Nie zmienia zachowania aplikacji – tylko filtruje logi z przeglądarki.
 */
export default function AbortErrorHandler() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      if (
        error instanceof Error &&
        (error.name === "AbortError" || error.message?.includes("signal is aborted"))
      ) {
        event.preventDefault();
        // Ciche logowanie diagnostyczne
        // eslint-disable-next-line no-console
        console.debug("[AbortErrorHandler] Ignored error event:", error.message);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (
        reason instanceof Error &&
        (reason.name === "AbortError" || reason.message?.includes("signal is aborted"))
      ) {
        event.preventDefault();
        // eslint-disable-next-line no-console
        console.debug("[AbortErrorHandler] Ignored unhandled rejection:", reason.message);
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}

