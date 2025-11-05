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

export async function generateMetadata() {
  return {
    title: "Wszystkie artykuły - Nasz Blog",
    description: "Przeglądaj wszystkie artykuły ze wszystkich kategorii",
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

  return (
    <PageLayout maxWidth="6xl">
      <PageHeader
        title="Wszystkie artykuły"
        subtitle="Przeglądaj wszystkie artykuły ze wszystkich kategorii"
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
              <Link href={`/${superCategory.slug.current}`} className="block">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-2 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {superCategory.name}
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
                    <div key={mainCategory._id} className="space-y-4">
                      {/* Nagłówek mainCategory - klikalny */}
                      <Link
                        href={`/${superCategory.slug.current}/${mainCategory.slug.current}`}
                        className="block"
                      >
                        <h3 className="text-xl md:text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                          {mainCategory.name}
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
                              <div key={subcategory._id} className="space-y-2">
                                {/* Nazwa podkategorii - klikalna */}
                                <Link href={categoryUrl} className="block">
                                  <h4 className="text-lg md:text-xl font-serif font-medium text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                    {subcategory.name}
                                  </h4>
                                </Link>

                                {/* Lista artykułów */}
                                <ul className="space-y-1.5">
                                  {subcategory.articles.map((article) => {
                                    const postUrl = getPostUrl(article);
                                    return (
                                      <li key={article._id}>
                                        <Link
                                          href={postUrl}
                                          variant="underline"
                                          className="text-sm md:text-base text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                                        >
                                          {article.title}
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
                                      className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                                    >
                                      Przeczytaj więcej artykułów w{" "}
                                      {subcategory.name} (
                                      {subcategory.totalArticlesCount - 5}{" "}
                                      więcej)
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
  );
}
