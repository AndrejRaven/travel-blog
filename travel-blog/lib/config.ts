// Konfiguracja strony - centralne miejsce dla wszystkich ustawień
export const SITE_CONFIG = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Vlogi Z Drogi",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://vlogizdrogi.pl",
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Blog podróżniczy",
  
  // Ustawienia autora/wydawcy
  author: {
    name: process.env.NEXT_PUBLIC_AUTHOR_NAME || "Vlogi Z Drogi",
    type: process.env.NEXT_PUBLIC_AUTHOR_TYPE || "Person", // "Organization" lub "Person"
    url: process.env.NEXT_PUBLIC_AUTHOR_URL,
  },
  
  // Ustawienia SEO
  seo: {
    defaultTitle: process.env.NEXT_PUBLIC_SITE_NAME || "Vlogi Z Drogi",
    titleTemplate: `${process.env.NEXT_PUBLIC_SITE_NAME || "Vlogi Z Drogi"}`,
  },
  
  // Ustawienia społecznościowe
  social: {
    twitter: process.env.NEXT_PUBLIC_TWITTER_HANDLE,
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_PAGE,
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE,
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_HANDLE,
  },
} as const;

// Typy dla TypeScript
export type SiteConfig = typeof SITE_CONFIG;
