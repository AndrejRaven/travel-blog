import { fetchGroq } from '@/lib/sanity';
import { QUERIES } from './index';
import type { 
  Post, 
  HeaderData, 
  ArticleForList, 
  ArticlesData,
  Category
} from '@/lib/sanity';

// ===== POST FUNCTIONS =====

/**
 * Pobierz post po slug
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    return await fetchGroq<Post | null>(QUERIES.POST.BY_SLUG, { slug });
  } catch (error) {
    console.error('❌ Error fetching post by slug:', error);
    return null;
  }
}

/**
 * Pobierz wszystkie slugi postów
 */
export async function getAllPostSlugs(): Promise<string[]> {
  try {
    return await fetchGroq<string[]>(QUERIES.POST.ALL_SLUGS);
  } catch (error) {
    console.error('❌ Error fetching post slugs:', error);
    return [];
  }
}

/**
 * Pobierz najnowsze posty
 */
export async function getLatestPosts(limit: number = 3): Promise<ArticleForList[]> {
  try {
    return await fetchGroq<ArticleForList[]>(QUERIES.POST.LATEST, { limit });
  } catch (error) {
    console.error('❌ Error fetching latest posts:', error);
    return [];
  }
}

/**
 * Pobierz najnowsze artykuły (alias dla kompatybilności wstecznej)
 */
export const getLatestArticles = getLatestPosts;

/**
 * Pobierz wybrane posty po ID
 */
export async function getSelectedPosts(articleIds: string[]): Promise<ArticleForList[]> {
  if (!articleIds || articleIds.length === 0) return [];
  
  try {
    return await fetchGroq<ArticleForList[]>(QUERIES.POST.SELECTED, { articleIds });
  } catch (error) {
    console.error('❌ Error fetching selected posts:', error);
    return [];
  }
}

/**
 * Pobierz wybrane artykuły (alias dla kompatybilności wstecznej)
 */
export const getSelectedArticles = getSelectedPosts;

// ===== HEADER FUNCTIONS =====

/**
 * Pobierz dane headera
 */
export async function getHeaderData(): Promise<HeaderData | null> {
  try {
    return await fetchGroq<HeaderData>(QUERIES.HEADER.DATA);
  } catch (error) {
    console.error('❌ Error fetching header data:', error);
    return null;
  }
}

// ===== ARTICLES COMPONENT FUNCTIONS =====

/**
 * Pobierz dane komponentu articles
 */
export async function getArticlesComponentData(): Promise<ArticlesData | null> {
  try {
    return await fetchGroq<ArticlesData>(QUERIES.ARTICLES.COMPONENT_DATA);
  } catch (error) {
    console.error('❌ Error fetching articles component data:', error);
    return null;
  }
}

// ===== CATEGORY FUNCTIONS =====

/**
 * Pobierz wszystkie kategorie
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    return await fetchGroq<Category[]>(QUERIES.CATEGORY.ALL);
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    return [];
  }
}

/**
 * Pobierz kategorię po slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    return await fetchGroq<Category | null>(QUERIES.CATEGORY.BY_SLUG, { slug });
  } catch (error) {
    console.error('❌ Error fetching category by slug:', error);
    return null;
  }
}

/**
 * Pobierz posty z kategorii
 */
export async function getCategoryPosts(slug: string): Promise<ArticleForList[]> {
  try {
    return await fetchGroq<ArticleForList[]>(QUERIES.CATEGORY.POSTS, { slug });
  } catch (error) {
    console.error('❌ Error fetching category posts:', error);
    return [];
  }
}

// ===== HOME PAGE FUNCTIONS =====

/**
 * Pobierz komponenty strony głównej
 */
export async function getHomePageComponents(): Promise<any[]> {
  try {
    return await fetchGroq<any[]>(QUERIES.HOME.COMPONENTS);
  } catch (error) {
    console.error('❌ Error fetching home page components:', error);
    return [];
  }
}

/**
 * Pobierz dane strony głównej z Sanity
 */
export async function getHomepageData(): Promise<any | null> {
  try {
    return await fetchGroq<any>(QUERIES.HOME.HOMEPAGE_DATA);
  } catch (error) {
    console.error('❌ Error fetching homepage data:', error);
    return null;
  }
}
