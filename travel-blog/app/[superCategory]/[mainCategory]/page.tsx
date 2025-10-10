import { notFound } from "next/navigation";
import { fetchGroq } from "@/lib/sanity";
import { QUERIES } from "@/lib/queries";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import BackToHome from "@/components/shared/BackToHome";
import CategoryArticles from "@/components/sections/CategoryArticles";
import SubcategoryList from "@/components/sections/SubcategoryList";
import { MainCategory, ArticleForList, Category } from "@/lib/sanity";

type MainCategoryPageProps = {
  params: {
    superCategory: string;
    mainCategory: string;
  };
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
  const mainCategory = await fetchGroq<MainCategory | null>(
    QUERIES.MAIN_CATEGORY.BY_SLUG,
    { slug: params.mainCategory },
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
  const [mainCategory, subcategories, posts] = await Promise.all([
    fetchGroq<MainCategory | null>(
      QUERIES.MAIN_CATEGORY.BY_SLUG,
      { slug: params.mainCategory },
      "CATEGORIES"
    ),
    fetchGroq<Category[]>(
      QUERIES.MAIN_CATEGORY.SUBCATEGORIES,
      { mainCategorySlug: params.mainCategory },
      "CATEGORIES"
    ),
    fetchGroq<ArticleForList[]>(
      QUERIES.MAIN_CATEGORY.POSTS,
      { mainCategorySlug: params.mainCategory },
      "POSTS"
    ),
  ]);

  if (!mainCategory) {
    notFound();
  }

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
            <a
              href="/"
              className="hover:text-gray-900 dark:hover:text-gray-100"
            >
              Strona główna
            </a>
          </li>
          <li>/</li>
          <li>
            <a
              href={`/${params.superCategory}`}
              className="hover:text-gray-900 dark:hover:text-gray-100"
            >
              {mainCategory.superCategory?.name || "Kategoria"}
            </a>
          </li>
          <li>/</li>
          <li className="text-gray-900 dark:text-gray-100">
            {mainCategory.name}
          </li>
        </ol>
      </nav>

      {/* Podkategorie */}
      {subcategories.length > 0 && (
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
              subcategories: subcategories.map((subcategory) => ({
                id: subcategory._id,
                name: subcategory.name,
                description: subcategory.description || "",
                href: `/${params.superCategory}/${params.mainCategory}/${subcategory.slug.current}`,
                color: subcategory.color,
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
            title={`Wszystkie posty z kategorii ${mainCategory.name}`}
          />
          <BackToHome />
        </>
      )}
    </PageLayout>
  );
}
