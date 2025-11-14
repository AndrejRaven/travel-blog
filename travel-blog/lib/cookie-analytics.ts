"use client";

import { useCookies } from "./useCookies";
import { track } from "@vercel/analytics";

// Implementacja analityki z Vercel Analytics
export function useAnalytics() {
  const { isAllowed } = useCookies();

  // Vercel Analytics automatycznie śledzi page views, więc ta funkcja jest głównie dla kompatybilności
  const trackPageView = (url: string) => {
    if (!isAllowed("analytics")) return;

    // Vercel Analytics automatycznie śledzi zmiany routingu
    // Możemy użyć track() do śledzenia custom page view jeśli potrzeba
    track("page_view", {
      url,
      timestamp: new Date().toISOString(),
    });
  };

  const trackEvent = (
    eventName: string,
    parameters?: Record<string, string | number | boolean | null>
  ) => {
    if (!isAllowed("analytics")) return;

    track(eventName, parameters);
  };

  const trackConversion = (conversionId: string, value?: number) => {
    if (!isAllowed("analytics")) return;

    track("conversion", {
      conversion_id: conversionId,
      value: value ?? null,
    });
  };

  return {
    trackPageView,
    trackEvent,
    trackConversion,
  };
}

// Przykładowa implementacja Facebook Pixel
export function useFacebookPixel() {
  const { isAllowed } = useCookies();

  const trackPageView = () => {
    if (!isAllowed("marketing")) return;

    // Tutaj możesz dodać kod Facebook Pixel
    // fbq('track', 'PageView');
    
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const trackPurchase = (value: number, _currency: string = "PLN") => {
    if (!isAllowed("marketing")) return;

    // Tutaj możesz dodać kod Facebook Pixel
    // fbq('track', 'Purchase', {
    //   value: value,
    //   currency: currency,
    // });
    
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const trackCustomEvent = (_eventName: string, _parameters?: Record<string, unknown>) => {
    if (!isAllowed("marketing")) return;

    // Tutaj możesz dodać kod Facebook Pixel
    // fbq('trackCustom', eventName, parameters);
    
  };

  return {
    trackPageView,
    trackPurchase,
    trackCustomEvent,
  };
}

// Przykładowa implementacja Google Tag Manager
export function useGoogleTagManager() {
  const { isAllowed } = useCookies();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pushDataLayer = (_data: Record<string, unknown>) => {
    if (!isAllowed("analytics") && !isAllowed("marketing")) return;

    // Tutaj możesz dodać kod Google Tag Manager
    // window.dataLayer = window.dataLayer || [];
    // window.dataLayer.push(data);
    
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const trackEvent = (_eventName: string, _parameters?: Record<string, unknown>) => {
    // Implementation placeholder
  };

  return {
    pushDataLayer,
    trackEvent,
  };
}
