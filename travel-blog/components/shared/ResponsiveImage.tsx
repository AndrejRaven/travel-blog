"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { useResponsiveImage } from "@/lib/render-hooks";
import { ANIMATION_CLASSES, HOVER_EFFECTS } from "@/lib/animations";
import { SanityImage } from "@/lib/sanity";

interface ResponsiveImageProps {
  desktopImage?: SanityImage | { src: string; alt?: string } | null;
  mobileImage?: SanityImage | { src: string; alt?: string } | null;
  fallback?: { src: string; alt: string };
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  showHoverEffect?: boolean;
  quality?: number;
  onLoad?: () => void;
  alt?: string;
}

/**
 * Komponent do obsługi responsywnych obrazków
 * Automatycznie wybiera odpowiedni obrazek dla mobile/desktop
 */
export default function ResponsiveImage({
  desktopImage,
  mobileImage,
  fallback,
  className = "",
  fill = false,
  width,
  height,
  sizes,
  priority = false,
  objectFit = "cover",
  showHoverEffect = false,
  quality = 100,
  onLoad,
  alt,
}: ResponsiveImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasLoadedRef = useRef(false);
  const { getCurrentImage, getOptimizedImageProps } = useResponsiveImage({
    quality,
  });

  const currentImage = getCurrentImage(desktopImage, mobileImage, fallback);
  const optimizedProps = getOptimizedImageProps(currentImage, fallback);

  const handleLoad = () => {
    if (!hasLoadedRef.current) {
      setImageLoaded(true);
      hasLoadedRef.current = true;
    }
    onLoad?.();
  };

  const imageClasses = [
    `object-${objectFit}`,
    showHoverEffect
      ? `${ANIMATION_CLASSES.hover} ${HOVER_EFFECTS.transform}`
      : "",
    className,
    // Dodaj fade-in tylko przy pierwszym ładowaniu
    !imageLoaded ? "opacity-0" : "opacity-100",
    "transition-opacity duration-300",
  ]
    .filter(Boolean)
    .join(" ");

  if (!optimizedProps || !optimizedProps.src) {
    return null;
  }

  const getAltFromSource = (
    image?: SanityImage | { src: string; alt?: string } | null
  ) => {
    if (!image || typeof image === "string") return undefined;
    return image.alt || undefined;
  };

  const derivedAltFromImages =
    getAltFromSource(desktopImage) ?? getAltFromSource(mobileImage);

  const resolvedAlt =
    alt ??
    optimizedProps.alt ??
    derivedAltFromImages ??
    fallback?.alt;

  if (!resolvedAlt) {
    console.warn(
      "ResponsiveImage: brak opisu alternatywnego dla obrazu",
      optimizedProps.src
    );
  }

  const finalAlt = resolvedAlt || "Ilustracja – opis niedostępny";

  if (fill) {
    return (
      <Image
        src={optimizedProps.src}
        alt={finalAlt}
        fill
        className={imageClasses}
        priority={priority}
        quality={quality}
        sizes={sizes}
        onLoad={handleLoad}
      />
    );
  }

  return (
    <Image
      src={optimizedProps.src}
      alt={finalAlt}
      width={width}
      height={height}
      className={imageClasses}
      priority={priority}
      quality={quality}
      sizes={sizes}
      onLoad={handleLoad}
    />
  );
}
