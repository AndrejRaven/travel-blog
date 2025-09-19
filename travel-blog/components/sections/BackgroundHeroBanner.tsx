"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import RichText from "@/components/ui/RichText";
import { BackgroundHeroBannerData } from "@/lib/component-types";
import { ChevronDown } from "lucide-react";
import {
  ANIMATION_PRESETS,
  ANIMATION_CLASSES,
  HOVER_EFFECTS,
} from "@/lib/animations";
import {
  getMaxWidthClass,
  getPaddingClass,
  getMarginClass,
  getAlignmentClass,
  getBackgroundColorClass,
  getBorderRadiusClass,
  getShadowClass,
  getHeightClass,
  getTextStyleClass,
  useResponsiveImage,
  generateSectionId,
} from "@/lib/section-utils";

type Props = {
  data: BackgroundHeroBannerData;
};

export default function BackgroundHeroBanner({ data }: Props) {
  const { container, layout } = data;

  // Debug - sprawdź jakie dane przychodzą z Sanity
  console.log("BackgroundHeroBanner data:", {
    textAlignment: layout?.textAlignment,
    fullLayout: layout,
    fullData: data,
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
  const [isInView, setIsInView] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isMobile, getCurrentImage } = useResponsiveImage();

  // Generuj ID na podstawie tytułu treści
  const sectionId = container.contentTitle
    ? generateSectionId(container.contentTitle)
    : undefined;

  // Intersection Observer - animacja uruchamia się gdy komponent wchodzi w viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
          }
        });
      },
      {
        threshold: 0.1, // Uruchamia się gdy 10% komponentu jest widoczne
        rootMargin: "0px 0px -50px 0px", // Dodatkowy margines od dołu
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Auto-hide przycisk po przewinięciu
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      id={sectionId}
      className={`w-full ${getMaxWidthClass(
        container.maxWidth
      )} ${getPaddingClass(container.padding)} ${getMarginClass(
        container.margin
      )} ${getAlignmentClass(container.alignment)} ${getBackgroundColorClass(
        container.backgroundColor
      )} ${getShadowClass(container.shadow)} ${getBorderRadiusClass(
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
          {/* Placeholder podczas ładowania */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
          )}

          {getCurrentImage(data.image, data.mobileImage).src && (
            <Image
              src={getCurrentImage(data.image, data.mobileImage).src}
              alt={
                getCurrentImage(data.image, data.mobileImage).alt || "Tło hero"
              }
              fill
              className={`object-cover ${ANIMATION_CLASSES.main} ${
                imageLoaded && isInView ? "opacity-100" : "opacity-0"
              }`}
              priority
              sizes="100vw"
              onLoad={() => setImageLoaded(true)}
            />
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
          className={`relative z-10 w-full h-full flex items-center px-6 lg:px-12 py-8 lg:py-16 ${
            layout.textAlignment === "center"
              ? "justify-center"
              : layout.textAlignment === "right"
              ? "justify-end"
              : "justify-start"
          }`}
        >
          <div
            className={`max-w-4xl w-full space-y-6 mx-auto ${ANIMATION_PRESETS.text(
              isInView,
              "none"
            )}`}
          >
            <h2 id="section-heading" className="sr-only">
              {data.content?.[0]?.children?.[0]?.text || "Sekcja treści"}
            </h2>

            <div className={getTextStyleClass(layout.textStyle)}>
              <RichText blocks={data.content} textColor="white" />
            </div>

            {data.buttons && data.buttons.length > 0 && (
              <div className={`flex items-center gap-3 flex-wrap`}>
                {data.buttons.map((button, index) => (
                  <Button
                    key={index}
                    href={button.href}
                    variant={button.variant}
                    external={button.external}
                    className={`${ANIMATION_CLASSES.hover} ${HOVER_EFFECTS.basic}`}
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
                setShowScrollButton(false);
              }}
              className={`flex flex-col items-center space-y-1 text-white/70 hover:text-white ${ANIMATION_CLASSES.hover} cursor-pointer group focus:outline-none rounded-lg p-2 hover:bg-white/5`}
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
