import React from "react";
import { Metadata } from "next";
import { getHomepageData } from "@/lib/queries/functions";
import HomePageClient from "@/components/pages/HomePageClient";
import { SITE_CONFIG } from "@/lib/config";
import { getImageUrl, SanityImage } from "@/lib/sanity";
import { safeJsonLd } from "@/lib/json-ld-utils";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generatePersonSchema,
} from "@/lib/schema-org";
import {
  getLatestYouTubeVideo,
  getYouTubeVideoById,
} from "@/lib/youtube";
import { PostComponent } from "@/lib/component-types";

// Funkcja pomocnicza do walidacji i upewnienia się że URL jest absolutny
function ensureAbsoluteUrl(
  url: string | null | undefined,
  siteUrl: string
): string | null {
  if (!url) return null;

  // Jeśli URL już zaczyna się od http:// lub https://, zwróć go bez zmian
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Jeśli URL zaczyna się od //, dodaj https:
  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  // Jeśli URL jest względny, połącz z siteUrl
  if (url.startsWith("/")) {
    return `${siteUrl}${url}`;
  }

  // W przeciwnym razie zwróć null (nieprawidłowy URL)
  console.warn(`Invalid image URL format: ${url}`);
  return null;
}

// Generuj metadata dla strony głównej
export async function generateMetadata(): Promise<Metadata> {
  const homepageDataRaw = await getHomepageData();
  const siteName = SITE_CONFIG.name;
  const siteUrl = SITE_CONFIG.url;

  // Jeśli nie ma danych, użyj domyślnych wartości
  if (!homepageDataRaw || typeof homepageDataRaw !== "object") {
    return {
      title: `${siteName} | Blog podróżniczy`,
      description: SITE_CONFIG.description,
      openGraph: {
        type: "website",
        title: siteName,
        description: SITE_CONFIG.description,
        url: siteUrl,
        siteName,
        locale: "pl_PL",
      },
      twitter: {
        card: "summary_large_image",
        title: siteName,
        description: SITE_CONFIG.description,
      },
    };
  }

  const homepageData = homepageDataRaw as {
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
  };

  // SEO Title - użyj seoTitle lub fallback
  const seoTitle = homepageData.seo?.seoTitle || siteName;
  const fullTitle = seoTitle.includes(siteName)
    ? seoTitle
    : `${seoTitle} | ${siteName}`;

  // SEO Description - użyj seoDescription lub fallback
  const seoDescription =
    homepageData.seo?.seoDescription || SITE_CONFIG.description;

  // Open Graph
  const ogTitle = homepageData.seo?.ogTitle || siteName;
  const ogDescription =
    homepageData.seo?.ogDescription || seoDescription;
  const ogImage = homepageData.seo?.ogImage;
  const rawOgImageUrl = ogImage
    ? getImageUrl(ogImage, { width: 1200, height: 630, format: "webp" })
    : null;
  // Upewnij się że URL jest absolutny (Facebook wymaga absolutnych URL)
  const ogImageUrlRaw = ensureAbsoluteUrl(rawOgImageUrl, siteUrl);
  // Upewnij się, że URL używa HTTPS (secure_url dla Facebook)
  const secureOgImageUrl = ogImageUrlRaw && ogImageUrlRaw.startsWith("http://")
    ? ogImageUrlRaw.replace("http://", "https://")
    : ogImageUrlRaw;

  // Keywords
  const keywords = homepageData.seo?.seoKeywords || [];

  // Robots
  const robots = [];
  if (homepageData.seo?.noIndex) robots.push("noindex");
  if (homepageData.seo?.noFollow) robots.push("nofollow");
  if (robots.length === 0) robots.push("index", "follow");

  // Canonical URL
  const canonicalUrl = homepageData.seo?.canonicalUrl || siteUrl;

  const metadata: Metadata = {
    title: fullTitle,
    description: seoDescription,
    keywords: keywords.length > 0 ? keywords.join(", ") : undefined,
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    robots: robots.join(", "),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      title: ogTitle,
      description: ogDescription,
      url: siteUrl,
      siteName,
      locale: "pl_PL",
      ...(secureOgImageUrl && {
        images: [
          {
            url: secureOgImageUrl,
            width: 1200,
            height: 630,
            alt: ogTitle,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      ...(secureOgImageUrl && {
        images: [secureOgImageUrl],
      }),
    },
    other: {
      ...(secureOgImageUrl && {
        "og:image:secure_url": secureOgImageUrl,
      }),
    },
  };

  return metadata;
}

export default async function Home() {
  // Pobierz dane homepage z Sanity na serwerze
  const homepageDataRaw = await getHomepageData();

  // Obsługa błędów
  if (!homepageDataRaw || typeof homepageDataRaw !== "object") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Brak danych
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Nie znaleziono danych strony głównej w Sanity
          </p>
        </div>
      </div>
    );
  }

  // Upewnij się, że homepageData ma _id
  const homepageData = {
    _id: (homepageDataRaw as { _id?: string })._id || "homepage",
    ...homepageDataRaw,
  };

  // Generuj JSON-LD dla strony głównej używając nowych funkcji Schema.org
  const siteUrl = SITE_CONFIG.url;

  // Organization schema z Logo (jeśli dostępne w homepageData)
  const homepageDataTyped = homepageData as {
    seo?: {
      ogImage?: SanityImage | null;
    };
  };
  const logoImage = homepageDataTyped.seo?.ogImage || null;

  const organizationJsonLd = generateOrganizationSchema({
    logo: logoImage,
    contactPoint: {
      email: "kontakt@naszblog.pl", // Można dodać do konfiguracji
      contactType: "customer service",
    },
  });

  // WebSite schema z SearchAction
  const websiteJsonLd = generateWebSiteSchema({
    potentialAction: {
      target: `${siteUrl}/wszystkie-artykuly?q={search_term_string}`,
      queryInput: "required name=search_term_string",
    },
  });

  // Person schema dla autorów (jeśli SITE_CONFIG.author.type === "Person")
  const personJsonLd =
    SITE_CONFIG.author.type === "Person"
      ? generatePersonSchema({
          name: SITE_CONFIG.author.name,
          url: SITE_CONFIG.author.url || siteUrl,
          sameAs: [
            ...(SITE_CONFIG.social.twitter
              ? [`https://twitter.com/${SITE_CONFIG.social.twitter}`]
              : []),
            ...(SITE_CONFIG.social.facebook
              ? [`https://facebook.com/${SITE_CONFIG.social.facebook}`]
              : []),
            ...(SITE_CONFIG.social.instagram
              ? [`https://instagram.com/${SITE_CONFIG.social.instagram}`]
              : []),
            ...(SITE_CONFIG.social.youtube
              ? [`https://youtube.com/${SITE_CONFIG.social.youtube}`]
              : []),
          ].filter(Boolean),
        })
      : null;

  // Funkcja pomocnicza do przetwarzania komponentów embedYoutube
  const processEmbedYoutubeComponents = async (
    components: PostComponent[] | undefined
  ): Promise<PostComponent[] | undefined> => {
    if (!components) return undefined;

    return Promise.all(
      components.map(async (component) => {
        if (component._type === "embedYoutube") {
          const embedYoutube = component as {
            videoId?: string;
            useLatestVideo?: boolean;
          };

          // Pobierz publishedAt dla komponentu (SSR)
          let publishedAt: string | null = null;
          try {
            if (embedYoutube.useLatestVideo || embedYoutube.videoId === "latest") {
              const latestVideo = await getLatestYouTubeVideo();
              publishedAt = latestVideo?.publishedAt || null;
            } else if (embedYoutube.videoId && embedYoutube.videoId !== "latest") {
              publishedAt = await getYouTubeVideoById(embedYoutube.videoId);
            }
          } catch (error) {
            console.error("Error fetching YouTube video publishedAt:", error);
            // Nie przerywamy renderowania, jeśli nie udało się pobrać daty
          }

          // Dodaj publishedAt do komponentu
          return {
            ...component,
            publishedAt,
          };
        }
        return component;
      })
    );
  };

  // Przetwarzanie wszystkich komponentów embedYoutube
  const processedHomepageData = {
    ...homepageData,
    heroComponents: await processEmbedYoutubeComponents(
      (homepageData as { heroComponents?: PostComponent[] }).heroComponents
    ),
    mainComponents: await processEmbedYoutubeComponents(
      (homepageData as { mainComponents?: PostComponent[] }).mainComponents
    ),
    asideComponents: await processEmbedYoutubeComponents(
      (homepageData as { asideComponents?: PostComponent[] }).asideComponents
    ),
    additionalComponents: await processEmbedYoutubeComponents(
      (homepageData as { additionalComponents?: PostComponent[] }).additionalComponents
    ),
  };

  return (
    <>
      {safeJsonLd(websiteJsonLd) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteJsonLd)! }}
        />
      )}
      {safeJsonLd(organizationJsonLd) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd)! }}
        />
      )}
      {personJsonLd && safeJsonLd(personJsonLd) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(personJsonLd)! }}
        />
      )}
      <HomePageClient
        homepageData={
          processedHomepageData as Parameters<typeof HomePageClient>[0]["homepageData"]
        }
      />
    </>
  );
}
