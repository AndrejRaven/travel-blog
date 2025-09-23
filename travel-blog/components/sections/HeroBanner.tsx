"use client";

import React from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import RichText from "@/components/ui/RichText";
import { HeroBannerData } from "@/lib/component-types";
import {
  getMaxWidthClass,
  getPaddingClass,
  getMarginClass,
  getBackgroundColorClass,
  getBorderRadiusClass,
  getShadowClass,
  getHeightClass,
  generateSectionId,
} from "@/lib/section-utils";
import {
  useResponsiveImage,
  useAnimation,
  getAnimationClass,
  getTextAlignmentClasses,
} from "@/lib/render-utils";

type Props = {
  data: HeroBannerData;
};

export default function HeroBanner({ data }: Props) {
  const { container, layout } = data;

  if (!container || !layout) {
    console.error("HeroBanner: Missing container or layout data");
    return null;
  }

  const { isLoaded, isInView, containerRef } = useAnimation();
  const { getCurrentImage, getOptimizedImageProps } = useResponsiveImage({
    width: 1600,
    mobileWidth: 800,
    quality: 95,
    format: "webp",
    fit: "fillmax",
  });

  const selectedImage = getCurrentImage(data.image, data.mobileImage);
  const imageProps = getOptimizedImageProps(selectedImage);
  const sectionId = container.contentTitle
    ? generateSectionId(container.contentTitle)
    : undefined;

  // Mapowanie szerokości obrazka na   kolumny grid
  const imageColumnMap = { 25: 3, 50: 6, 75: 9 } as const;
  const imageColumns = imageColumnMap[layout.imageWidth] || 6;
  const textColumns = 12 - imageColumns;

  // Klasy pozycjonowania
  const imageOrder =
    layout.imagePosition === "left" ? "lg:order-1" : "lg:order-2";
  const textOrder =
    layout.imagePosition === "left" ? "lg:order-2" : "lg:order-1";
  const mobileImageOrder =
    layout.mobileLayout === "top" ? "order-1" : "order-2";
  const mobileTextOrder = layout.mobileLayout === "top" ? "order-2" : "order-1";

  return (
    <div
      id={sectionId}
      ref={containerRef}
      className={`w-full ${getMaxWidthClass(
        container.maxWidth
      )} ${getPaddingClass(container.padding)} ${getMarginClass(
        container.margin
      )} ${getBorderRadiusClass(container.borderRadius)} ${getShadowClass(
        container.shadow
      )} mx-auto overflow-hidden`}
      role="banner"
    >
      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-0 ${getHeightClass(
          container.height
        )} ${getBackgroundColorClass(
          container.backgroundColor
        )} ${getBorderRadiusClass(container.borderRadius)}`}
      >
        {/* Tekst */}
        <div
          className={`${mobileTextOrder} ${textOrder} lg:col-span-${textColumns} px-6 lg:px-12 py-8 lg:py-16 flex items-center`}
        >
          <div
            className={`${
              layout.textSpacing === "with-spacing" ? "space-y-4" : "space-y-0"
            } ${getTextAlignmentClasses(
              layout.textAlignment
            )} ${getAnimationClass({
              type: "text",
              delay: "none",
              isInView,
              isLoaded,
            })}`}
          >
            <RichText blocks={data.content} />
            {data.buttons && (
              <div className="flex items-center gap-3 flex-wrap">
                {data.buttons.map((button, index) => (
                  <Button
                    key={index}
                    href={button.href}
                    variant={button.variant}
                    external={button.external}
                    className={getAnimationClass({
                      type: "button",
                      delay: "none",
                      isInView,
                      isLoaded,
                    })}
                  >
                    {button.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Obraz */}
        <div
          className={`${mobileImageOrder} ${imageOrder} lg:col-span-${imageColumns} w-full aspect-square lg:aspect-auto lg:h-full`}
        >
          <div className="relative w-full h-full overflow-hidden">
            {imageProps?.src ? (
              <Image
                src={imageProps.src as string}
                alt={
                  selectedImage && "alt" in selectedImage
                    ? selectedImage.alt || "Obraz"
                    : "Obraz"
                }
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
