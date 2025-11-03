import React from "react";
import { getHomepageData } from "@/lib/queries/functions";
import HomePageClient from "@/components/pages/HomePageClient";
import { SITE_CONFIG } from "@/lib/config";

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

  // Generuj JSON-LD dla strony głównej
  const organizationUrl = SITE_CONFIG.url;
  const organizationName = SITE_CONFIG.author.name;

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    url: organizationUrl,
    description: SITE_CONFIG.description,
    publisher: {
      "@type": "Organization",
      "@id": `${organizationUrl}#organization`,
      name: organizationName,
      url: organizationUrl,
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${organizationUrl}#organization`,
    name: organizationName,
    url: organizationUrl,
    description: SITE_CONFIG.description,
    ...((SITE_CONFIG.social.twitter ||
      SITE_CONFIG.social.facebook ||
      SITE_CONFIG.social.instagram) && {
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
      ].filter(Boolean),
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <HomePageClient
        homepageData={
          homepageData as Parameters<typeof HomePageClient>[0]["homepageData"]
        }
      />
    </>
  );
}
