export default {
  name: 'backgroundHeroBanner',
  type: 'object',
  title: 'Background Hero Banner',
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
      title: 'Obraz w tle',
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
          name: 'height',
          title: 'Wysokość baneru (vh)',
          type: 'number',
          options: {
            list: [
              { title: '25vh', value: 25 },
              { title: '50vh', value: 50 },
              { title: '75vh', value: 75 },
              { title: '100vh', value: 100 },
            ],
            layout: 'radio',
          },
          initialValue: 75,
        },
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
          name: 'overlayOpacity',
          title: 'Przezroczystość nakładki (%)',
          type: 'number',
          options: {
            list: [
              { title: '10%', value: 10 },
              { title: '20%', value: 20 },
              { title: '30%', value: 30 },
              { title: '40%', value: 40 },
              { title: '50%', value: 50 },
              { title: '60%', value: 60 },
              { title: '70%', value: 70 },
              { title: '80%', value: 80 },
              { title: '90%', value: 90 },
            ],
            layout: 'dropdown',
          },
          initialValue: 30,
        },
        {
          name: 'textStyle',
          title: 'Styl tekstu',
          type: 'string',
          options: {
            list: [
              { title: 'Normalny', value: 'normal' },
              { title: 'Pogrubiony', value: 'bold' },
              { title: 'Kontur', value: 'outline' },
              { title: 'Cień', value: 'shadow' },
            ],
            layout: 'radio',
          },
          initialValue: 'shadow',
        },
        {
          name: 'showScrollIndicator',
          title: 'Pokaż wskaźnik przewijania',
          type: 'boolean',
          description: 'Pokazuje przycisk "Przewiń w dół" na dole baneru',
          initialValue: false,
        },
        {
          name: 'showBottomGradient',
          title: 'Pokaż gradient na dole',
          type: 'boolean',
          description: 'Pokazuje subtelny gradient sugerujący kontynuację treści',
          initialValue: false,
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
        title: text || 'Background Hero Banner',
        media,
      };
    },
  },
}
