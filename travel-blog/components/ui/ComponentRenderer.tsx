import React from "react";
import HeroBanner from "@/components/sections/HeroBanner";
import BackgroundHeroBanner from "@/components/sections/BackgroundHeroBanner";
import TextContent from "@/components/sections/TextContent";
import ImageCollage from "@/components/sections/ImageCollage";
import Articles from "@/components/sections/LatestArticles";
import EmbedYoutube from "@/components/sections/EmbedYoutube";
import {
  PostComponent,
  Articles as ArticlesType,
  EmbedYoutube as EmbedYoutubeType,
  HeroBanner as HeroBannerType,
  BackgroundHeroBanner as BackgroundHeroBannerType,
  TextContent as TextContentType,
  ImageCollage as ImageCollageType,
  BaseContainer,
  RichTextBlock,
  Button,
} from "@/lib/component-types";
import { SanityImage } from "@/lib/sanity";

// Helper do konwersji obrazu Sanity na format komponentu
const convertImage = (
  image: unknown
): SanityImage | { src: string; alt: string } => {
  const img = image as SanityImage;
  return img?.asset?.url ? img : { src: "", alt: "Brak obrazu" };
};

// Type for component data that can be passed to components
type ComponentDataBase = {
  container: BaseContainer;
  content?: RichTextBlock[];
  mobileContent?: RichTextBlock[];
  buttons?: Button[];
  image?: SanityImage | { src: string; alt: string };
  mobileImage?: SanityImage | { src: string; alt: string };
};

// Konwersja danych z Sanity na format oczekiwany przez komponenty
const convertToComponentData = (comp: PostComponent): ComponentDataBase => {
  const baseData: Partial<ComponentDataBase> = {};

  // Mapowanie pól z komponentu do baseData
  const title =
    "_type" in comp && comp._type === "articles"
      ? (comp as ArticlesType).title
      : undefined;

  baseData.container = comp.container || {
    maxWidth: "6xl",
    padding: "lg",
    margin: { top: "lg", bottom: "lg" },
    backgroundColor: "transparent",
    borderRadius: "none",
    shadow: "none",
    height: "auto",
    contentTitle: title || "Najnowsze artykuły",
  };

  if ("content" in comp && comp.content) {
    baseData.content = comp.content;
  }

  if ("mobileContent" in comp && comp.mobileContent) {
    baseData.mobileContent = comp.mobileContent;
  }

  if ("buttons" in comp && comp.buttons) {
    baseData.buttons = comp.buttons;
  }

  if ("image" in comp && comp.image) {
    baseData.image = convertImage(comp.image);
  }

  if ("mobileImage" in comp && comp.mobileImage?.asset?.url) {
    baseData.mobileImage = convertImage(comp.mobileImage);
  }

  return baseData as ComponentDataBase;
};

// Mapa komponentów - znacznie czytelniejsza niż switch
const componentMap = {
  heroBanner: (comp: PostComponent) => {
    const heroBanner = comp as HeroBannerType;
    return (
      <HeroBanner
        data={
          {
            ...convertToComponentData(comp),
            layout: heroBanner.layout,
          } as Parameters<typeof HeroBanner>[0]["data"]
        }
      />
    );
  },
  backgroundHeroBanner: (comp: PostComponent) => {
    const bgHeroBanner = comp as BackgroundHeroBannerType;
    return (
      <BackgroundHeroBanner
        data={
          {
            ...convertToComponentData(comp),
            layout: bgHeroBanner.layout,
          } as Parameters<typeof BackgroundHeroBanner>[0]["data"]
        }
      />
    );
  },
  textContent: (comp: PostComponent) => {
    const textContent = comp as TextContentType;
    return (
      <TextContent
        data={
          {
            ...convertToComponentData(comp),
            layout: textContent.layout,
          } as Parameters<typeof TextContent>[0]["data"]
        }
      />
    );
  },
  imageCollage: (comp: PostComponent) => {
    const imageCollage = comp as ImageCollageType;
    return (
      <ImageCollage
        data={
          {
            ...convertToComponentData(comp),
            images: imageCollage.images || [],
            layout: imageCollage.layout,
          } as Parameters<typeof ImageCollage>[0]["data"]
        }
      />
    );
  },
  articles: (
    comp: PostComponent,
    animationProps?: {
      isLoaded: boolean;
      isInView: boolean;
      containerRef?: React.RefObject<HTMLDivElement>;
    }
  ) => {
    const articles = comp as ArticlesType;
    return (
      <Articles
        data={{
          ...convertToComponentData(comp),
          title: articles.title || "Najnowsze artykuły",
          showViewAll: articles.showViewAll || false,
          viewAllHref: articles.viewAllHref,
          articlesType: articles.articlesType || "latest",
          selectedArticles: articles.selectedArticles || [],
          maxArticles: articles.maxArticles || 3,
        }}
        {...animationProps}
      />
    );
  },
  embedYoutube: (comp: PostComponent) => {
    const embedYoutube = comp as EmbedYoutubeType & {
      publishedAt?: string | null;
    };
    return (
      <EmbedYoutube
        {
          ...({
            ...convertToComponentData(comp),
            title: embedYoutube.title,
            description: embedYoutube.description,
            videoId: embedYoutube.videoId,
            useLatestVideo: embedYoutube.useLatestVideo,
            publishedAt: embedYoutube.publishedAt,
          } as Parameters<typeof EmbedYoutube>[0])
        }
      />
    );
  },
};

type Props = {
  component: PostComponent;
  animationProps?: {
    isLoaded: boolean;
    isInView: boolean;
    containerRef?: React.RefObject<HTMLDivElement>;
  };
};

export default function ComponentRenderer({
  component,
  animationProps,
}: Props) {
  // Renderuj komponent używając mapy
  const renderComponent =
    componentMap[component._type as keyof typeof componentMap];

  if (!renderComponent) {
    console.warn(`Nieznany typ komponentu: ${component._type}`);
    return null;
  }

  return renderComponent(component, animationProps);
}
