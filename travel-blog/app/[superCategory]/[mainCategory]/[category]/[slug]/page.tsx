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
import {
  generateBlogPostingSchema,
  generateBreadcrumbListSchema,
  generateOrganizationSchema,
  generatePersonSchema,
  generateVideoObjectSchema,
  generateImageGallerySchema,
  type BreadcrumbItem,
} from "@/lib/schema-org";
import {
  getLatestYouTubeVideo,
  getYouTubeVideoById,
} from "@/lib/youtube";
import { buildAlternates, buildOpenGraph, buildAbsoluteUrl } from "@/lib/metadata";

export const revalidate = 600;

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

  // Robots
  const robots = [];
  if (post.seo?.noIndex) robots.push("noindex");
  if (post.seo?.noFollow) robots.push("nofollow");
  if (robots.length === 0) robots.push("index", "follow");

  // Znajdź pierwszy komponent embedYoutube dla Open Graph video
  const embedYoutubeComponent = post.components?.find(
    (comp) => comp._type === "embedYoutube"
  ) as {
    videoId?: string;
    useLatestVideo?: boolean;
  } | undefined;

  // Pobierz videoId dla og:video
  let videoIdForOg: string | null = null;
  if (embedYoutubeComponent) {
    if (embedYoutubeComponent.useLatestVideo || embedYoutubeComponent.videoId === "latest") {
      try {
        const latestVideo = await getLatestYouTubeVideo();
        videoIdForOg = latestVideo?.id || null;
      } catch (error) {
        console.error("Error fetching latest video for OG:", error);
      }
    } else if (embedYoutubeComponent.videoId && embedYoutubeComponent.videoId !== "latest") {
      videoIdForOg = embedYoutubeComponent.videoId;
    }
  }

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
    openGraph: {
      ...openGraph,
      type: "article",
      ...(post.publishedAt && { publishedTime: post.publishedAt }),
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
      "og:url": buildAbsoluteUrl(canonicalUrl),
      "article:author": siteName,
      "article:section": post.categories?.[0]?.name || "Blog",
      ...(post.publishedAt && {
        "article:published_time": post.publishedAt,
      }),
      ...(secureOgImageUrl && {
        "og:image:secure_url": secureOgImageUrl,
      }),
      // Open Graph video dla embedYoutube
      ...(videoIdForOg && {
        "og:video": `https://www.youtube.com/embed/${videoIdForOg}`,
        "og:video:url": `https://www.youtube.com/embed/${videoIdForOg}`,
        "og:video:secure_url": `https://www.youtube.com/embed/${videoIdForOg}`,
        "og:video:type": "text/html",
        "og:video:width": "1280",
        "og:video:height": "720",
      }),
    },
  };

  return metadata;
}

