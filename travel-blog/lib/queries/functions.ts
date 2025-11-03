import { fetchGroq, CACHE_STRATEGIES } from '@/lib/sanity';
import { QUERIES } from './index';
import type { 
  Post, 
  HeaderData, 
  ArticleForList, 
  ArticlesData,
  Category
} from '@/lib/sanity';
import { PostComponent } from '@/lib/component-types';

// Typy błędów dla lepszej obsługi
type SanityError = {
  status: number;
  message: string;
  details?: unknown;
};

// Funkcja pomocnicza do obsługi błędów
function handleSanityError(error: unknown, context: string): never {
  const err = error as { status?: number; message?: string; details?: unknown };
  const status = err.status || 500;
  const message = err.message || 'Unknown error';
  
  console.error(`❌ ${context}:`, {
    status,
    message,
    details: err.details || error
  });
  
  // Różne strategie dla różnych błędów
  if (status === 404) {
    throw new Error(`Not found: ${message}`);
  }
  if (status === 401 || status === 403) {
    throw new Error(`Authentication error: ${message}`);
  }
  if (status >= 500) {
    throw new Error(`Server error: ${message}`);
  }
  
  throw new Error(`${context}: ${message}`);
}

// ===== POST FUNCTIONS =====

/**
 * Pobierz post po slug
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    return await fetchGroq<Post | null>(
      QUERIES.POST.BY_SLUG, 
      { slug }, 
      'POSTS'
    );
  } catch (error) {
    const err = error as { message?: string };
    if (err.message?.includes('Not found')) {
      return null; // Post nie istnieje
    }
    handleSanityError(error, 'Error fetching post by slug');
  }
}

/**
 * Pobierz wszystkie slugi postów
 */
export async function getAllPostSlugs(): Promise<string[]> {
  try {
    return await fetchGroq<string[]>(
      QUERIES.POST.ALL_SLUGS, 
      {}, 
      'STATIC'
    );
  } catch (error) {
    handleSanityError(error, 'Error fetching post slugs');
  }
}

/**
 * Typ dla postów z kategoriami (dla generateStaticParams)
 * Zwraca tylko kategorie z pełną hierarchią (3 poziomy: superCategory -> mainCategory -> category)
 */
type PostWithCategories = {
  slug: string;
  categories: Array<{
    category: string;
    mainCategory: string;
    superCategory: string;
  }>;
};

/**
 * Pobierz wszystkie slugi postów wraz z informacjami o kategoriach
 */
export async function getAllPostSlugsWithCategories(): Promise<PostWithCategories[]> {
  try {
    return await fetchGroq<PostWithCategories[]>(
      QUERIES.POST.SLUGS_WITH_CATEGORIES, 
      {}, 
      'STATIC'
    );
  } catch (error) {
    handleSanityError(error, 'Error fetching post slugs with categories');
  }
}

/**
 * Pobierz najnowsze posty
 */
export async function getLatestPosts(limit: number = 3): Promise<ArticleForList[]> {
  try {
    return await fetchGroq<ArticleForList[]>(
      QUERIES.POST.LATEST, 
      { limit }, 
      'POSTS'
    );
  } catch (error) {
    handleSanityError(error, 'Error fetching latest posts');
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
    return await fetchGroq<ArticleForList[]>(
      QUERIES.POST.SELECTED, 
      { articleIds }, 
      'POSTS'
    );
  } catch (error) {
    handleSanityError(error, 'Error fetching selected posts');
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
    return await fetchGroq<HeaderData>(
      QUERIES.HEADER.DATA, 
      {}, 
      'HEADER'
    );
  } catch (error) {
    handleSanityError(error, 'Error fetching header data');
  }
}

// ===== ARTICLES COMPONENT FUNCTIONS =====

/**
 * Pobierz dane komponentu articles
 */
export async function getArticlesComponentData(): Promise<ArticlesData | null> {
  try {
    return await fetchGroq<ArticlesData>(
      QUERIES.ARTICLES.COMPONENT_DATA, 
      {}, 
      'COMPONENTS'
    );
  } catch (error) {
    handleSanityError(error, 'Error fetching articles component data');
  }
}

// ===== CATEGORY FUNCTIONS =====

/**
 * Pobierz wszystkie kategorie
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    return await fetchGroq<Category[]>(
      QUERIES.CATEGORY.ALL, 
      {}, 
      'CATEGORIES'
    );
  } catch (error) {
    handleSanityError(error, 'Error fetching categories');
  }
}

/**
 * Pobierz kategorię po slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    return await fetchGroq<Category | null>(
      QUERIES.CATEGORY.BY_SLUG, 
      { slug }, 
      'CATEGORIES'
    );
  } catch (error) {
    const err = error as { message?: string };
    if (err.message?.includes('Not found')) {
      return null; // Kategoria nie istnieje
    }
    handleSanityError(error, 'Error fetching category by slug');
  }
}

/**
 * Pobierz posty z kategorii
 */
export async function getCategoryPosts(slug: string): Promise<ArticleForList[]> {
  try {
    return await fetchGroq<ArticleForList[]>(
      QUERIES.CATEGORY.POSTS, 
      { slug }, 
      'POSTS'
    );
  } catch (error) {
    handleSanityError(error, 'Error fetching category posts');
  }
}

// ===== HOME PAGE FUNCTIONS =====

/**
 * Pobierz komponenty strony głównej
 */
export async function getHomePageComponents(): Promise<PostComponent[]> {
  try {
    return await fetchGroq<PostComponent[]>(
      QUERIES.HOME.COMPONENTS, 
      {}, 
      'COMPONENTS'
    );
  } catch (error) {
    handleSanityError(error, 'Error fetching home page components');
  }
}

/**
 * Pobierz dane strony głównej z Sanity
 */
export async function getHomepageData(): Promise<unknown | null> {
  try {
    return await fetchGroq<unknown>(
      QUERIES.HOME.HOMEPAGE_DATA, 
      {}, 
      'COMPONENTS'
    );
  } catch (error) {
    handleSanityError(error, 'Error fetching homepage data');
  }
}
