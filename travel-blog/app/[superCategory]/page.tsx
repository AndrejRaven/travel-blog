import { notFound } from "next/navigation";
import { fetchGroq } from "@/lib/sanity";
import { QUERIES } from "@/lib/queries";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import BackToHome from "@/components/shared/BackToHome";
import CategoryArticles from "@/components/sections/CategoryArticles";
import MainCategoryList from "@/components/sections/MainCategoryList";
import { SuperCategory, ArticleForList, MainCategory } from "@/lib/sanity";

type SuperCategoryPageProps = {
  params: {
    superCategory: string;
  };
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
  const superCategory = await fetchGroq<SuperCategory | null>(
    QUERIES.SUPER_CATEGORY.BY_SLUG,
    { slug: params.superCategory },
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
  const [superCategory, mainCategories, posts] = await Promise.all([
    fetchGroq<SuperCategory | null>(
      QUERIES.SUPER_CATEGORY.BY_SLUG,
      { slug: params.superCategory },
      "CATEGORIES"
    ),
    fetchGroq<MainCategory[]>(
      QUERIES.SUPER_CATEGORY.MAIN_CATEGORIES,
      { superCategorySlug: params.superCategory },
      "CATEGORIES"
    ),
    fetchGroq<ArticleForList[]>(
      QUERIES.SUPER_CATEGORY.POSTS,
      { superCategorySlug: params.superCategory },
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
                href: `/${params.superCategory}/${mainCategory.slug.current}`,
                color: mainCategory.color,
                icon: mainCategory.icon,
              })),
            }}
          />
        </div>
      )}

      {/* Posty */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
            Brak postów w tej kategorii.
          </p>
          <BackToHome />
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
