"use client";

import { useState, useEffect } from "react";
import { useCookies, CookiePreferences } from "@/lib/useCookies";
import Button from "@/components/ui/Button";
import InfoCard from "@/components/shared/InfoCard";

export default function CookieSettings() {
  const { preferences, savePreferences, acceptAll, rejectAll, resetConsent } =
    useCookies();
  const [tempPreferences, setTempPreferences] =
    useState<CookiePreferences>(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  // Aktualizuj tymczasowe preferencje gdy zmienią się główne
  useEffect(() => {
    setTempPreferences(preferences);
  }, [preferences]);

  // Sprawdź czy są zmiany
  useEffect(() => {
    const changed =
      JSON.stringify(tempPreferences) !== JSON.stringify(preferences);
    setHasChanges(changed);
  }, [tempPreferences, preferences]);

  const handleToggle = (type: keyof CookiePreferences) => {
    if (type === "necessary") return; // Nie można wyłączyć niezbędnych cookies

    setTempPreferences((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleSave = () => {
    savePreferences(tempPreferences);
    setHasChanges(false);
  };

  const handleReset = () => {
    resetConsent();
    setTempPreferences({
      necessary: true,
      analytics: false,
      marketing: false,
    });
    setHasChanges(false);
  };

  return (
    <div className="space-y-8">
      {/* Opis */}
      <div className="text-center">
        <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-4">
          Ustawienia cookies
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Zarządzaj swoimi preferencjami dotyczącymi plików cookies. Możesz
          włączyć lub wyłączyć różne typy cookies w zależności od swoich
          potrzeb.
        </p>
      </div>

      {/* Niezbędne cookies */}
      <InfoCard variant="blue">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Niezbędne cookies
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Te pliki cookies są absolutnie niezbędne do prawidłowego
                funkcjonowania naszej strony internetowej. Nie można ich
                wyłączyć, ponieważ są wymagane do podstawowych funkcji, takich
                jak nawigacja, bezpieczeństwo i dostęp do zabezpieczonych
                obszarów strony.
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Przechowywanie preferencji motywu (jasny/ciemny)</li>
                <li>• Zarządzanie sesją użytkownika</li>
                <li>• Zabezpieczenia i ochrona przed atakami</li>
                <li>• Podstawowa funkcjonalność strony</li>
              </ul>
            </div>
            <div className="ml-6 flex items-center">
              <div className="w-12 h-6 bg-blue-500 rounded-full p-1">
                <div className="w-4 h-4 bg-white rounded-full shadow transform translate-x-6" />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Zawsze włączone
              </span>
            </div>
          </div>
        </div>
      </InfoCard>

      {/* Analityczne cookies */}
      <InfoCard variant="green">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Analityczne cookies
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Te pliki cookies pomagają nam zrozumieć, jak odwiedzający
                wchodzą w interakcję ze stroną internetową, dostarczając
                informacji o odwiedzonych stronach, czasie spędzonym na stronie
                i problemach, które mogą napotkać, takich jak błędy 404.
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Google Analytics - analiza ruchu na stronie</li>
                <li>• Statystyki odwiedzin i popularności treści</li>
                <li>• Identyfikacja problemów technicznych</li>
                <li>• Optymalizacja wydajności strony</li>
              </ul>
            </div>
            <div className="ml-6 flex items-center">
              <button
                onClick={() => handleToggle("analytics")}
                className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${
                  tempPreferences.analytics
                    ? "bg-green-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    tempPreferences.analytics
                      ? "translate-x-7"
                      : "translate-x-1"
                  }`}
                />
              </button>
              <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                {tempPreferences.analytics ? "Włączone" : "Wyłączone"}
              </span>
            </div>
          </div>
        </div>
      </InfoCard>

      {/* Marketingowe cookies */}
      <InfoCard variant="purple">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Marketingowe cookies
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Te pliki cookies są używane do wyświetlania reklam, które są
                bardziej odpowiednie dla Ciebie i Twoich zainteresowań. Mogą być
                również używane do ograniczenia liczby wyświetlanych reklam i
                pomiaru skuteczności kampanii reklamowych.
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Spersonalizowane reklamy</li>
                <li>• Śledzenie konwersji</li>
                <li>• Retargeting (ponowne wyświetlanie reklam)</li>
                <li>• Integracje z mediami społecznościowymi</li>
              </ul>
            </div>
            <div className="ml-6 flex items-center">
              <button
                onClick={() => handleToggle("marketing")}
                className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${
                  tempPreferences.marketing
                    ? "bg-purple-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    tempPreferences.marketing
                      ? "translate-x-7"
                      : "translate-x-1"
                  }`}
                />
              </button>
              <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                {tempPreferences.marketing ? "Włączone" : "Wyłączone"}
              </span>
            </div>
          </div>
        </div>
      </InfoCard>

      {/* Przyciski akcji */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="outline" onClick={rejectAll} className="px-8 py-3">
          Odrzuć wszystkie
        </Button>
        <Button variant="outline" onClick={acceptAll} className="px-8 py-3">
          Akceptuję wszystkie
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!hasChanges}
          className="px-8 py-3"
        >
          {hasChanges ? "Zapisz zmiany" : "Brak zmian"}
        </Button>
        <Button variant="secondary" onClick={handleReset} className="px-8 py-3">
          Resetuj ustawienia
        </Button>
      </div>

      {/* Informacja o zapisanych ustawieniach */}
      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Twoje ustawienia są zapisywane lokalnie w przeglądarce i będą
          zachowane między sesjami. Możesz je zmienić w każdej chwili.
        </p>
      </div>
    </div>
  );
}
