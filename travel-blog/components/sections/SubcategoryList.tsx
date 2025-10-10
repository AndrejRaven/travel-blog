"use client";

import React from "react";
import Link from "@/components/ui/Link";
import SectionContainer from "@/components/shared/SectionContainer";
import { useAnimation } from "@/lib/useAnimation";
import { getAnimationClass } from "@/lib/render-utils";
import { SubcategoryListData } from "@/lib/component-types";

type Props = {
  data: SubcategoryListData;
};

export default function SubcategoryList({ data }: Props) {
  // Zabezpieczenie na wypadek gdyby data był undefined
  if (!data) {
    console.error("SubcategoryList: Missing data", { data });
    return null;
  }

  const { container, title, subcategories } = data;

  // Zabezpieczenie na wypadek gdyby container był undefined
  if (!container) {
    console.error("SubcategoryList: Missing container data", { container });
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
          {subcategories.map((subcategory, index) => (
            <Link
              key={subcategory.id}
              href={subcategory.href}
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
                    {subcategory.name}
                  </p>
                  <p className="text-sm font-sans text-gray-600 dark:text-gray-400">
                    {subcategory.description}
                  </p>
                  {subcategory.articleCount && (
                    <p className="text-xs font-sans text-gray-500 dark:text-gray-500 mt-1">
                      {subcategory.articleCount} artykułów
                    </p>
                  )}
                </div>
                <div
                  className={`w-4 h-4 rounded-full bg-${subcategory.color}-500`}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </SectionContainer>
  );
}
