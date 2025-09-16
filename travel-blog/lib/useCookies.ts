"use client";

import { useState, useEffect } from "react";

export type CookieType = "necessary" | "analytics" | "marketing";

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsent {
  accepted: boolean;
  preferences: CookiePreferences;
  timestamp: number;
}

const COOKIE_CONSENT_KEY = "cookie-consent";
const COOKIE_PREFERENCES_KEY = "cookie-preferences";

// Domyślne preferencje - niezbędne cookies są zawsze włączone
const defaultPreferences: CookiePreferences = {
  necessary: true, // Zawsze true - nie można wyłączyć
  analytics: false,
  marketing: false,
};

export function useCookies() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Ładowanie stanu z localStorage przy inicjalizacji
  useEffect(() => {
    try {
      const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
      const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

      if (savedConsent) {
        const parsedConsent = JSON.parse(savedConsent) as CookieConsent;
        setConsent(parsedConsent);
      }

      if (savedPreferences) {
        const parsedPreferences = JSON.parse(savedPreferences) as CookiePreferences;
        setPreferences(parsedPreferences);
      }
    } catch (error) {
      console.error("Błąd podczas ładowania preferencji cookies:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sprawdzenie czy użytkownik już wyraził zgodę
  const hasConsent = consent?.accepted === true;

  // Akceptacja wszystkich cookies
  const acceptAll = () => {
    const newConsent: CookieConsent = {
      accepted: true,
      preferences: {
        necessary: true,
        analytics: true,
        marketing: true,
      },
      timestamp: Date.now(),
    };

    setConsent(newConsent);
    setPreferences(newConsent.preferences);

    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newConsent));
      localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newConsent.preferences));
    } catch (error) {
      console.error("Błąd podczas zapisywania zgody na cookies:", error);
    }
  };

  // Odrzucenie wszystkich oprócz niezbędnych
  const rejectAll = () => {
    const newConsent: CookieConsent = {
      accepted: true,
      preferences: defaultPreferences,
      timestamp: Date.now(),
    };

    setConsent(newConsent);
    setPreferences(newConsent.preferences);

    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newConsent));
      localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newConsent.preferences));
    } catch (error) {
      console.error("Błąd podczas zapisywania zgody na cookies:", error);
    }
  };

  // Zapisywanie indywidualnych preferencji
  const savePreferences = (newPreferences: Partial<CookiePreferences>) => {
    const updatedPreferences = {
      ...preferences,
      ...newPreferences,
      necessary: true, // Niezbędne cookies zawsze włączone
    };

    const newConsent: CookieConsent = {
      accepted: true,
      preferences: updatedPreferences,
      timestamp: Date.now(),
    };

    setConsent(newConsent);
    setPreferences(updatedPreferences);

    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newConsent));
      localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(updatedPreferences));
    } catch (error) {
      console.error("Błąd podczas zapisywania preferencji cookies:", error);
    }
  };

  // Sprawdzenie czy konkretny typ cookies jest dozwolony
  const isAllowed = (type: CookieType): boolean => {
    if (!hasConsent) return false;
    return preferences[type] === true;
  };

  // Resetowanie zgody (dla ustawień)
  const resetConsent = () => {
    setConsent(null);
    setPreferences(defaultPreferences);

    try {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      localStorage.removeItem(COOKIE_PREFERENCES_KEY);
    } catch (error) {
      console.error("Błąd podczas resetowania zgody na cookies:", error);
    }
  };

  return {
    hasConsent,
    preferences,
    isLoaded,
    acceptAll,
    rejectAll,
    savePreferences,
    isAllowed,
    resetConsent,
  };
}
