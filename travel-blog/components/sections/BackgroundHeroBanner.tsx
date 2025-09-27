"use client";

import React, { useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import RichText from "@/components/ui/RichText";
import { BackgroundHeroBannerData } from "@/lib/component-types";
import { ChevronDown } from "lucide-react";
import {
  getMaxWidthClass,
  getPaddingClass,
  getMarginClass,
  getBackgroundColorClass,
  getBorderRadiusClass,
  getShadowClass,
  getHeightClass,
  getTextStyleClass,
  generateSectionId,
} from "@/lib/section-utils";
import {
  useResponsiveImage,
  useAnimation,
  useScrollIndicator,
  getAnimationClass,
  getTextAlignmentClasses,
  getFlexLayoutClasses,
  getContainerMarginClasses,
  getImagePlaceholderClasses,
  getVerticalAlignmentClasses,
} from "@/lib/render-utils";

type Props = {
  data: BackgroundHeroBannerData;
};

export default function BackgroundHeroBanner({ data }: Props) {
  const { container, layout } = data;

  // Console.log do sprawdzenia danych layout
  console.log("BackgroundHeroBanner - Layout data:", {
    layout,
    verticalAlignment: layout?.verticalAlignment,
    textAlignment: layout?.textAlignment,
  });

  // Zabezpieczenie na wypadek gdyby container był undefined
  if (!container || !layout) {
    console.error("BackgroundHeroBanner: Missing container or layout data", {
      container,
      layout,
    });
    return null;
  }

  const [imageLoaded, setImageLoaded] = useState(false);
  const { isLoaded, isInView, containerRef } = useAnimation();
  const { showScrollButton, hideScrollButton } = useScrollIndicator();
  const { isMobile, getCurrentImage, getOptimizedImageProps } =
    useResponsiveImage({
      width: 1920,
      mobileWidth: 1200,
      quality: 95,
      format: "webp",
      fit: "fillmax",
    });

  const selectedImage = getCurrentImage(data.image, data.mobileImage, {
    src: "/demo-images/demo-asset.png",
    alt: "Tło hero",
  });
  const imageProps = getOptimizedImageProps(selectedImage);

  // Wybierz treść w zależności od urządzenia
  const selectedContent =
    data.mobileContent && isMobile ? data.mobileContent : data.content;

  // Generuj ID na podstawie tytułu treści
  const sectionId = container.contentTitle
    ? generateSectionId(container.contentTitle)
    : undefined;

  return (
    <div
      id={sectionId}
      className={`w-full ${getMaxWidthClass(
        container.maxWidth
      )} ${getPaddingClass(container.padding)} ${getMarginClass(
        container.margin
      )} ${getBackgroundColorClass(container.backgroundColor)} ${getShadowClass(
        container.shadow
      )} ${getBorderRadiusClass(
        container.borderRadius
      )} overflow-hidden mx-auto`}
    >
      <div
        ref={containerRef}
        className={`relative w-full ${getHeightClass(
          container.height
        )} overflow-hidden`}
        role="complementary"
        aria-labelledby="section-heading"
      >
        {/* Obraz w tle */}
        <div className="absolute inset-0 w-full h-full bg-gray-900 dark:bg-gray-800">
          {imageProps?.src ? (
            <Image
              src={imageProps.src as string}
              alt={
                selectedImage && "alt" in selectedImage
                  ? selectedImage.alt || "Tło hero"
                  : "Tło hero"
              }
              fill
              className={`object-cover ${
                imageLoaded && isInView ? "opacity-100" : "opacity-0"
              }`}
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
          )}
        </div>

        {/* Nakładka przyciemniająca */}
        <div
          className="absolute inset-0 w-full h-full bg-black"
          style={{
            opacity: Math.min((layout.overlayOpacity || 30) / 100, 0.6),
          }}
        />

        {/* Zawartość tekstowa */}
        <div
          className={`relative z-10 w-full h-full flex px-6 lg:px-12 py-8 lg:py-16 ${getFlexLayoutClasses(
            layout.textAlignment
          )} ${getVerticalAlignmentClasses(layout.verticalAlignment)}`}
        >
          <div
            className={`max-w-4xl w-full space-y-6 ${getContainerMarginClasses(
              layout.textAlignment
            )} ${getAnimationClass({
              type: "text",
              delay: "none",
              isInView,
              isLoaded,
            })}`}
          >
            <h2 id="section-heading" className="sr-only">
              {selectedContent?.[0]?.children?.[0]?.text || "Sekcja treści"}
            </h2>

            <div
              className={`${getTextStyleClass(
                layout.textStyle
              )} ${getTextAlignmentClasses(layout.textAlignment)}`}
            >
              <RichText blocks={selectedContent} textColor="white" />
            </div>

            {data.buttons && data.buttons.length > 0 && (
              <div className={`flex items-center gap-3 flex-wrap`}>
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

        {/* Wskaźnik przewijania - pokazuje że można przewinąć w dół */}
        {layout.showScrollIndicator && showScrollButton && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 hidden md:block">
            <button
              onClick={() => {
                // Przewiń do następnej sekcji (główna treść)
                const nextSection = document.querySelector(
                  "[data-main-content]"
                );
                if (nextSection) {
                  // Przewiń do elementu z marginesem od góry
                  const elementTop = (nextSection as HTMLElement).offsetTop;
                  const offset = 100; // 100px marginesu od góry
                  window.scrollTo({
                    top: elementTop - offset,
                    behavior: "smooth",
                  });
                } else {
                  // Fallback - przewiń o mniejszą odległość
                  window.scrollBy({
                    top: window.innerHeight * 0.1,
                    behavior: "smooth",
                  });
                }
                // Ukryj przycisk po kliknięciu
                hideScrollButton();
              }}
              className={`flex flex-col items-center space-y-1 text-white/70 hover:text-white cursor-pointer group focus:outline-none rounded-lg p-2 hover:bg-white/5`}
              aria-label="Zobacz więcej treści"
            >
              <span className="text-xs font-medium">Zobacz więcej</span>
              <ChevronDown className="w-4 h-4 animate-pulse group-hover:animate-none" />
            </button>
          </div>
        )}

        {/* Gradient na dole sugerujący kontynuację treści */}
        {layout.showBottomGradient && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
}
