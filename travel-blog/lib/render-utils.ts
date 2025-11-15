import { ANIMATION_PRESETS, ANIMATION_CLASSES, HOVER_EFFECTS } from "./animations";

// Typy dla konfiguracji animacji
export interface AnimationConfig {
  type?: "text" | "image" | "sectionHeader" | "button" | "subtle";
  delay?: "none" | "short" | "medium" | "long" | "longest";
  isInView?: boolean;
  isLoaded?: boolean;
}

// Typy dla konfiguracji przycisków
export interface ButtonConfig {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "outline" | "youtube";
  external?: boolean;
  className?: string;
}

/**
 * Generuje klasy animacji na podstawie konfiguracji
 */
export const getAnimationClass = (config: AnimationConfig): string => {
  const { type = "text", delay = "none", isInView = false, isLoaded = false } = config;
  
  switch (type) {
    case "text":
      return ANIMATION_PRESETS.text(isLoaded && isInView, delay);
    case "image":
      return ANIMATION_PRESETS.image(isLoaded && isInView, delay);
    case "sectionHeader":
      return ANIMATION_PRESETS.sectionHeader(isLoaded && isInView);
    case "button":
      return ANIMATION_PRESETS.button(isLoaded && isInView, delay);
    case "subtle":
      return ANIMATION_PRESETS.subtle(isLoaded && isInView, delay);
    default:
      return "";
  }
};

/**
 * Generuje klasy dla obrazków z hover effects
 */
export const getImageClasses = (withHover: boolean = true, customClasses: string = ""): string => {
  const baseClasses = "object-cover w-full h-full";
  const hoverClasses = withHover ? `${ANIMATION_CLASSES.hover} ${HOVER_EFFECTS.transform}` : "";
  
  return [baseClasses, hoverClasses, customClasses].filter(Boolean).join(" ");
};

/**
 * Generuje klasy dla przycisków z animacjami
 */
export const getButtonClasses = (config: ButtonConfig): string => {
  const baseClasses = `${ANIMATION_CLASSES.hover} ${HOVER_EFFECTS.basic}`;
  return [baseClasses, config.className].filter(Boolean).join(" ");
};

/**
 * Generuje klasy dla kontenerów z animacjami
 */
export const getContainerClasses = (
  baseClasses: string,
  animationType: AnimationConfig["type"] = "text",
  delay: AnimationConfig["delay"] = "none",
  isInView: boolean = false,
  isLoaded: boolean = false
): string => {
  const animationClass = getAnimationClass({ type: animationType, delay, isInView, isLoaded });
  return [baseClasses, animationClass].filter(Boolean).join(" ");
};

/**
 * Generuje klasy dla tekstu z wyrównaniem
 */
export const getTextAlignmentClasses = (alignment: "left" | "center" | "right"): string => {
  switch (alignment) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    case "left":
    default:
      return "text-left";
  }
};

/**
 * Generuje klasy dla layoutu flexbox
 */
export const getFlexLayoutClasses = (alignment: "left" | "center" | "right"): string => {
  switch (alignment) {
    case "center":
      return "justify-center";
    case "right":
      return "justify-end";
    case "left":
    default:
      return "justify-start";
  }
};

/**
 * Generuje klasy dla kontenerów z marginesami
 */
export const getContainerMarginClasses = (alignment: "left" | "center" | "right"): string => {
  switch (alignment) {
    case "center":
      return "mx-auto";
    case "right":
      return "ml-auto";
    case "left":
    default:
      return "mr-auto";
  }
};

/**
 * Generuje klasy CSS dla placeholder obrazków podczas ładowania
 */
export const getImagePlaceholderClasses = (className: string = ""): string => {
  const baseClasses = "w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 animate-pulse";
  return className ? `${baseClasses} ${className}` : baseClasses;
};

/**
 * Generuje fallback dla obrazków
 */
export const getImageFallback = (alt: string = "Obraz"): { src: string; alt: string } => ({
  src: "/demo-images/demo-asset.png",
  alt
});

/**
 * Generuje klasy dla modal/overlay
 */
export const getModalClasses = (isOpen: boolean): string => {
  const baseClasses = "fixed inset-0 z-50 flex items-center justify-center p-4";
  const visibilityClasses = isOpen ? "opacity-100 visible" : "opacity-0 invisible";
  const backgroundClasses = "bg-black/50 backdrop-blur-sm";
  
  return [baseClasses, visibilityClasses, backgroundClasses].join(" ");
};

/**
 * Generuje klasy dla przycisków nawigacji
 */
export const getNavigationClasses = (direction: "prev" | "next"): string => {
  const baseClasses = "absolute top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 hover:text-gray-900 transition-all duration-200";
  const positionClasses = direction === "prev" ? "left-4" : "right-4";
  
  return [baseClasses, positionClasses].join(" ");
};

/**
 * Generuje klasy dla wyrównania wertykalnego tekstu
 */
export const getVerticalAlignmentClasses = (alignment: "top" | "center" | "bottom"): string => {
  switch (alignment) {
    case "top":
      return "items-start";
    case "bottom":
      return "items-end";
    case "center":
    default:
      return "items-center";
  }
};
