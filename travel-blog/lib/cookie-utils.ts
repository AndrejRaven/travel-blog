"use client";

import { useCookies } from "./useCookies";

// Rozszerzenie interfejsu Window dla Google Analytics i Facebook Pixel
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: {
      (...args: unknown[]): void;
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      push?: unknown;
      loaded?: boolean;
      version?: string;
    };
  }
}

// Utility functions dla cookies
export function useCookieUtils() {
  const { isAllowed, hasConsent } = useCookies();

  // Sprawdź czy można ładować skrypty zewnętrzne
  const canLoadExternalScripts = (type: "analytics" | "marketing" | "both" = "both") => {
    if (!hasConsent) return false;
    
    if (type === "analytics") return isAllowed("analytics");
    if (type === "marketing") return isAllowed("marketing");
    if (type === "both") return isAllowed("analytics") || isAllowed("marketing");
    
    return false;
  };

  // Dynamiczne ładowanie skryptów na podstawie zgody
  const loadScript = (src: string, type: "analytics" | "marketing" = "analytics") => {
    if (!canLoadExternalScripts(type)) return;

    // Sprawdź czy skrypt już nie jest załadowany
    if (document.querySelector(`script[src="${src}"]`)) return;

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    document.head.appendChild(script);
  };

  // Usuwanie skryptów gdy użytkownik cofnie zgodę
  const removeScript = (src: string) => {
    const script = document.querySelector(`script[src="${src}"]`);
    if (script) {
      script.remove();
    }
  };

  // Ładowanie Google Analytics
  const loadGoogleAnalytics = (measurementId: string) => {
    if (!isAllowed("analytics")) return;

    // Ładuj Google Analytics
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`, "analytics");
    
    // Inicjalizuj gtag
    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function(...args: unknown[]) {
        if (window.dataLayer) {
          window.dataLayer.push(args);
        }
      };
      window.gtag('js', new Date());
      window.gtag('config', measurementId);
    }
  };

  // Ładowanie Facebook Pixel
  const loadFacebookPixel = (pixelId: string) => {
    if (!isAllowed("marketing")) return;

    // Ładuj Facebook Pixel
    loadScript(`https://connect.facebook.net/en_US/fbevents.js`, "marketing");
    
    // Inicjalizuj fbq
    if (typeof window !== "undefined") {
      const fbqFunction = function(...args: unknown[]) {
        if (window.fbq) {
          if (window.fbq.callMethod) {
            window.fbq.callMethod(...args);
          } else if (window.fbq.queue) {
            window.fbq.queue.push(args);
          }
        }
      };
      
      window.fbq = window.fbq || fbqFunction;
      if (!window.fbq.callMethod) {
        window.fbq.callMethod = fbqFunction;
      }
      if (window.fbq.queue === undefined) {
        window.fbq.queue = [];
      }
      window.fbq.push = window.fbq;
      window.fbq.loaded = true;
      window.fbq.version = '2.0';
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
    }
  };

  // Ładowanie Google Tag Manager
  const loadGoogleTagManager = (gtmId: string) => {
    if (!canLoadExternalScripts("both")) return;

    // Ładuj GTM
    loadScript(`https://www.googletagmanager.com/gtm.js?id=${gtmId}`, "analytics");
    
    // Inicjalizuj dataLayer
    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      });
    }
  };

  // Usuwanie wszystkich skryptów śledzących
  const removeAllTrackingScripts = () => {
    const trackingScripts = [
      'googletagmanager.com',
      'google-analytics.com',
      'connect.facebook.net',
      'facebook.com',
      'doubleclick.net',
      'googlesyndication.com'
    ];

    trackingScripts.forEach(domain => {
      const scripts = document.querySelectorAll(`script[src*="${domain}"]`);
      scripts.forEach(script => script.remove());
    });
  };

  // Sprawdź czy cookie istnieje
  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  };

  // Ustaw cookie
  const setCookie = (name: string, value: string, days: number = 365) => {
    if (typeof document === "undefined") return;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  };

  // Usuń cookie
  const deleteCookie = (name: string) => {
    if (typeof document === "undefined") return;
    
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  };

  // Pobierz wszystkie cookies
  const getAllCookies = (): Record<string, string> => {
    if (typeof document === "undefined") return {};
    
    return document.cookie
      .split(';')
      .reduce((cookies, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = decodeURIComponent(value);
        }
        return cookies;
      }, {} as Record<string, string>);
  };

  return {
    canLoadExternalScripts,
    loadScript,
    removeScript,
    loadGoogleAnalytics,
    loadFacebookPixel,
    loadGoogleTagManager,
    removeAllTrackingScripts,
    getCookie,
    setCookie,
    deleteCookie,
    getAllCookies,
  };
}
