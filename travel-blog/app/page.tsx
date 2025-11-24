import React from "react";
import { Metadata } from "next";
import { getHomepageData, getSiteConfig } from "@/lib/queries/functions";
import HomePageContent from "@/components/pages/HomePageContent";
import { SITE_CONFIG } from "@/lib/config";
import { getImageUrl, SanityImage } from "@/lib/sanity";
import JsonLdScript from "@/components/shared/JsonLdScript";
import { safeJsonLd } from "@/lib/json-ld-utils";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generatePersonSchema,
  generateBreadcrumbListSchema,
  type BreadcrumbItem,
} from "@/lib/schema-org";
import {
  createEmbedResolutionContext,
  resolveEmbedYoutubeComponents,
} from "@/lib/youtube";
import { PostComponent } from "@/lib/component-types";
import { buildAlternates, buildOpenGraph, buildAbsoluteUrl } from "@/lib/metadata";

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
  const [homepageDataRaw, siteConfig] = await Promise.all([
    getHomepageData(),
    getSiteConfig(),
  ]);
  const siteName = siteConfig?.general?.siteName || SITE_CONFIG.name;
  const siteDescription =
    siteConfig?.general?.siteDescription || SITE_CONFIG.description;
  const siteUrl = SITE_CONFIG.url;

  // Jeśli nie ma danych, użyj domyślnych wartości
  if (!homepageDataRaw || typeof homepageDataRaw !== "object") {
    return {
      title: `${siteName} | Blog podróżniczy`,
      description: siteDescription,
      openGraph: {
        type: "website",
        title: siteName,
        description: siteDescription,
        url: siteUrl,
        siteName,
        locale: "pl_PL",
      },
      twitter: {
        card: "summary_large_image",
        title: siteName,
        description: siteDescription,
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
    homepageData.seo?.seoDescription || siteDescription;

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
  // Robots
  const robots = [];
  if (homepageData.seo?.noIndex) robots.push("noindex");
  if (homepageData.seo?.noFollow) robots.push("nofollow");
  if (robots.length === 0) robots.push("index", "follow");

  // Canonical URL
  const canonicalUrl = homepageData.seo?.canonicalUrl || siteUrl;
  const alternates = buildAlternates(canonicalUrl);
  const openGraph = buildOpenGraph({
    title: ogTitle,
    description: ogDescription,
    path: canonicalUrl,
    image: secureOgImageUrl
      ? { url: secureOgImageUrl, alt: ogTitle, width: 1200, height: 630 }
      : undefined,
  });

  const metadata: Metadata = {
    title: fullTitle,
    description: seoDescription,
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    robots: robots.join(", "),
    alternates,
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      ...(secureOgImageUrl && {
        images: [secureOgImageUrl],
      }),
    },
    other: {
      "og:url": buildAbsoluteUrl(canonicalUrl),
      ...(secureOgImageUrl && {
        "og:image:secure_url": secureOgImageUrl,
      }),
    },
  };

  return metadata;
}

export const revalidate = 300;
export const dynamic = "force-static";

export default async function Home() {
  // Pobierz dane homepage z Sanity na serwerze
  const [homepageDataRaw, siteConfig] = await Promise.all([
    getHomepageData(),
    getSiteConfig(),
  ]);

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

  const heroComponents = (homepageData as { heroComponents?: PostComponent[] })
    .heroComponents;
  const mainComponents = (homepageData as { mainComponents?: PostComponent[] })
    .mainComponents;
  const asideComponents = (homepageData as {
    asideComponents?: PostComponent[];
  }).asideComponents;
  const additionalComponents = (homepageData as {
    additionalComponents?: PostComponent[];
  }).additionalComponents;

  const embedContext = await createEmbedResolutionContext([
    heroComponents,
    mainComponents,
    asideComponents,
    additionalComponents,
  ]);

  // Przetwarzanie wszystkich komponentów embedYoutube
  const processedHomepageData = {
    ...homepageData,
    heroComponents: resolveEmbedYoutubeComponents(heroComponents, embedContext),
    mainComponents: resolveEmbedYoutubeComponents(mainComponents, embedContext),
    asideComponents: resolveEmbedYoutubeComponents(asideComponents, embedContext),
    additionalComponents: resolveEmbedYoutubeComponents(
      additionalComponents,
      embedContext
    ),
  };

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      name: "Strona główna",
      url: siteUrl,
      position: 1,
    },
  ];

  const breadcrumbJsonLd = generateBreadcrumbListSchema(breadcrumbItems);
  const websiteJsonLdString = safeJsonLd(websiteJsonLd);
  const organizationJsonLdString = safeJsonLd(organizationJsonLd);
  const personJsonLdString = personJsonLd ? safeJsonLd(personJsonLd) : null;
  const breadcrumbJsonLdString = safeJsonLd(breadcrumbJsonLd);

  return (
    <>
      <JsonLdScript data={websiteJsonLdString} />
      <JsonLdScript data={organizationJsonLdString} />
      <JsonLdScript data={personJsonLdString} />
      <JsonLdScript data={breadcrumbJsonLdString} />
      <HomePageContent
        homepageData={
          processedHomepageData as Parameters<typeof HomePageContent>[0]["homepageData"]
        }
        siteConfig={siteConfig}
      />
    </>
  );
}
