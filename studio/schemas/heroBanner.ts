export default {
  name: 'heroBanner',
  type: 'object',
  title: 'Hero Banner',
  fields: [
    {
      name: 'content',
      title: 'Treść',
      type: 'richText',
      validation: (Rule: any) => Rule.required(),
      description: 'Tytuł i opis w jednym polu. Użyj nagłówków (H1, H2, H3) dla tytułów i zwykłego tekstu dla opisu.',
    },
    {
      name: 'image',
      title: 'Obraz',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'buttons',
      title: 'Przyciski',
      type: 'array',
      of: [{ type: 'button' }],
    },
    {
      name: 'layout',
      title: 'Układ',
      type: 'object',
      fields: [
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
        },
        {
          name: 'textSpacing',
          title: 'Odstępy tekstu',
          type: 'string',
          options: {
            list: [
              { title: 'Z odstępami', value: 'with-spacing' },
              { title: 'Bez odstępów', value: 'no-spacing' },
            ],
            layout: 'radio',
          },
          initialValue: 'with-spacing',
        },
        {
          name: 'height',
          title: 'Wysokość baneru (vh)',
          type: 'number',
          options: {
            list: [
              { title: '25vh', value: 25 },
              { title: '50vh', value: 50 },
              { title: '75vh', value: 75 },
            ],
            layout: 'radio',
          },
          initialValue: 75,
        },
        {
          name: 'backgroundColor',
          title: 'Kolor tła',
          type: 'string',
          options: {
            list: [
              { title: 'Tło', value: 'background' },
              { title: 'Karta', value: 'card' },
              { title: 'Akcent', value: 'accent' },
              { title: 'Hero', value: 'hero' },
              { title: 'Przycisk', value: 'button' },
              { title: 'Nawigacja', value: 'navigation' },
            ],
            layout: 'dropdown',
          },
          initialValue: 'card',
        },
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
