import React from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import RichText from "@/components/ui/RichText";
import SectionContainer from "@/components/shared/SectionContainer";
import { HeroBannerData } from "@/lib/component-types";
import {
  getBackgroundColorClass,
  getBorderRadiusClass,
  getHeightClass,
} from "@/lib/section-utils";
import { getAnimationClass, getTextAlignmentClasses } from "@/lib/render-utils";
import { getSanityImageProps } from "@/lib/sanity-image";

type Props = {
  data: HeroBannerData;
};

export default function HeroBanner({ data }: Props) {
  const { container, layout } = data;

  if (!container || !layout) {
    console.error("HeroBanner: Missing container or layout data");
    return null;
  }

  const heroImage = data.image || data.mobileImage;
  const heroImageProps = getSanityImageProps(heroImage, {
    quality: 90,
    fit: "fillmax",
  });

  // Mapowanie szerokości obrazka na   kolumny grid
  const imageColumnMap = { 25: 3, 50: 6, 75: 9 } as const;
  const imageColumns = imageColumnMap[layout.imageWidth] || 6;
  const textColumns = 12 - imageColumns;

  const columnClassMap: Record<number, string> = {
    3: "lg:col-span-3",
    4: "lg:col-span-4",
    6: "lg:col-span-6",
    9: "lg:col-span-9",
  };

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
          className={`${mobileTextOrder} ${textOrder} ${
            columnClassMap[textColumns] || "lg:col-span-6"
          } px-6 lg:px-12 py-8 lg:py-16 flex items-center`}
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
          className={`${mobileImageOrder} ${imageOrder} ${
            columnClassMap[imageColumns] || "lg:col-span-6"
          } w-full aspect-[4/3] lg:aspect-auto lg:h-full overflow-hidden`}
        >
          <div className="relative w-full h-full">
            {heroImageProps.src ? (
              <Image
                src={heroImageProps.src}
                alt={heroImageProps.alt}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 55vw, 40vw"
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
