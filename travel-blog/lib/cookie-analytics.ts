"use client";

import { useCookies } from "./useCookies";

// Przykładowa implementacja Google Analytics
export function useAnalytics() {
  const { isAllowed } = useCookies();

  const trackPageView = (url: string) => {
    if (!isAllowed("analytics")) return;

    // Tutaj możesz dodać kod Google Analytics
    // gtag('config', 'GA_MEASUREMENT_ID', {
    //   page_path: url,
    // });
    
  };

  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (!isAllowed("analytics")) return;

    // Tutaj możesz dodać kod Google Analytics
    // gtag('event', eventName, parameters);
    
  };

  const trackConversion = (conversionId: string, value?: number) => {
    if (!isAllowed("analytics")) return;

    // Tutaj możesz dodać kod śledzenia konwersji
    // gtag('event', 'conversion', {
    //   send_to: conversionId,
    //   value: value,
    // });
    
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

  const trackPurchase = (value: number, currency: string = "PLN") => {
    if (!isAllowed("marketing")) return;

    // Tutaj możesz dodać kod Facebook Pixel
    // fbq('track', 'Purchase', {
    //   value: value,
    //   currency: currency,
    // });
    
  };

  const trackCustomEvent = (eventName: string, parameters?: Record<string, any>) => {
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

  const pushDataLayer = (data: Record<string, any>) => {
    if (!isAllowed("analytics") && !isAllowed("marketing")) return;

    // Tutaj możesz dodać kod Google Tag Manager
    // window.dataLayer = window.dataLayer || [];
    // window.dataLayer.push(data);
    
  };

  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    pushDataLayer({
      event: eventName,
      ...parameters,
    });
  };

  return {
    pushDataLayer,
    trackEvent,
  };
}
