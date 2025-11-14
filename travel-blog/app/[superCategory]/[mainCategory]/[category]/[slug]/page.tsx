import {
  getPostBySlug,
  getAllPostSlugsWithCategories,
} from "@/lib/queries/functions";
import { getImageUrl } from "@/lib/sanity";
import PostPageClient from "@/components/pages/PostPageClient";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPrimaryCategory, getCanonicalPath } from "@/lib/utils";
import { SITE_CONFIG } from "@/lib/config";
import { safeJsonLd } from "@/lib/json-ld-utils";

type Params = {
  params: Promise<{
    superCategory: string;
    mainCategory: string;
    category: string;
    slug: string;
  }>;
};

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

// Generuj metadata dla SEO
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, superCategory, mainCategory, category } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Nie znaleziono posta",
      description: "Sprawdź adres URL lub wróć na stronę główną.",
    };
  }

  // Podstawowe informacje
  const siteName = SITE_CONFIG.name;
  const siteUrl = SITE_CONFIG.url;

  // Znajdź główną kategorię dla canonical URL
  const primaryCategory = getPrimaryCategory(post);
  const canonicalPostUrl =
    primaryCategory &&
    primaryCategory.mainCategory?.superCategory?.slug?.current &&
    primaryCategory.mainCategory?.slug?.current &&
    primaryCategory.slug?.current
      ? `${siteUrl}/${primaryCategory.mainCategory.superCategory.slug.current}/${primaryCategory.mainCategory.slug.current}/${primaryCategory.slug.current}/${slug}`
      : `${siteUrl}/${superCategory}/${mainCategory}/${category}/${slug}`;

  // URL aktualnej strony (może być różny od canonical jeśli użytkownik wszedł przez inną kategorię)
  const postUrl = `${siteUrl}/${superCategory}/${mainCategory}/${category}/${slug}`;

  // SEO Title - użyj seoTitle lub fallback do title
  const seoTitle = post.seo?.seoTitle || post.title;
  const fullTitle = seoTitle
    ? `${seoTitle} | ${siteName}`
    : `${post.title} | ${siteName}`;

  // SEO Description - użyj seoDescription lub fallback do subtitle
  const seoDescription =
    post.seo?.seoDescription ||
    post.subtitle ||
    `Przeczytaj artykuł: ${post.title}`;

  // Open Graph
  const ogTitle = post.seo?.ogTitle || post.title;
  const ogDescription =
    post.seo?.ogDescription || post.subtitle || seoDescription;
  const ogImage = post.seo?.ogImage || post.coverImage;
  const rawOgImageUrl = ogImage
    ? getImageUrl(ogImage, { width: 1200, height: 630, format: "webp" })
    : null;
  // Upewnij się że URL jest absolutny (Facebook wymaga absolutnych URL)
  const ogImageUrl = ensureAbsoluteUrl(rawOgImageUrl, siteUrl);
  
  // Upewnij się, że URL używa HTTPS (secure_url dla Facebook)
  const secureOgImageUrl = ogImageUrl && ogImageUrl.startsWith("http://")
    ? ogImageUrl.replace("http://", "https://")
    : ogImageUrl;

  // Canonical URL - zawsze wskazuje na główną kategorię
  const canonicalUrl = post.seo?.canonicalUrl || canonicalPostUrl;

  // Keywords
  const keywords =
    post.seo?.seoKeywords || post.categories?.map((cat) => cat.name) || [];

  // Robots
  const robots = [];
  if (post.seo?.noIndex) robots.push("noindex");
  if (post.seo?.noFollow) robots.push("nofollow");
  if (robots.length === 0) robots.push("index", "follow");

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
      type: "article",
      title: ogTitle,
      description: ogDescription,
      url: postUrl,
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
      ...(post.publishedAt && {
        publishedTime: post.publishedAt,
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
      "article:author": siteName,
      "article:section": post.categories?.[0]?.name || "Blog",
      ...(post.publishedAt && {
        "article:published_time": post.publishedAt,
      }),
      ...(secureOgImageUrl && {
        "og:image:secure_url": secureOgImageUrl,
      }),
    },
  };

  return metadata;
}

