import Image from "next/image";
import Link from "@/components/ui/Link";
import CategoryBadge from "@/components/ui/CategoryBadge";
import JsonLdScript from "@/components/shared/JsonLdScript";
import { ArticleForList } from "@/lib/sanity";
import { getPostUrl } from "@/lib/utils";
import { getSanityImageProps } from "@/lib/sanity-image";

interface Props {
  articles: ArticleForList[];
  title?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
}

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

const buildArticleJsonLd = (articles: ArticleForList[]) => {
  if (!articles.length) {
    return null;
  }

  const itemListElement = articles.map((article, index) => {
    const url = getPostUrl(article);
    const image = article.coverImage?.asset?.url || article.coverMobileImage?.asset?.url;

    return {
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Article",
        headline: article.title,
        description: article.subtitle || article.description,
        url,
        image,
        datePublished: article.publishedAt,
        dateModified: article.publishedAt,
      },
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement,
  };
};

export default function CategoryArticles({
  articles,
  title = "Artykuły",
  showViewAll = false,
  viewAllHref,
}: Props) {
  const jsonLd = buildArticleJsonLd(articles);

  return (
    <>
      <JsonLdScript data={jsonLd} />
      <div className="mb-12">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.length > 0 ? (
            articles.map((article, index) => {
              const postUrl = getPostUrl(article);
              const coverImage = article.coverImage || article.coverMobileImage;
              const imageProps = getSanityImageProps(coverImage, {
                alt: article.title,
                profile: "card",
                quality: 85,
              });

              const card = (
                <article className="relative h-full flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden hover:shadow-lg transition-all duration-500 hover:scale-105 cursor-pointer">
                  <div className="relative aspect-[16/10] bg-gray-50 dark:bg-gray-700">
                    <Image
                      src={imageProps.src}
                      alt={imageProps.alt || article.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      priority={index < 3}
                    />

                  <div className="absolute top-3 left-3 z-10">
                      {article.categories && article.categories.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1">
                          {article.categories.slice(0, 2).map((category) => (
                            <CategoryBadge
                              key={category._id}
                              category={category}
                            showLink={false}
                            />
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

                  <div className="p-4 pb-4 flex-1">
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
                        <p className="text-sm font-sans text-gray-500 dark:text-gray-400">
                          {article.description}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );

              return postUrl !== "#" ? (
                <Link
                  key={article._id}
                  href={postUrl}
                  className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
                >
                  {card}
                </Link>
              ) : (
                <div key={article._id}>{card}</div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 font-sans">
                Brak artykułów do wyświetlenia
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
