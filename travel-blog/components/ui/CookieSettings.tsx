"use client";

import { useState, useEffect } from "react";
import { useCookies, CookiePreferences } from "@/lib/useCookies";
import Button from "@/components/ui/Button";

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
    <div className="space-y-4">
      {/* Niezbędne cookies */}
      <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Niezbędne cookies
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Wymagane do podstawowych funkcji strony. Zawsze włączone.
            </p>
          </div>
          <div className="ml-4 flex items-center">
            <div className="w-10 h-5 bg-gray-300 dark:bg-gray-600 rounded-full p-0.5">
              <div className="w-4 h-4 bg-white rounded-full shadow-sm transform translate-x-5" />
            </div>
            <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
              Włączone
            </span>
          </div>
        </div>
      </div>

      {/* Analityczne cookies */}
      <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Analityczne cookies
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Pomagają zrozumieć, jak użytkownicy korzystają ze strony.
            </p>
          </div>
          <div className="ml-4 flex items-center">
            <button
              onClick={() => handleToggle("analytics")}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                tempPreferences.analytics
                  ? "bg-blue-500"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  tempPreferences.analytics
                    ? "translate-x-5"
                    : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
              {tempPreferences.analytics ? "Włączone" : "Wyłączone"}
            </span>
          </div>
        </div>
      </div>

      {/* Marketingowe cookies */}
      <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Marketingowe cookies
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Używane do wyświetlania spersonalizowanych reklam.
            </p>
          </div>
          <div className="ml-4 flex items-center">
            <button
              onClick={() => handleToggle("marketing")}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                tempPreferences.marketing
                  ? "bg-blue-500"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  tempPreferences.marketing
                    ? "translate-x-5"
                    : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
              {tempPreferences.marketing ? "Włączone" : "Wyłączone"}
            </span>
          </div>
        </div>
      </div>

      {/* Przyciski akcji */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          variant="outline"
          onClick={rejectAll}
          className="px-3 py-1.5 text-xs"
        >
          Odrzuć wszystkie
        </Button>
        <Button
          variant="outline"
          onClick={acceptAll}
          className="px-3 py-1.5 text-xs"
        >
          Akceptuję wszystkie
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!hasChanges}
          className="px-3 py-1.5 text-xs"
        >
          {hasChanges ? "Zapisz" : "Brak zmian"}
        </Button>
        <Button
          variant="secondary"
          onClick={handleReset}
          className="px-3 py-1.5 text-xs"
        >
          Resetuj
        </Button>
      </div>
    </div>
  );
}
