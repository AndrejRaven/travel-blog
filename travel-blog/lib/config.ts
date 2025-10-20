// Konfiguracja strony - centralne miejsce dla wszystkich ustawień
export const SITE_CONFIG = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Nasz Blog",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://nasz-blog.com",
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Blog podróżniczy",
  
  // Ustawienia autora/wydawcy
  author: {
    name: process.env.NEXT_PUBLIC_AUTHOR_NAME || "Nasz Blog",
    type: process.env.NEXT_PUBLIC_AUTHOR_TYPE || "Organization", // "Organization" lub "Person"
    url: process.env.NEXT_PUBLIC_AUTHOR_URL,
  },
  
  // Ustawienia SEO
  seo: {
    defaultTitle: process.env.NEXT_PUBLIC_SITE_NAME || "Nasz Blog",
    titleTemplate: `%s - ${process.env.NEXT_PUBLIC_SITE_NAME || "Nasz Blog"}`,
  },
  
  // Ustawienia społecznościowe
  social: {
    twitter: process.env.NEXT_PUBLIC_TWITTER_HANDLE,
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_PAGE,
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE,
  },
} as const;

// Typy dla TypeScript
export type SiteConfig = typeof SITE_CONFIG;
