import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/config';
import { fetchGroq } from '@/lib/sanity';
import { QUERIES } from '@/lib/queries';
import { getPostUrl } from '@/lib/utils';
import type { Post } from '@/lib/sanity';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.url;
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  // Strona główna
  entries.push({
    url: baseUrl,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 1.0,
  });

  // Statyczne strony
  const staticPages = [
    '/kontakt',
    '/polityka-prywatnosci',
    '/regulamin',
    '/wsparcie',
    '/polityka-cookies',
    '/ustawienia-cookies',
  ];

  staticPages.forEach((path) => {
    entries.push({
      url: `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    });
  });

  try {
    // Pobierz wszystkie super kategorie
    const superCategories = await fetchGroq<Array<{
      slug: { current: string };
    }>>(
      QUERIES.SUPER_CATEGORY.ALL,
      {},
      'CATEGORIES'
    );

    // Pobierz wszystkie kategorie główne
    const mainCategories = await fetchGroq<Array<{
      slug: { current: string };
      superCategory?: { slug: { current: string } };
    }>>(
      QUERIES.MAIN_CATEGORY.ALL,
      {},
      'CATEGORIES'
    );

    // Pobierz wszystkie podkategorie
    const categories = await fetchGroq<Array<{
      slug: { current: string };
      mainCategory?: {
        slug: { current: string };
        superCategory?: { slug: { current: string } };
      };
    }>>(
      QUERIES.CATEGORY.ALL,
      {},
      'CATEGORIES'
    );

    // Pobierz wszystkie posty z datami publikacji
    const postsWithDates = await fetchGroq<Array<{
      slug?: { current: string };
      publishedAt?: string;
      seo?: {
        noIndex?: boolean;
      };
      categories?: Array<{
        slug?: { current: string };
        mainCategory?: {
          slug?: { current: string };
          superCategory?: {
            slug?: { current: string };
          };
        };
      }>;
    }>>(
      `*[_type == "post" && defined(slug.current)] {
        slug,
        publishedAt,
        seo {
          noIndex
        },
        "categories": categories[]-> {
          slug {
            current
          },
          "mainCategory": mainCategory-> {
            slug {
              current
            },
            "superCategory": superCategory-> {
              slug {
                current
              }
            }
          }
        }
      }`,
      {},
      'POSTS'
    );

    // Dodaj super kategorie
    superCategories.forEach((superCat) => {
      entries.push({
        url: `${baseUrl}/${superCat.slug.current}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });

    // Dodaj kategorie główne
    mainCategories.forEach((mainCat) => {
      if (mainCat.superCategory?.slug.current) {
        entries.push({
          url: `${baseUrl}/${mainCat.superCategory.slug.current}/${mainCat.slug.current}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    });

    // Dodaj podkategorie
    categories.forEach((category) => {
      const superCatSlug = category.mainCategory?.superCategory?.slug.current;
      const mainCatSlug = category.mainCategory?.slug.current;
      
      if (superCatSlug && mainCatSlug) {
        entries.push({
          url: `${baseUrl}/${superCatSlug}/${mainCatSlug}/${category.slug.current}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    });

    // Dodaj posty (pomijając te z noIndex)
    let postsAdded = 0;
    let postsSkipped = 0;
    postsWithDates.forEach((post) => {
      // Pomiń posty oznaczone jako noIndex
      if (post.seo?.noIndex) {
        postsSkipped++;
        return;
      }

      const postUrl = getPostUrl(post as Post);
      if (postUrl && postUrl !== "#") {
        entries.push({
          url: `${baseUrl}${postUrl}`,
          lastModified: post.publishedAt ? new Date(post.publishedAt) : now,
          changeFrequency: 'monthly',
          priority: 0.9,
        });
        postsAdded++;
      } else {
        postsSkipped++;
      }
    });

    // Debug logging
    console.log(`[Sitemap] Total posts fetched: ${postsWithDates.length}`);
    console.log(`[Sitemap] Posts added to sitemap: ${postsAdded}`);
    console.log(`[Sitemap] Posts skipped: ${postsSkipped}`);

  } catch (error) {
    console.error('Error generating sitemap:', error);
    // W przypadku błędu zwróć przynajmniej statyczne strony
  }

  return entries;
}