export default async function PostPage({ params }: Params) {
  const { superCategory, mainCategory, category, slug } = await params;
  const post = await getPostBySlug(slug);
  const siteUrl = SITE_CONFIG.url;

  if (!post) {
    return (
      <div className="flex min-h-screen">
        <main className="flex-1 mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100">
            Nie znaleziono posta
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-sans">
            Sprawdź adres URL lub wróć na stronę główną.
          </p>
        </main>
      </div>
    );
  }

  // Znajdź główną kategorię dla canonical URL (używane w JSON-LD i przekierowaniach)
  const primaryCategory = getPrimaryCategory(post);
  const canonicalPostUrl =
    primaryCategory &&
    primaryCategory.mainCategory?.superCategory?.slug?.current &&
    primaryCategory.mainCategory?.slug?.current &&
    primaryCategory.slug?.current
      ? `${siteUrl}/${primaryCategory.mainCategory.superCategory.slug.current}/${primaryCategory.mainCategory.slug.current}/${primaryCategory.slug.current}/${slug}`
      : `${siteUrl}/${superCategory}/${mainCategory}/${category}/${slug}`;

  // Canonical URL - użyj z CMS jeśli jest ustawiony, w przeciwnym razie użyj automatycznego
  const canonicalUrl = post.seo?.canonicalUrl || canonicalPostUrl;

  // Znajdź główną (pierwszą) kategorię posta
  if (!primaryCategory) {
    return (
      <div className="flex min-h-screen">
        <main className="flex-1 mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100">
            Post nie ma przypisanej kategorii
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-sans">
            Sprawdź adres URL lub wróć na stronę główną.
          </p>
        </main>
      </div>
    );
  }

  // Sprawdź czy aktualna kategoria to główna kategoria
  const isPrimaryCategory =
    primaryCategory.slug.current === category &&
    primaryCategory.mainCategory?.slug.current === mainCategory &&
    primaryCategory.mainCategory?.superCategory?.slug.current === superCategory;

  // Jeśli aktualna kategoria NIE jest główną → przekieruj 301 do canonical URL
  if (
    !isPrimaryCategory &&
    primaryCategory.mainCategory?.superCategory?.slug?.current &&
    primaryCategory.mainCategory?.slug?.current &&
    primaryCategory.slug?.current
  ) {
    // Wygeneruj automatyczny canonical URL z głównej kategorii (fallback)
    const autoCanonicalPath = `/${primaryCategory.mainCategory.superCategory.slug.current}/${primaryCategory.mainCategory.slug.current}/${primaryCategory.slug.current}/${slug}`;

    // Sprawdź czy jest canonical URL z CMS, jeśli nie - użyj automatycznego
    const canonicalPath = getCanonicalPath(
      post.seo?.canonicalUrl,
      autoCanonicalPath
    );
    redirect(canonicalPath);
  }

  // Sprawdź czy post należy do właściwej kategorii (dodatkowe zabezpieczenie)
  const postCategory = post.categories?.find(
    (cat) => cat.slug.current === category
  );
  if (
    !postCategory ||
    postCategory.mainCategory?.slug.current !== mainCategory ||
    postCategory.mainCategory?.superCategory?.slug.current !== superCategory
  ) {
    return (
      <div className="flex min-h-screen">
        <main className="flex-1 mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100">
            Post nie należy do tej kategorii
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-sans">
            Sprawdź adres URL lub wróć na stronę główną.
          </p>
        </main>
      </div>
    );
  }

  // Generuj dane Open Graph dla przycisków udostępniania
  const seoDescription =
    post.seo?.seoDescription ||
    post.subtitle ||
    `Przeczytaj artykuł: ${post.title}`;

  const ogTitle = post.seo?.ogTitle || post.title;
  const ogDescription =
    post.seo?.ogDescription || post.subtitle || seoDescription;
  const ogImage = post.seo?.ogImage || post.coverImage;
  const rawOgImageUrl = ogImage
    ? getImageUrl(ogImage, { width: 1200, height: 630, format: "webp" })
    : null;
  // Upewnij się że URL jest absolutny (Facebook wymaga absolutnych URL)
  const ogImageUrlRaw = ensureAbsoluteUrl(rawOgImageUrl, siteUrl);
  // Upewnij się, że URL używa HTTPS (secure_url dla Facebook)
  const ogImageUrl = ogImageUrlRaw && ogImageUrlRaw.startsWith("http://")
    ? ogImageUrlRaw.replace("http://", "https://")
    : ogImageUrlRaw || undefined;

  // Generuj spis treści na podstawie komponentów z tytułami treści
  const generateTableOfContents = () => {
    if (!post.components) return [];

    const generateId = (title: string) => {
      return (
        title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/^-+|-+$/g, "") // Usuń myślniki z początku i końca
          .replace(/^-/, "section-") // Jeśli zaczyna się od myślnika, dodaj prefix
          .trim() || "section"
      ); // Fallback jeśli pusty string
    };

    return post.components
      .filter((component) => {
        const container = component.container as
          | { contentTitle?: string }
          | undefined;
        return container?.contentTitle && container.contentTitle.trim() !== "";
      })
      .map((component) => {
        const container = component.container as { contentTitle: string };
        return {
          id: generateId(container.contentTitle),
          title: container.contentTitle,
          level: 1, // Wszystkie sekcje na tym samym poziomie
        };
      });
  };

  const tableOfContentsItems = generateTableOfContents();

  // Generuj JSON-LD dla lepszego SEO
  const organizationUrl = SITE_CONFIG.url;
  const organizationName = SITE_CONFIG.author.name;

  // BreadcrumbList
  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Strona główna",
      item: siteUrl,
    },
  ];

  let position = 2;

  if (primaryCategory.mainCategory?.superCategory) {
    const superCat = primaryCategory.mainCategory.superCategory;
    breadcrumbItems.push({
      "@type": "ListItem",
      position: position++,
      name: superCat.name || "Kategoria",
      item: `${siteUrl}/${superCat.slug.current}`,
    });
  }

  if (primaryCategory.mainCategory) {
    const mainCat = primaryCategory.mainCategory;
    const superCatSlug = mainCat.superCategory?.slug.current;
    if (superCatSlug) {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: position++,
        name: mainCat.name || "Kategoria główna",
        item: `${siteUrl}/${superCatSlug}/${mainCat.slug.current}`,
      });
    }
  }

  if (primaryCategory.slug?.current) {
    const superCatSlug =
      primaryCategory.mainCategory?.superCategory?.slug.current;
    const mainCatSlug = primaryCategory.mainCategory?.slug.current;
    if (superCatSlug && mainCatSlug) {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: position++,
        name: primaryCategory.name || "Podkategoria",
        item: `${siteUrl}/${superCatSlug}/${mainCatSlug}/${primaryCategory.slug.current}`,
      });
    }
  }

  breadcrumbItems.push({
    "@type": "ListItem",
    position: position,
    name: post.title,
    item: canonicalUrl,
  });

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description:
      post.seo?.seoDescription ||
      post.subtitle ||
      `Przeczytaj artykuł: ${post.title}`,
    image: post.coverImage
      ? getImageUrl(post.coverImage, { width: 1200, height: 630 })
      : undefined,
    author: {
      "@type": "Organization",
      "@id": `${organizationUrl}#organization`,
      name: organizationName,
      url: organizationUrl,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${organizationUrl}#organization`,
      name: organizationName,
      url: organizationUrl,
    },
    datePublished: post.publishedAt,
    ...(post.publishedAt && { dateModified: post.publishedAt }),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    ...(post.categories &&
      post.categories.length > 0 && {
        articleSection: post.categories.map((cat) => cat.name).join(", "),
      }),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
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
      {safeJsonLd(articleJsonLd) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd)! }}
        />
      )}
      {safeJsonLd(breadcrumbJsonLd) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd)! }}
        />
      )}
      {safeJsonLd(organizationJsonLd) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd)! }}
        />
      )}
      <PostPageClient
        post={post}
        tableOfContentsItems={tableOfContentsItems}
        postUrl={`${siteUrl}/${superCategory}/${mainCategory}/${category}/${slug}`}
        ogTitle={ogTitle}
        ogDescription={ogDescription}
        ogImageUrl={ogImageUrl}
      />
    </>
  );
}

export async function generateStaticParams() {
  const postsWithCategories = await getAllPostSlugsWithCategories();
  const params: Array<{
    superCategory: string;
    mainCategory: string;
    category: string;
    slug: string;
  }> = [];

  for (const post of postsWithCategories) {
    // Dla każdego posta generuj ścieżkę TYLKO dla pierwszej (głównej) kategorii
    // Zapytanie GROQ już filtruje tylko kategorie z pełną hierarchią (3 poziomy)
    if (post.categories && post.categories.length > 0) {
      const primaryCategory = post.categories[0];
      params.push({
        superCategory: primaryCategory.superCategory,
        mainCategory: primaryCategory.mainCategory,
        category: primaryCategory.category,
        slug: post.slug,
      });
    }
  }

  return params;
}
