"use client";

import React from "react";
import Button from "@/components/ui/Button";
import AnimatedSection from "@/components/shared/AnimatedSection";
import SectionContainer from "@/components/shared/SectionContainer";
import { useAnimation } from "@/lib/useAnimation";
import { useResponsiveImage } from "@/lib/render-utils";
import { SanityImage } from "@/lib/sanity";
import { YouTubeChannelData } from "@/lib/component-types";

type Props = {
  data: YouTubeChannelData;
};

export default function YouTubeChannel({ data }: Props) {
  // Wszystkie hooki muszą być przed wczesnymi returnami
  // Użyj ujednoliconego hook useAnimation
  const { isLoaded, isInView, containerRef } = useAnimation();

  // Użyj useResponsiveImage dla optymalizacji obrazka kanału
  const { getOptimizedImageProps } = useResponsiveImage({
    width: 80,
    height: 80,
    quality: 98,
    format: "webp",
    fit: "fillmax",
  });

  // Zabezpieczenie na wypadek gdyby data był undefined
  if (!data) {
    console.error("YouTubeChannel: Missing data", { data });
    return null;
  }

  const {
    container,
    title,
    channelName,
    channelDescription,
    channelHref,
    buttonText,
    buttonVariant,
    channelImage,
  } = data;

  // Zabezpieczenie na wypadek gdyby container był undefined
  if (!container) {
    console.error("YouTubeChannel: Missing container data", { container });
    return null;
  }

  return (
    <SectionContainer config={container}>
      <AnimatedSection
        className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800"
        isLoaded={isLoaded}
        isInView={isInView}
        containerRef={containerRef}
      >
        <h3 className="text-lg font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {title}
        </h3>

        <div className="space-y-4">
          <AnimatedSection
            animationType="text"
            animationDelay="short"
            className="flex items-center space-x-3"
            isLoaded={isLoaded}
            isInView={isInView}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110 overflow-hidden">
              {channelImage ? (
                (() => {
                  const imageProps = getOptimizedImageProps(channelImage);
                  return (
                    <img
                      {...imageProps}
                      className="w-full h-full rounded-full object-cover"
                      alt={imageProps.alt}
                    />
                  );
                })()
              ) : (
                <div className="w-full h-full bg-red-600 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <p className="font-sans font-medium text-gray-900 dark:text-gray-100 text-sm">
                {channelName}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {channelDescription}
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection
            animationType="text"
            animationDelay="medium"
            isLoaded={isLoaded}
            isInView={isInView}
          >
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Obejrzyj nasze najnowsze filmy z podróży i dowiedz się więcej o
              miejscach, które odwiedzamy.
            </p>
          </AnimatedSection>

          <AnimatedSection
            animationType="button"
            animationDelay="longer"
            isLoaded={isLoaded}
            isInView={isInView}
          >
            <Button
              href={channelHref}
              variant={buttonVariant}
              external
              className="w-full text-xs px-3 py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              {buttonText}
            </Button>
          </AnimatedSection>
        </div>
      </AnimatedSection>
    </SectionContainer>
  );
}
