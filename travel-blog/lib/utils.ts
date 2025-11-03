import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ArticleForList, Post } from "@/lib/sanity"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Znajduje główną (pierwszą) kategorię posta z pełną hierarchią
 * Format: /{superCategory}/{mainCategory}/{category}/{slug}
 * 
 * @param article - Post lub ArticleForList z kategoriami
 * @returns Pierwsza kategoria z pełną hierarchią lub null
 */
export function getPrimaryCategory(article: ArticleForList | Post) {
  if (!article.categories || article.categories.length === 0) {
    return null;
  }

  // Znajdź pierwszą kategorię z pełną hierarchią (3 poziomy)
  const category = article.categories.find(
    (cat) =>
      cat.slug?.current &&
      cat.mainCategory?.slug?.current &&
      cat.mainCategory?.superCategory?.slug?.current
  );

  if (!category || !category.slug?.current || !category.mainCategory?.slug?.current || !category.mainCategory?.superCategory?.slug?.current) {
    return null;
  }

  return category;
}

/**
 * Generuje SEO-friendly URL dla posta na podstawie jego głównej kategorii
 * Format: /{superCategory}/{mainCategory}/{category}/{slug}
 * 
 * @param article - Post lub ArticleForList z kategoriami
 * @returns URL posta lub "#" jeśli brak kategorii/slug
 */
export function getPostUrl(article: ArticleForList | Post): string {
  // Sprawdź czy jest slug
  const slug = article.slug?.current;
  if (!slug) {
    return "#";
  }

  // Użyj głównej kategorii (pierwszej z pełną hierarchią)
  const category = getPrimaryCategory(article);
  if (!category) {
    return "#";
  }

  // Zwróć SEO-friendly URL
  return `/${category.mainCategory.superCategory.slug.current}/${category.mainCategory.slug.current}/${category.slug.current}/${slug}`;
}
