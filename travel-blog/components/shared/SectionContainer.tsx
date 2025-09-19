"use client";

import React, { useRef } from "react";
import { useAnimation } from "@/lib/useAnimation";
import { ANIMATION_PRESETS } from "@/lib/animations";
import {
  ContainerConfig,
  getContainerClasses,
  generateSectionId,
} from "@/lib/section-utils";

interface SectionContainerProps {
  config: ContainerConfig;
  children: React.ReactNode;
  className?: string;
  role?: string;
  "aria-labelledby"?: string;
  itemScope?: boolean;
  itemType?: string;
}

/**
 * Wspólny kontener dla wszystkich sekcji
 * Eliminuje duplikację kodu między komponentami sekcji
 */
export default function SectionContainer({
  config,
  children,
  className = "",
  role,
  "aria-labelledby": ariaLabelledBy,
  itemScope,
  itemType,
}: SectionContainerProps) {
  const { isLoaded, isInView, containerRef } = useAnimation();

  const sectionId = config.contentTitle
    ? generateSectionId(config.contentTitle)
    : undefined;

  const containerClasses = getContainerClasses(config);
  const animationClass = ANIMATION_PRESETS.text(isLoaded && isInView, "none");

  return (
    <div
      id={sectionId}
      ref={containerRef}
      className={`${containerClasses} ${animationClass} ${className}`}
      role={role}
      aria-labelledby={ariaLabelledBy}
      itemScope={itemScope}
      itemType={itemType}
    >
      {children}
    </div>
  );
}
