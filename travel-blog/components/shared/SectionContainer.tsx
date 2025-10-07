"use client";

import React, { useRef } from "react";
import { useAnimation } from "@/lib/useAnimation";
import { ANIMATION_PRESETS } from "@/lib/animations";
import {
  ContainerConfig,
  getContainerClasses,
  generateSectionId,
  getMaxWidthClass,
  getPaddingClass,
  getMarginClass,
  getBackgroundColorClass,
  getBorderRadiusClass,
  getShadowClass,
  getInnerMarginClass,
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

  // Zewnętrzny kontener - tylko zewnętrzne rzeczy (szerokość, marginesy)
  const outerContainerClasses = [
    "w-full",
    getMaxWidthClass(config.maxWidth),
    getMarginClass(config.margin),
    "mx-auto",
  ];

  // Wewnętrzny kontener - wszystkie style wizualne + innerMargin
  const innerContainerClasses = [getPaddingClass(config.padding)];

  if (config.innerMargin && config.innerMargin !== "none") {
    innerContainerClasses.push(getInnerMarginClass(config.innerMargin));
  }

  if (config.backgroundColor) {
    innerContainerClasses.push(getBackgroundColorClass(config.backgroundColor));
  }

  if (config.borderRadius) {
    innerContainerClasses.push(getBorderRadiusClass(config.borderRadius));
  }

  if (config.shadow) {
    innerContainerClasses.push(getShadowClass(config.shadow));
  }

  const animationClass = ANIMATION_PRESETS.text(isLoaded && isInView, "none");

  return (
    <div
      id={sectionId}
      ref={containerRef}
      className={`${outerContainerClasses.join(" ")} ${animationClass} ${className || ""} relative`}
      role={role}
      aria-labelledby={ariaLabelledBy}
      itemScope={itemScope}
      itemType={itemType}
    >
      <div className={innerContainerClasses.join(" ")}>{children}</div>
    </div>
  );
}
