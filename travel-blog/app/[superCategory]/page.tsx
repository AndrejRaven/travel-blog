import { notFound } from "next/navigation";
import { fetchGroq } from "@/lib/sanity";
import { QUERIES } from "@/lib/queries";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import BackToHome from "@/components/shared/BackToHome";
import InfoCard from "@/components/shared/InfoCard";
import CategoryArticles from "@/components/sections/CategoryArticles";
import MainCategoryList from "@/components/sections/MainCategoryList";
import { SuperCategory, ArticleForList, MainCategory } from "@/lib/sanity";
import { SITE_CONFIG } from "@/lib/config";
import JsonLdScript from "@/components/shared/JsonLdScript";
import { safeJsonLd } from "@/lib/json-ld-utils";
import {
  generateCollectionPageSchema,
  generateItemListSchema,
  generateBreadcrumbListSchema,
  type BreadcrumbItem,
  type ArticleItem,
} from "@/lib/schema-org";
import { getPostUrl } from "@/lib/utils";
import { buildAlternates, buildOpenGraph, buildAbsoluteUrl } from "@/lib/metadata";

export const revalidate = 600;
export const dynamic = "force-static";

type SuperCategoryPageProps = {
  params: Promise<{
    superCategory: string;
  }>;
};

export async function generateStaticParams() {
  try {
    const superCategories = await fetchGroq<SuperCategory[]>(
      QUERIES.SUPER_CATEGORY.ALL,
      {},
      "CATEGORIES"
    );

    return superCategories.map((superCategory) => ({
      superCategory: superCategory.slug.current,
    }));
  } catch (error) {
    // Jeśli zmienne środowiskowe nie są dostępne podczas build time,
    // zwróć pustą tablicę - strony będą generowane dynamicznie
    console.warn('Warning: Could not generate static params. Pages will be generated dynamically.', error);
    return [];
  }
}

export async function generateMetadata({ params }: SuperCategoryPageProps) {
  const { superCategory: superCategorySlug } = await params;
  const superCategory = await fetchGroq<SuperCategory | null>(
    QUERIES.SUPER_CATEGORY.BY_SLUG,
    { slug: superCategorySlug },
    "CATEGORIES"
  );

  if (!superCategory) {
    return {
      title: "Kategoria nie znaleziona",
    };
  }

  const canonicalPath = `/${superCategory.slug.current}`;

  return {
    title: `${superCategory.name} - Nasz Blog`,
    description:
      superCategory.description ||
      `Wszystkie posty z kategorii ${superCategory.name}`,
    alternates: buildAlternates(canonicalPath),
    openGraph: buildOpenGraph({
      title: superCategory.name,
      description:
        superCategory.description ||
        `Wszystkie posty z kategorii ${superCategory.name}`,
      path: canonicalPath,
    }),
    other: {
      "og:url": buildAbsoluteUrl(canonicalPath),
    },
  };
}

