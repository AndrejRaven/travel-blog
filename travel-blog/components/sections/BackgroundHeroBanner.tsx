import type { CSSProperties } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import RichText from "@/components/ui/RichText";
import SectionContainer from "@/components/shared/SectionContainer";
import { BackgroundHeroBannerData } from "@/lib/component-types";
import { ChevronDown } from "lucide-react";
import { getHeightClass } from "@/lib/section-utils";
import {
  getAnimationClass,
  getFlexLayoutClasses,
  getContainerMarginClasses,
  getVerticalAlignmentClasses,
} from "@/lib/render-utils";
import { getSanityImageProps } from "@/lib/sanity-image";

interface Props {
  data: BackgroundHeroBannerData;
}

export default function BackgroundHeroBanner({ data }: Props) {
  const { container, layout } = data;

  if (!container || !layout) {
    console.error("BackgroundHeroBanner: Missing container or layout data", {
      container,
      layout,
    });
    return null;
  }

  const heroImage = data.image || data.mobileImage;
  const heroImageProps = getSanityImageProps(heroImage, {
    alt: container.contentTitle,
    profile: "feature",
    quality: 90,
  });
  const overlayOpacity = Math.min((layout.overlayOpacity ?? 30) / 100, 0.85);
  const gradientStyle: CSSProperties = {
    opacity: overlayOpacity,
  };

  const mobileContent = data.mobileContent?.length ? data.mobileContent : null;

  return (
    <SectionContainer config={container}>
      <div
        className={`relative w-full ${getHeightClass(
          container.height
        )} overflow-hidden`}
        role="complementary"
      >
        <div className="absolute inset-0 w-full h-full bg-gray-900 dark:bg-gray-800">
          <Image
            src={heroImageProps.src}
            alt={heroImageProps.alt || "Tło hero"}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>

        <div
          className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black via-black/70 to-transparent"
          style={gradientStyle}
        />

        <div
          className={`relative z-10 w-full h-full flex px-6 lg:px-12 py-8 lg:py-16 ${getFlexLayoutClasses(
            layout.textAlignment
          )} ${getVerticalAlignmentClasses(layout.verticalAlignment)}`}
        >
          <div
            className={`max-w-4xl w-full space-y-6 ${getContainerMarginClasses(
              layout.textAlignment
            )} ${getAnimationClass({
              type: "text",
              delay: "none",
              isInView: true,
              isLoaded: true,
            })}`}
          >
            {mobileContent ? (
              <>
                <div className="md:hidden">
                  <RichText blocks={mobileContent} textColor="white" />
                </div>
                <div className="hidden md:block">
                  <RichText blocks={data.content} textColor="white" />
                </div>
              </>
            ) : (
              <RichText blocks={data.content} textColor="white" />
            )}

            {data.buttons && data.buttons.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                {data.buttons.map((button, index) => (
                  <Button
                    key={index}
                    href={button.href}
                    variant={button.variant}
                    external={button.external}
                    className={getAnimationClass({
                      type: "button",
                      delay: "none",
                      isInView: true,
                      isLoaded: true,
                    })}
                  >
                    {button.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {layout.showScrollIndicator && (
          <a
            href="#main-content"
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 hidden md:flex flex-col items-center space-y-1 text-white/70 hover:text-white cursor-pointer group focus:outline-none rounded-lg p-2 hover:bg-white/5"
            aria-label="Zobacz więcej treści"
          >
            <span className="text-xs font-medium">Zobacz więcej</span>
            <ChevronDown className="w-4 h-4 animate-pulse group-hover:animate-none" />
          </a>
        )}

        {layout.showBottomGradient && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
        )}
      </div>
    </SectionContainer>
  );
}
