// Funkcja pomocnicza do pobierania danych dokumentu
async function getDocumentData(client: any, id: string) {
  const query = `*[_id == $id][0]`
  return await client.fetch(query, { id })
}

// Base URL dla aplikacji Next.js (localhost:3000 w dev)
const baseUrl = process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:3000'

// Resolver mapujący typy dokumentów na URL-e w aplikacji Next.js
export const locations = {
  // Resolver dla różnych typów dokumentów
  resolve: {
    // Strona główna
    homepage: {
      locations: [
        {
          title: 'Strona główna',
          href: '/',
        },
      ],
    },

    // Posty - wymagają pełnej ścieżki kategorii
    post: {
      locations: async (document, context) => {
        const { client } = context
        
        // Pobierz pełne dane posta z kategoriami (używając referencji)
        const postQuery = `*[_id == $id][0]{
          _id,
          title,
          slug,
          categories[]-> {
            _id,
            slug,
            mainCategory-> {
              slug,
              superCategory-> {
                slug
              }
            }
          }
        }`
        
        const post = await client.fetch(postQuery, { id: document._id })
        
        if (!post || !post.slug?.current) {
          return []
        }

        // Pobierz pierwszą kategorię z pełną hierarchią
        if (!post.categories || post.categories.length === 0) {
          return []
        }

        const category = post.categories[0]
        if (!category || !category.slug?.current) {
          return []
        }

        const superCategorySlug = category.mainCategory?.superCategory?.slug?.current
        const mainCategorySlug = category.mainCategory?.slug?.current
        const categorySlug = category.slug.current
        const postSlug = post.slug.current

        if (!superCategorySlug || !mainCategorySlug) {
          return []
        }

        return [
          {
            title: post.title || 'Post',
            href: `/${superCategorySlug}/${mainCategorySlug}/${categorySlug}/${postSlug}`,
          },
        ]
      },
    },

    // Podkategorie (category)
    category: {
      locations: async (document, context) => {
        const { client } = context
        
        const category = await getDocumentData(client, document._id)
        
        if (!category || !category.slug?.current) {
          return []
        }

        // Pobierz pełne dane kategorii z hierarchią
        const categoryQuery = `*[_id == $categoryId][0]{
          slug,
          mainCategory-> {
            slug,
            superCategory-> {
              slug
            }
          }
        }`
        
        const fullCategory = await client.fetch(categoryQuery, {
          categoryId: document._id,
        })

        if (!fullCategory || !fullCategory.slug?.current) {
          return []
        }

        const superCategorySlug = fullCategory.mainCategory?.superCategory?.slug?.current
        const mainCategorySlug = fullCategory.mainCategory?.slug?.current
        const categorySlug = fullCategory.slug.current

        if (!superCategorySlug || !mainCategorySlug) {
          return []
        }

        return [
          {
            title: category.name || 'Kategoria',
            href: `/${superCategorySlug}/${mainCategorySlug}/${categorySlug}`,
          },
        ]
      },
    },

    // Kategorie główne (mainCategory)
    mainCategory: {
      locations: async (document, context) => {
        const { client } = context
        
        const mainCategory = await getDocumentData(client, document._id)
        
        if (!mainCategory || !mainCategory.slug?.current) {
          return []
        }

        // Pobierz pełne dane z superCategory
        const mainCategoryQuery = `*[_id == $mainCategoryId][0]{
          slug,
          superCategory-> {
            slug
          }
        }`
        
        const fullMainCategory = await client.fetch(mainCategoryQuery, {
          mainCategoryId: document._id,
        })

        if (!fullMainCategory || !fullMainCategory.slug?.current) {
          return []
        }

        const superCategorySlug = fullMainCategory.superCategory?.slug?.current
        const mainCategorySlug = fullMainCategory.slug.current

        if (!superCategorySlug) {
          return []
        }

        return [
          {
            title: mainCategory.name || 'Kategoria główna',
            href: `/${superCategorySlug}/${mainCategorySlug}`,
          },
        ]
      },
    },

    // Kategorie nadrzędne (superCategory)
    superCategory: {
      locations: async (document, context) => {
        const { client } = context
        
        const superCategory = await getDocumentData(client, document._id)
        
        if (!superCategory || !superCategory.slug?.current) {
          return []
        }

        return [
          {
            title: superCategory.name || 'Kategoria nadrzędna',
            href: `/${superCategory.slug.current}`,
          },
        ]
      },
    },
  },
}

