import { fetchGroq } from "@/lib/sanity";
import { QUERIES } from "@/lib/queries";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import BackToHome from "@/components/shared/BackToHome";
import InfoCard from "@/components/shared/InfoCard";
import CategoryArticles from "@/components/sections/CategoryArticles";
import Link from "@/components/ui/Link";
import {
  SuperCategory,
  MainCategory,
  Category,
  ArticleForList,
} from "@/lib/sanity";
import { getPostUrl } from "@/lib/utils";
import { SITE_CONFIG } from "@/lib/config";
import JsonLdScript from "@/components/shared/JsonLdScript";
import { safeJsonLd } from "@/lib/json-ld-utils";
import {
  generateCollectionPageSchema,
  generateItemListSchema,
  generateBreadcrumbListSchema,
  type ArticleItem,
  type BreadcrumbItem,
} from "@/lib/schema-org";
import { buildAlternates, buildOpenGraph, buildAbsoluteUrl } from "@/lib/metadata";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { ChevronRight } from "lucide-react";

export const revalidate = 600;

export async function generateMetadata() {
  const title = "Wszystkie artykuły - Nasz Blog";
  const description = "Przeglądaj wszystkie artykuły ze wszystkich kategorii";
  const canonicalPath = "/wszystkie-artykuly";

  return {
    title,
    description,
    alternates: buildAlternates(canonicalPath),
    openGraph: buildOpenGraph({
      title,
      description,
      path: canonicalPath,
    }),
    other: {
      "og:url": buildAbsoluteUrl(canonicalPath),
    },
  };
}

