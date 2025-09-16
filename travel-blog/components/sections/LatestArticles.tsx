"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "@/components/ui/Link";
import SectionHeader from "@/components/shared/SectionHeader";

interface Article {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  image: string;
  slug: string;
}

interface LatestArticlesProps {
  articles?: Article[];
  showViewAll?: boolean;
  viewAllHref?: string;
  maxArticles?: number;
}

const defaultArticles: Article[] = [
  {
    id: 1,
    title: "Tytuł przykładowego artykułu 1",
    excerpt: "Krótki opis artykułu. Placeholder tekst do wypełnienia treścią.",
    category: "Kategoria",
    publishedAt: "2 dni temu",
    image: "/window.svg",
    slug: "przykladowy-artykul-1",
  },
  {
    id: 2,
    title: "Tytuł przykładowego artykułu 2",
    excerpt: "Krótki opis artykułu. Placeholder tekst do wypełnienia treścią.",
    category: "Kategoria",
    publishedAt: "3 dni temu",
    image: "/window.svg",
    slug: "przykladowy-artykul-2",
  },
  {
    id: 3,
    title: "Tytuł przykładowego artykułu 3",
    excerpt: "Krótki opis artykułu. Placeholder tekst do wypełnienia treścią.",
    category: "Kategoria",
    publishedAt: "5 dni temu",
    image: "/window.svg",
    slug: "przykladowy-artykul-3",
  },
];

export default function LatestArticles({
  articles = defaultArticles,
  showViewAll = true,
  viewAllHref = "#",
  maxArticles = 3,
}: LatestArticlesProps) {
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

  const displayedArticles = articles.slice(0, maxArticles);

  return (
    <section
      ref={containerRef}
      id="najnowsze"
      className="mx-auto max-w-7xl px-6"
    >
      <div
        className={`flex items-end justify-between mb-6 transition-all duration-1000 ease-out ${
          isLoaded && isInView
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <SectionHeader title="Najnowsze artykuły" />
        {showViewAll && (
          <Link href={viewAllHref} variant="underline">
            Zobacz wszystko
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayedArticles.map((article, index) => (
          <article
            key={article.id}
            className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden hover:shadow-lg transition-all duration-500 hover:scale-105 ${
              isLoaded && isInView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
            style={{
              transitionDelay: `${(index + 1) * 200}ms`,
            }}
          >
            <div className="relative aspect-[16/10] bg-gray-50 dark:bg-gray-700">
              <Image
                src={article.image}
                alt={article.title}
                fill
                className="object-contain p-6 dark:invert"
              />
            </div>
            <div className="p-4 space-y-2">
              <p className="text-xs font-sans text-gray-500 dark:text-gray-400">
                {article.category} · {article.publishedAt}
              </p>
              <h3 className="font-sans font-medium text-gray-900 dark:text-gray-100">
                {article.title}
              </h3>
              <p className="text-sm font-sans text-gray-600 dark:text-gray-300">
                {article.excerpt}
              </p>
              <Link href={`/post/${article.slug}`} variant="arrow">
                Czytaj dalej
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
