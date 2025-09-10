export default {
  name: 'header',
  type: 'document',
  title: 'Header Navigation',
  fields: [
    {
      name: 'title',
      title: 'Tytuł strony',
      type: 'string',
      description: 'Tytuł wyświetlany w headerze (np. "Nasz Blog")',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true },
      description: 'Logo wyświetlane w headerze',
    },
    {
      name: 'mainNavigation',
      title: 'Główna nawigacja',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'navItem',
          title: 'Element nawigacji',
          fields: [
            {
              name: 'label',
              title: 'Etykieta',
              type: 'string',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'href',
              title: 'Link',
              type: 'string',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'isExternal',
              title: 'Link zewnętrzny',
              type: 'boolean',
              description: 'Zaznacz jeśli link prowadzi poza stronę',
              initialValue: false,
            },
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'href',
            },
          },
        },
      ],
      description: 'Główne elementy nawigacji (Główna, O nas, Kontakt)',
    },
    {
      name: 'categoriesDropdown',
      title: 'Dropdown Kategorie',
      type: 'object',
      fields: [
        {
          name: 'label',
          title: 'Etykieta dropdowna',
          type: 'string',
          initialValue: 'Kategorie',
          validation: (Rule: any) => Rule.required(),
        },
        {
          name: 'sections',
          title: 'Sekcje kategorii',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'categorySection',
              title: 'Sekcja kategorii',
              fields: [
                {
                  name: 'key',
                  title: 'Klucz sekcji',
                  type: 'string',
                  validation: (Rule: any) => Rule.required(),
                  description: 'Unikalny identyfikator (np. places, guides, culture)',
                },
                {
                  name: 'title',
                  title: 'Tytuł sekcji',
                  type: 'string',
                  validation: (Rule: any) => Rule.required(),
                },
                {
                  name: 'emoji',
                  title: 'Emoji',
                  type: 'string',
                  validation: (Rule: any) => Rule.required().max(2),
                  description: 'Emoji dla sekcji (max 2 znaki)',
                },
                {
                  name: 'items',
                  title: 'Elementy sekcji',
                  type: 'array',
                  of: [
                    {
                      type: 'object',
                      name: 'categoryItem',
                      title: 'Element kategorii',
                      fields: [
                        {
                          name: 'label',
                          title: 'Etykieta',
                          type: 'string',
                          validation: (Rule: any) => Rule.required(),
                        },
                        {
                          name: 'href',
                          title: 'Link',
                          type: 'string',
                          validation: (Rule: any) => Rule.required(),
                        },
                        {
                          name: 'isExternal',
                          title: 'Link zewnętrzny',
                          type: 'boolean',
                          initialValue: false,
                        },
                      ],
                      preview: {
                        select: {
                          title: 'label',
                          subtitle: 'href',
                        },
                      },
                    },
                  ],
                },
              ],
              preview: {
                select: {
                  title: 'title',
                  subtitle: 'emoji',
                },
              },
            },
          ],
        },
      ],
    },
    {
      name: 'mobileMenu',
      title: 'Menu mobilne',
      type: 'object',
      fields: [
        {
          name: 'isEnabled',
          title: 'Włączone',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'label',
          title: 'Etykieta przycisku',
          type: 'string',
          initialValue: 'Menu',
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'mainNavigation.0.label',
    },
  },
}
