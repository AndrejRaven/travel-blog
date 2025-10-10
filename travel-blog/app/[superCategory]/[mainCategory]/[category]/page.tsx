import { notFound } from "next/navigation";
import { fetchGroq } from "@/lib/sanity";
import { QUERIES } from "@/lib/queries";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import BackToHome from "@/components/shared/BackToHome";
import CategoryArticles from "@/components/sections/CategoryArticles";
import { Category, ArticleForList } from "@/lib/sanity";

type SubcategoryPageProps = {
  params: {
    superCategory: string;
    mainCategory: string;
    category: string;
  };
};

export async function generateStaticParams() {
  const categories = await fetchGroq<Category[]>(
    QUERIES.CATEGORY.ALL,
    {},
    "CATEGORIES"
  );

  return categories.map((category) => ({
    superCategory:
      category.mainCategory?.superCategory?.slug.current || "unknown",
    mainCategory: category.mainCategory?.slug.current || "unknown",
    category: category.slug.current,
  }));
}

export async function generateMetadata({ params }: SubcategoryPageProps) {
  const category = await fetchGroq<Category | null>(
    QUERIES.CATEGORY.BY_SLUG,
    { slug: params.category },
    "CATEGORIES"
  );

  if (!category) {
    return {
      title: "Podkategoria nie znaleziona",
    };
  }

  return {
    title: `${category.name} - ${category.mainCategory?.name || "Kategoria"} - Nasz Blog`,
    description:
      category.description || `Wszystkie posty z podkategorii ${category.name}`,
  };
}

export default async function SubcategoryPage({
  params,
}: SubcategoryPageProps) {
  const [category, posts] = await Promise.all([
    fetchGroq<Category | null>(
      QUERIES.CATEGORY.BY_SLUG,
      { slug: params.category },
      "CATEGORIES"
    ),
    fetchGroq<ArticleForList[]>(
      QUERIES.CATEGORY.POSTS,
      { slug: params.category },
      "POSTS"
    ),
  ]);

  if (!category) {
    notFound();
  }

  // Sprawdź czy podkategoria należy do właściwej kategorii głównej
  if (category.mainCategory?.slug.current !== params.mainCategory) {
    notFound();
  }

  return (
    <PageLayout maxWidth="6xl">
      <PageHeader
        title={category.name}
        subtitle={
          category.description ||
          `Wszystkie posty z podkategorii ${category.name}`
        }
      />

      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-gray-600 dark:text-gray-400">
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
              {category.mainCategory?.superCategory?.name || "Kategoria"}
            </a>
          </li>
          <li>/</li>
          <li>
            <a
              href={`/${params.superCategory}/${params.mainCategory}`}
              className="hover:text-gray-900 dark:hover:text-gray-100"
            >
              {category.mainCategory?.name || "Kategoria"}
            </a>
          </li>
          <li>/</li>
          <li className="text-gray-900 dark:text-gray-100">{category.name}</li>
        </ol>
      </nav>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
            Brak postów w tej podkategorii.
          </p>
          <BackToHome />
        </div>
      ) : (
        <>
          <CategoryArticles
            articles={posts}
            title={`Wszystkie posty z podkategorii ${category.name}`}
          />
          <BackToHome />
        </>
      )}
    </PageLayout>
  );
}
