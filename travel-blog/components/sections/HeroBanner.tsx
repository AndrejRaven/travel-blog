"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import RichText from "@/components/ui/RichText";
import { HeroBannerData } from "@/lib/component-types";

type Props = {
  data: HeroBannerData;
};

export default function HeroBanner({ data }: Props) {
  const { layout } = data;
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer - animacja uruchamia się gdy komponent wchodzi w viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            setTimeout(() => {
              setIsLoaded(true);
            }, 200);
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

  // Klasy dla wysokości baneru
  const getHeightClass = (height: number) => {
    switch (height) {
      case 25:
        return "lg:min-h-[25vh]";
      case 50:
        return "lg:min-h-[50vh]";
      case 75:
        return "lg:min-h-[75vh]";
      default:
        return "lg:min-h-[60vh]";
    }
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
      ref={containerRef}
      className={`w-full grid grid-cols-1 lg:grid-cols-12 gap-0 ${getHeightClass(
        layout.height
      )} bg-gray-50 dark:bg-gray-900`}
      role="banner"
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
          )} transition-all duration-1000 ease-out ${
            isLoaded && isInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <RichText blocks={data.content} />
          <div
            className={`flex items-center gap-3 flex-wrap transition-all duration-1000 ease-out delay-300 ${
              isLoaded && isInView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            {data.buttons?.map((button, index) => (
              <Button
                key={index}
                href={button.href}
                variant={button.variant}
                external={button.external}
                className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
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
        )} ${getImagePositionClass(layout.imagePosition)} ${getImageColumnClass(
          imageColumns
        )} w-full h-64 lg:h-full`}
      >
        <div
          className={`relative w-full h-full overflow-hidden transition-all duration-1000 ease-out delay-200 ${
            isLoaded && isInView
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-8"
          }`}
        >
          <Image
            src={data.image.src}
            alt={data.image.alt}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            priority
          />
        </div>
      </div>
    </div>
  );
}
