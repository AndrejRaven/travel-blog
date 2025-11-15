import { notFound } from "next/navigation";
import { fetchGroq } from "@/lib/sanity";
import { QUERIES } from "@/lib/queries";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import BackToHome from "@/components/shared/BackToHome";
import InfoCard from "@/components/shared/InfoCard";
import CategoryArticles from "@/components/sections/CategoryArticles";
import SubcategoryList from "@/components/sections/SubcategoryList";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { MainCategory, ArticleForList, Category } from "@/lib/sanity";
import { SITE_CONFIG } from "@/lib/config";
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

type MainCategoryPageProps = {
  params: Promise<{
    superCategory: string;
    mainCategory: string;
  }>;
};

export async function generateStaticParams() {
  try {
    const mainCategories = await fetchGroq<MainCategory[]>(
      QUERIES.MAIN_CATEGORY.ALL,
      {},
      "CATEGORIES"
    );

    return mainCategories.map((mainCategory) => ({
      superCategory: mainCategory.superCategory?.slug.current || "unknown",
      mainCategory: mainCategory.slug.current,
    }));
  } catch (error) {
    // Jeśli zmienne środowiskowe nie są dostępne podczas build time,
    // zwróć pustą tablicę - strony będą generowane dynamicznie
    console.warn('Warning: Could not generate static params. Pages will be generated dynamically.', error);
    return [];
  }
}

export async function generateMetadata({ params }: MainCategoryPageProps) {
  const { mainCategory: mainCategorySlug } = await params;
  const mainCategory = await fetchGroq<MainCategory | null>(
    QUERIES.MAIN_CATEGORY.BY_SLUG,
    { slug: mainCategorySlug },
    "CATEGORIES"
  );

  if (!mainCategory) {
    return {
      title: "Kategoria nie znaleziona",
    };
  }

  const superCatSlug = mainCategory.superCategory?.slug.current;
  const canonicalPath = superCatSlug
    ? `/${superCatSlug}/${mainCategory.slug.current}`
    : `/${mainCategory.slug.current}`;

  return {
    title: `${mainCategory.name} - Nasz Blog`,
    description:
      mainCategory.description ||
      `Wszystkie posty z kategorii ${mainCategory.name}`,
    alternates: buildAlternates(canonicalPath),
    openGraph: buildOpenGraph({
      title: mainCategory.name,
      description:
        mainCategory.description ||
        `Wszystkie posty z kategorii ${mainCategory.name}`,
      path: canonicalPath,
    }),
    other: {
      "og:url": buildAbsoluteUrl(canonicalPath),
    },
  };
}

export default async function MainCategoryPage({
  params,
}: MainCategoryPageProps) {
  const { superCategory, mainCategory: mainCategorySlug } = await params;
  const [mainCategory, subcategories, posts] = await Promise.all([
    fetchGroq<MainCategory | null>(
      QUERIES.MAIN_CATEGORY.BY_SLUG,
      { slug: mainCategorySlug },
      "CATEGORIES"
    ),
    fetchGroq<Category[]>(
      QUERIES.MAIN_CATEGORY.SUBCATEGORIES,
      { mainCategorySlug },
      "CATEGORIES"
    ),
    fetchGroq<ArticleForList[]>(
      QUERIES.MAIN_CATEGORY.POSTS,
      { mainCategorySlug },
      "POSTS"
    ),
  ]);

  if (!mainCategory) {
    notFound();
  }

  // Pobierz liczbę postów dla każdej subcategory
  const subcategoriesWithCounts = await Promise.all(
    subcategories.map(async (subcategory) => {
      const articleCount = await fetchGroq<number>(
        QUERIES.CATEGORY.POSTS_COUNT,
        { slug: subcategory.slug.current },
        "POSTS"
      );
      return {
        ...subcategory,
        articleCount,
      };
    })
  );

  // Generuj Schema.org
  const siteUrl = SITE_CONFIG.url;
  const mainCategoryUrl = `${siteUrl}/${superCategory}/${mainCategorySlug}`;

  // BreadcrumbList
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      name: "Strona główna",
      url: siteUrl,
      position: 1,
    },
  ];

  let position = 2;

  if (mainCategory.superCategory) {
    breadcrumbItems.push({
      name: mainCategory.superCategory.name || "Kategoria",
      url: `${siteUrl}/${mainCategory.superCategory.slug.current}`,
      position: position++,
    });
  }

  breadcrumbItems.push({
    name: mainCategory.name,
    url: mainCategoryUrl,
    position: position,
  });

  const breadcrumbJsonLd = generateBreadcrumbListSchema(breadcrumbItems);

  // CollectionPage
  const collectionPageJsonLd = generateCollectionPageSchema({
    name: mainCategory.name,
    description:
      mainCategory.description ||
      `Wszystkie posty z kategorii ${mainCategory.name}`,
    url: mainCategoryUrl,
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
          name: `Artykuły w kategorii ${mainCategory.name}`,
          description: `Lista wszystkich artykułów w kategorii ${mainCategory.name}`,
          items: articleItems,
          url: mainCategoryUrl,
        })
      : null;

  const breadcrumbNavItems = [
    { label: "Strona główna", href: "/" },
    mainCategory.superCategory?.slug.current
      ? {
          label: mainCategory.superCategory?.name || "Kategoria",
          href: `/${mainCategory.superCategory.slug.current}`,
        }
      : null,
    { label: mainCategory.name },
  ].filter(Boolean) as { label: string; href?: string }[];

  return (
    <>
      {safeJsonLd(collectionPageJsonLd) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(collectionPageJsonLd)! }}
        />
      )}
      {itemListJsonLd && safeJsonLd(itemListJsonLd) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd)! }}
        />
      )}
      {safeJsonLd(breadcrumbJsonLd) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd)! }}
        />
      )}
      <PageLayout maxWidth="6xl">
      <PageHeader
        title={mainCategory.name}
        subtitle={
          mainCategory.description ||
          `Wszystkie posty z kategorii ${mainCategory.name}`
        }
      />

      <Breadcrumbs className="mb-8" items={breadcrumbNavItems} />

      {/* Podkategorie */}
      {subcategoriesWithCounts.length > 0 && (
        <div className="mb-12">
          <SubcategoryList
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
              title: `Podkategorie w ${mainCategory.name}`,
              subcategories: subcategoriesWithCounts.map((subcategory) => ({
                id: subcategory._id,
                name: subcategory.name,
                description: subcategory.description || "",
                href: `/${superCategory}/${mainCategorySlug}/${subcategory.slug.current}`,
                color: subcategory.color,
                icon: subcategory.icon
                  ? {
                      asset: {
                        url: subcategory.icon.asset?.url,
                      },
                    }
                  : undefined,
                invertOnDark: subcategory.invertOnDark,
                articleCount: subcategory.articleCount,
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
                    {mainCategory.name}
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
            title={`Wszystkie posty z kategorii ${mainCategory.name} (${posts.length})`}
          />
          <BackToHome />
        </>
      )}
      </PageLayout>
    </>
  );
}
