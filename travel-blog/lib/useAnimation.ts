"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ANIMATION_PRESETS, createProgressiveDelayStyle } from "./animations";

// Re-export ANIMATION_PRESETS for easier imports
export { ANIMATION_PRESETS };

/**
 * Hook do zarządzania animacjami w komponentach sections
 * 
 * Zapewnia spójne animacje we wszystkich komponentach:
 * - Intersection Observer dla uruchamiania animacji
 * - Spójne stany isLoaded i isInView
 * - Automatyczne czyszczenie observera
 * - Lepsze zarządzanie wieloma elementami
 */
export const useAnimation = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Sprawdź czy element istnieje
    if (!containerRef.current) return;

    // Responsywne ustawienia dla różnych urządzeń
    const isMobile = window.innerWidth < 768;
    const rootMargin = isMobile ? "0px 0px -10px 0px" : "0px 0px -20px 0px";
    const threshold = isMobile ? 0.05 : 0.1; // Niższy próg dla mobilnych

    // Utwórz nowy observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isInView) {
            console.log("🎬 Element entered viewport:", entry.target);
            setIsInView(true);
            // Mniejsze opóźnienie dla mobilnych
            const delay = isMobile ? 100 : 200;
            setTimeout(() => {
              console.log("🎬 Setting isLoaded to true");
              setIsLoaded(true);
            }, delay);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    // Obserwuj element
    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current && containerRef.current) {
        observerRef.current.unobserve(containerRef.current);
        observerRef.current.disconnect();
      }
    };
  }, [isInView]); // Dodaj isInView jako dependency

  return {
    isLoaded,
    isInView,
    containerRef,
    setIsLoaded,
  };
};

/**
 * Hook do animacji z progresywnym opóźnieniem dla list elementów
 * 
 * Używa się gdy mamy listę elementów, które mają się animować jeden po drugim
 */
export const useProgressiveAnimation = (itemCount: number) => {
  const { isLoaded, isInView, containerRef } = useAnimation();

  // Funkcja do tworzenia stylów z progresywnym opóźnieniem
  const getItemStyle = (index: number, baseDelay: number = 100) => {
    return createProgressiveDelayStyle(index, baseDelay);
  };

  // Funkcja do tworzenia klas z progresywnym opóźnieniem
  const getItemClass = (index: number, preset: keyof typeof ANIMATION_PRESETS = "listItem") => {
    if (preset === "listItem") {
      return ANIMATION_PRESETS[preset](isLoaded && isInView, index);
    }
    // Dla innych presetów używamy domyślnego opóźnienia
    return ANIMATION_PRESETS[preset](isLoaded && isInView, "medium");
  };

  return {
    isLoaded,
    isInView,
    containerRef,
    getItemStyle,
    getItemClass,
  };
};

/**
 * Hook do animacji z custom opóźnieniem
 * 
 * Używa się gdy potrzebujemy kontrolować opóźnienia ręcznie
 */
export const useCustomAnimation = () => {
  const { isLoaded, isInView, containerRef } = useAnimation();

  // Funkcja do tworzenia klas z custom opóźnieniem
  const getClass = (
    preset: keyof typeof ANIMATION_PRESETS,
    delay: "none" | "short" | "medium" | "long" | "longer" | "longest" = "none"
  ) => {
    if (preset === "listItem") {
      // listItem wymaga index jako drugi parametr, nie delay
      return ANIMATION_PRESETS[preset](isLoaded && isInView, 0);
    }
    return ANIMATION_PRESETS[preset](isLoaded && isInView, delay);
  };

  return {
    isLoaded,
    isInView,
    containerRef,
    getClass,
  };
};

/**
 * Hook do animacji hover
 * 
 * Używa się gdy potrzebujemy tylko efektów hover bez animacji wejścia
 */
export const useHoverAnimation = () => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return {
    isHovered,
    handleMouseEnter,
    handleMouseLeave,
  };
};
