import { notFound } from "next/navigation";
import { fetchGroq } from "@/lib/sanity";
import { QUERIES } from "@/lib/queries";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import BackToHome from "@/components/shared/BackToHome";
import InfoCard from "@/components/shared/InfoCard";
import CategoryArticles from "@/components/sections/CategoryArticles";
import { Category, ArticleForList } from "@/lib/sanity";

type SubcategoryPageProps = {
  params: Promise<{
    superCategory: string;
    mainCategory: string;
    category: string;
  }>;
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
  const { category: categorySlug } = await params;
  const category = await fetchGroq<Category | null>(
    QUERIES.CATEGORY.BY_SLUG,
    { slug: categorySlug },
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
  const { superCategory, mainCategory, category: categorySlug } = await params;
  const [category, posts] = await Promise.all([
    fetchGroq<Category | null>(
      QUERIES.CATEGORY.BY_SLUG,
      { slug: categorySlug },
      "CATEGORIES"
    ),
    fetchGroq<ArticleForList[]>(
      QUERIES.CATEGORY.POSTS,
      { slug: categorySlug },
      "POSTS"
    ),
  ]);

  if (!category) {
    notFound();
  }

  // Sprawdź czy podkategoria należy do właściwej kategorii głównej
  if (category.mainCategory?.slug.current !== mainCategory) {
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
              href={`/${superCategory}`}
              className="hover:text-gray-900 dark:hover:text-gray-100"
            >
              {category.mainCategory?.superCategory?.name || "Kategoria"}
            </a>
          </li>
          <li>/</li>
          <li>
            <a
              href={`/${superCategory}/${mainCategory}`}
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
        <div className="max-w-2xl mx-auto">
          <InfoCard variant="blue">
            <div className="text-center">
              <div className="mb-6">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Artykuły w drodze!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Pracujemy nad przygotowaniem ciekawych artykułów w
                  podkategorii{" "}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {category.name}
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
            title={`Wszystkie posty z podkategorii ${category.name}`}
          />
          <BackToHome />
        </>
      )}
    </PageLayout>
  );
}
