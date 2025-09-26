import baseContainer from "../shared/baseContainer";

export default {
  name: 'categoriesSection',
  type: 'object',
  title: 'Sekcja kategorii (Main)',
  fields: [
    ...baseContainer.fields,
    {
      name: 'title',
      title: 'Tytuł',
      type: 'string',
      initialValue: 'Kategorie artykułów',
    },
    {
      name: 'showBackground',
      title: 'Pokaż tło',
      type: 'boolean',
      initialValue: true,
      description: 'Czy sekcja ma mieć szare tło',
    },
    {
      name: 'categories',
      title: 'Kategorie',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'category',
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
