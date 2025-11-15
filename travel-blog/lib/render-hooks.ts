"use client";

import { useState, useEffect } from "react";
import imageUrlBuilder from "@sanity/image-url";
import { projectId, dataset, type SanityImage } from "./sanity";

const builder = imageUrlBuilder({
  projectId: projectId!,
  dataset: dataset!,
});

const urlFor = (source: SanityImage) => builder.image(source);

export interface ImageConfig {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpg" | "png";
  fit?: "fillmax" | "fill" | "crop" | "scale";
  mobileWidth?: number;
  srcSetWidths?: number[];
  sizes?: string;
}

export const useResponsiveImage = (config: ImageConfig = {}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const checkIsMobile = () => setIsMobile(window.innerWidth < 1024);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const getOptimizedImageProps = (
    image: SanityImage | { src: string; alt?: string } | null | undefined,
    fallback?: { src: string; alt: string }
  ) => {
    if (!image) {
      return fallback || { src: "/demo-images/demo-asset.png", alt: "Obraz" };
    }

    if ("src" in image && typeof image.src === "string") {
      return {
        src: image.src,
        alt: image.alt || "Obraz",
      };
    }

    if ("asset" in image && image.asset?.url) {
      const width = isMobile
        ? config.mobileWidth || config.width || 800
        : config.width || 1200;

      const buildVariant = (variantWidth: number) =>
        urlFor(image)
          .width(variantWidth)
          .quality(config.quality || 95)
          .format(config.format || "webp")
          .fit(config.fit || "fillmax")
          .auto("format")
          .url();

      const imageUrl = buildVariant(width);
      const srcSetWidths = config.srcSetWidths || [480, 768, 1024, 1440];
      const srcSet = srcSetWidths
        .map((variantWidth) => `${buildVariant(variantWidth)} ${variantWidth}w`)
        .join(", ");

      return {
        src: imageUrl,
        srcSet,
        sizes:
          config.sizes ||
          "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 1200px",
        alt: image.alt || "Obraz",
      };
    }

    if (fallback) {
      return fallback;
    }

    return {
      src: "/demo-images/demo-asset.png",
      alt: "Obraz",
    };
  };

  const getCurrentImage = (
    desktopImage?: SanityImage | { src: string; alt?: string } | null,
    mobileImage?: SanityImage | { src: string; alt?: string } | null,
    fallback?: { src: string; alt: string }
  ) => {
    if (!isHydrated) {
      return desktopImage || fallback || {
        src: "/demo-images/demo-asset.png",
        alt: "Obraz",
      };
    }

    if (isMobile && mobileImage) return mobileImage;
    if (desktopImage) return desktopImage;
    return fallback || { src: "/demo-images/demo-asset.png", alt: "Obraz" };
  };

  return { isMobile, isHydrated, getOptimizedImageProps, getCurrentImage };
};

