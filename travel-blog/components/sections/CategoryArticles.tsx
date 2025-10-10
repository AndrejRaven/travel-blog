import Link from "@/components/ui/Link";
import CategoryBadge from "@/components/ui/CategoryBadge";
import ResponsiveImage from "@/components/shared/ResponsiveImage";
import { ArticleForList } from "@/lib/sanity";

type Props = {
  articles: ArticleForList[];
  title?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
};

export default function CategoryArticles({
  articles,
  title = "Artykuły",
  showViewAll = false,
  viewAllHref,
}: Props) {
  // Funkcja do formatowania daty
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Brak daty";

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 dzień temu";
    if (diffDays < 7) return `${diffDays} dni temu`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} tygodni temu`;
    return date.toLocaleDateString("pl-PL");
  };

  return (
    <div className="mb-12">
      {/* Nagłówek sekcji */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        {showViewAll && viewAllHref && (
          <div className="flex justify-end mt-2 md:mt-0">
            <Link href={viewAllHref} variant="underline">
              Zobacz wszystko
            </Link>
          </div>
        )}
      </div>

      {/* Siatka artykułów */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.length > 0 ? (
          articles.map((article) => (
            <article
              key={article._id}
              className="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden hover:shadow-lg transition-all duration-500 hover:scale-105"
            >
              <div className="relative aspect-[16/10] bg-gray-50 dark:bg-gray-700">
                <ResponsiveImage
                  desktopImage={article.coverImage}
                  mobileImage={article.coverMobileImage}
                  fallback={{
                    src: "/demo-images/demo-asset.png",
                    alt: article.title,
                  }}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  quality={95}
                />

                {/* Badge kategorii na obrazie */}
                <div className="absolute top-3 left-3">
                  {article.categories && article.categories.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1">
                      {article.categories.slice(0, 2).map((category) => (
                        <CategoryBadge key={category._id} category={category} />
                      ))}
                      {(article.categories?.length || 0) > 2 && (
                        <span className="text-xs font-medium text-white bg-black/50 px-2 py-1 rounded-full">
                          +{(article.categories?.length || 0) - 2} więcej
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="p-4 pb-16">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-sans text-gray-500 dark:text-gray-400">
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>
                  <h3 className="font-serif text-xl font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                    {article.title}
                  </h3>
                  {article.subtitle && (
                    <p className="text-sm font-sans text-gray-600 dark:text-gray-300 line-clamp-2">
                      {article.subtitle}
                    </p>
                  )}
                  {article.description && (
                    <p className="text-sm font-sans text-gray-500 dark:text-gray-400 line-clamp-3">
                      {article.description}
                    </p>
                  )}
                </div>
              </div>

              {article.slug?.current && (
                <div className="absolute bottom-4 left-4 right-4">
                  <Link href={`/post/${article.slug.current}`} variant="arrow">
                    Czytaj dalej
                  </Link>
                </div>
              )}
            </article>
          ))
        ) : (
          // Brak artykułów
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 font-sans">
              Brak artykułów do wyświetlenia
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
