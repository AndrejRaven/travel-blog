export default {
  name: 'categoriesSection',
  type: 'object',
  title: 'Sekcja kategorii (Main)',
  fields: [
    {
      name: 'container',
      title: 'Kontener',
      type: 'baseContainer',
      description: 'Podstawowe ustawienia layoutu (szerokość, odstępy, wyrównanie, wysokość)',
      group: 'properties',
    },
    {
      name: 'title',
      title: 'Tytuł',
      type: 'string',
      initialValue: 'Kategorie artykułów',
      group: 'content',
    },
    {
      name: 'showBackground',
      title: 'Pokaż tło',
      type: 'boolean',
      initialValue: true,
      description: 'Czy sekcja ma mieć szare tło',
      group: 'content',
    },
    {
      name: 'categories',
      title: 'Kategorie',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'object',
          name: 'categoryItem',
          title: 'Kategoria',
          fields: [
            {
              name: 'id',
              title: 'ID',
              type: 'string',
              description: 'Unikalny identyfikator kategorii',
            },
            {
              name: 'name',
              title: 'Nazwa',
              type: 'string',
            },
            {
              name: 'description',
              title: 'Opis',
              type: 'string',
            },
            {
              name: 'href',
              title: 'Link',
              type: 'string',
              description: 'Link do strony kategorii',
            },
            {
              name: 'icon',
              title: 'Ikona',
              type: 'image',
              options: { hotspot: true },
            },
            {
              name: 'articleCount',
              title: 'Liczba artykułów',
              type: 'number',
              description: 'Liczba artykułów w kategorii (opcjonalnie)',
            },
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'description',
              media: 'icon',
            },
          },
        },
      ],
      initialValue: [
        {
          id: 'przygoda',
          name: 'Przygoda',
          description: 'Krótki opis kategorii',
          href: '/kategoria/przygoda',
          articleCount: 12,
        },
        {
          id: 'kuchnia',
          name: 'Kuchnia',
          description: 'Krótki opis kategorii',
          href: '/kategoria/kuchnia',
          articleCount: 8,
        },
        {
          id: 'kultura',
          name: 'Kultura',
          description: 'Krótki opis kategorii',
          href: '/kategoria/kultura',
          articleCount: 15,
        },
        {
          id: 'natura',
          name: 'Natura',
          description: 'Krótki opis kategorii',
          href: '/kategoria/natura',
          articleCount: 6,
        },
      ],
    },
  ],
  groups: [
    {
      name: 'content',
      title: 'Treść',
      default: true,
    },
    {
      name: 'properties',
      title: 'Właściwości',
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'categories.0.name',
    },
    prepare(selection: any) {
      const { title, subtitle } = selection;
      return {
        title: title || 'Sekcja kategorii',
        subtitle: subtitle ? `Pierwsza kategoria: ${subtitle}` : 'Brak kategorii',
      };
    },
  },
}
