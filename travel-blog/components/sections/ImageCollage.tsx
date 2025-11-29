"use client";

import Image from "next/image";
import { ImageCollageData } from "@/lib/component-types";
import { ANIMATION_PRESETS } from "@/lib/animations";
import { getAnimationClass, getImageClasses } from "@/lib/render-utils";
import { useResponsiveImage } from "@/lib/render-hooks";
import ClientSectionContainer from "@/components/shared/ClientSectionContainer";
import ImageLightbox from "./shared/ImageLightbox";

type Props = {
  data: ImageCollageData;
};

const getImageAspectRatio = (
  image?: ImageCollageData["images"][number]
): number | null => {
  const width = image?.asset?.metadata?.dimensions?.width;
  const height = image?.asset?.metadata?.dimensions?.height;

  if (!width || !height) {
    return null;
  }

  return width / height;
};

export default function ImageCollage({ data }: Props) {
  const { container, images, layout } = data;
  const { getOptimizedImageProps } = useResponsiveImage({
    width: 1200,
    quality: 95,
    format: "webp",
    fit: "fillmax",
  });

  if (!images || images.length === 0) return null;

  const mainImage = images[0];
  const thumbnailImages = images.slice(1, layout.thumbnailCount + 1);
  const mainImageAspectRatio = getImageAspectRatio(mainImage);
  const shouldContainMainImage =
    mainImageAspectRatio !== null && mainImageAspectRatio <= 1;

  // Pobierz props dla głównego obrazu
  const mainImageProps = getOptimizedImageProps(mainImage);
  if (!mainImageProps) return null;

  return (
    <ImageLightbox images={images} getImageProps={getOptimizedImageProps}>
      {({ open }) => (
        <ClientSectionContainer config={container}>
          <div
            className={`w-full ${getAnimationClass({
              type: "text",
              delay: "medium",
              isInView: true,
              isLoaded: true,
            })}`}
          >
            {/* Główne zdjęcie */}
            <div
              className={`relative w-full aspect-video min-h-[16rem] sm:min-h-[18rem] lg:min-h-[24rem] rounded-2xl overflow-hidden cursor-pointer group bg-gray-100 dark:bg-gray-900 ${getAnimationClass(
                {
                  type: "image",
                  delay: "short",
                  isInView: true,
                  isLoaded: true,
                }
              )}`}
              onClick={() => open(0)}
            >
              <Image
                {...mainImageProps}
                width={800}
                height={600}
                className={
                  shouldContainMainImage
                    ? getImageClasses(true, "!object-contain object-center")
                    : getImageClasses(true)
                }
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                alt={
                  typeof mainImageProps.alt === "string"
                    ? mainImageProps.alt
                    : "Obraz"
                }
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                <span className="text-white/70 group-hover:text-white text-xs font-medium transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  Zobacz
                </span>
              </div>
            </div>

            {/* Miniaturki */}
            {thumbnailImages.length > 0 && (
              <div
                className={`mt-4 grid gap-3 ${ANIMATION_PRESETS.text(
                  true,
                  "long"
                )} ${
                  thumbnailImages.length === 1
                    ? "grid-cols-1 max-w-xs mx-auto"
                    : thumbnailImages.length === 2
                      ? "grid-cols-2"
                      : thumbnailImages.length === 3
                        ? "grid-cols-3"
                        : "grid-cols-4"
                }`}
              >
                {thumbnailImages.map((image, index) => {
                  const imageProps = getOptimizedImageProps(image);
                  if (!imageProps) return null;

                  return (
                    <div
                      key={index}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group ${ANIMATION_PRESETS.image(
                        true,
                        "medium"
                      )}`}
                      onClick={() => open(index + 1)}
                    >
                      <Image
                        {...imageProps}
                        width={300}
                        height={300}
                        className={getImageClasses(true)}
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                        alt={
                          typeof imageProps.alt === "string"
                            ? imageProps.alt
                            : "Obraz"
                        }
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                        <span className="text-white/70 group-hover:text-white text-xs font-medium transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          Zobacz
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ClientSectionContainer>
      )}
    </ImageLightbox>
  );
}
