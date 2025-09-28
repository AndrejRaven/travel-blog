"use client";

import React from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import AnimatedSection from "@/components/shared/AnimatedSection";
import { useAnimation } from "@/lib/useAnimation";

interface SupportOption {
  id: string;
  name: string;
  href: string;
  icon?: string | { asset?: { url?: string } };
  iconSvg?: string;
  variant?: "primary" | "secondary" | "outline" | "youtube";
}

interface SupportSectionProps {
  title?: string;
  description?: string;
  supportOptions?: SupportOption[];
  thankYouMessage?: string;
}

const defaultSupportOptions: SupportOption[] = [
  {
    id: "buymeacoffee",
    name: "Buy Me a Coffee",
    href: "https://buymeacoffee.com/naszblog",
    iconSvg: `<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.5 3h-17C2.67 3 2 3.67 2 4.5v15C2 20.33 2.67 21 3.5 21h17c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5zm-17 1h17v15h-17v-15z" />
      <path d="M6 8h12v1H6V8zm0 2h12v1H6v-1zm0 2h8v1H6v-1z" />
    </svg>`,
    variant: "outline",
  },
  {
    id: "patronite",
    name: "Patronite",
    href: "https://patronite.pl/naszblog",
    icon: "/patronite.svg",
    variant: "outline",
  },
  {
    id: "revolut",
    name: "Revolut",
    href: "https://revolut.com",
    icon: "/revolut.svg",
    variant: "outline",
  },
];

export default function SupportSection({
  title = "Wsparcie naszego bloga",
  description = "Jeśli podoba Ci się nasza treść, możesz nas wesprzeć. Każda złotówka pomaga nam w tworzeniu lepszych artykułów i filmów.",
  supportOptions = defaultSupportOptions,
  thankYouMessage = "Dziękujemy za wsparcie! ❤️",
}: SupportSectionProps) {
  // Użyj ujednoliconego hook useAnimation
  const { isLoaded, isInView, containerRef } = useAnimation();

  return (
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
                        option.id === "revolut" ? "dark:invert" : ""
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
  );
}
