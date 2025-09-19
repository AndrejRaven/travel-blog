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
      name: 'mainMenu',
      title: 'Główne menu',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'menuItem',
          title: 'Element menu',
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
              description: 'Opcjonalny link dla elementu menu (tylko dla elementów bez dropdowna)',
              hidden: ({ parent }: any) => parent?.hasDropdown,
            },
            {
              name: 'isExternal',
              title: 'Link zewnętrzny',
              type: 'boolean',
              initialValue: false,
              hidden: ({ parent }: any) => parent?.hasDropdown,
            },
            {
              name: 'hasDropdown',
              title: 'Ma dropdown',
              type: 'boolean',
              initialValue: false,
              description: 'Zaznacz jeśli element ma rozwijane podmenu',
            },
            {
              name: 'dropdownItems',
              title: 'Elementy dropdowna',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'dropdownItem',
                  title: 'Element dropdowna',
                  fields: [
                    {
                      name: 'label',
                      title: 'Tytuł',
                      type: 'string',
                      validation: (Rule: any) => Rule.required(),
                    },
                    {
                      name: 'href',
                      title: 'Link',
                      type: 'string',
                      description: 'Opcjonalny link dla elementu dropdowna (tylko dla elementów bez podmenu)',
                      hidden: ({ parent }: any) => parent?.hasSubmenu,
                    },
                    {
                      name: 'isExternal',
                      title: 'Link zewnętrzny',
                      type: 'boolean',
                      initialValue: false,
                      hidden: ({ parent }: any) => parent?.hasSubmenu,
                    },
                    {
                      name: 'hasSubmenu',
                      title: 'Ma podmenu',
                      type: 'boolean',
                      initialValue: false,
                      description: 'Zaznacz jeśli element ma dodatkowe podmenu',
                    },
                    {
                      name: 'submenuItems',
                      title: 'Elementy podmenu',
                      type: 'array',
                      of: [
                        {
                          type: 'object',
                          name: 'submenuItem',
                          title: 'Element podmenu',
                          fields: [
                            {
                              name: 'label',
                              title: 'Tytuł',
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
                      hidden: ({ parent }: any) => !parent?.hasSubmenu,
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
              hidden: ({ parent }: any) => !parent?.hasDropdown,
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
      description: 'Główne elementy menu z możliwością dropdownów',
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
      subtitle: 'mainMenu.0.label',
    },
  },
}
