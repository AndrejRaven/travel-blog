"use client";

import { useCookies } from "./useCookies";

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
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).gtag = function(...args: unknown[]) {
        (window as any).dataLayer.push(args);
      };
      (window as any).gtag('js', new Date());
      (window as any).gtag('config', measurementId);
    }
  };

  // Ładowanie Facebook Pixel
  const loadFacebookPixel = (pixelId: string) => {
    if (!isAllowed("marketing")) return;

    // Ładuj Facebook Pixel
    loadScript(`https://connect.facebook.net/en_US/fbevents.js`, "marketing");
    
    // Inicjalizuj fbq
    if (typeof window !== "undefined") {
      (window as any).fbq = (window as any).fbq || function(...args: unknown[]) {
        (window as any).fbq.callMethod ? (window as any).fbq.callMethod(...args) : (window as any).fbq.queue.push(args);
      };
      (window as any).fbq.push = (window as any).fbq;
      (window as any).fbq.loaded = true;
      (window as any).fbq.version = '2.0';
      (window as any).fbq.queue = [];
      (window as any).fbq('init', pixelId);
      (window as any).fbq('track', 'PageView');
    }
  };

  // Ładowanie Google Tag Manager
  const loadGoogleTagManager = (gtmId: string) => {
    if (!canLoadExternalScripts("both")) return;

    // Ładuj GTM
    loadScript(`https://www.googletagmanager.com/gtm.js?id=${gtmId}`, "analytics");
    
    // Inicjalizuj dataLayer
    if (typeof window !== "undefined") {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({
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
