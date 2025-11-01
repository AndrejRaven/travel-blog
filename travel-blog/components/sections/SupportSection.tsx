"use client";

import React from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import AnimatedSection from "@/components/shared/AnimatedSection";
import SectionContainer from "@/components/shared/SectionContainer";
import { useAnimation } from "@/lib/useAnimation";
import { SupportSectionData } from "@/lib/component-types";

type Props = {
  data: SupportSectionData;
};

export default function SupportSection({ data }: Props) {
  // Wszystkie hooki muszą być przed wczesnymi returnami
  const { isLoaded, isInView, containerRef } = useAnimation();

  // Zabezpieczenie na wypadek gdyby data był undefined
  if (!data) {
    console.error("SupportSection: Missing data", { data });
    return null;
  }

  const { container, title, description, supportOptions, thankYouMessage } =
    data;

  // Zabezpieczenie na wypadek gdyby container był undefined
  if (!container) {
    console.error("SupportSection: Missing container data", { container });
    return null;
  }

  return (
    <SectionContainer config={container}>
      <section
        ref={containerRef}
        className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800"
      >
        <AnimatedSection
          animationType="sectionHeader"
          className="text-lg font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4"
          isLoaded={isLoaded}
          isInView={isInView}
        >
          {title}
        </AnimatedSection>

        <div className="space-y-4">
          <AnimatedSection
            animationType="text"
            animationDelay="short"
            className="text-xs text-gray-600 dark:text-gray-300"
            isLoaded={isLoaded}
            isInView={isInView}
          >
            {description}
          </AnimatedSection>

          {supportOptions.map((option, index) => (
            <AnimatedSection
              key={option.id}
              animationType="text"
              animationDelay={
                index === 0 ? "medium" : index === 1 ? "long" : "longer"
              }
              isLoaded={isLoaded}
              isInView={isInView}
            >
              <Button
                href={option.href}
                variant={option.variant || "outline"}
                external
                className="w-full text-xs px-3 py-2 flex items-center justify-center space-x-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                {option.icon ? (
                  (() => {
                    const iconUrl =
                      typeof option.icon === "string"
                        ? option.icon
                        : option.icon.asset?.url;
                    return iconUrl ? (
                      <Image
                        src={iconUrl}
                        alt={option.name}
                        width={16}
                        height={16}
                        className={`w-4 h-4 ${
                          option.invertOnDark === true ? "dark:invert" : ""
                        }`}
                      />
                    ) : null;
                  })()
                ) : option.iconSvg ? (
                  <div dangerouslySetInnerHTML={{ __html: option.iconSvg }} />
                ) : null}
                <span>{option.name}</span>
              </Button>
            </AnimatedSection>
          ))}

          <AnimatedSection
            animationType="text"
            animationDelay="longest"
            className="text-xs text-gray-500 dark:text-gray-400 text-center"
            isLoaded={isLoaded}
            isInView={isInView}
          >
            {thankYouMessage}
          </AnimatedSection>
        </div>
      </section>
    </SectionContainer>
  );
}
