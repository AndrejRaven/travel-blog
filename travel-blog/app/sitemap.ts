import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/config';
import { fetchGroq } from '@/lib/sanity';
import { QUERIES } from '@/lib/queries';

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
      slug: { current: string };
      publishedAt?: string;
      seo?: {
        noIndex?: boolean;
      };
      categories?: Array<{
        slug: { current: string };
        mainCategory?: {
          slug: { current: string };
          superCategory?: {
            slug: { current: string };
          };
        };
      }>;
    }>>(
      `*[_type == "post" && defined(slug.current)] {
        "slug": slug.current,
        publishedAt,
        seo {
          noIndex
        },
        "categories": categories[]-> {
          "slug": slug.current,
          "mainCategory": mainCategory-> {
            "slug": slug.current,
            "superCategory": superCategory-> {
              "slug": slug.current
            }
          }
        }[0]
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
    postsWithDates.forEach((post) => {
      // Pomiń posty oznaczone jako noIndex
      if (post.seo?.noIndex) {
        return;
      }

      const category = post.categories?.[0];
      const superCatSlug = category?.mainCategory?.superCategory?.slug.current;
      const mainCatSlug = category?.mainCategory?.slug.current;
      const catSlug = category?.slug.current;
      
      if (superCatSlug && mainCatSlug && catSlug) {
        entries.push({
          url: `${baseUrl}/${superCatSlug}/${mainCatSlug}/${catSlug}/${post.slug.current}`,
          lastModified: post.publishedAt ? new Date(post.publishedAt) : now,
          changeFrequency: 'monthly',
          priority: 0.9,
        });
      }
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    // W przypadku błędu zwróć przynajmniej statyczne strony
  }

  return entries;
}

