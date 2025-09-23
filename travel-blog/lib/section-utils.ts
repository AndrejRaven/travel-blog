/**
 * Wspólne utility functions dla komponentów sekcji
 * Eliminuje duplikację kodu między różnymi sekcjami
 */

import { useState, useEffect } from "react";
import { SanityImage } from "./sanity";

// Typy dla konfiguracji kontenerów
export interface ContainerConfig {
  maxWidth: string;
  padding: string;
  margin: { top: string; bottom: string };
  alignment?: string;
  backgroundColor?: string;
  borderRadius?: string;
  shadow?: string;
  contentTitle?: string;
}

// Typy dla konfiguracji layoutu
export interface LayoutConfig {
  textSize?: string;
  textStyle?: "normal" | "bold" | "outline" | "shadow";
  textAlignment?: "left" | "center" | "right";
  textSpacing?: "with-spacing" | "no-spacing";
  overlayOpacity?: number;
  showScrollIndicator?: boolean;
  showBottomGradient?: boolean;
}

// Mapowania dla klas CSS - eliminuje długie switch-case
const MAX_WIDTH_MAP = {
  sm: "max-w-sm",
  md: "max-w-md", 
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "6xl": "max-w-4xl xl:max-w-5xl 2xl:max-w-6xl",
  full: "max-w-full",
} as const;

const PADDING_MAP = {
  none: "p-0",
  xs: "p-2",
  sm: "p-4", 
  md: "p-6",
  lg: "p-8",
  xl: "p-12",
  "2xl": "p-16",
} as const;

const MARGIN_MAP = {
  none: "0",
  xs: "2",
  sm: "4",
  md: "6", 
  lg: "8",
  xl: "12",
  "2xl": "16",
} as const;

const BACKGROUND_COLOR_MAP = {
  subtle: "bg-gray-50 dark:bg-gray-800",
  accent: "bg-blue-50 dark:bg-blue-900/20", 
  transparent: "bg-transparent",
} as const;

const BORDER_RADIUS_MAP = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg", 
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
  none: "rounded-none",
} as const;

const SHADOW_MAP = {
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl", 
  "2xl": "shadow-2xl",
  none: "shadow-none",
} as const;

const TEXT_SIZE_MAP = {
  sm: "prose-sm",
  base: "prose-base",
  lg: "prose-lg",
  xl: "prose-xl",
} as const;

const TEXT_STYLE_MAP = {
  normal: "",
  bold: "font-black",
  outline: "text-stroke-2 text-stroke-white",
  shadow: "drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]",
} as const;

const HEIGHT_MAP = {
  "10vh": "lg:h-[10vh]",
  "20vh": "lg:h-[20vh]", 
  "25vh": "lg:min-h-[25vh]",
  "30vh": "lg:h-[30vh]",
  "40vh": "lg:h-[40vh]",
  "50vh": "lg:min-h-[50vh]",
  "60vh": "lg:h-[60vh]",
  "70vh": "lg:min-h-[75vh]",
  "75vh": "lg:min-h-[75vh]",
  "80vh": "lg:h-[80vh]",
  "90vh": "lg:h-[90vh]",
  "100vh": "lg:min-h-[100vh]",
  auto: "h-auto",
} as const;

/**
 * Uniwersalna funkcja do generowania klas CSS z mapowania
 */
const getClassFromMap = <T extends Record<string, string>>(
  map: T,
  key: string,
  fallback: string
): string => {
  return map[key as keyof T] || fallback;
};

/**
 * Generuje ID sekcji na podstawie tytułu treści
 */
export const generateSectionId = (title: string): string => {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/^-/, "section-")
      .trim() || "section"
  );
};

/**
 * Klasy dla maksymalnej szerokości
 */
export const getMaxWidthClass = (maxWidth: string): string => {
  return getClassFromMap(MAX_WIDTH_MAP, maxWidth, "max-w-4xl");
};

/**
 * Klasy dla paddingu
 */
