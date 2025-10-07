"use client";

import React from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import RichText from "@/components/ui/RichText";
import { HeroBannerData } from "@/lib/component-types";
import {
  getBackgroundColorClass,
  getBorderRadiusClass,
  getHeightClass,
} from "@/lib/section-utils";
import {
  useResponsiveImage,
  getAnimationClass,
  getTextAlignmentClasses,
} from "@/lib/render-utils";
import SectionContainer from "@/components/shared/SectionContainer";

type Props = {
  data: HeroBannerData;
};

export default function HeroBanner({ data }: Props) {
  const { container, layout } = data;

  if (!container || !layout) {
    console.error("HeroBanner: Missing container or layout data");
    return null;
  }

  const { getCurrentImage, getOptimizedImageProps } = useResponsiveImage({
    width: 1600,
    mobileWidth: 800,
    quality: 95,
    format: "webp",
    fit: "fillmax",
  });

  const selectedImage = getCurrentImage(data.image, data.mobileImage);
  const imageProps = getOptimizedImageProps(selectedImage);

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
    <SectionContainer config={container} role="banner">
      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-0 h-auto lg:${getHeightClass(
          container.height
        )} ${getBackgroundColorClass(
          container.backgroundColor
        )} ${getBorderRadiusClass(container.borderRadius)} relative overflow-hidden`}
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
              isInView: true,
              isLoaded: true,
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
                      isInView: true,
                      isLoaded: true,
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
          className={`${mobileImageOrder} ${imageOrder} lg:col-span-${imageColumns} w-full aspect-[4/3] lg:aspect-auto lg:h-full overflow-hidden`}
        >
          <div className="relative w-full h-full">
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
    </SectionContainer>
  );
}
