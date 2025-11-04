import { notFound } from "next/navigation";
import { fetchGroq } from "@/lib/sanity";
import { QUERIES } from "@/lib/queries";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import BackToHome from "@/components/shared/BackToHome";
import InfoCard from "@/components/shared/InfoCard";
import CategoryArticles from "@/components/sections/CategoryArticles";
import SubcategoryList from "@/components/sections/SubcategoryList";
import Link from "@/components/ui/Link";
import { MainCategory, ArticleForList, Category } from "@/lib/sanity";

type MainCategoryPageProps = {
  params: Promise<{
    superCategory: string;
    mainCategory: string;
  }>;
};

export async function generateStaticParams() {
  const mainCategories = await fetchGroq<MainCategory[]>(
    QUERIES.MAIN_CATEGORY.ALL,
    {},
    "CATEGORIES"
  );

  return mainCategories.map((mainCategory) => ({
    superCategory: mainCategory.superCategory?.slug.current || "unknown",
    mainCategory: mainCategory.slug.current,
  }));
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

  return {
    title: `${mainCategory.name} - Nasz Blog`,
    description:
      mainCategory.description ||
      `Wszystkie posty z kategorii ${mainCategory.name}`,
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

  return (
    <PageLayout maxWidth="6xl">
      <PageHeader
        title={mainCategory.name}
        subtitle={
          mainCategory.description ||
          `Wszystkie posty z kategorii ${mainCategory.name}`
        }
      />

      {/* Breadcrumb navigation */}
      <nav className="mb-8">
        <ol className="flex items-center space-x-2">
          <li>
            <Link
              href="/"
              className="hover:text-gray-900 dark:hover:text-gray-100"
            >
              Strona główna
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link
              href={`/${superCategory}`}
              className="hover:text-gray-900 dark:hover:text-gray-100"
            >
              {mainCategory.superCategory?.name || "Kategoria"}
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900 dark:text-gray-100">
            {mainCategory.name}
          </li>
        </ol>
      </nav>

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
  );
}
