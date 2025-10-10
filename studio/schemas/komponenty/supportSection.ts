export default {
  name: 'supportSection',
  type: 'object',
  title: 'Sekcja wsparcia (Aside)',
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
      initialValue: 'Wsparcie naszego bloga',
      group: 'content',
    },
    {
      name: 'description',
      title: 'Opis',
      type: 'text',
      rows: 3,
      initialValue: 'Jeśli podoba Ci się nasza treść, możesz nas wesprzeć. Każda złotówka pomaga nam w tworzeniu lepszych artykułów i filmów.',
      group: 'content',
    },
    {
      name: 'supportOptions',
      title: 'Opcje wsparcia',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'object',
          name: 'supportOption',
          title: 'Opcja wsparcia',
          fields: [
            {
              name: 'id',
              title: 'ID',
              type: 'string',
              description: 'Unikalny identyfikator',
            },
            {
              name: 'name',
              title: 'Nazwa',
              type: 'string',
            },
            {
              name: 'href',
              title: 'Link',
              type: 'url',
            },
            {
              name: 'icon',
              title: 'Ikona (plik)',
              type: 'image',
              description: 'Ikona jako plik obrazu',
            },
            {
              name: 'iconSvg',
              title: 'Ikona (SVG)',
              type: 'text',
              description: 'Ikona jako kod SVG',
            },
            {
              name: 'variant',
              title: 'Wariant przycisku',
              type: 'string',
              options: {
                list: [
                  { title: 'Primary', value: 'primary' },
                  { title: 'Secondary', value: 'secondary' },
                  { title: 'Outline', value: 'outline' },
                  { title: 'YouTube', value: 'youtube' },
                ],
              },
              initialValue: 'outline',
            },
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'href',
            },
          },
        },
      ],
      initialValue: [
        {
          id: 'buymeacoffee',
          name: 'Buy Me a Coffee',
          href: 'https://buymeacoffee.com/naszblog',
          variant: 'outline',
        },
        {
          id: 'patronite',
          name: 'Patronite',
          href: 'https://patronite.pl/naszblog',
          variant: 'outline',
        },
        {
          id: 'revolut',
          name: 'Revolut',
          href: 'https://revolut.com',
          variant: 'outline',
        },
      ],
    },
    {
      name: 'thankYouMessage',
      title: 'Wiadomość podziękowania',
      type: 'string',
      initialValue: 'Dziękujemy za wsparcie! ❤️',
      group: 'content',
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
      subtitle: 'description',
    },
    prepare(selection: any) {
      const { title, subtitle } = selection;
      return {
        title: title || 'Sekcja wsparcia',
        subtitle: subtitle ? subtitle.substring(0, 50) + '...' : 'Brak opisu',
      };
    },
  },
}
