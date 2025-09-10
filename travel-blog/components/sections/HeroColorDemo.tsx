import React from "react";
import HeroBanner from "./HeroBanner";
import { heroExamples, ThemeColorKey } from "@/lib/hero-test-data";
import { availableThemeColors } from "@/lib/theme-colors";

// Komponent do demonstracji różnych kolorów hero bannerów
export default function HeroColorDemo() {
  const colorNames: Record<ThemeColorKey, string> = {
    background: "Tło sekcji",
    card: "Tło karty",
    accent: "Tło akcentu",
    hero: "Tło hero",
    button: "Tło przycisku",
    navigation: "Tło nawigacji",
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-4">
          Demo kolorów Hero Banner
        </h2>
        <p className="text-gray-600 dark:text-gray-300 font-sans">
          Przełącz theme aby zobaczyć jak kolory się zmieniają
        </p>
      </div>

      {availableThemeColors.map((colorKey) => {
        const heroData = {
          ...heroExamples.sectionBackground,
          layout: {
            ...heroExamples.sectionBackground.layout,
            backgroundColor: colorKey,
          },
        };

        return (
          <div key={colorKey} className="space-y-2">
            <h3 className="text-lg font-serif font-semibold text-gray-900 dark:text-gray-100">
              {colorNames[colorKey]} ({colorKey})
            </h3>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <HeroBanner data={heroData} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
