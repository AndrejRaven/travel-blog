import React from "react";
import HeroBanner from "@/components/sections/HeroBanner";
import BackgroundHeroBanner from "@/components/sections/BackgroundHeroBanner";
import {
  PostComponent,
  HeroBannerData,
  BackgroundHeroBannerData,
} from "@/lib/component-types";
import { getImageUrl } from "@/lib/sanity";

type Props = {
  component: PostComponent;
};

export default function ComponentRenderer({ component }: Props) {
  // Konwersja danych z Sanity na format oczekiwany przez komponenty
  const convertToComponentData = (comp: PostComponent) => {
    const baseData = {
      content: comp.content || [],
      buttons: comp.buttons,
    };

    // Konwersja obrazu
    const image = comp.image?.asset
      ? {
          src: getImageUrl(comp.image) || "",
          alt: comp.content?.[0]?.children?.[0]?.text || "Obraz",
        }
      : {
          src: "",
          alt: "Brak obrazu",
        };

    return {
      ...baseData,
      image,
    };
  };

  switch (component._type) {
    case "heroBanner": {
      const heroData: HeroBannerData = {
        ...convertToComponentData(component),
        layout: component.layout,
      };
      return <HeroBanner data={heroData} />;
    }

    case "backgroundHeroBanner": {
      const backgroundData: BackgroundHeroBannerData = {
        ...convertToComponentData(component),
        layout: component.layout,
      };
      return <BackgroundHeroBanner data={backgroundData} />;
    }

    default:
      console.warn(`Nieznany typ komponentu: ${component._type}`);
      return null;
  }
}
