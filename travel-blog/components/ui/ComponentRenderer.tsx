import React from "react";
import HeroBanner from "@/components/sections/HeroBanner";
import BackgroundHeroBanner from "@/components/sections/BackgroundHeroBanner";
import TextContent from "@/components/sections/TextContent";
import ImageCollage from "@/components/sections/ImageCollage";
import {
  PostComponent,
  HeroBannerData,
  BackgroundHeroBannerData,
  TextContentData,
  ImageCollageData,
} from "@/lib/component-types";
import { getImageUrl } from "@/lib/sanity";

type Props = {
  component: PostComponent;
};

export default function ComponentRenderer({ component }: Props) {
  // Debug - sprawdź typ komponentu
  console.log("ComponentRenderer - component type:", component._type);
  console.log("ComponentRenderer - component data:", component);

  // Konwersja danych z Sanity na format oczekiwany przez komponenty
  const convertToComponentData = (comp: PostComponent) => {
    const baseData: any = {};

    // Dodaj content tylko jeśli komponent je ma
    if ("content" in comp) {
      baseData.content = comp.content || [];
    }

    // Dodaj buttons tylko jeśli komponent je ma
    if ("buttons" in comp) {
      baseData.buttons = comp.buttons;
    }

    // Dodaj image tylko jeśli komponent je ma
    if ("image" in comp) {
      const image = comp.image?.asset
        ? {
            src: getImageUrl(comp.image) || "",
            alt: comp.content?.[0]?.children?.[0]?.text || "Obraz",
          }
        : {
            src: "",
            alt: "Brak obrazu",
          };
      baseData.image = image;
    }

    return baseData;
  };

  switch (component._type) {
    case "heroBanner": {
      const heroData: HeroBannerData = {
        ...convertToComponentData(component),
        layout: component.layout,
      } as HeroBannerData;
      return <HeroBanner data={heroData} />;
    }

    case "backgroundHeroBanner": {
      const backgroundData: BackgroundHeroBannerData = {
        ...convertToComponentData(component),
        layout: component.layout,
      } as BackgroundHeroBannerData;
      return <BackgroundHeroBanner data={backgroundData} />;
    }

    case "textContent": {
      const textData: TextContentData = {
        content: component.content || [],
        layout: component.layout,
      };
      return <TextContent data={textData} />;
    }

    case "imageCollage": {
      const collageData: ImageCollageData = {
        images:
          component.images?.map((img) => {
            const src = getImageUrl(img) || "";
            console.log("ImageCollage - img:", img);
            console.log("ImageCollage - src:", src);
            return {
              src,
              alt: img.alt || "Zdjęcie",
            };
          }) || [],
        layout: component.layout,
      };
      console.log("ImageCollage - collageData:", collageData);
      return <ImageCollage data={collageData} />;
    }

    default:
      console.warn(`Nieznany typ komponentu: ${(component as any)._type}`);
      return null;
  }
}
