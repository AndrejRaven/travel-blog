export default {
  name: 'homepage',
  type: 'document',
  title: 'Strona główna',
  fields: [
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

    // BANER HERO ZAKŁADKA
    {
      name: 'heroComponents',
      title: 'Baner na górze strony',
      type: 'array',
      of: [
        { type: 'heroBanner' },
        { type: 'backgroundHeroBanner' },
      ],
      description: 'Dodaj komponenty banera wyświetlane na górze strony (pełna szerokość)',
      group: 'components',
    },

    // KOMPONENTY GŁÓWNE ZAKŁADKA
    {
      name: 'mainComponents',
      title: 'Komponenty główne',
      type: 'array',
      of: [
        { type: 'textContent' },
        { type: 'imageCollage' },
        { type: 'embedYoutube' },
        { type: 'articles' },
        { type: 'categoriesSection' },
        { type: 'instagramSection' },
        { type: 'newsletter' },
      ],
      description: 'Dodaj komponenty, które będą wyświetlane w głównej części strony (75% szerokości)',
      group: 'components',
    },

    // KOMPONENTY ASIDE ZAKŁADKA
    {
      name: 'asideComponents',
      title: 'Komponenty boczne (Aside)',
      type: 'array',
      of: [
        { type: 'aboutUs' },
        { type: 'youtubeChannel' },
        { type: 'supportSection' },
      ],
      description: 'Dodaj komponenty, które będą wyświetlane w bocznej części strony (25% szerokości)',
      group: 'components',
    },

    // INNE KOMPONENTY ZAKŁADKA
    {
      name: 'additionalComponents',
      title: 'Inne komponenty',
      type: 'array',
      of: [
        { type: 'heroBanner' },
        { type: 'backgroundHeroBanner' },
        { type: 'textContent' },
        { type: 'imageCollage' },
        { type: 'embedYoutube' },
        { type: 'articles' },
        { type: 'categoriesSection' },
        { type: 'instagramSection' },
        { type: 'newsletter' },
        { type: 'aboutUs' },
        { type: 'youtubeChannel' },
        { type: 'supportSection' },
      ],
      description: 'Dodaj dodatkowe komponenty, które będą wyświetlane na dole strony (pełna szerokość)',
      group: 'components',
    },

    // USTAWIENIA STRONY ZAKŁADKA
    {
      name: 'pageSettings',
      title: 'Ustawienia strony',
      type: 'object',
      group: 'settings',
      fields: [
        {
          name: 'showBreadcrumbs',
          title: 'Pokaż breadcrumbs',
          type: 'boolean',
          initialValue: false,
          description: 'Czy pokazywać breadcrumbs na stronie głównej',
        },
        {
          name: 'showLastUpdated',
          title: 'Pokaż datę ostatniej aktualizacji',
          type: 'boolean',
          initialValue: true,
          description: 'Czy pokazywać datę ostatniej aktualizacji na stronie',
        },
        {
          name: 'enableComments',
          title: 'Włącz komentarze',
          type: 'boolean',
          initialValue: false,
          description: 'Czy komentarze mają być dostępne na stronie głównej',
        },
        {
          name: 'showSocialShare',
          title: 'Pokaż przyciski udostępniania',
          type: 'boolean',
          initialValue: true,
          description: 'Czy pokazywać przyciski udostępniania w mediach społecznościowych',
        },
      ],
    },
  ],
  groups: [
    {
      name: 'seo',
      title: 'SEO',
      default: true,
    },
    {
      name: 'components',
      title: 'Komponenty',
    },
    {
      name: 'settings',
      title: 'Ustawienia',
    },
  ],
  preview: {
    select: {
      title: 'seo.seoTitle',
      subtitle: 'seo.seoDescription',
    },
    prepare(selection: any) {
      const { title, subtitle } = selection;
      return {
        title: title || 'Strona główna',
        subtitle: subtitle || 'Brak opisu SEO',
      };
    },
  },
}
