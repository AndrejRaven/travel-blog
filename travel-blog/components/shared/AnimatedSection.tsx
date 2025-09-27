"use client";

import React, { useRef } from "react";
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

  const getAnimationClass = () => {
    switch (animationType) {
      case "text":
        return ANIMATION_PRESETS.text(isLoaded && isInView, animationDelay);
      case "image":
        return ANIMATION_PRESETS.image(isLoaded && isInView, animationDelay);
      case "sectionHeader":
        return ANIMATION_PRESETS.sectionHeader(isLoaded && isInView);
      case "button":
        return ANIMATION_PRESETS.button(isLoaded && isInView, animationDelay);
      default:
        return ANIMATION_PRESETS.text(isLoaded && isInView, animationDelay);
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
