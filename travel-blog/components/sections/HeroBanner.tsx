"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import RichText from "@/components/ui/RichText";
import { HeroBannerData } from "@/lib/component-types";
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
  useResponsiveImage,
  generateSectionId,
} from "@/lib/section-utils";

type Props = {
  data: HeroBannerData;
};

export default function HeroBanner({ data }: Props) {
  const { container, layout } = data;

  // Zabezpieczenie na wypadek gdyby container był undefined
  if (!container || !layout) {
    console.error("HeroBanner: Missing container or layout data", {
      container,
      layout,
    });
    return null;
  }

  const [isInView, setIsInView] = useState(false);
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
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
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

  // Oblicz kolumny dla tekstu i obrazka
  const imageColumns = (layout.imageWidth / 25) * 3; // 25% = 3 kolumny, 50% = 6 kolumn, 75% = 9 kolumn
  const textColumns = 12 - imageColumns;

  // Klasy dla pozycji obrazka na desktop
  const getImagePositionClass = (position: "left" | "right") => {
    return position === "left" ? "lg:order-1" : "lg:order-2";
  };

  // Klasy dla pozycji tekstu na desktop
  const getTextPositionClass = (position: "left" | "right") => {
    return position === "left" ? "lg:order-2" : "lg:order-1";
  };

  // Klasy dla układu mobilnego
  const getMobileImageOrder = (mobileLayout: "top" | "bottom") => {
    return mobileLayout === "top" ? "order-1" : "order-2";
  };

  const getMobileTextOrder = (mobileLayout: "top" | "bottom") => {
    return mobileLayout === "top" ? "order-2" : "order-1";
  };

  // Klasy dla odstępów tekstu
  const getTextSpacingClass = (spacing: "with-spacing" | "no-spacing") => {
    return spacing === "with-spacing" ? "space-y-4" : "space-y-0";
  };

  // Klasy dla kolumn tekstu
  const getTextColumnClass = (columns: number) => {
    switch (columns) {
      case 3:
        return "lg:col-span-3";
      case 6:
        return "lg:col-span-6";
      case 9:
        return "lg:col-span-9";
      default:
        return "lg:col-span-6";
    }
  };

  // Klasy dla kolumn obrazka
  const getImageColumnClass = (columns: number) => {
    switch (columns) {
      case 3:
        return "lg:col-span-3";
      case 6:
        return "lg:col-span-6";
      case 9:
        return "lg:col-span-9";
      default:
        return "lg:col-span-6";
    }
  };

  return (
    <div
      id={sectionId}
      ref={containerRef}
      className={`w-full ${getMaxWidthClass(
        container.maxWidth
      )} ${getPaddingClass(container.padding)} ${getMarginClass(
        container.margin
      )} ${getAlignmentClass(container.alignment)} ${getBorderRadiusClass(
        container.borderRadius
      )} ${getShadowClass(container.shadow)} mx-auto overflow-hidden`}
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
          className={`${getMobileTextOrder(
            layout.mobileLayout
          )} ${getTextPositionClass(layout.imagePosition)} ${getTextColumnClass(
            textColumns
          )} px-6 lg:px-12 py-8 lg:py-16 flex items-center`}
        >
          <div
            className={`${getTextSpacingClass(
              layout.textSpacing
            )} ${ANIMATION_PRESETS.text(isInView, "none")}`}
          >
            <RichText blocks={data.content} />
            <div className={`flex items-center gap-3 flex-wrap`}>
              {data.buttons?.map((button, index) => (
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
          </div>
        </div>

        {/* Obraz */}
        <div
          className={`${getMobileImageOrder(
            layout.mobileLayout
          )} ${getImagePositionClass(
            layout.imagePosition
          )} ${getImageColumnClass(
            imageColumns
          )} w-full aspect-square lg:aspect-auto lg:h-full`}
        >
          <div className={`relative w-full h-full overflow-hidden`}>
            {getCurrentImage(data.image, data.mobileImage).src && (
              <Image
                src={getCurrentImage(data.image, data.mobileImage).src}
                alt={
                  getCurrentImage(data.image, data.mobileImage).alt || "Obrazek"
                }
                fill
                className={`object-cover`}
                priority
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
