export default {
  name: 'artykul',
  type: 'document',
  title: 'Artykuł',
  fields: [
    // GŁÓWNA ZAKŁADKA
    {
      name: 'title',
      title: 'Tytuł',
      type: 'string',
      group: 'main',
    },
    {
      name: 'subtitle',
      title: 'Podtytuł',
      type: 'string',
      group: 'main',
    },
    {
      name: 'description',
      title: 'Opis',
      type: 'text',
      rows: 3,
      description: 'Krótki opis artykułu używany w listach i kartach artykułów',
      group: 'main',
    },
    {
      name: 'categories',
      title: 'Kategorie',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'category' }],
        },
      ],
      validation: (Rule: any) => Rule.min(1).error('Post musi mieć przynajmniej jedną kategorię'),
      group: 'main',
    },
    {
      name: 'slug',
      title: 'Slug (adres URL)',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      group: 'main',
    },
    {
      name: 'coverImage',
      title: 'Zdjęcie główne',
      type: 'image',
      options: { hotspot: true },
      group: 'main',
    },
    {
      name: 'coverMobileImage',
      title: 'Zdjęcie główne (mobile)',
      type: 'image',
      options: { hotspot: true },
      group: 'main',
    },
    {
      name: 'publishedAt',
      title: 'Data publikacji',
      type: 'datetime',
      group: 'main',
    },
    
    // SEO ZAKŁADKA
    {
      name: 'seo',
      title: 'SEO',
      type: 'object',
      group: 'seo',
      fields: [
        {
          name: 'seoTitle',
          title: 'Tytuł SEO',
          type: 'string',
          description: 'Tytuł strony dla wyszukiwarek (meta title)',
          validation: (Rule: any) => Rule.max(60).warning('Tytuł SEO powinien mieć maksymalnie 60 znaków'),
        },
        {
          name: 'seoDescription',
          title: 'Opis SEO',
          type: 'text',
          rows: 3,
          description: 'Opis strony dla wyszukiwarek (meta description)',
          validation: (Rule: any) => Rule.max(160).warning('Opis SEO powinien mieć maksymalnie 160 znaków'),
        },
        {
          name: 'seoKeywords',
          title: 'Słowa kluczowe',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            layout: 'tags',
          },
          description: 'Słowa kluczowe oddzielone przecinkami',
        },
        {
          name: 'canonicalUrl',
          title: 'Canonical URL',
          type: 'url',
          description: 'Główny adres URL strony (opcjonalnie)',
        },
        {
          name: 'noIndex',
          title: 'Nie indeksuj',
          type: 'boolean',
          description: 'Zaznacz jeśli strona nie ma być indeksowana przez wyszukiwarki',
          initialValue: false,
        },
        {
          name: 'noFollow',
          title: 'No Follow',
          type: 'boolean',
          description: 'Zaznacz jeśli linki na stronie nie mają być śledzone przez wyszukiwarki',
          initialValue: false,
        },
        {
          name: 'ogTitle',
          title: 'Open Graph - Tytuł',
          type: 'string',
          description: 'Tytuł dla mediów społecznościowych (Facebook, Twitter)',
        },
        {
          name: 'ogDescription',
          title: 'Open Graph - Opis',
          type: 'text',
          rows: 2,
          description: 'Opis dla mediów społecznościowych',
        },
        {
          name: 'ogImage',
          title: 'Open Graph - Obraz',
          type: 'image',
          description: 'Obraz wyświetlany w mediach społecznościowych',
          options: { hotspot: true },
        },
      ],
    },

    // KOMPONENTY ZAKŁADKA
    {
      name: 'components',
      title: 'Komponenty',
      type: 'array',
      of: [
        { type: 'heroBanner' },
        { type: 'backgroundHeroBanner' },
        { type: 'textContent' },
        { type: 'imageCollage' },
        { type: 'embedYoutube' },
        { type: 'articles' },
        // Tutaj będziemy dodawać kolejne komponenty jak karuzele, blog artykułów, kategorie itp.
      ],
      description: 'Dodaj komponenty, które będą wyświetlane na stronie posta',
      group: 'components',
    },

    // KOMENTARZE ZAKŁADKA
    {
      name: 'comments',
      title: 'Komentarze',
      type: 'object',
      group: 'comments',
      fields: [
        {
          name: 'enabled',
          title: 'Włącz komentarze',
          type: 'boolean',
          initialValue: true,
          description: 'Czy komentarze mają być włączone dla tego posta',
        },
        {
          name: 'moderation',
          title: 'Moderacja',
          type: 'object',
          fields: [
            {
              name: 'requireApproval',
              title: 'Wymagaj zatwierdzenia',
              type: 'boolean',
              initialValue: true,
              description: 'Czy komentarze wymagają zatwierdzenia przed publikacją',
            },
            {
              name: 'maxLength',
              title: 'Maksymalna długość komentarza',
              type: 'number',
              initialValue: 1000,
              description: 'Maksymalna liczba znaków w komentarzu',
            },
            {
              name: 'allowReplies',
              title: 'Zezwól na odpowiedzi',
              type: 'boolean',
              initialValue: true,
              description: 'Czy użytkownicy mogą odpowiadać na komentarze',
            },
          ],
        },
      ],
    },
  ],
  groups: [
    {
      name: 'main',
      title: 'Główna',
      default: true,
    },
    {
      name: 'seo',
      title: 'SEO',
    },
    {
      name: 'components',
      title: 'Komponenty',
    },
    {
      name: 'comments',
      title: 'Komentarze',
    },
  ],
}