export const getPaddingClass = (padding: string): string => {
  return getClassFromMap(PADDING_MAP, padding, "p-6");
};

/**
 * Klasy dla marginesów
 */
export const getMarginClass = (margin: { top: string; bottom: string }): string => {
  const topValue = getClassFromMap(MARGIN_MAP, margin.top, "16");
  const bottomValue = getClassFromMap(MARGIN_MAP, margin.bottom, "16");
  
  const topClass = margin.top === "none" ? "mt-0" : `mt-${topValue}`;
  const bottomClass = margin.bottom === "none" ? "mb-0" : `mb-${bottomValue}`;
  
  return `${topClass} ${bottomClass}`;
};

/**
 * Klasy dla koloru tła
 */
export const getBackgroundColorClass = (backgroundColor: string): string => {
  return getClassFromMap(BACKGROUND_COLOR_MAP, backgroundColor, "bg-white dark:bg-gray-900");
};

/**
 * Klasy dla zaokrąglenia rogów
 */
export const getBorderRadiusClass = (borderRadius: string): string => {
  return getClassFromMap(BORDER_RADIUS_MAP, borderRadius, "rounded-none");
};

/**
 * Klasy dla cienia
 */
export const getShadowClass = (shadow: string): string => {
  return getClassFromMap(SHADOW_MAP, shadow, "shadow-none");
};

/**
 * Klasy dla rozmiaru tekstu
 */
export const getTextSizeClass = (textSize: string): string => {
  return getClassFromMap(TEXT_SIZE_MAP, textSize, "prose-lg");
};

/**
 * Klasy dla stylu tekstu
 */
export const getTextStyleClass = (textStyle: "normal" | "bold" | "outline" | "shadow"): string => {
  return TEXT_STYLE_MAP[textStyle] || "";
};

/**
 * Klasy dla wysokości komponentu
 */
export const getHeightClass = (height: string): string => {
  return getClassFromMap(HEIGHT_MAP, height, "h-auto");
};

/**
 * Generuje klasy CSS dla kontenera na podstawie konfiguracji
 */
export const getContainerClasses = (config: ContainerConfig): string => {
  const classes = [
    "w-full",
    getMaxWidthClass(config.maxWidth),
    getPaddingClass(config.padding),
    getMarginClass(config.margin),
  ];

  if (config.backgroundColor) {
    classes.push(getBackgroundColorClass(config.backgroundColor));
  }

  if (config.borderRadius) {
    classes.push(getBorderRadiusClass(config.borderRadius));
  }

  if (config.shadow) {
    classes.push(getShadowClass(config.shadow));
  }

  classes.push("mx-auto");

  return classes.join(" ");
};

/**
 * Hook do obsługi responsywnych obrazków
 */
export const useResponsiveImage = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 1024);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const hasValidImage = (image?: { src: string; alt?: string } | SanityImage): boolean => {
    if (!image) return false;
    return Boolean(('src' in image && image.src?.trim()) || ('asset' in image && image.asset?.url));
  };

  const getCurrentImage = (
    desktopImage?: { src: string; alt?: string } | SanityImage,
    mobileImage?: { src: string; alt?: string } | SanityImage,
    fallback?: { src: string; alt: string }
  ) => {
    if (isMobile && hasValidImage(mobileImage)) return mobileImage;
    if (hasValidImage(desktopImage)) return desktopImage;
    if (fallback) return fallback;
    return { src: "/demo-images/demo-asset.png", alt: "Obrazek" };
  };

  const getOptimizedImageProps = (image?: { src: string; alt?: string } | SanityImage) => {
    if (!image) return null;
    
    if ('src' in image && typeof image.src === 'string') {
      return { src: image.src, alt: image.alt || "Obraz" };
    }
    
    if ('asset' in image && image.asset?.url) {
      return { isSanityImage: true, asset: image.asset, alt: "Obraz" };
    }
    
    return null;
  };

  return { isMobile, getCurrentImage, getOptimizedImageProps };
};
