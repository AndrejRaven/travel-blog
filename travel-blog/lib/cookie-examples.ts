"use client";

import { useCookies } from "./useCookies";
import { useAnalytics } from "./cookie-analytics";
import { useFacebookPixel } from "./cookie-analytics";
import { useGoogleTagManager } from "./cookie-analytics";

// Przykład użycia cookies w komponencie
export function useCookieExamples() {
  const { hasConsent, preferences, isAllowed } = useCookies();
  const analytics = useAnalytics();
  const facebookPixel = useFacebookPixel();
  const gtm = useGoogleTagManager();

  // Przykład śledzenia kliknięcia w przycisk
  const trackButtonClick = (buttonName: string) => {
    // Sprawdź czy użytkownik wyraził zgodę na analityczne cookies
    if (isAllowed("analytics")) {
      analytics.trackEvent("button_click", {
        button_name: buttonName,
        page: window.location.pathname,
      });
    }
  };

  // Przykład śledzenia scrollowania
  const trackScroll = (scrollPercentage: number) => {
    if (isAllowed("analytics")) {
      analytics.trackEvent("scroll", {
        scroll_percentage: scrollPercentage,
        page: window.location.pathname,
      });
    }
  };

  // Przykład śledzenia czasu spędzonego na stronie
  const trackTimeOnPage = (timeInSeconds: number) => {
    if (isAllowed("analytics")) {
      analytics.trackEvent("time_on_page", {
        time_seconds: timeInSeconds,
        page: window.location.pathname,
      });
    }
  };

  // Przykład śledzenia konwersji (np. zapis do newslettera)
  const trackNewsletterSignup = (email: string) => {
    if (isAllowed("analytics")) {
      analytics.trackEvent("newsletter_signup", {
        email: email,
        page: window.location.pathname,
      });
    }

    if (isAllowed("marketing")) {
      facebookPixel.trackCustomEvent("NewsletterSignup", {
        email: email,
      });
    }
  };

  // Przykład śledzenia zakupu (jeśli masz sklep)
  const trackPurchase = (productName: string, value: number) => {
    if (isAllowed("analytics")) {
      analytics.trackEvent("purchase", {
        product_name: productName,
        value: value,
        currency: "PLN",
      });
    }

    if (isAllowed("marketing")) {
      facebookPixel.trackPurchase(value, "PLN");
    }

    // GTM event
    gtm.trackEvent("purchase", {
      product_name: productName,
      value: value,
      currency: "PLN",
    });
  };

  // Przykład śledzenia błędów
  const trackError = (errorMessage: string, errorCode?: string) => {
    if (isAllowed("analytics")) {
      analytics.trackEvent("error", {
        error_message: errorMessage,
        error_code: errorCode,
        page: window.location.pathname,
      });
    }
  };

  // Przykład śledzenia wyszukiwania
  const trackSearch = (searchTerm: string, resultsCount: number) => {
    if (isAllowed("analytics")) {
      analytics.trackEvent("search", {
        search_term: searchTerm,
        results_count: resultsCount,
        page: window.location.pathname,
      });
    }
  };

  // Przykład śledzenia social media
  const trackSocialShare = (platform: string, contentUrl: string) => {
    if (isAllowed("analytics")) {
      analytics.trackEvent("social_share", {
        platform: platform,
        content_url: contentUrl,
        page: window.location.pathname,
      });
    }
  };

  return {
    hasConsent,
    preferences,
    isAllowed,
    trackButtonClick,
    trackScroll,
    trackTimeOnPage,
    trackNewsletterSignup,
    trackPurchase,
    trackError,
    trackSearch,
    trackSocialShare,
  };
}

// Przykład komponentu z śledzeniem - przeniesiony do osobnego pliku
// Zobacz: components/ui/TrackedButton.tsx

// Przykład hooka do śledzenia scrollowania
export function useScrollTracking() {
  const { trackScroll } = useCookieExamples();

  const handleScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = Math.round((scrollTop / scrollHeight) * 100);
    
    trackScroll(scrollPercentage);
  };

  return { handleScroll };
}

// Przykład hooka do śledzenia czasu na stronie
export function useTimeTracking() {
  const { trackTimeOnPage } = useCookieExamples();

  const startTime = Date.now();

  const trackTime = () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    trackTimeOnPage(timeSpent);
  };

  return { trackTime };
}
