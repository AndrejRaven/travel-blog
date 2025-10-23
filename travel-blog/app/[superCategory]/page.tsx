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

type SuperCategoryPageProps = {
  params: Promise<{
    superCategory: string;
  }>;
};

export async function generateStaticParams() {
  const superCategories = await fetchGroq<SuperCategory[]>(
    QUERIES.SUPER_CATEGORY.ALL,
    {},
    "CATEGORIES"
  );

  return superCategories.map((superCategory) => ({
    superCategory: superCategory.slug.current,
  }));
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

  return {
    title: `${superCategory.name} - Nasz Blog`,
    description:
      superCategory.description ||
      `Wszystkie posty z kategorii ${superCategory.name}`,
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

  return (
    <PageLayout maxWidth="6xl">
      <PageHeader
        title={superCategory.name}
        subtitle={
          superCategory.description ||
          `Wszystkie posty z kategorii ${superCategory.name}`
        }
      />

      {/* Kategorie główne */}
      {mainCategories.length > 0 && (
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
              mainCategories: mainCategories.map((mainCategory) => ({
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
            title={`Wszystkie posty z kategorii ${superCategory.name}`}
          />
          <BackToHome />
        </>
      )}
    </PageLayout>
  );
}
