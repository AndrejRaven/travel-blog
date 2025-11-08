import imageUrlBuilder from '@sanity/image-url';
import { createClient } from 'next-sanity';

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "k5fsny25";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";

// Client tylko do odczytu (z CDN dla lepszej wydajności)
export const readOnlyClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // ✅ CDN dla read-only queries
  perspective: 'published',
});

// Client do operacji write (bez CDN)
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // ✅ Bez CDN dla write operations
  token: process.env.SANITY_VIEWER_TOKEN,
  perspective: 'published',
});

// Preview client do podglądu draftów (bez CDN, z perspective: 'drafts')
export const previewClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // ✅ Bez CDN dla preview (zawsze świeże dane)
  token: process.env.SANITY_VIEWER_TOKEN,
  perspective: 'drafts', // ✅ Używa draftów zamiast opublikowanych
});

// Alias dla kompatybilności wstecznej
export const client = writeClient;

// Konfiguracja dla image-url builder
const builder = imageUrlBuilder({
  projectId,
  dataset,
});

// Eksport urlFor dla użycia w komponentach
export const urlFor = (source: SanityImage) => builder.image(source);

type GroqParams = Record<string, unknown>;

// Strategie cacheowania dla różnych typów danych
export const CACHE_STRATEGIES = {
  POSTS: { revalidate: 300 },      // 5 min - często aktualizowane
  CATEGORIES: { revalidate: 3600 }, // 1h - rzadko zmieniane
  HEADER: { revalidate: 3600 },     // 1h - rzadko zmieniane (zwiększone z 30 min)
  COMPONENTS: { revalidate: 1800 },  // 30 min - komponenty strony (zwiększone z 10 min)
  STATIC: { revalidate: 86400 },    // 24h - dane statyczne
} as const;

