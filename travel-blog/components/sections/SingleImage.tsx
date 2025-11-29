"use client";

import Image from "next/image";
import { Download } from "lucide-react";
import ClientSectionContainer from "@/components/shared/ClientSectionContainer";
import Button from "@/components/ui/Button";
import { useResponsiveImage } from "@/lib/render-hooks";
import { SingleImageData } from "@/lib/component-types";
import ImageLightbox from "./shared/ImageLightbox";

type Props = {
  data: SingleImageData;
};

export default function SingleImage({ data }: Props) {
  const { container, image, caption, description, download } = data;

  const { getOptimizedImageProps } = useResponsiveImage({
    width: 1600,
    quality: 95,
    format: "webp",
    fit: "fillmax",
  });

  if (!container || !image) {
    console.warn("SingleImage: Missing required data", { container, image });
    return null;
  }

  const imageProps = getOptimizedImageProps(image);

  return (
    <ImageLightbox images={[image]} getImageProps={getOptimizedImageProps}>
      {({ open }) => (
        <ClientSectionContainer config={container}>
          <figure className="flex flex-col gap-6">
            <button
              type="button"
              onClick={() => open(0)}
              className="relative w-full rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:focus-visible:ring-gray-600"
              aria-label="Zobacz obraz w powiększeniu"
            >
              <div className="relative w-full h-full min-h-[220px]">
                <Image
                  {...imageProps}
                  width={1600}
                  height={900}
                  className="w-full h-auto object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1600px"
                  alt={
                    typeof imageProps.alt === "string"
                      ? imageProps.alt
                      : "Wykres"
                  }
                  priority={false}
                />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                <span className="text-white/80 group-hover:text-white text-xs font-medium tracking-wide uppercase">
                  Zobacz
                </span>
              </div>
            </button>

            {(caption || description || download?.url) && (
              <figcaption className="flex flex-col gap-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-4 md:p-6">
                {caption && (
                  <p className="text-base md:text-lg font-semibold font-serif text-gray-900 dark:text-gray-100">
                    {caption}
                  </p>
                )}
                {description && (
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                )}
                {download?.url && (
                  <div>
                    <Button
                      href={download.url}
                      external
                      variant="outline"
                      className="gap-2"
                      title={download.label || "Pobierz pełny wykres"}
                    >
                      <Download className="w-4 h-4 text-current" />
                      <span>{download.label || "Pobierz pełny wykres"}</span>
                    </Button>
                  </div>
                )}
              </figcaption>
            )}
          </figure>
        </ClientSectionContainer>
      )}
    </ImageLightbox>
  );
}

