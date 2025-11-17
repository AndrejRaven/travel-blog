export default {
  name: 'siteConfig',
  type: 'document',
  title: 'Konfiguracja strony',
  groups: [
    { name: 'general', title: 'Informacje ogólne', default: true },
    { name: 'social', title: 'Social media' },
    { name: 'popup', title: 'Popup promocyjny' },
    { name: 'banners', title: 'Globalne banery' },
  ],
  fields: [
    {
      name: 'general',
      title: 'Informacje ogólne',
      type: 'object',
      group: 'general',
      fields: [
        {
          name: 'siteName',
          title: 'Nazwa strony',
          type: 'string',
          description: 'Używana jako domyślny tytuł oraz fallback w aplikacji',
          validation: (Rule: any) => Rule.required(),
        },
        {
          name: 'siteDescription',
          title: 'Opis strony',
          type: 'text',
          rows: 3,
          description: 'Krótki opis używany w miejscach, gdzie nie ma treści z Sanity',
        },
        {
          name: 'contactEmail',
          title: 'E-mail kontaktowy',
          type: 'string',
          validation: (Rule: any) => Rule.email().warning('Wpisz poprawny adres e-mail'),
        },
        {
          name: 'contactPhone',
          title: 'Telefon kontaktowy',
          type: 'string',
        },
      ],
    },
    {
      name: 'social',
      title: 'Linki społecznościowe',
      type: 'object',
      group: 'social',
      fields: [
        {
          name: 'facebook',
          title: 'Facebook',
          type: 'url',
        },
        {
          name: 'instagram',
          title: 'Instagram',
          type: 'url',
        },
        {
          name: 'youtube',
          title: 'YouTube',
          type: 'url',
        },
        {
          name: 'twitter',
          title: 'Twitter / X',
          type: 'url',
        },
      ],
    },
    {
      name: 'popup',
      title: 'Popup promocyjny',
      type: 'object',
      group: 'popup',
      fields: [
        {
          name: 'enabled',
          title: 'Włączony',
          type: 'boolean',
          description: 'Decyduje czy popup ma być renderowany w aplikacji',
          initialValue: true,
        },
        {
          name: 'title',
          title: 'Tytuł',
          type: 'string',
          validation: (Rule: any) => Rule.required(),
        },
        {
          name: 'description',
          title: 'Opis',
          type: 'text',
          rows: 3,
        },
        {
          name: 'image',
          title: 'Obraz kanału / produktu',
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              title: 'Tekst alternatywny',
              type: 'string',
            },
          ],
        },
        {
          name: 'button',
          title: 'Przycisk CTA',
          type: 'button',
        },
        {
          name: 'scrollThreshold',
          title: 'Próg przewinięcia (%)',
          type: 'number',
          description: 'Po jakim procencie przewinięcia strony ma się pojawić popup',
          initialValue: 60,
          validation: (Rule: any) => Rule.min(10).max(100),
        },
        {
          name: 'cooldownMinutes',
          title: 'Cooldown w minutach',
          type: 'number',
          description: 'Jak często można ponownie pokazać popup temu samemu użytkownikowi',
          initialValue: 60,
          validation: (Rule: any) => Rule.min(5),
        },
      ],
    },
    {
      name: 'globalBanners',
      title: 'Globalne banery (NOT IN USE)',
      description: 'Placeholder - nieużywane w aplikacji, zostaw puste.',
      type: 'array',
      group: 'banners',
      of: [
        {
          type: 'object',
          name: 'globalBanner',
          title: 'Baner globalny',
          fields: [
            {
              name: 'key',
              title: 'Identyfikator',
              type: 'string',
              description: 'Użyj krótkiej nazwy, aby móc łatwo odwołać się w aplikacji',
            },
            {
              name: 'isEnabled',
              title: 'Aktywny',
              type: 'boolean',
              initialValue: false,
            },
            {
              name: 'title',
              title: 'Tytuł',
              type: 'string',
            },
            {
              name: 'message',
              title: 'Wiadomość',
              type: 'text',
              rows: 2,
            },
            {
              name: 'variant',
              title: 'Wariant kolorystyczny',
              type: 'string',
              options: {
                list: [
                  { title: 'Informacja', value: 'info' },
                  { title: 'Sukces', value: 'success' },
                  { title: 'Ostrzeżenie', value: 'warning' },
                  { title: 'Błąd', value: 'error' },
                ],
                layout: 'radio',
              },
              initialValue: 'info',
            },
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'key',
            },
            prepare(selection: any) {
              const { title, subtitle } = selection;
              return {
                title: title || 'Globalny baner',
                subtitle: subtitle || 'Brak identyfikatora',
              };
            },
          },
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'general.siteName',
      subtitle: 'general.siteDescription',
    },
    prepare(selection: any) {
      const { title, subtitle } = selection;
      return {
        title: title || 'Konfiguracja strony',
        subtitle: subtitle || 'Ustawienia globalne',
      };
    },
  },
};

