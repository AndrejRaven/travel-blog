export default {
  name: 'heroBanner',
  type: 'object',
  title: 'Hero Banner',
  fieldsets: [
    {
      name: 'content',
      title: 'Treść',
      options: { collapsible: true, collapsed: false }
    },
    {
      name: 'properties',
      title: 'Właściwości',
      options: { collapsible: true, collapsed: true }
    }
  ],
  fields: [
    {
      name: 'container',
      title: 'Kontener',
      type: 'baseContainer',
      description: 'Podstawowe ustawienia layoutu (szerokość, odstępy, wyrównanie, wysokość)',
      fieldset: 'properties',
    },
    {
      name: 'content',
      title: 'Treść',
      type: 'richText',
      validation: (Rule: any) => Rule.required(),
      description: 'Tytuł i opis w jednym polu. Użyj nagłówków (H1, H2, H3) dla tytułów i zwykłego tekstu dla opisu.',
      fieldset: 'content'
    },
    {
      name: 'image',
      title: 'Obraz (desktop)',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule: any) => Rule.required(),
      description: 'Obraz wyświetlany na desktop i jako fallback na mobile',
      fieldset: 'content'
    },
    {
      name: 'mobileImage',
      title: 'Obraz (mobile)',
      type: 'image',
      options: { hotspot: true },
      description: 'Opcjonalny obraz specjalnie dla mobile. Jeśli nie zostanie wybrany, będzie używany obraz desktop.',
      fieldset: 'content'
    },
    {
      name: 'buttons',
      title: 'Przyciski',
      type: 'array',
      of: [{ type: 'button' }],
      fieldset: 'content'
    },
    {
      name: 'layout',
      title: 'Układ',
      type: 'object',
      fieldset: 'properties',
      fields: [
        {
          name: 'textAlignment',
          title: 'Wyrównanie tekstu',
          type: 'string',
          options: {
            list: [
              { title: 'Lewo', value: 'left' },
              { title: 'Środek', value: 'center' },
              { title: 'Prawo', value: 'right' },
            ],
            layout: 'radio',
          },
          initialValue: 'left',
        },
        {
          name: 'imageWidth',
          title: 'Szerokość obrazka (%)',
          type: 'number',
          options: {
            list: [
              { title: '25%', value: 25 },
              { title: '50%', value: 50 },
              { title: '75%', value: 75 },
            ],
            layout: 'radio',
          },
          initialValue: 50,
        },
        {
          name: 'imagePosition',
          title: 'Pozycja obrazka (desktop)',
          type: 'string',
          options: {
            list: [
              { title: 'Lewo', value: 'left' },
              { title: 'Prawo', value: 'right' },
            ],
            layout: 'radio',
          },
          initialValue: 'right',
        },
        {
          name: 'mobileLayout',
          title: 'Pozycja obrazka (mobile)',
          type: 'string',
          options: {
            list: [
              { title: 'Góra', value: 'top' },
              { title: 'Dół', value: 'bottom' },
            ],
            layout: 'radio',
          },
          initialValue: 'top',
        }
      ],
    },
  ],
  preview: {
    select: {
      content: 'content',
      media: 'image',
    },
    prepare(selection: any) {
      const { content, media } = selection;
      const block = (content || []).find((item: any) => item._type === 'block');
      const text = block ? block.children?.map((child: any) => child.text).join('') : 'Brak treści';
      return {
        title: text || 'Hero Banner',
        media,
      };
    },
  },
}
