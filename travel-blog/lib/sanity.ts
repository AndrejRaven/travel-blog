import imageUrlBuilder from '@sanity/image-url';
import { createClient } from 'next-sanity';

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";

// Funkcja pomocnicza do walidacji zmiennych środowiskowych
function validateSanityConfig() {
  if (!projectId) {
    throw new Error(
      "NEXT_PUBLIC_SANITY_PROJECT_ID environment variable is required"
    );
  }

  if (!dataset) {
    throw new Error(
      "NEXT_PUBLIC_SANITY_DATASET environment variable is required"
    );
  }
}

// Lazy initialization dla klientów - tworzone tylko gdy są potrzebne
let _readOnlyClient: ReturnType<typeof createClient> | null = null;
let _writeClient: ReturnType<typeof createClient> | null = null;
let _previewClient: ReturnType<typeof createClient> | null = null;
let _builder: ReturnType<typeof imageUrlBuilder> | null = null;

// Client tylko do odczytu (z CDN dla lepszej wydajności)
function getReadOnlyClient() {
  if (!_readOnlyClient) {
    if (!projectId || !dataset) {
      throw new Error(
        "NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET environment variables are required"
      );
    }
    _readOnlyClient = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
      perspective: 'published',
    });
  }
  return _readOnlyClient;
}

// Client do operacji write (bez CDN)
function getWriteClient() {
  if (!_writeClient) {
    if (!projectId || !dataset) {
      throw new Error(
        "NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET environment variables are required"
      );
    }
    _writeClient = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token: process.env.SANITY_VIEWER_TOKEN,
      perspective: 'published',
    });
  }
  return _writeClient;
}

// Preview client do podglądu draftów (bez CDN, z perspective: 'drafts')
function getPreviewClient() {
  if (!_previewClient) {
    if (!projectId || !dataset) {
      throw new Error(
        "NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET environment variables are required"
      );
    }
    _previewClient = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token: process.env.SANITY_VIEWER_TOKEN,
      perspective: 'drafts',
    });
  }
  return _previewClient;
}

// Eksport klientów - lazy initialization przy pierwszym użyciu
// Używamy Proxy aby uniknąć wywołania podczas importu
type SanityClient = ReturnType<typeof createClient>;

function createLazyClient(getter: () => SanityClient): SanityClient {
  return new Proxy({} as SanityClient, {
    get(_target, prop) {
      const client = getter();
      const value = (client as unknown as Record<string, unknown>)[prop as string];
      if (typeof value === 'function') {
        return value.bind(client);
      }
      return value;
    }
  });
}

export const readOnlyClient = createLazyClient(getReadOnlyClient);
export const writeClient = createLazyClient(getWriteClient);
export const previewClient = createLazyClient(getPreviewClient);

// Alias dla kompatybilności wstecznej
export const client = writeClient;

// Konfiguracja dla image-url builder - lazy initialization
function getBuilder() {
  if (!_builder) {
    validateSanityConfig();
    _builder = imageUrlBuilder({
      projectId: projectId!,
      dataset: dataset!,
    });
  }
  return _builder;
}

// Eksport urlFor dla użycia w komponentach
export const urlFor = (source: SanityImage) => getBuilder().image(source);

type GroqParams = Record<string, unknown>;

// Strategie cacheowania dla różnych typów danych
export const CACHE_STRATEGIES = {
  POSTS: { revalidate: 300 },      // 5 min - często aktualizowane
  CATEGORIES: { revalidate: 3600 }, // 1h - rzadko zmieniane
  HEADER: { revalidate: 3600 },     // 1h - rzadko zmieniane (zwiększone z 30 min)
  COMPONENTS: { revalidate: 1800 },  // 30 min - komponenty strony (zwiększone z 10 min)
  CONFIG: { revalidate: 3600 },      // 1h - ustawienia globalne
  STATIC: { revalidate: 86400 },    // 24h - dane statyczne
} as const;

export async function fetchGroq<T>(
  query: string, 
  params: GroqParams = {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    try {
      return await previewClient.fetch<T>(query, params);
    } catch {
      // Jeśli preview client nie działa, użyj readOnlyClient jako fallback
      return await readOnlyClient.fetch<T>(query, params);
    }
  }

  // Zawsze używaj readOnlyClient (ma lazy initialization i obsługuje brakujące zmienne środowiskowe)
  // readOnlyClient używa Proxy, więc getReadOnlyClient() zostanie wywołane tylko przy pierwszym dostępie
  // Jeśli zmienne środowiskowe nie są dostępne, getReadOnlyClient() rzuci błąd z czytelnym komunikatem
  return await readOnlyClient.fetch<T>(query, params);
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
    invertOnDark?: boolean;
    icon?: SanityImage | null;
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
    invertOnDark?: boolean;
    icon?: SanityImage | null;
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

export type SiteConfig = {
  _id: string;
  general?: {
    siteName?: string;
    siteDescription?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  social?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
  };
  popup?: {
    enabled?: boolean;
    title?: string;
    description?: string;
    image?: SanityImage | null;
    button?: {
      label: string;
      href: string;
      variant?: 'primary' | 'secondary' | 'outline' | 'outlinewhite' | 'youtube' | 'danger';
      external?: boolean;
    } | null;
    scrollThreshold?: number;
    cooldownMinutes?: number;
  };
  globalBanners?: Array<{
    key?: string;
    isEnabled?: boolean;
    title?: string;
    message?: string;
    variant?: 'info' | 'success' | 'warning' | 'error';
  }>;
};

// Re-export functions from queries for backward compatibility
export { 
  getHeaderData,
  getLatestArticles,
  getSelectedArticles,
  getArticlesComponentData,
  getLatestPosts,
  getSelectedPosts,
  getSiteConfig
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
    const imageBuilder = getBuilder().image(image);
    imageBuilder.auto('format');
    
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
    
    imageBuilder.quality(options?.quality ?? 75);
    
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



