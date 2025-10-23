"use client";

import React, { useRef, useState, useEffect } from "react";
import { ANIMATION_PRESETS } from "@/lib/animations";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animationType?: "text" | "image" | "sectionHeader" | "button";
  animationDelay?: "none" | "short" | "medium" | "long" | "longer" | "longest";
  id?: string;
  role?: string;
  "aria-labelledby"?: string;
  itemScope?: boolean;
  itemType?: string;
  // Nowe props dla animacji
  isLoaded?: boolean;
  isInView?: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Wrapper dla animowanych sekcji
 * Ujednolica obsługę animacji między komponentami
 */
export default function AnimatedSection({
  children,
  className = "",
  animationType = "text",
  animationDelay = "none",
  id,
  role,
  "aria-labelledby": ariaLabelledBy,
  itemScope,
  itemType,
  // Nowe props z wartościami domyślnymi
  isLoaded = true,
  isInView = true,
  containerRef,
}: AnimatedSectionProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = containerRef || internalRef;
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  // Zapamiętaj, że element był już widoczny
  useEffect(() => {
    if (isLoaded && isInView && !hasBeenVisible) {
      setHasBeenVisible(true);
    }
  }, [isLoaded, isInView, hasBeenVisible]);

  const getAnimationClass = () => {
    // Użyj hasBeenVisible zamiast isLoaded && isInView
    const shouldAnimate = hasBeenVisible;

    switch (animationType) {
      case "text":
        return ANIMATION_PRESETS.text(shouldAnimate, animationDelay);
      case "image":
        return ANIMATION_PRESETS.image(shouldAnimate, animationDelay);
      case "sectionHeader":
        return ANIMATION_PRESETS.sectionHeader(shouldAnimate);
      case "button":
        return ANIMATION_PRESETS.button(shouldAnimate, animationDelay);
      default:
        return ANIMATION_PRESETS.text(shouldAnimate, animationDelay);
    }
  };

  return (
    <div
      ref={ref}
      id={id}
      className={`${getAnimationClass()} ${className}`}
      role={role}
      aria-labelledby={ariaLabelledBy}
      itemScope={itemScope}
      itemType={itemType}
    >
      {children}
    </div>
  );
}
