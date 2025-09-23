"use client";

import React, { useState, useEffect } from "react";
import ComponentRenderer from "@/components/ui/ComponentRenderer";
import TableOfContents from "@/components/ui/TableOfContents";
import Link from "@/components/ui/Link";
import { Post, getImageUrl } from "@/lib/sanity";
import { PostComponent } from "@/lib/component-types";
import { useAnimation, ANIMATION_PRESETS } from "@/lib/useAnimation";

interface PostPageClientProps {
  post: Post;
  tableOfContentsItems: Array<{
    id: string;
    title: string;
    level: number;
  }>;
}

export default function PostPageClient({
  post,
  tableOfContentsItems,
}: PostPageClientProps) {
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Hooki animacji dla różnych sekcji
  const imageAnimation = useAnimation();
  const titleAnimation = useAnimation();
  const metaAnimation = useAnimation();

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const formattedDate = post.publishedAt
    ? new Intl.DateTimeFormat("pl-PL", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      }).format(new Date(post.publishedAt))
    : null;

  // Mapowanie kolorów kategorii do klas Tailwind
  const getCategoryColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      green:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      yellow:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      purple:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      gray: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    };
    return colorMap[color] || colorMap.gray;
  };

  return (
    <main
      className={`relative transition-all duration-300 ${
        isTocOpen ? "lg:ml-80" : ""
      }`}
    >
      {/* Spis treści - tylko jeśli są sekcje z tytułami */}
      {tableOfContentsItems.length > 0 && (
        <TableOfContents
          items={tableOfContentsItems}
          onToggle={setIsTocOpen}
          className=""
        />
      )}

      {/* Obrazek na górze - tylko jeśli nie ma komponentów lub pierwszy komponent nie jest banerem */}
      {(!post.components ||
        post.components.length === 0 ||
        (post.components[0]?._type !== "heroBanner" &&
          post.components[0]?._type !== "backgroundHeroBanner")) &&
        (post.coverImage || post.coverMobileImage) && (
          <div
            ref={imageAnimation.containerRef}
            className={`relative w-full h-[40vh] overflow-hidden ${ANIMATION_PRESETS.sectionHeader(
              imageAnimation.isLoaded && imageAnimation.isInView
            )}`}
          >
            {/* Obrazek desktop */}
            {post.coverImage && (
              <img
                src={
                  getImageUrl(post.coverImage, {
                    width: 1920,
                    height: 800,
                    quality: 85,
                    format: "webp",
                  }) || ""
                }
                alt={post.title}
                className="hidden md:block w-full h-full object-cover"
              />
            )}
            {/* Obrazek mobile */}
            {post.coverMobileImage && (
              <img
                src={
                  getImageUrl(post.coverMobileImage, {
                    width: 768,
                    height: 400,
                    quality: 85,
                    format: "webp",
                  }) || ""
                }
                alt={post.title}
                className="block md:hidden w-full h-full object-cover"
              />
            )}
            {/* Fallback na desktop jeśli nie ma coverMobileImage */}
            {post.coverImage && !post.coverMobileImage && (
              <img
                src={
                  getImageUrl(post.coverImage, {
                    width: 768,
                    height: 400,
                    quality: 85,
                    format: "webp",
                  }) || ""
                }
                alt={post.title}
                className="block md:hidden w-full h-full object-cover"
              />
            )}
          </div>
        )}

      {/* Meta - tylko jeśli nie ma komponentów lub pierwszy komponent nie jest banerem */}
      {(!post.components ||
        post.components.length === 0 ||
        (post.components[0]?._type !== "heroBanner" &&
          post.components[0]?._type !== "backgroundHeroBanner")) && (
        <div
          ref={titleAnimation.containerRef}
          className={`mx-auto max-w-3xl px-6 py-10 text-center ${ANIMATION_PRESETS.sectionHeader(
            titleAnimation.isLoaded && titleAnimation.isInView
          )}`}
        >
          {/* Tytuł */}
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-6 text-gray-900 dark:text-gray-100">
            {post.title}
          </h1>
          {/* Podtytuł */}
          {post?.subtitle && (
            <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight mb-6 text-gray-600 dark:text-gray-300">
              {post.subtitle}
            </h2>
          )}

          <div
            ref={metaAnimation.containerRef}
            className={`mb-4 flex flex-col items-center gap-3 text-sm font-sans text-gray-600 dark:text-gray-400 ${ANIMATION_PRESETS.text(
              metaAnimation.isLoaded && metaAnimation.isInView,
              "medium"
            )}`}
          >
            {/* Data i kategorie w jednym rzędzie na desktop, kolumnie na mobile */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              {formattedDate && (
                <time dateTime={post.publishedAt} className="text-center">
                  {formattedDate}
                </time>
              )}

              {/* Divider między datą a kategoriami */}
              {formattedDate &&
                post.categories &&
                post.categories.length > 0 && (
                  <div className="hidden sm:block w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                )}

              {/* Kategorie - ograniczone do 3 na mobile, więcej na desktop */}
              {post.categories && post.categories.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                  {post.categories
                    .slice(0, isMobile ? 3 : post.categories.length)
                    .map((category) => (
                      <Link
                        key={category._id}
                        href={`/kategoria/${category.slug.current}`}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColorClasses(
                          category.color
                        )} hover:opacity-80 transition-opacity duration-200`}
                      >
                        {category.name}
                      </Link>
                    ))}
                  {/* Pokazuj "+X więcej" jeśli są ukryte kategorie na mobile */}
                  {isMobile && post.categories.length > 3 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      +{post.categories.length - 3} więcej
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Komponenty */}
      {post.components && post.components.length > 0 ? (
        <div className="relative">
          {post.components.map((component, index) => {
            return (
              <div key={component._key} className={`relative`}>
                <ComponentRenderer component={component as PostComponent} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mx-auto max-w-3xl px-6 py-10">
          <p className="text-gray-600 dark:text-gray-400 font-sans">
            Brak treści.
          </p>
        </div>
      )}
    </main>
  );
}
