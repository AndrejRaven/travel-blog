"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useResponsiveImage } from "@/lib/render-utils";
import { ANIMATION_CLASSES, HOVER_EFFECTS } from "@/lib/animations";
import { SanityImage } from "@/lib/sanity";

interface ImageData {
  src: string;
  alt?: string;
}

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
}: ResponsiveImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { isMobile, getCurrentImage, getOptimizedImageProps } =
    useResponsiveImage({ quality });

  const currentImage = getCurrentImage(desktopImage, mobileImage, fallback);
  const optimizedProps = getOptimizedImageProps(currentImage, fallback);

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const imageClasses = [
    `object-${objectFit}`,
    showHoverEffect
      ? `${ANIMATION_CLASSES.hover} ${HOVER_EFFECTS.transform}`
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (!optimizedProps || !optimizedProps.src) {
    return null;
  }

  const alt = (optimizedProps.alt || "Obrazek") as string;

  if (fill) {
    return (
      <Image
        src={optimizedProps.src}
        alt={alt}
        fill
        className={imageClasses}
        priority={priority}
        sizes={sizes}
        onLoad={handleLoad}
      />
    );
  }

  return (
    <Image
      src={optimizedProps.src}
      alt={alt}
      width={width}
      height={height}
      className={imageClasses}
      priority={priority}
      sizes={sizes}
      onLoad={handleLoad}
    />
  );
}
