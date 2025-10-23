"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "@/components/ui/Link";
import SectionContainer from "@/components/shared/SectionContainer";
import { useAnimation } from "@/lib/useAnimation";
import { getAnimationClass } from "@/lib/render-utils";
import { CategoriesSectionData } from "@/lib/component-types";
import { SuperCategory } from "@/lib/sanity";
import { fetchGroq } from "@/lib/sanity";
import { QUERIES } from "@/lib/queries";

type Props = {
  data: CategoriesSectionData;
};

export default function CategoriesSection({ data }: Props) {
  const [superCategories, setSuperCategories] = useState<SuperCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mapowanie kolorów do klas Tailwind
  const getCategoryColorClass = (color: string): string => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      red: "bg-red-500",
      purple: "bg-purple-500",
      gray: "bg-gray-500",
    };
    return colorMap[color] || colorMap.gray;
  };

  // Zabezpieczenie na wypadek gdyby data był undefined
  if (!data) {
    console.error("CategoriesSection: Missing data", { data });
    return null;
  }

  const { container, title, showBackground } = data;

  // Zabezpieczenie na wypadek gdyby container był undefined
  if (!container) {
    console.error("CategoriesSection: Missing container data", { container });
    return null;
  }

  const { isLoaded, isInView, containerRef } = useAnimation();

  // Pobierz kategorie nadrzędne
  useEffect(() => {
    const fetchSuperCategories = async () => {
      try {
        const categories = await fetchGroq<SuperCategory[]>(
          QUERIES.HOME.SUPER_CATEGORIES,
          {},
          "CATEGORIES"
        );
        setSuperCategories(categories);
      } catch (error) {
        console.error("Error fetching super categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuperCategories();
  }, []);

  return (
    <SectionContainer config={container}>
      <section
        ref={containerRef}
        id="kategorie"
        className={`mx-auto my-8 max-w-7xl px-6 py-12 md:py-16 ${
          showBackground ? "bg-gray-50 dark:bg-gray-900" : ""
        }`}
      >
        <h2
          className={`text-2xl md:text-3xl font-serif font-semibold mb-6 text-gray-900 dark:text-gray-100 ${getAnimationClass(
            {
              type: "sectionHeader",
              delay: "none",
              isInView: isLoaded && isInView,
              isLoaded: true,
            }
          )}`}
        >
          {title}
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-800 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                  <div className="w-7 h-7 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {superCategories.map((category, index) => (
              <Link
                key={category._id}
                href={`/${category.slug.current}`}
                className={`group rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-500 hover:scale-105 bg-white dark:bg-gray-800 ${getAnimationClass(
                  {
                    type: "text",
                    delay: index < 2 ? "short" : index < 4 ? "medium" : "long",
                    isInView: isLoaded && isInView,
                    isLoaded: true,
                  }
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
                  </div>
                  {category.icon?.asset?.url ? (
                    <Image
                      src={category.icon.asset.url}
                      alt={`Ikona ${category.name}`}
                      width={28}
                      height={28}
                      className={`opacity-70 group-hover:opacity-100 ${category.invertOnDark === true ? "dark:invert" : ""} transition-opacity duration-300`}
                    />
                  ) : (
                    <div
                      className={`w-7 h-7 rounded-full ${getCategoryColorClass(category.color)}`}
                    />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </SectionContainer>
  );
}
