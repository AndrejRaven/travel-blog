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
    
    console.log("Analytics: Page view tracked", url);
  };

  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (!isAllowed("analytics")) return;

    // Tutaj możesz dodać kod Google Analytics
    // gtag('event', eventName, parameters);
    
    console.log("Analytics: Event tracked", eventName, parameters);
  };

  const trackConversion = (conversionId: string, value?: number) => {
    if (!isAllowed("analytics")) return;

    // Tutaj możesz dodać kod śledzenia konwersji
    // gtag('event', 'conversion', {
    //   send_to: conversionId,
    //   value: value,
    // });
    
    console.log("Analytics: Conversion tracked", conversionId, value);
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
    
    console.log("Facebook Pixel: Page view tracked");
  };

  const trackPurchase = (value: number, currency: string = "PLN") => {
    if (!isAllowed("marketing")) return;

    // Tutaj możesz dodać kod Facebook Pixel
    // fbq('track', 'Purchase', {
    //   value: value,
    //   currency: currency,
    // });
    
    console.log("Facebook Pixel: Purchase tracked", value, currency);
  };

  const trackCustomEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (!isAllowed("marketing")) return;

    // Tutaj możesz dodać kod Facebook Pixel
    // fbq('trackCustom', eventName, parameters);
    
    console.log("Facebook Pixel: Custom event tracked", eventName, parameters);
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
    
    console.log("GTM: Data pushed to dataLayer", data);
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
