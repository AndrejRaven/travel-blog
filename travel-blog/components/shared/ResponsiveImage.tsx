"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useResponsiveImage } from "@/lib/section-utils";
import { ANIMATION_CLASSES, HOVER_EFFECTS } from "@/lib/animations";

interface ImageData {
  src: string;
  alt?: string;
}

interface ResponsiveImageProps {
  desktopImage?: ImageData;
  mobileImage?: ImageData;
  fallback?: ImageData;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  showHoverEffect?: boolean;
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
  onLoad,
}: ResponsiveImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { isMobile, getCurrentImage } = useResponsiveImage();

  const currentImage = getCurrentImage(desktopImage, mobileImage, fallback);

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

  if (!currentImage.src) {
    return null;
  }

  if (fill) {
    return (
      <Image
        src={currentImage.src}
        alt={currentImage.alt || "Obrazek"}
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
      src={currentImage.src}
      alt={currentImage.alt || "Obrazek"}
      width={width}
      height={height}
      className={imageClasses}
      priority={priority}
      sizes={sizes}
      onLoad={handleLoad}
    />
  );
}
