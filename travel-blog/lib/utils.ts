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

  // Sprawdź że wszystkie wymagane właściwości istnieją (type guards dla TypeScript)
  if (
    !category.mainCategory ||
    !category.mainCategory.superCategory ||
    !category.mainCategory.superCategory.slug?.current ||
    !category.mainCategory.slug?.current ||
    !category.slug?.current
  ) {
    return "#";
  }

  // Zwróć SEO-friendly URL (po walidacji TypeScript wie że wszystko istnieje)
  return `/${category.mainCategory.superCategory.slug.current}/${category.mainCategory.slug.current}/${category.slug.current}/${slug}`;
}

/**
 * Wyciąga path z canonical URL (obsługuje pełne URL i względne path)
 * Canonical URL NIE jest obowiązkowy - jeśli nie jest ustawiony, używa fallbackPath
 * 
 * @param canonicalUrl - Canonical URL z CMS (może być pełnym URL lub względnym path)
 * @param fallbackPath - Ścieżka do użycia jeśli canonical URL nie jest ustawiony
 * @returns Path do użycia w przekierowaniu (zaczyna się od /)
 */
export function getCanonicalPath(canonicalUrl: string | undefined | null, fallbackPath: string): string {
  // Jeśli canonical URL nie jest ustawiony → użyj fallbackPath
  if (!canonicalUrl || canonicalUrl.trim() === '') {
    return fallbackPath;
  }

  try {
    // Jeśli canonical URL jest pełnym URL (z domeną) → wyciągnij path
    if (canonicalUrl.startsWith('http://') || canonicalUrl.startsWith('https://')) {
      const url = new URL(canonicalUrl);
      return url.pathname;
    }

    // Jeśli canonical URL jest względnym path → użyj go
    if (canonicalUrl.startsWith('/')) {
      return canonicalUrl;
    }

    // Jeśli nie zaczyna się od / → dodaj go
    return `/${canonicalUrl}`;
  } catch (error) {
    // Jeśli błąd parsowania URL → użyj fallbackPath
    console.warn('Error parsing canonical URL, using fallback:', error);
    return fallbackPath;
  }
}
