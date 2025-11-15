import Image from "next/image";
import Link from "@/components/ui/Link";
import SectionContainer from "@/components/shared/SectionContainer";
import { getAnimationClass } from "@/lib/render-utils";
import { CategoriesSectionData } from "@/lib/component-types";
import { fetchGroq, type SuperCategory } from "@/lib/sanity";
import { QUERIES } from "@/lib/queries";

interface Props {
  data: CategoriesSectionData;
}

interface SuperCategoryWithCount extends SuperCategory {
  articleCount?: number;
}

const CATEGORY_COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
  gray: "bg-gray-500",
};

const getCategoryColorClass = (color: string) => {
  return CATEGORY_COLOR_MAP[color] || CATEGORY_COLOR_MAP.gray;
};

async function loadSuperCategories(): Promise<SuperCategoryWithCount[]> {
  try {
    const categories = await fetchGroq<SuperCategory[]>(
      QUERIES.HOME.SUPER_CATEGORIES,
      {},
      "CATEGORIES"
    );

    return Promise.all(
      categories.map(async (category) => {
        try {
          const articleCount = await fetchGroq<number>(
            QUERIES.SUPER_CATEGORY.POSTS_COUNT,
            { superCategorySlug: category.slug.current },
            "POSTS"
          );

          return {
            ...category,
            articleCount,
          };
        } catch {
          return {
            ...category,
            articleCount: 0,
          };
        }
      })
    );
  } catch (error) {
    console.error("CategoriesSection: Failed to fetch categories", error);
    return [];
  }
}

export default async function CategoriesSection({ data }: Props) {
  if (!data) {
    console.error("CategoriesSection: Missing data", { data });
    return null;
  }

  const { container, title, showBackground } = data;

  if (!container) {
    console.error("CategoriesSection: Missing container data", { container });
    return null;
  }

  const superCategories = await loadSuperCategories();
  const categoriesCount = superCategories.length;

  const mdColsClass =
    categoriesCount >= 3
      ? "md:grid-cols-3"
      : categoriesCount === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-1";
  const lgColsClass =
    categoriesCount >= 4
      ? "lg:grid-cols-4"
      : categoriesCount === 3
        ? "lg:grid-cols-3"
        : categoriesCount === 2
          ? "lg:grid-cols-2"
          : "lg:grid-cols-1";

  const gridColsClasses = `grid grid-cols-1 ${mdColsClass} ${lgColsClass} gap-4`;

  return (
    <SectionContainer config={container}>
      <section
        id="kategorie"
        className={`mx-auto my-8 max-w-7xl px-6 py-12 md:py-16 ${
          showBackground ? "bg-gray-50 dark:bg-gray-900" : ""
        }`}
      >
        <h2
          className={`text-2xl md:text-3xl font-serif font-semibold mb-6 text-gray-900 dark:text-gray-100 ${getAnimationClass(
            {
              type: "sectionHeader",
              delay: "none",
              isInView: true,
              isLoaded: true,
            }
          )}`}
        >
          {title}
        </h2>

        {superCategories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Brak kategorii do wyświetlenia
          </div>
        ) : (
          <div className={gridColsClasses}>
            {superCategories.map((category, index) => (
              <Link
                key={category._id}
                href={`/${category.slug.current}`}
                className={`group rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-500 hover:scale-105 bg-white dark:bg-gray-800 ${getAnimationClass(
                  {
                    type: "text",
                    delay: index < 2 ? "short" : index < 4 ? "medium" : "long",
                    isInView: true,
                    isLoaded: true,
                  }
                )}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-sans font-medium text-gray-900 dark:text-gray-100">
                      {category.name}
                    </p>
                    {category.description && (
                      <p className="text-sm font-sans text-gray-600 dark:text-gray-400">
                        {category.description}
                      </p>
                    )}
                    {typeof category.articleCount === "number" && (
                      <p className="text-xs font-sans text-gray-500 dark:text-gray-500 mt-1">
                        {category.articleCount} artykułów
                      </p>
                    )}
                  </div>
                  {category.icon?.asset?.url ? (
                    <Image
                      src={category.icon.asset.url}
                      alt={`Ikona ${category.name}`}
                      width={28}
                      height={28}
                      className={`opacity-70 group-hover:opacity-100 ${
                        category.invertOnDark === true ? "dark:invert" : ""
                      } transition-opacity duration-300`}
                    />
                  ) : (
                    <div
                      className={`w-7 h-7 rounded-full ${getCategoryColorClass(
                        category.color
                      )}`}
                    />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </SectionContainer>
  );
}
