"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "@/components/ui/Link";

interface Category {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: string;
  articleCount?: number;
}

interface CategoriesSectionProps {
  categories?: Category[];
  title?: string;
  showBackground?: boolean;
}

const defaultCategories: Category[] = [
  {
    id: "przygoda",
    name: "Przygoda",
    description: "Krótki opis kategorii",
    href: "/kategoria/przygoda",
    icon: "/file.svg",
    articleCount: 12,
  },
  {
    id: "kuchnia",
    name: "Kuchnia",
    description: "Krótki opis kategorii",
    href: "/kategoria/kuchnia",
    icon: "/file.svg",
    articleCount: 8,
  },
  {
    id: "kultura",
    name: "Kultura",
    description: "Krótki opis kategorii",
    href: "/kategoria/kultura",
    icon: "/file.svg",
    articleCount: 15,
  },
  {
    id: "natura",
    name: "Natura",
    description: "Krótki opis kategorii",
    href: "/kategoria/natura",
    icon: "/file.svg",
    articleCount: 6,
  },
];

export default function CategoriesSection({
  categories = defaultCategories,
  title = "Kategorie artykułów",
  showBackground = true,
}: CategoriesSectionProps) {
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
      id="kategorie"
      className={`mx-auto max-w-7xl px-6 py-12 md:py-16 ${
        showBackground ? "bg-gray-50 dark:bg-gray-900" : ""
      }`}
    >
      <h2
        className={`text-2xl md:text-3xl font-serif font-semibold mb-6 text-gray-900 dark:text-gray-100 transition-all duration-1000 ease-out ${
          isLoaded && isInView
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        {title}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category, index) => (
          <Link
            key={category.id}
            href={category.href}
            className={`group rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-500 hover:scale-105 bg-white dark:bg-gray-800 ${
              isLoaded && isInView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
            style={{
              transitionDelay: `${(index + 1) * 150}ms`,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-sans font-medium text-gray-900 dark:text-gray-100">
                  {category.name}
                </p>
                <p className="text-sm font-sans text-gray-600 dark:text-gray-400">
                  {category.description}
                </p>
                {category.articleCount && (
                  <p className="text-xs font-sans text-gray-500 dark:text-gray-500 mt-1">
                    {category.articleCount} artykułów
                  </p>
                )}
              </div>
              <Image
                src={category.icon}
                alt="Ikona"
                width={28}
                height={28}
                className="opacity-70 group-hover:opacity-100 dark:invert transition-opacity duration-300"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
