import React from "react";
import HeroBanner from "@/components/sections/HeroBanner";
import BackgroundHeroBanner from "@/components/sections/BackgroundHeroBanner";
import TextContent from "@/components/sections/TextContent";
import ImageCollage from "@/components/sections/ImageCollage";
import EmbedYoutube from "@/components/sections/EmbedYoutube";
import Articles from "@/components/sections/LatestArticles";
import { PostComponent, Articles as ArticlesType } from "@/lib/component-types";
import { SanityImage } from "@/lib/sanity";

// Helper do konwersji obrazu Sanity na format komponentu
const convertImage = (
  image: any
): SanityImage | { src: string; alt: string } => {
  return image?.asset?.url
    ? (image as SanityImage)
    : { src: "", alt: "Brak obrazu" };
};

// Konwersja danych z Sanity na format oczekiwany przez komponenty
const convertToComponentData = (comp: PostComponent) => {
  const baseData: any = {};

  // Mapowanie pól z komponentu do baseData
  const fieldMap = {
    container: comp.container || {
      maxWidth: "6xl",
      padding: "lg",
      margin: { top: "lg", bottom: "lg" },
      backgroundColor: "transparent",
      borderRadius: "none",
      shadow: "none",
      height: "auto",
      contentTitle: (comp as any).title || "Najnowsze artykuły",
    },
    content: "content" in comp ? comp.content || [] : undefined,
    buttons: "buttons" in comp ? comp.buttons : undefined,
    image: "image" in comp ? convertImage(comp.image) : undefined,
    mobileImage:
      "mobileImage" in comp && comp.mobileImage?.asset?.url
        ? (comp.mobileImage as SanityImage)
        : undefined,
  };

  // Dodaj tylko te pola, które istnieją w komponencie
  Object.entries(fieldMap).forEach(([key, value]) => {
    if (value !== undefined) {
      baseData[key] = value;
    }
  });

  return baseData;
};

// Mapa komponentów - znacznie czytelniejsza niż switch
const componentMap = {
  heroBanner: (comp: PostComponent) => (
    <HeroBanner
      data={{
        ...convertToComponentData(comp),
        layout: (comp as any).layout,
      }}
    />
  ),
  backgroundHeroBanner: (comp: PostComponent) => (
    <BackgroundHeroBanner
      data={{
        ...convertToComponentData(comp),
        layout: (comp as any).layout,
      }}
    />
  ),
  textContent: (comp: PostComponent) => (
    <TextContent
      data={{
        ...convertToComponentData(comp),
        layout: (comp as any).layout,
      }}
    />
  ),
  imageCollage: (comp: PostComponent) => (
    <ImageCollage
      data={{
        ...convertToComponentData(comp),
        images:
          (comp as any).images?.map((img: any) => img as SanityImage) || [],
        layout: (comp as any).layout,
      }}
    />
  ),
  articles: (comp: PostComponent) => (
    <Articles
      data={{
        ...convertToComponentData(comp),
        title: (comp as ArticlesType).title || "Najnowsze artykuły",
        showViewAll: (comp as ArticlesType).showViewAll || false,
        viewAllHref: (comp as ArticlesType).viewAllHref,
        articlesType: (comp as ArticlesType).articlesType || "latest",
        selectedArticles: (comp as ArticlesType).selectedArticles || [],
        maxArticles: (comp as ArticlesType).maxArticles || 3,
      }}
    />
  ),
  embedYoutube: (comp: PostComponent) => (
    <EmbedYoutube
      {...{
        ...convertToComponentData(comp),
        title: (comp as any).title,
        description: (comp as any).description,
        videoId: (comp as any).videoId,
        useLatestVideo: (comp as any).useLatestVideo,
      }}
    />
  ),
};

type Props = {
  component: PostComponent;
};

export default function ComponentRenderer({ component }: Props) {
  // Renderuj komponent używając mapy
  const renderComponent =
    componentMap[component._type as keyof typeof componentMap];

  if (!renderComponent) {
    console.warn(`Nieznany typ komponentu: ${component._type}`);
    return null;
  }

  return renderComponent(component);
}
