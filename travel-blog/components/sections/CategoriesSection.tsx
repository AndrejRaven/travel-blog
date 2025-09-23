"use client";

import React from "react";
import Image from "next/image";
import Link from "@/components/ui/Link";
import { useProgressiveAnimation } from "@/lib/useAnimation";
import { ANIMATION_PRESETS } from "@/lib/animations";

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
  const { isLoaded, isInView, containerRef, getItemClass } =
    useProgressiveAnimation(categories.length);

  return (
    <section
      ref={containerRef}
      id="kategorie"
      className={`mx-auto my-8 max-w-7xl px-6 py-12 md:py-16 ${
        showBackground ? "bg-gray-50 dark:bg-gray-900" : ""
      }`}
    >
      <h2
        className={`text-2xl md:text-3xl font-serif font-semibold mb-6 text-gray-900 dark:text-gray-100 ${ANIMATION_PRESETS.sectionHeader(
          isLoaded && isInView
        )}`}
      >
        {title}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category, index) => (
          <Link
            key={category.id}
            href={category.href}
            className={`group rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-500 hover:scale-105 bg-white dark:bg-gray-800 ${getItemClass(
              index
            )}`}
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
