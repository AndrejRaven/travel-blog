"use client";

import React from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { useProgressiveAnimation } from "@/lib/useAnimation";
import { ANIMATION_PRESETS } from "@/lib/animations";

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
  // Props dla animacji z głównej strony
  isLoaded?: boolean;
  isInView?: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
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
  // Props dla animacji z głównej strony
  isLoaded: externalIsLoaded,
  isInView: externalIsInView,
  containerRef: externalContainerRef,
}: SupportSectionProps) {
  // Użyj zewnętrznych props jeśli są dostępne, w przeciwnym razie użyj własnego hook
  const {
    isLoaded: internalIsLoaded,
    isInView: internalIsInView,
    containerRef: internalContainerRef,
    getItemClass: internalGetItemClass,
  } = useProgressiveAnimation(supportOptions.length);

  const isLoaded =
    externalIsLoaded !== undefined ? externalIsLoaded : internalIsLoaded;
  const isInView =
    externalIsInView !== undefined ? externalIsInView : internalIsInView;
  const containerRef = externalContainerRef || internalContainerRef;

  // Utwórz własną funkcję getItemClass używającą globalnych stanów
  const getItemClass = (
    index: number,
    preset: keyof typeof ANIMATION_PRESETS = "listItem"
  ) => {
    if (preset === "listItem") {
      return ANIMATION_PRESETS[preset](isLoaded && isInView, index);
    }
    // Dla innych presetów używamy domyślnego opóźnienia
    return ANIMATION_PRESETS[preset](isLoaded && isInView, "medium");
  };

  return (
    <section
      ref={containerRef}
      className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800"
    >
      <h3
        className={`text-lg font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4 ${ANIMATION_PRESETS.sectionHeader(
          isLoaded && isInView
        )}`}
      >
        {title}
      </h3>

      <div className="space-y-4">
        <p
          className={`text-xs text-gray-600 dark:text-gray-300 ${ANIMATION_PRESETS.text(
            isLoaded && isInView,
            "short"
          )}`}
        >
          {description}
        </p>

        {supportOptions.map((option, index) => (
          <div key={option.id} className={getItemClass(index)}>
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
          </div>
        ))}

        <p
          className={`text-xs text-gray-500 dark:text-gray-400 text-center ${ANIMATION_PRESETS.subtle(
            isLoaded && isInView,
            "longest"
          )}`}
        >
          {thankYouMessage}
        </p>
      </div>
    </section>
  );
}
