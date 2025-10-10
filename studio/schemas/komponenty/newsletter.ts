export default {
  name: 'newsletter',
  type: 'object',
  title: 'Newsletter (Main)',
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
      initialValue: 'Zapisz się do newslettera',
      group: 'content',
    },
    {
      name: 'subtitle',
      title: 'Podtytuł',
      type: 'string',
      initialValue: 'Otrzymuj najnowsze artykuły prosto na swoją skrzynkę',
      group: 'content',
    },
    {
      name: 'description',
      title: 'Opis',
      type: 'text',
      rows: 3,
      initialValue: 'Bądź na bieżąco z naszymi podróżami, przepisami kulinarnymi i poradami podróżniczymi. Zapisz się do naszego newslettera i nie przegap żadnej przygody!',
      group: 'content',
    },
    {
      name: 'placeholder',
      title: 'Placeholder pola email',
      type: 'string',
      initialValue: 'Twój adres email',
      group: 'content',
    },
    {
      name: 'buttonText',
      title: 'Tekst przycisku',
      type: 'string',
      initialValue: 'Zapisz się',
      group: 'content',
    },
    {
      name: 'successMessage',
      title: 'Wiadomość sukcesu',
      type: 'string',
      initialValue: 'Dziękujemy za zapisanie się do newslettera!',
      group: 'content',
    },
    {
      name: 'errorMessage',
      title: 'Wiadomość błędu',
      type: 'string',
      initialValue: 'Wystąpił błąd. Spróbuj ponownie.',
      group: 'content',
    },
    {
      name: 'privacyText',
      title: 'Tekst o prywatności',
      type: 'text',
      rows: 2,
      initialValue: 'Twoje dane są bezpieczne. Nie spamujemy i możesz się wypisać w każdej chwili.',
      group: 'content',
    },
    {
      name: 'showBackground',
      title: 'Pokaż tło',
      type: 'boolean',
      initialValue: true,
      description: 'Czy sekcja ma mieć kolorowe tło',
      group: 'content',
    },
    {
      name: 'features',
      title: 'Funkcje/cechy',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'icon',
              title: 'Ikona',
              type: 'string',
              options: {
                list: [
                  { title: 'Lock', value: 'Lock' },
                  { title: 'Info', value: 'Info' },
                  { title: 'Download', value: 'Download' },
                ],
                layout: 'radio',
              },
              initialValue: 'Lock',
            },
            {
              name: 'text',
              title: 'Tekst',
              type: 'string',
              initialValue: 'Bezpieczne dane',
            },
          ],
          preview: {
            select: {
              title: 'text',
              subtitle: 'icon',
            },
            prepare(selection: any) {
              const { title, subtitle } = selection;
              return {
                title: title || 'Funkcja',
                subtitle: `Ikona: ${subtitle || 'Lock'}`,
              };
            },
          },
        },
      ],
      initialValue: [
        { icon: 'Lock', text: 'Bezpieczne dane' },
        { icon: 'Info', text: 'Tylko wartościowe treści' },
        { icon: 'Download', text: 'Materiały do pobrania' },
      ],
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
      subtitle: 'subtitle',
    },
    prepare(selection: any) {
      const { title, subtitle } = selection;
      return {
        title: title || 'Newsletter',
        subtitle: subtitle || 'Brak podtytułu',
      };
    },
  },
}
