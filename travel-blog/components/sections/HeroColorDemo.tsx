"use client";

import React, { useState, useEffect, useRef } from "react";
import HeroBanner from "./HeroBanner";
import { heroExamples, ThemeColorKey } from "@/lib/hero-test-data";
import { availableThemeColors } from "@/lib/theme-colors";

// Komponent do demonstracji różnych kolorów hero bannerów
export default function HeroColorDemo() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer - animacja uruchamia się gdy komponent wchodzi w viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            setTimeout(() => {
              setIsLoaded(true);
            }, 200);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const colorNames: Record<ThemeColorKey, string> = {
    background: "Tło sekcji",
    card: "Tło karty",
    accent: "Tło akcentu",
    hero: "Tło hero",
    button: "Tło przycisku",
    navigation: "Tło nawigacji",
  };

  return (
    <div ref={containerRef} className="space-y-8">
      <div
        className={`text-center transition-all duration-1000 ease-out ${
          isLoaded && isInView
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-4">
          Demo kolorów Hero Banner
        </h2>
        <p className="text-gray-600 dark:text-gray-300 font-sans">
          Przełącz theme aby zobaczyć jak kolory się zmieniają
        </p>
      </div>

      {availableThemeColors.map((colorKey, index) => {
        const heroData = {
          ...heroExamples.sectionBackground,
          layout: {
            ...heroExamples.sectionBackground.layout,
            backgroundColor: colorKey,
          },
        };

        return (
          <div
            key={colorKey}
            className={`space-y-2 transition-all duration-1000 ease-out delay-${
              (index + 1) * 200
            } ${
              isLoaded && isInView
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-8 scale-95"
            }`}
          >
            <h3 className="text-lg font-serif font-semibold text-gray-900 dark:text-gray-100">
              {colorNames[colorKey]} ({colorKey})
            </h3>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-lg">
              <HeroBanner data={heroData} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
