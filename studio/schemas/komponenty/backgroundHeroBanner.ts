export default {
  name: 'backgroundHeroBanner',
  type: 'object',
  title: 'Background Hero Banner',
  initialValue: () => ({
    container: {
      maxWidth: "6xl",
      padding: "md",
      margin: {
        top: "md",
        bottom: "md"
      },
      alignment: "left",
      backgroundColor: "transparent",
      borderRadius: "none",
      shadow: "none",
      height: "75vh"
    }
  }),
  fieldsets: [
    {
      name: 'content',
      title: 'Treść',
      options: { collapsible: true, collapsed: false }
    },
    {
      name: 'properties',
      title: 'Właściwości',
      options: { collapsible: true, collapsed: false }
    }
  ],
  fields: [
    {
      name: 'container',
      title: 'Kontener',
      type: 'baseContainer',
      description: 'Podstawowe ustawienia layoutu (szerokość, odstępy, wyrównanie)',
      fieldset: 'properties'
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
      title: 'Obraz w tle (desktop)',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule: any) => Rule.required(),
      description: 'Obraz wyświetlany na desktop i jako fallback na mobile',
      fieldset: 'content'
    },
    {
      name: 'mobileImage',
      title: 'Obraz w tle (mobile)',
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
