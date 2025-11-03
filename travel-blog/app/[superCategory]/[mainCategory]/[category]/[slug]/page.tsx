import {
  getPostBySlug,
  getAllPostSlugsWithCategories,
} from "@/lib/queries/functions";
import { getImageUrl } from "@/lib/sanity";
import PostPageClient from "@/components/pages/PostPageClient";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPrimaryCategory, getCanonicalPath } from "@/lib/utils";

type Params = {
  params: Promise<{
    superCategory: string;
    mainCategory: string;
    category: string;
    slug: string;
  }>;
};

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
  const siteName = "Nasz Blog";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nasz-blog.com";

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
  const ogImageUrl = ogImage
    ? getImageUrl(ogImage, { width: 1200, height: 630, format: "webp" })
    : null;

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
      ...(ogImageUrl && {
        images: [
          {
            url: ogImageUrl,
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
      ...(ogImageUrl && {
        images: [ogImageUrl],
      }),
    },
    other: {
      "article:author": siteName,
      "article:section": post.categories?.[0]?.name || "Blog",
      ...(post.publishedAt && {
        "article:published_time": post.publishedAt,
      }),
    },
  };

  return metadata;
}

export default async function PostPage({ params }: Params) {
  const { superCategory, mainCategory, category, slug } = await params;
  const post = await getPostBySlug(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nasz-blog.com";

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
  const ogImageUrl = ogImage
    ? getImageUrl(ogImage, { width: 1200, height: 630, format: "webp" }) ||
      undefined
    : undefined;

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
  const jsonLd = {
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
      name: "Nasz Blog",
    },
    publisher: {
      "@type": "Organization",
      name: "Nasz Blog",
    },
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    ...(post.categories &&
      post.categories.length > 0 && {
        articleSection: post.categories.map((cat) => cat.name).join(", "),
      }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
