"use client";

import React from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import AnimatedSection from "@/components/shared/AnimatedSection";
import SectionContainer from "@/components/shared/SectionContainer";
import { useAnimation } from "@/lib/useAnimation";
import { useResponsiveImage } from "@/lib/render-utils";
import { AboutUsData } from "@/lib/component-types";

type Props = {
  data: AboutUsData;
};

const defaultDescription = [
  "Jesteśmy Aga i Andrej - para, która od kilku lat przemierza świat w poszukiwaniu najpiękniejszych miejsc i najsmaczniejszych potraw. Nasze podróże to nie tylko zwiedzanie, ale przede wszystkim poznawanie lokalnych kultur i tradycji.",
  "Na tym blogu dzielimy się naszymi doświadczeniami, praktycznymi poradami podróżniczymi oraz przepisami kulinarnymi z różnych zakątków świata. Każda podróż to nowa historia do opowiedzenia.",
  "Dołącz do nas w tej podróży pełnej przygód, smaków i niezapomnianych wspomnień!",
];

export default function AboutUs({ data }: Props) {
  // Wszystkie hooki muszą być przed wczesnymi returnami
  // Animacje z opóźnieniem po załadowaniu strony
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isInView, setIsInView] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Użyj useResponsiveImage dla optymalizacji obrazka
  const { getOptimizedImageProps } = useResponsiveImage({
    width: 600,
    height: 600,
    quality: 95,
    format: "webp",
    fit: "fillmax",
  });

  // Uruchom animacje po załadowaniu komponentu
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsInView(true);
      setTimeout(() => {
        setIsLoaded(true);
      }, 100);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // Zabezpieczenie na wypadek gdyby data był undefined
  if (!data) {
    console.error("AboutUs: Missing data", { data });
    return null;
  }

  const {
    container,
    title,
    image,
    imageAlt,
    description,
    contactHref,
    contactText,
  } = data;

  // Zabezpieczenie na wypadek gdyby container był undefined
  if (!container) {
    console.error("AboutUs: Missing container data", { container });
    return null;
  }

  return (
    <SectionContainer config={container}>
      <AnimatedSection
        id="o-nas"
        className="rounded-xl my-8 border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800"
        isLoaded={isLoaded}
        isInView={isInView}
        containerRef={containerRef}
      >
        <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {title}
        </h2>

        {/* ZDJĘCIE */}
        <AnimatedSection
          animationType="image"
          animationDelay="medium"
          className="relative w-full aspect-square overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 mb-4"
          isLoaded={isLoaded}
          isInView={isInView}
        >
          {image?.asset ? (
            (() => {
              const imageProps = getOptimizedImageProps(image);
              return (
                <img
                  {...imageProps}
                  alt={imageAlt}
                  className="object-cover transition-transform duration-300 hover:scale-105 w-full h-full"
                />
              );
            })()
          ) : (
            <Image
              src="/demo-images/demo-asset.png"
              alt={imageAlt}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          )}
        </AnimatedSection>

        {/* OPIS */}
        <div className="space-y-3 mb-4">
          {description.map((paragraph, index) => (
            <AnimatedSection
              key={index}
              animationType="text"
              animationDelay={
                index === 0 ? "long" : index === 1 ? "longer" : "longest"
              }
              className="text-sm text-gray-600 dark:text-gray-300"
              isLoaded={isLoaded}
              isInView={isInView}
            >
              {paragraph}
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection
          animationType="button"
          animationDelay="longest"
          isLoaded={isLoaded}
          isInView={isInView}
        >
          <Button
            href={contactHref}
            variant="outline"
            className="w-full text-xs px-3 py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            {contactText}
          </Button>
        </AnimatedSection>
      </AnimatedSection>
    </SectionContainer>
  );
}