export default async function SuperCategoryPage({
  params,
}: SuperCategoryPageProps) {
  const { superCategory: superCategorySlug } = await params;
  const [superCategory, mainCategories, posts] = await Promise.all([
    fetchGroq<SuperCategory | null>(
      QUERIES.SUPER_CATEGORY.BY_SLUG,
      { slug: superCategorySlug },
      "CATEGORIES"
    ),
    fetchGroq<MainCategory[]>(
      QUERIES.SUPER_CATEGORY.MAIN_CATEGORIES,
      { superCategorySlug },
      "CATEGORIES"
    ),
    fetchGroq<ArticleForList[]>(
      QUERIES.SUPER_CATEGORY.POSTS,
      { superCategorySlug },
      "POSTS"
    ),
  ]);

  if (!superCategory) {
    notFound();
  }

  // Pobierz liczbę postów dla każdej mainCategory
  const mainCategoriesWithCounts = await Promise.all(
    mainCategories.map(async (mainCategory) => {
      const articleCount = await fetchGroq<number>(
        QUERIES.MAIN_CATEGORY.POSTS_COUNT,
        { mainCategorySlug: mainCategory.slug.current },
        "POSTS"
      );
      return {
        ...mainCategory,
        articleCount,
      };
    })
  );

  // Generuj Schema.org
  const siteUrl = SITE_CONFIG.url;
  const superCategoryUrl = `${siteUrl}/${superCategorySlug}`;

  // BreadcrumbList
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      name: "Strona główna",
      url: siteUrl,
      position: 1,
    },
    {
      name: superCategory.name,
      url: superCategoryUrl,
      position: 2,
    },
  ];

  const breadcrumbJsonLd = generateBreadcrumbListSchema(breadcrumbItems);

  // CollectionPage
  const collectionPageJsonLd = generateCollectionPageSchema({
    name: superCategory.name,
    description:
      superCategory.description ||
      `Wszystkie posty z kategorii ${superCategory.name}`,
    url: superCategoryUrl,
    breadcrumb: breadcrumbItems,
  });

  // ItemList z artykułami
  const articleItems: ArticleItem[] = posts.map((post) => ({
    title: post.title,
    url: getPostUrl(post),
    description: post.subtitle,
    datePublished: post.publishedAt,
  }));

  const itemListJsonLd =
    articleItems.length > 0
      ? generateItemListSchema({
          name: `Artykuły w kategorii ${superCategory.name}`,
          description: `Lista wszystkich artykułów w kategorii ${superCategory.name}`,
          items: articleItems,
          url: superCategoryUrl,
        })
      : null;

  const collectionPageJsonLdString = safeJsonLd(collectionPageJsonLd);
  const itemListJsonLdString = itemListJsonLd ? safeJsonLd(itemListJsonLd) : null;
  const breadcrumbJsonLdString = safeJsonLd(breadcrumbJsonLd);

  return (
    <>
      <JsonLdScript data={collectionPageJsonLdString} />
      <JsonLdScript data={itemListJsonLdString} />
      <JsonLdScript data={breadcrumbJsonLdString} />
      <PageLayout maxWidth="6xl">
      <PageHeader
        title={superCategory.name}
        subtitle={
          superCategory.description ||
          `Wszystkie posty z kategorii ${superCategory.name}`
        }
      />

      {/* Kategorie główne */}
      {mainCategoriesWithCounts.length > 0 && (
        <div className="mb-12">
          <MainCategoryList
            data={{
              container: {
                maxWidth: "6xl",
                padding: "md",
                margin: { top: "none", bottom: "lg" },
                backgroundColor: "transparent",
                borderRadius: "none",
                shadow: "none",
                height: "auto",
              },
              title: `Kategorie w ${superCategory.name}`,
              mainCategories: mainCategoriesWithCounts.map((mainCategory) => ({
                id: mainCategory._id,
                name: mainCategory.name,
                description: mainCategory.description || "",
                href: `/${superCategorySlug}/${mainCategory.slug.current}`,
                color: mainCategory.color,
                icon: mainCategory.icon
                  ? {
                      asset: {
                        url: mainCategory.icon.asset?.url,
                      },
                    }
                  : undefined,
                invertOnDark: mainCategory.invertOnDark,
                articleCount: mainCategory.articleCount,
              })),
            }}
          />
        </div>
      )}

      {/* Posty */}
      {posts.length === 0 ? (
        <div className="max-w-2xl mx-auto">
          <InfoCard variant="blue">
            <div className="text-center">
              <div className="mb-6">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Artykuły w drodze!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Pracujemy nad przygotowaniem ciekawych artykułów w kategorii{" "}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {superCategory.name}
                  </span>
                  . Wkrótce znajdziesz tu wartościowe treści!
                </p>
              </div>

              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
                <span className="ml-2">Pracujemy nad treściami...</span>
              </div>

              <BackToHome />
            </div>
          </InfoCard>
        </div>
      ) : (
        <>
          <CategoryArticles
            articles={posts}
            title={`Wszystkie posty z kategorii ${superCategory.name} (${posts.length})`}
          />
          <BackToHome />
        </>
      )}
      </PageLayout>
    </>
  );
}
