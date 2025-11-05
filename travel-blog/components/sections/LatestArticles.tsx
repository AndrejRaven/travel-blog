"use client";

import React from "react";
import Link from "@/components/ui/Link";
import CategoryBadge from "@/components/ui/CategoryBadge";
import SectionHeader from "@/components/shared/SectionHeader";
import ResponsiveImage from "@/components/shared/ResponsiveImage";
import { getHeightClass } from "@/lib/section-utils";
import AnimatedSection from "@/components/shared/AnimatedSection";
import SectionContainer from "@/components/shared/SectionContainer";
import { ArticlesData } from "@/lib/component-types";
import { ArticleForList } from "@/lib/sanity";
import { getSelectedPosts, getLatestPosts } from "@/lib/queries/functions";
import { getPostUrl } from "@/lib/utils";

// Używamy typu z Sanity
type Article = ArticleForList;

type Props = {
  data: ArticlesData;
  isLoaded?: boolean;
  isInView?: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
};

export default function Articles({
  data,
  isLoaded = true,
  isInView = true,
  containerRef,
}: Props) {
  // Wszystkie hooki muszą być przed wczesnymi returnami
  const [displayedArticles, setDisplayedArticles] = React.useState<Article[]>(
    []
  );
  const [isLoading, setIsLoading] = React.useState(true);

  // Wyciągnij ID artykułów z referencji - używamy useMemo żeby uniknąć nieskończonej pętli
  const selectedArticleIds = React.useMemo(() => {
    return data?.selectedArticles?.map((ref) => ref._ref) || [];
  }, [data?.selectedArticles]);

  // Pobieranie artykułów z Sanity
  React.useEffect(() => {
    if (!data) return;

    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        let articles: Article[] = [];

        if (data.articlesType === "selected" && selectedArticleIds.length > 0) {
          articles = await getSelectedPosts(selectedArticleIds);
        } else if (data.articlesType === "latest") {
          articles = await getLatestPosts(data.maxArticles);
        }

        setDisplayedArticles(articles.slice(0, data.maxArticles));
      } catch (error) {
        console.error("❌ Error fetching articles:", error);
        setDisplayedArticles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, [data, selectedArticleIds]);

  const { container, title, showViewAll, viewAllHref, maxArticles } =
    data || {};

  // Zabezpieczenie na wypadek gdyby container był undefined
  if (!data || !container) {
    console.error("Articles: Missing container data", { container });
    return null;
  }

  // Mapowanie kolorów kategorii do klas Tailwind

  // Funkcja do formatowania daty
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Brak daty";

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 dzień temu";
    if (diffDays < 7) return `${diffDays} dni temu`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} tygodni temu`;
    return date.toLocaleDateString("pl-PL");
  };

  return (
    <SectionContainer config={container} role="region" aria-labelledby={title}>
      <div ref={containerRef} className={`${getHeightClass(container.height)}`}>
        <AnimatedSection
          animationType="sectionHeader"
          animationDelay="none"
          isLoaded={isLoaded}
          isInView={isInView}
          className="flex flex-col md:flex-row md:items-end justify-between mb-6"
        >
          <SectionHeader title={title} />
          {showViewAll && viewAllHref && (
            <div className="flex justify-end mt-2 md:mt-0">
              <Link href={viewAllHref} variant="underline">
                Zobacz wszystko
              </Link>
            </div>
          )}
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: maxArticles }).map((_, index) => (
              <div
                key={`loading-${index}`}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden animate-pulse"
              >
                <div className="aspect-[16/10] bg-gray-300 dark:bg-gray-700" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full" />
                </div>
              </div>
            ))
          ) : displayedArticles.length > 0 ? (
            displayedArticles.map((article, index) => {
              const delay = index < 3 ? "short" : index < 6 ? "medium" : "long";

              const card = (
                <AnimatedSection
                  animationType="text"
                  animationDelay={delay}
                  isLoaded={isLoaded}
                  isInView={isInView}
                  className="relative h-full flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden hover:shadow-lg transition-all duration-500 hover:scale-105 cursor-pointer"
                >
                  <div className="relative aspect-[16/10] bg-gray-50 dark:bg-gray-700">
                    <ResponsiveImage
                      desktopImage={article.coverMobileImage}
                      mobileImage={article.coverMobileImage}
                      fallback={{
                        src: "/demo-images/demo-asset.png",
                        alt: article.title,
                      }}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      quality={95}
                      priority={index < 3}
                    />

                    {/* Badge kategorii na obrazie */}
                    <div
                      className="absolute top-3 left-3 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {article.categories && article.categories.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1">
                          {article.categories.slice(0, 2).map((category) => (
                            <CategoryBadge
                              key={category._id}
                              category={category}
                              showLink={false}
                            />
                          ))}
                          {(article.categories?.length || 0) > 2 && (
                            <span className="text-xs font-medium text-white bg-black/50 px-2 py-1 rounded-full">
                              +{(article.categories?.length || 0) - 2} więcej
                            </span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="p-4 flex-1">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-sans text-gray-500 dark:text-gray-400">
                        <span>{formatDate(article.publishedAt)}</span>
                      </div>
                      <h3 className="font-serif text-2xl font-medium text-gray-900 dark:text-gray-100">
                        {article.title}
                      </h3>
                      {article.description && (
                        <p className="text-sm font-sans text-gray-600 dark:text-gray-300">
                          {article.description}
                        </p>
                      )}
                    </div>
                  </div>
                </AnimatedSection>
              );

              const postUrl = getPostUrl(article);
              return postUrl !== "#" ? (
                <Link
                  key={article._id}
                  href={postUrl}
                  className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
                >
                  {card}
                </Link>
              ) : (
                <React.Fragment key={article._id}>{card}</React.Fragment>
              );
            })
          ) : (
            // Brak artykułów
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 font-sans">
                Brak artykułów do wyświetlenia
              </p>
            </div>
          )}
        </div>
      </div>
    </SectionContainer>
  );
}
