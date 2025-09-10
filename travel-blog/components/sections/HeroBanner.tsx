import React from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import RichText from "@/components/ui/RichText";
import { HeroBannerData } from "@/lib/component-types";
import { ThemeColorKey } from "@/lib/hero-test-data";
import { getThemeColorCSS } from "@/lib/theme-colors";

type Props = {
  data: HeroBannerData;
};

export default function HeroBanner({ data }: Props) {
  const { layout } = data;

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
    <section
      className={`w-full grid grid-cols-1 lg:grid-cols-12 gap-0 ${getHeightClass(
        layout.height
      )}`}
      style={{
        backgroundColor: getThemeColorCSS(layout.backgroundColor),
      }}
    >
      {/* Tekst */}
      <div
        className={`${getMobileTextOrder(
          layout.mobileLayout
        )} ${getTextPositionClass(layout.imagePosition)} ${getTextColumnClass(
          textColumns
        )} px-6 lg:px-12 py-8 lg:py-16 flex items-center`}
      >
        <div className={`${getTextSpacingClass(layout.textSpacing)}`}>
          <RichText blocks={data.content} />
          <div className="flex items-center gap-3 flex-wrap">
            {data.buttons?.map((button, index) => (
              <Button
                key={index}
                href={button.href}
                variant={button.variant}
                external={button.external}
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
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src={data.image.src}
            alt={data.image.alt}
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