export default async function PostPage({ params }: Params) {
  const { superCategory, mainCategory, category, slug } = await params;
  const post = await getPostBySlug(slug);
  const siteUrl = SITE_CONFIG.url;
  const postUrl = `${siteUrl}/${superCategory}/${mainCategory}/${category}/${slug}`;

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

  // Generuj JSON-LD dla lepszego SEO używając nowych funkcji Schema.org

  // BreadcrumbList - ulepszony
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      name: "Strona główna",
      url: siteUrl,
      position: 1,
    },
  ];

  let position = 2;

  if (primaryCategory.mainCategory?.superCategory) {
    const superCat = primaryCategory.mainCategory.superCategory;
    breadcrumbItems.push({
      name: superCat.name || "Kategoria",
      url: `${siteUrl}/${superCat.slug.current}`,
      position: position++,
    });
  }

  if (primaryCategory.mainCategory) {
    const mainCat = primaryCategory.mainCategory;
    const superCatSlug = mainCat.superCategory?.slug.current;
    if (superCatSlug) {
      breadcrumbItems.push({
        name: mainCat.name || "Kategoria główna",
        url: `${siteUrl}/${superCatSlug}/${mainCat.slug.current}`,
        position: position++,
      });
    }
  }

  if (primaryCategory.slug?.current) {
    const superCatSlug =
      primaryCategory.mainCategory?.superCategory?.slug.current;
    const mainCatSlug = primaryCategory.mainCategory?.slug.current;
    if (superCatSlug && mainCatSlug) {
      breadcrumbItems.push({
        name: primaryCategory.name || "Podkategoria",
        url: `${siteUrl}/${superCatSlug}/${mainCatSlug}/${primaryCategory.slug.current}`,
        position: position++,
      });
    }
  }

  breadcrumbItems.push({
    name: post.title,
    url: canonicalUrl,
    position: position,
  });

  const breadcrumbJsonLd = generateBreadcrumbListSchema(breadcrumbItems);

  // BlogPosting schema (zamiast Article)
  const blogPostingJsonLd = generateBlogPostingSchema({
    headline: post.title,
    description:
      post.seo?.seoDescription ||
      post.subtitle ||
      `Przeczytaj artykuł: ${post.title}`,
    image: post.coverImage,
    url: canonicalUrl,
    datePublished: post.publishedAt || new Date().toISOString(),
    dateModified: post.publishedAt || new Date().toISOString(),
    author:
      SITE_CONFIG.author.type === "Person"
        ? {
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
          }
        : SITE_CONFIG.author.name,
    publisher: {
      name: SITE_CONFIG.author.name,
      url: siteUrl,
    },
    articleSection:
      post.categories && post.categories.length > 0
        ? post.categories.map((cat) => cat.name)
        : undefined,
    keywords: post.seo?.seoKeywords,
    mainEntityOfPage: canonicalUrl,
  });

  // Organization schema
  const organizationJsonLd = generateOrganizationSchema();

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

  // VideoObject dla osadzonych filmów YouTube w komponentach
  const videoObjects: object[] = [];
  // ImageGallery dla komponentów ImageCollage
  const imageGalleryObjects: object[] = [];
  // Przetwarzanie komponentów embedYoutube - pobieranie publishedAt dla SSR
  const processedComponents = post.components ? await Promise.all(
    post.components.map(async (component) => {
      if (component._type === "embedYoutube") {
        const embedYoutube = component as {
          videoId?: string;
          title?: string;
          description?: string;
          useLatestVideo?: boolean;
        };
        
        // Pobierz publishedAt dla JSON-LD
        if (embedYoutube.videoId) {
          const videoId = embedYoutube.videoId;
          const videoTitle = embedYoutube.title || post.title;
          const videoDescription =
            embedYoutube.description ||
            post.subtitle ||
            post.seo?.seoDescription;

          const videoJsonLd = generateVideoObjectSchema({
            name: videoTitle,
            description: videoDescription,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
            contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            uploadDate: post.publishedAt,
          });

          videoObjects.push(videoJsonLd);
        }

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
      
      // Przetwarzanie komponentów ImageCollage dla structured data
      if (component._type === "imageCollage") {
        const imageCollage = component as {
          images?: Array<{
            asset?: {
              url?: string;
              metadata?: {
                dimensions?: {
                  width?: number;
                  height?: number;
                };
              };
            };
            alt?: string;
          }>;
        };
        
        if (imageCollage.images && imageCollage.images.length > 0) {
          const galleryImages = imageCollage.images
            .filter((img) => img.asset?.url)
            .map((img) => ({
              url: img.asset!.url!,
              alt: img.alt || `Zdjęcie z galerii`,
              width: img.asset?.metadata?.dimensions?.width,
              height: img.asset?.metadata?.dimensions?.height,
            }));
          
          if (galleryImages.length > 0) {
            const imageGalleryJsonLd = generateImageGallerySchema({
              name: `Galeria zdjęć - ${post.title}`,
              description: `Galeria zdjęć z artykułu: ${post.title}`,
              images: galleryImages,
              url: canonicalUrl,
            });
            
            imageGalleryObjects.push(imageGalleryJsonLd);
          }
        }
      }
      
      return component;
    })
  ) : undefined;

  // Utwórz zaktualizowany obiekt post z przetworzonymi komponentami
  const postWithProcessedComponents = {
    ...post,
    components: processedComponents,
  };

  return (
    <>
      {safeJsonLd(blogPostingJsonLd) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(blogPostingJsonLd)! }}
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
      {personJsonLd && safeJsonLd(personJsonLd) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(personJsonLd)! }}
        />
      )}
      {videoObjects.map((videoJsonLd, index) => {
        const jsonLd = safeJsonLd(videoJsonLd);
        return jsonLd ? (
          <script
            key={`video-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLd }}
          />
        ) : null;
      })}
      {imageGalleryObjects.map((imageGalleryJsonLd, index) => {
        const jsonLd = safeJsonLd(imageGalleryJsonLd);
        return jsonLd ? (
          <script
            key={`imageGallery-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLd }}
          />
        ) : null;
      })}
      <PostPageClient
        post={postWithProcessedComponents}
        tableOfContentsItems={tableOfContentsItems}
        postUrl={postUrl}
        ogTitle={ogTitle}
        ogDescription={ogDescription}
        ogImageUrl={ogImageUrl}
      />
    </>
  );
}

export async function generateStaticParams() {
  try {
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
  } catch (error) {
    // Jeśli zmienne środowiskowe nie są dostępne podczas build time,
    // zwróć pustą tablicę - strony będą generowane dynamicznie
    console.warn('Warning: Could not generate static params. Pages will be generated dynamically.', error);
    return [];
  }
}
