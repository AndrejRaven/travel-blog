/**
 * Wspólne utility functions dla komponentów sekcji
 * Eliminuje duplikację kodu między różnymi sekcjami
 */

// Typy dla konfiguracji kontenerów
export interface ContainerConfig {
  maxWidth: string;
  padding: string;
  margin: { top: string; bottom: string };
  alignment: string;
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

/**
 * Generuje ID sekcji na podstawie tytułu treści
 */
export const generateSectionId = (title: string): string => {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "") // Usuń myślniki z początku i końca
      .replace(/^-/, "section-") // Jeśli zaczyna się od myślnika, dodaj prefix
      .trim() || "section"
  ); // Fallback jeśli pusty string
};

/**
 * Klasy dla maksymalnej szerokości - responsywne z uwzględnieniem spisu treści
 */
export const getMaxWidthClass = (maxWidth: string): string => {
  switch (maxWidth) {
    case "sm":
      return "max-w-sm";
    case "md":
      return "max-w-md";
    case "lg":
      return "max-w-lg";
    case "xl":
      return "max-w-xl";
    case "2xl":
      return "max-w-2xl";
    case "4xl":
      return "max-w-4xl";
    case "6xl":
      return "max-w-6xl xl:max-w-4xl 2xl:max-w-5xl";
    case "full":
      return "max-w-full";
    default:
      return "max-w-4xl";
  }
};

/**
 * Klasy dla paddingu
 */
export const getPaddingClass = (padding: string): string => {
  switch (padding) {
    case "none":
      return "p-0";
    case "xs":
      return "p-2";
    case "sm":
      return "p-4";
    case "md":
      return "p-6";
    case "lg":
      return "p-8";
    case "xl":
      return "p-12";
    case "2xl":
      return "p-16";
    default:
      return "p-6";
  }
};

/**
 * Klasy dla marginesów
 */
export const getMarginClass = (margin: { top: string; bottom: string }): string => {
  const topClass =
    margin.top === "none"
      ? "mt-0"
      : `mt-${
          margin.top === "xs"
            ? "2"
            : margin.top === "sm"
            ? "4"
            : margin.top === "md"
            ? "6"
            : margin.top === "lg"
            ? "8"
            : margin.top === "xl"
            ? "12"
            : margin.top === "2xl"
            ? "16"
            : "16"
        }`;
  const bottomClass =
    margin.bottom === "none"
      ? "mb-0"
      : `mb-${
          margin.bottom === "xs"
            ? "2"
            : margin.bottom === "sm"
            ? "4"
            : margin.bottom === "md"
            ? "6"
            : margin.bottom === "lg"
            ? "8"
            : margin.bottom === "xl"
            ? "12"
            : margin.bottom === "2xl"
            ? "16"
            : "16"
        }`;
  return `${topClass} ${bottomClass}`;
};

/**
 * Klasy dla wyrównania
 */
export const getAlignmentClass = (alignment: string): string => {
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
 * Klasy dla koloru tła
 */
export const getBackgroundColorClass = (backgroundColor: string): string => {
  switch (backgroundColor) {
    case "subtle":
      return "bg-gray-50 dark:bg-gray-800";
    case "accent":
      return "bg-blue-50 dark:bg-blue-900/20";
    case "transparent":
      return "bg-transparent";
    default:
      return "bg-white dark:bg-gray-900";
  }
};

/**
 * Klasy dla zaokrąglenia rogów
 */
export const getBorderRadiusClass = (borderRadius: string): string => {
  switch (borderRadius) {
    case "sm":
      return "rounded-sm";
    case "md":
      return "rounded-md";
    case "lg":
      return "rounded-lg";
    case "xl":
      return "rounded-xl";
    case "full":
      return "rounded-full";
    case "none":
    default:
      return "rounded-none";
  }
};

/**
 * Klasy dla cienia
 */
export const getShadowClass = (shadow: string): string => {
  switch (shadow) {
    case "sm":
      return "shadow-sm";
    case "md":
      return "shadow-md";
    case "lg":
      return "shadow-lg";
    case "xl":
      return "shadow-xl";
    case "2xl":
      return "shadow-2xl";
    case "none":
    default:
      return "shadow-none";
  }
};

/**
 * Klasy dla rozmiaru tekstu
 */
export const getTextSizeClass = (textSize: string): string => {
  switch (textSize) {
    case "sm":
      return "prose-sm";
    case "base":
      return "prose-base";
    case "lg":
      return "prose-lg";
    case "xl":
      return "prose-xl";
    default:
      return "prose-lg";
  }
};

/**
 * Klasy dla stylu tekstu
 */
export const getTextStyleClass = (
  textStyle: "normal" | "bold" | "outline" | "shadow"
): string => {
  switch (textStyle) {
    case "bold":
      return "font-black";
    case "outline":
      return "text-stroke-2 text-stroke-white";
    case "shadow":
      return "drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]";
    case "normal":
    default:
      return "";
  }
};

/**
 * Klasy dla wysokości komponentu
 */
export const getHeightClass = (height: string): string => {
  switch (height) {
    case "10vh":
      return "h-[10vh]";
    case "20vh":
      return "h-[20vh]";
    case "25vh":
      return "lg:min-h-[25vh]";
    case "30vh":
      return "h-[30vh]";
    case "40vh":
      return "h-[40vh]";
    case "50vh":
      return "h-[50vh] lg:min-h-[50vh]";
    case "60vh":
      return "h-[60vh]";
    case "70vh":
      return "h-[70vh] lg:min-h-[75vh]";
    case "75vh":
      return "lg:min-h-[75vh]";
    case "80vh":
      return "h-[80vh]";
    case "90vh":
      return "h-[90vh]";
    case "100vh":
      return "h-[100vh] lg:min-h-[100vh]";
    case "auto":
    default:
      return "h-auto";
  }
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
    getAlignmentClass(config.alignment),
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
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const getCurrentImage = (desktopImage?: { src: string; alt?: string }, mobileImage?: { src: string; alt?: string }, fallback?: { src: string; alt: string }) => {
    if (isMobile && mobileImage?.src) {
      return mobileImage;
    }
    if (desktopImage?.src) {
      return desktopImage;
    }
    return fallback || { src: "/demo-images/demo-asset.png", alt: "Obrazek" };
  };

  return { isMobile, getCurrentImage };
};

// Import useState i useEffect dla hooka
import { useState, useEffect } from "react";
