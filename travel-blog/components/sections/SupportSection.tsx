"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";

interface SupportOption {
  id: string;
  name: string;
  href: string;
  icon?: string;
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer - animacja uruchamia się gdy komponent wchodzi w viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            setTimeout(() => {
              setIsLoaded(true);
            }, 200);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800"
    >
      <h3
        className={`text-lg font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-all duration-1000 ease-out ${
          isLoaded && isInView
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        {title}
      </h3>

      <div className="space-y-4">
        <p
          className={`text-xs text-gray-600 dark:text-gray-300 transition-all duration-1000 ease-out delay-200 ${
            isLoaded && isInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          {description}
        </p>

        {supportOptions.map((option, index) => (
          <div
            key={option.id}
            className={`transition-all duration-1000 ease-out ${
              isLoaded && isInView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
            style={{
              transitionDelay: `${300 + index * 150}ms`,
            }}
          >
            <Button
              href={option.href}
              variant={option.variant || "outline"}
              external
              className="w-full text-xs px-3 py-2 flex items-center justify-center space-x-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              {option.icon ? (
                <Image
                  src={option.icon}
                  alt={option.name}
                  width={16}
                  height={16}
                  className={`w-4 h-4 ${
                    option.id === "revolut" ? "dark:invert" : ""
                  }`}
                />
              ) : option.iconSvg ? (
                <div dangerouslySetInnerHTML={{ __html: option.iconSvg }} />
              ) : null}
              <span>{option.name}</span>
            </Button>
          </div>
        ))}

        <p
          className={`text-xs text-gray-500 dark:text-gray-400 text-center transition-all duration-1000 ease-out delay-500 ${
            isLoaded && isInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          {thankYouMessage}
        </p>
      </div>
    </section>
  );
}