export async function fetchGroq<T>(
  query: string, 
  params: GroqParams = {},
  cacheStrategy: keyof typeof CACHE_STRATEGIES = 'POSTS'
): Promise<T> {
  // Sprawdź draft mode dynamicznie (tylko w Server Components)
  // W Next.js 15 draftMode() musi być awaitowane
  let isDraft = false;
  try {
    const { draftMode } = await import('next/headers');
    const draft = await draftMode();
    isDraft = draft.isEnabled;
  } catch {
    // W przypadku błędu (np. poza Server Component) kontynuuj bez draft mode
    isDraft = false;
  }

  // Jeśli draft mode jest aktywny, użyj preview client
  if (isDraft) {
    return await previewClient.fetch<T>(query, params);
  }

  // W przeciwnym razie użyj standardowego fetch z cache
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, params }),
    next: {
      ...CACHE_STRATEGIES[cacheStrategy],
      tags: [cacheStrategy.toLowerCase()], // Dodaj tagi dla lepszego cache invalidation
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sanity query failed: ${res.status} ${res.statusText} ${text}`);
  }
  const data = await res.json();
  return data.result as T;
}

export type PortableBlock = {
  _key: string;
  _type: string;
  children?: Array<{ _key: string; _type: string; text?: string }>;
};

export type SanityImage = {
  asset?: {
    _id: string;
    url: string;
    metadata?: {
      dimensions?: {
        width: number;
        height: number;
      };
    };
  };
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
  crop?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  alt?: string;
};

export type Post = {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  slug?: { current: string };
  publishedAt?: string;
  categories?: Array<{
    _id: string;
    name: string;
    slug: { current: string };
    color: string;
    mainCategory?: {
      _id: string;
      name: string;
      slug: { current: string };
      superCategory?: {
        _id: string;
        name: string;
        slug: { current: string };
      };
    };
  }>;
  coverImage?: SanityImage | null;
  coverMobileImage?: SanityImage | null;
  seo?: {
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    canonicalUrl?: string;
    noIndex?: boolean;
    noFollow?: boolean;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: SanityImage | null;
  };
  components?: Array<{
    _type: string;
    _key: string;
    [key: string]: unknown;
  }>;
  comments?: {
    enabled?: boolean;
    moderation?: {
      requireApproval?: boolean;
      maxLength?: number;
      allowReplies?: boolean;
    };
  };
};

// Typ dla artykułów w sekcji LatestArticles
export type ArticleForList = {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  slug?: { current: string };
  publishedAt?: string;
  coverImage?: SanityImage | null;
  coverMobileImage?: SanityImage | null;
  categories?: Array<{
    _id: string;
    name: string;
    slug: { current: string };
    color: string;
    mainCategory?: {
      _id: string;
      name: string;
      slug: { current: string };
      superCategory?: {
        _id: string;
        name: string;
        slug: { current: string };
      };
    };
  }>;
};



export type SubmenuItem = {
  label: string;
  href: string;
  isExternal?: boolean;
};

export type DropdownItem = {
  label: string;
  href?: string;
  isExternal?: boolean;
  hasSubmenu?: boolean;
  submenuItems?: SubmenuItem[];
};

export type MenuItem = {
  label: string;
  href?: string;
  isExternal?: boolean;
  hasDropdown?: boolean;
  dropdownItems?: DropdownItem[];
};

export type SuperCategory = {
  _id: string;
  name: string;
  slug: { current: string };
  color: string;
  description?: string;
  icon?: SanityImage | null;
  invertOnDark?: boolean;
};

export type MainCategory = {
  _id: string;
  name: string;
  slug: { current: string };
  color: string;
  description?: string;
  icon?: SanityImage | null;
  invertOnDark?: boolean;
  superCategory?: {
    _id: string;
    name: string;
    slug: { current: string };
  };
};

export type Category = {
  _id: string;
  name: string;
  slug: { current: string };
  color: string;
  description?: string;
  icon?: SanityImage | null;
  invertOnDark?: boolean;
  mainCategory?: {
    _id: string;
    name: string;
    slug: { current: string };
    superCategory?: {
      _id: string;
      name: string;
      slug: { current: string };
    };
  };
};

export type HeaderData = {
  _id: string;
  title: string;
  logo?: {
    asset?: {
      _id: string;
      url: string;
    };
  } | null;
  mainMenu?: MenuItem[];
  categoriesDropdown: {
    label: string;
    sections: Array<{
      key: string;
      title: string;
      emoji: string;
      items: Array<{
        label: string;
        href: string;
        isExternal?: boolean;
      }>;
    }>;
  };
  mobileMenu: {
    isEnabled: boolean;
    label: string;
  };
};

// Re-export functions from queries for backward compatibility
export { 
  getHeaderData,
  getLatestArticles,
  getSelectedArticles,
  getArticlesComponentData,
  getLatestPosts,
  getSelectedPosts
} from './queries/functions';

// Funkcja do generowania URL obrazu z Sanity z obsługą crop i hotspot
export function getImageUrl(
  image: SanityImage | string | null | undefined,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
    fit?: 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min';
  }
): string | null {
  if (!image) return null;
  
  if (typeof image === 'string') {
    return image;
  }
  
  if (!image.asset?.url) {
    return null;
  }

  try {
    const imageBuilder = builder.image(image);
    
    // Zastosuj crop i hotspot jeśli są dostępne
    if (image.crop && image.asset?.metadata?.dimensions) {
      // Użyj rect() zamiast crop() - rect przyjmuje współrzędne w pikselach
      const { width, height } = image.asset.metadata.dimensions;
      const left = Math.round(image.crop.left * width);
      const top = Math.round(image.crop.top * height);
      const right = Math.round(image.crop.right * width);
      const bottom = Math.round(image.crop.bottom * height);
      
      imageBuilder.rect(left, top, right - left, bottom - top);
    }
    
    if (image.hotspot) {
      imageBuilder.fit('crop').focalPoint(image.hotspot.x, image.hotspot.y);
    }
    
    // Zastosuj opcjonalne parametry
    if (options?.width) {
      imageBuilder.width(options.width);
    }
    
    if (options?.height) {
      imageBuilder.height(options.height);
    }
    
    if (options?.quality) {
      imageBuilder.quality(options.quality);
    }
    
    if (options?.format) {
      imageBuilder.format(options.format);
    }
    
    if (options?.fit) {
      imageBuilder.fit(options.fit);
    }
    
    return imageBuilder.url();
  } catch (error) {
    console.error('Error generating image URL:', error);
    // Fallback do podstawowego URL
    return image.asset.url;
  }
}



