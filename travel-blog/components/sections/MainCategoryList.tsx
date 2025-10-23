"use client";

import React from "react";
import Image from "next/image";
import Link from "@/components/ui/Link";
import SectionContainer from "@/components/shared/SectionContainer";
import { useAnimation } from "@/lib/useAnimation";
import { getAnimationClass } from "@/lib/render-utils";
import { MainCategoryListData } from "@/lib/component-types";

type Props = {
  data: MainCategoryListData;
};

export default function MainCategoryList({ data }: Props) {
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
    console.error("MainCategoryList: Missing data", { data });
    return null;
  }

  const { container, title, mainCategories } = data;

  // Zabezpieczenie na wypadek gdyby container był undefined
  if (!container) {
    console.error("MainCategoryList: Missing container data", { container });
    return null;
  }

  const { isLoaded, isInView, containerRef } = useAnimation();

  return (
    <SectionContainer config={container}>
      <section
        ref={containerRef}
        className={`mx-auto my-8 max-w-7xl px-6 py-12 md:py-16`}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mainCategories.map((mainCategory, index) => (
            <Link
              key={mainCategory.id}
              href={mainCategory.href}
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
                    {mainCategory.name}
                  </p>
                  <p className="text-sm font-sans text-gray-600 dark:text-gray-400">
                    {mainCategory.description}
                  </p>
                  {mainCategory.articleCount && (
                    <p className="text-xs font-sans text-gray-500 dark:text-gray-500 mt-1">
                      {mainCategory.articleCount} artykułów
                    </p>
                  )}
                </div>
                {mainCategory.icon?.asset?.url ? (
                  <Image
                    src={mainCategory.icon.asset.url}
                    alt={`Ikona ${mainCategory.name}`}
                    width={28}
                    height={28}
                    className={`opacity-70 group-hover:opacity-100 ${mainCategory.invertOnDark === true ? "dark:invert" : ""} transition-opacity duration-300`}
                  />
                ) : (
                  <div
                    className={`w-7 h-7 rounded-full bg-${mainCategory.color}-500`}
                  />
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </SectionContainer>
  );
}
