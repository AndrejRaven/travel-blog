"use client";

import { useState } from "react";
import { useCookies } from "@/lib/useCookies";
import Button from "@/components/ui/Button";
import Link from "@/components/ui/Link";
import { Settings, X } from "lucide-react";

export default function CookieBanner() {
  const { hasConsent, isLoaded, acceptAll, rejectAll } = useCookies();
  const [showSettings, setShowSettings] = useState(false);

  // Nie pokazuj bannera jeśli użytkownik już wyraził zgodę lub strona się jeszcze ładuje
  if (hasConsent || !isLoaded) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Treść bannera */}
          <div className="flex-1">
            <h3 className="text-lg font-serif font-semibold text-gray-900 dark:text-gray-100 mb-2">
              🍪 Używamy plików cookies
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 lg:mb-0">
              Używamy plików cookies, aby poprawić Twoje doświadczenia na naszej
              stronie, analizować ruch i personalizować treści. Możesz zarządzać
              swoimi preferencjami w każdej chwili.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Link
                href="/polityka-prywatnosci"
                variant="underline"
                className="text-xs"
              >
                Polityka prywatności
              </Link>
              <span>•</span>
              <Link
                href="/polityka-cookies"
                variant="underline"
                className="text-xs"
              >
                Polityka cookies
              </Link>
            </div>
          </div>

          {/* Przyciski */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Button
              variant="outline"
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 text-sm px-4 py-2"
            >
              <Settings className="w-4 h-4" />
              Ustawienia
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={rejectAll}
                className="text-sm px-4 py-2"
              >
                Odrzuć wszystkie
              </Button>
              <Button
                variant="primary"
                onClick={acceptAll}
                className="text-sm px-6 py-2"
              >
                Akceptuję wszystkie
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal ustawień */}
      {showSettings && (
        <CookieSettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

// Modal z ustawieniami cookies
function CookieSettingsModal({ onClose }: { onClose: () => void }) {
  const { preferences, savePreferences, acceptAll, rejectAll } = useCookies();
  const [tempPreferences, setTempPreferences] = useState(preferences);

  const handleSave = () => {
    savePreferences(tempPreferences);
    onClose();
  };

  const handleToggle = (type: keyof typeof tempPreferences) => {
    if (type === "necessary") return; // Nie można wyłączyć niezbędnych cookies

    setTempPreferences((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] min-h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100">
            Ustawienia cookies
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Zawartość */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto min-h-0">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Wybierz, które pliki cookies chcesz akceptować. Niezbędne cookies są
            wymagane do podstawowego funkcjonowania strony i nie można ich
            wyłączyć.
          </p>

          {/* Niezbędne cookies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Niezbędne cookies
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Wymagane do podstawowego funkcjonowania strony
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full p-1">
                  <div className="w-4 h-4 bg-white rounded-full shadow transform transition-transform translate-x-6" />
                </div>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  Zawsze włączone
                </span>
              </div>
            </div>
          </div>

          {/* Analityczne cookies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Analityczne cookies
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Pomagają nam zrozumieć, jak użytkownicy korzystają ze strony
                </p>
              </div>
              <button
                onClick={() => handleToggle("analytics")}
                className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${
                  tempPreferences.analytics
                    ? "bg-blue-600 dark:bg-blue-500"
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
            </div>
          </div>

          {/* Marketingowe cookies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Marketingowe cookies
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Używane do wyświetlania spersonalizowanych reklam
                </p>
              </div>
              <button
                onClick={() => handleToggle("marketing")}
                className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${
                  tempPreferences.marketing
                    ? "bg-blue-600 dark:bg-blue-500"
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
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 pt-8 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <Button
            variant="outline"
            onClick={rejectAll}
            className="flex-1 sm:flex-none order-1 sm:order-1"
          >
            Odrzuć wszystkie
          </Button>
          <Button
            variant="outline"
            onClick={acceptAll}
            className="flex-1 sm:flex-none order-2 sm:order-2"
          >
            Akceptuję wszystkie
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="flex-1 sm:flex-none order-3 sm:order-3"
          >
            Zapisz ustawienia
          </Button>
        </div>
      </div>
    </div>
  );
}
