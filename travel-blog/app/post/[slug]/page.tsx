import { Post } from "@/lib/sanity";
import { getPostBySlug, getAllPostSlugs } from "@/lib/queries/functions";
import { getImageUrl } from "@/lib/sanity";
import PostPageClient from "@/components/pages/PostPageClient";
import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/config";

type Params = { params: Promise<{ slug: string }> };

// Generuj metadata dla SEO
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
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
  const postUrl = `${siteUrl}/post/${slug}`;

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

  // Canonical URL
  const canonicalUrl = post.seo?.canonicalUrl || postUrl;

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
  const { slug } = await params;
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

  const formattedDate = post.publishedAt
    ? new Intl.DateTimeFormat("pl-PL", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      }).format(new Date(post.publishedAt))
    : null;

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
      .filter(
        (component) =>
          component.container?.contentTitle &&
          component.container.contentTitle.trim() !== ""
      )
      .map((component, index) => ({
        id: generateId(component.container.contentTitle),
        title: component.container.contentTitle,
        level: 1, // Wszystkie sekcje na tym samym poziomie
      }));
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
      "@type": SITE_CONFIG.author.type,
      name: SITE_CONFIG.author.name,
      ...(SITE_CONFIG.author.url && { url: SITE_CONFIG.author.url }),
    },
    publisher: {
      "@type": SITE_CONFIG.author.type,
      name: SITE_CONFIG.author.name,
      ...(SITE_CONFIG.author.url && { url: SITE_CONFIG.author.url }),
    },
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_CONFIG.url}/post/${slug}`,
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
        postUrl={`${siteUrl}/post/${slug}`}
        ogTitle={ogTitle}
        ogDescription={ogDescription}
        ogImageUrl={ogImageUrl}
      />
    </>
  );
}

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}