export default async function WszystkieArtykulyPage() {
  const [superCategories, allPosts] = await Promise.all([
    fetchGroq<SuperCategory[]>(QUERIES.SUPER_CATEGORY.ALL, {}, "CATEGORIES"),
    fetchGroq<ArticleForList[]>(QUERIES.POST.ALL, {}, "POSTS"),
  ]);

  // Dla każdej superkategorii pobierz mainCategories i ich subcategories z artykułami
  const superCategoriesWithData = await Promise.all(
    superCategories.map(async (superCategory) => {
      // Pobierz mainCategories dla tej superCategory
      const mainCategories = await fetchGroq<MainCategory[]>(
        QUERIES.SUPER_CATEGORY.MAIN_CATEGORIES,
        { superCategorySlug: superCategory.slug.current },
        "CATEGORIES"
      );

      // Dla każdej mainCategory pobierz subcategories i artykuły
      const mainCategoriesWithData = await Promise.all(
        mainCategories.map(async (mainCategory) => {
          // Pobierz podkategorie
          const subcategories = await fetchGroq<Category[]>(
            QUERIES.MAIN_CATEGORY.SUBCATEGORIES,
            { mainCategorySlug: mainCategory.slug.current },
            "CATEGORIES"
          );

          // Dla każdej podkategorii pobierz artykuły (limit 5 najnowszych)
          const subcategoriesWithArticles = await Promise.all(
            subcategories.map(async (subcategory) => {
              const allArticles = await fetchGroq<ArticleForList[]>(
                QUERIES.CATEGORY.POSTS,
                { slug: subcategory.slug.current },
                "POSTS"
              );

              // Pokaż tylko 5 najnowszych artykułów
              const articles = allArticles.slice(0, 5);

              return {
                ...subcategory,
                articles,
                totalArticlesCount: allArticles.length,
              };
            })
          );

          return {
            ...mainCategory,
            subcategories: subcategoriesWithArticles,
          };
        })
      );

      return {
        ...superCategory,
        mainCategories: mainCategoriesWithData,
      };
    })
  );

  // Filtruj tylko superkategorie, które mają mainCategories z subcategories z artykułami
  const filteredSuperCategories = superCategoriesWithData.filter(
    (superCategory) =>
      superCategory.mainCategories.length > 0 &&
      superCategory.mainCategories.some((main) =>
        main.subcategories.some((sub) => sub.articles.length > 0)
      )
  );

  // Generuj Schema.org
  const siteUrl = SITE_CONFIG.url;
  const allArticlesUrl = `${siteUrl}/wszystkie-artykuly`;

  // CollectionPage
  const collectionPageJsonLd = generateCollectionPageSchema({
    name: "Wszystkie artykuły",
    description: "Przeglądaj wszystkie artykuły ze wszystkich kategorii",
    url: allArticlesUrl,
  });

  // ItemList z wszystkimi artykułami
  const articleItems: ArticleItem[] = allPosts.map((post) => ({
    title: post.title,
    url: getPostUrl(post),
    description: post.subtitle,
    datePublished: post.publishedAt,
  }));

  const itemListJsonLd =
    articleItems.length > 0
      ? generateItemListSchema({
          name: "Wszystkie artykuły",
          description: "Lista wszystkich artykułów na blogu",
          items: articleItems,
          url: allArticlesUrl,
        })
      : null;

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      name: "Strona główna",
      url: siteUrl,
      position: 1,
    },
    {
      name: "Wszystkie artykuły",
      url: allArticlesUrl,
      position: 2,
    },
  ];

  const breadcrumbJsonLd = generateBreadcrumbListSchema(breadcrumbItems);

  const breadcrumbJsonLdString = safeJsonLd(breadcrumbJsonLd);
  const collectionPageJsonLdString = safeJsonLd(collectionPageJsonLd);
  const itemListJsonLdString = itemListJsonLd ? safeJsonLd(itemListJsonLd) : null;

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLdString} />
      <JsonLdScript data={collectionPageJsonLdString} />
      <JsonLdScript data={itemListJsonLdString} />
      <PageLayout maxWidth="6xl">
      <PageHeader
        title="Wszystkie artykuły"
        subtitle="Przeglądaj wszystkie artykuły ze wszystkich kategorii"
      />
      <Breadcrumbs
        className="mb-8"
        items={[
          { label: "Strona główna", href: "/" },
          { label: "Wszystkie artykuły" },
        ]}
      />

      {/* Opis wprowadzający */}
      <div className="mb-12">
        <InfoCard variant="gray">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Odkryj naszą kolekcję artykułów podzielonych na kategorie. Każda
            kategoria zawiera wartościowe treści, które pomogą Ci znaleźć
            dokładnie to, czego szukasz. Przeglądaj kategorie poniżej lub
            przejrzyj wszystkie artykuły na dole strony.
          </p>
        </InfoCard>
      </div>

      {/* Superkategorie w 2 kolumnach */}
      {filteredSuperCategories.length === 0 ? (
        <div className="max-w-2xl mx-auto mb-12">
          <InfoCard variant="blue">
            <div className="text-center">
              <div className="mb-6">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Artykuły w drodze!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Pracujemy nad przygotowaniem ciekawych artykułów. Wkrótce
                  znajdziesz tu wartościowe treści!
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {filteredSuperCategories.map((superCategory) => (
            <div key={superCategory._id} className="space-y-6">
              {/* Nagłówek superkategorii - klikalny */}
              <Link
                href={`/${superCategory.slug.current}`}
                className="group block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-300"
              >
                <h2 className="inline-flex items-center gap-2 text-2xl md:text-3xl font-serif font-bold text-gray-900 dark:text-gray-100 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-300">
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors group-hover:text-blue-500 dark:group-hover:text-blue-300" />
                  <span>{superCategory.name}</span>
                </h2>
              </Link>
              {superCategory.description && (
                <p className="text-base text-gray-600 dark:text-gray-400">
                  {superCategory.description}
                </p>
              )}

              {/* MainCategories */}
              <div className="space-y-6">
                {superCategory.mainCategories
                  .filter((main) =>
                    main.subcategories.some((sub) => sub.articles.length > 0)
                  )
                  .map((mainCategory) => (
                    <div
                      key={mainCategory._id}
                      className="space-y-4 border-l border-gray-200 dark:border-gray-700 pl-4 md:pl-6"
                    >
                      {/* Nagłówek mainCategory - klikalny */}
                      <Link
                        href={`/${superCategory.slug.current}/${mainCategory.slug.current}`}
                        className="group block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-300"
                      >
                        <h3 className="inline-flex items-center gap-2 text-xl md:text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-300">
                          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 transition-colors group-hover:text-blue-500 dark:group-hover:text-blue-300" />
                          <span>{mainCategory.name}</span>
                        </h3>
                      </Link>
                      {mainCategory.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {mainCategory.description}
                        </p>
                      )}

                      {/* Subcategories z artykułami */}
                      <div className="space-y-4">
                        {mainCategory.subcategories
                          .filter((sub) => sub.articles.length > 0)
                          .map((subcategory) => {
                            const categoryUrl = `/${superCategory.slug.current}/${mainCategory.slug.current}/${subcategory.slug.current}`;

                            return (
                              <div
                                key={subcategory._id}
                                className="space-y-2 border-l border-gray-200 dark:border-gray-700 pl-4 md:pl-6"
                              >
                                {/* Nazwa podkategorii - klikalna */}
                                <Link
                                  href={categoryUrl}
                                  className="group block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-300"
                                >
                                  <h4 className="inline-flex items-center gap-2 text-lg md:text-xl font-serif font-medium text-gray-900 dark:text-gray-100 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-300">
                                    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 transition-colors group-hover:text-blue-500 dark:group-hover:text-blue-300" />
                                    <span>{subcategory.name}</span>
                                  </h4>
                                </Link>

                                {/* Lista artykułów */}
                                <ul className="space-y-1.5 border-l border-gray-200 dark:border-gray-700 pl-4 md:pl-6">
                                  {subcategory.articles.map((article) => {
                                    const postUrl = getPostUrl(article);
                                    return (
                                      <li key={article._id}>
                                        <Link
                                          href={postUrl}
                                          variant="underline"
                                          className="group inline-flex items-center gap-2 text-sm md:text-base font-medium text-gray-800 dark:text-gray-100 transition-colors hover:text-blue-600 dark:hover:text-blue-300"
                                        >
                                          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 transition-colors group-hover:text-blue-500 dark:group-hover:text-blue-300" />
                                          <span>{article.title}</span>
                                        </Link>
                                      </li>
                                    );
                                  })}
                                </ul>

                                {/* Link do więcej artykułów */}
                                {subcategory.totalArticlesCount > 5 && (
                                  <div className="pt-1">
                                    <Link
                                      href={categoryUrl}
                                      variant="underline"
                                      className="group inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-100 transition-colors hover:text-blue-600 dark:hover:text-blue-300"
                                    >
                                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-colors group-hover:text-blue-500 dark:group-hover:text-blue-300" />
                                      <span>
                                        Przeczytaj więcej artykułów w {subcategory.name} (
                                        {subcategory.totalArticlesCount - 5} więcej)
                                      </span>
                                    </Link>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Separator */}
      <div className="my-12 border-t border-gray-200 dark:border-gray-700"></div>

      {/* Wszystkie artykuły na dole */}
      {allPosts.length === 0 ? (
        <InfoCard variant="blue">
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-300">
              Brak artykułów do wyświetlenia
            </p>
          </div>
        </InfoCard>
      ) : (
        <CategoryArticles
          articles={allPosts}
          title={`Wszystkie artykuły (${allPosts.length})`}
        />
      )}

      <BackToHome className="mt-12" />
      </PageLayout>
    </>
  );
}
