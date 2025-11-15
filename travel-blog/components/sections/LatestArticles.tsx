import SectionContainer from "@/components/shared/SectionContainer";
import { ArticlesData } from "@/lib/component-types";
import { ArticleForList } from "@/lib/sanity";
import { getSelectedPosts, getLatestPosts } from "@/lib/queries/functions";
import { getPostUrl } from "@/lib/utils";
import { getSanityImageProps } from "@/lib/sanity-image";
import LatestArticlesClient, {
  LatestArticlesCard,
} from "@/components/sections/LatestArticlesClient";

const buildJsonLd = (articles: ArticleForList[]) => {
  if (!articles.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: articles.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Article",
        headline: article.title,
        url: getPostUrl(article),
        image: article.coverImage?.asset?.url || article.coverMobileImage?.asset?.url,
        datePublished: article.publishedAt,
        dateModified: article.publishedAt,
        description: article.subtitle || article.description,
      },
    })),
  };
};

async function loadArticles(data: ArticlesData): Promise<ArticleForList[]> {
  try {
    if (data.articlesType === "selected" && data.selectedArticles?.length) {
      const ids = data.selectedArticles.map((ref) => ref._ref);
      return await getSelectedPosts(ids);
    }

    return await getLatestPosts(data.maxArticles);
  } catch (error) {
    console.error("Articles: Failed to fetch data", error);
    return [];
  }
}

interface Props {
  data: ArticlesData;
}

export default async function Articles({ data }: Props) {
  const { container, title, showViewAll, viewAllHref, maxArticles } = data || {};

  if (!data || !container) {
    console.error("Articles: Missing container data", { container: data?.container });
    return null;
  }

  const articles = (await loadArticles(data)).slice(0, maxArticles);
  const jsonLd = buildJsonLd(articles);

  const articleCards: LatestArticlesCard[] = articles.map((article) => {
    const coverImage = article.coverImage || article.coverMobileImage;
    const imageProps = getSanityImageProps(coverImage, {
      quality: 90,
      fit: "fillmax",
    });

    return {
      id: article._id,
      title: article.title,
      subtitle: article.subtitle,
      description: article.description,
      publishedAt: article.publishedAt,
      url: getPostUrl(article),
      coverImage: imageProps,
      categories: (article.categories || []).map((category) => ({
        _id: category._id,
        name: category.name,
        slug: category.slug,
        color: category.color,
        invertOnDark: false,
        mainCategory: category.mainCategory,
      })),
    };
  });

  return (
    <SectionContainer config={container} role="region" aria-labelledby={title}>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <LatestArticlesClient
        title={title}
        showViewAll={showViewAll}
        viewAllHref={viewAllHref}
        articles={articleCards}
      />
    </SectionContainer>
  );
}
