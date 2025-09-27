export default {
  name: 'backgroundHeroBanner',
  type: 'object',
  title: 'Background Hero Banner',
  fields: [
    {
      name: 'container',
      title: 'Kontener',
      type: 'baseContainer',
      description: 'Podstawowe ustawienia layoutu (szerokość, odstępy, wyrównanie)',
      group: 'properties'
    },
    {
      name: 'content',
      title: 'Treść (desktop)',
      type: 'richText',
      validation: (Rule: any) => Rule.required(),
      description: 'Tytuł i opis wyświetlane na desktop. Użyj nagłówków (H1, H2, H3) dla tytułów i zwykłego tekstu dla opisu.',
      group: 'content'
    },
    {
      name: 'mobileContent',
      title: 'Treść (mobile)',
      type: 'richText',
      description: 'Opcjonalna treść specjalnie dla mobile. Jeśli nie zostanie wybrana, będzie używana treść desktop.',
      group: 'content'
    },
    {
      name: 'image',
      title: 'Obraz w tle (desktop)',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule: any) => Rule.required(),
      description: 'Obraz wyświetlany na desktop i jako fallback na mobile',
      group: 'content'
    },
    {
      name: 'mobileImage',
      title: 'Obraz w tle (mobile)',
      type: 'image',
      options: { hotspot: true },
      description: 'Opcjonalny obraz specjalnie dla mobile. Jeśli nie zostanie wybrany, będzie używany obraz desktop.',
      group: 'content'
    },
    {
      name: 'buttons',
      title: 'Przyciski',
      type: 'array',
      of: [{ type: 'button' }],
      group: 'content'
    },
    {
      name: 'layout',
      title: 'Układ',
      type: 'object',
      group: 'properties',
      fields: [
        {
          name: 'textAlignment',
          title: 'Wyrównanie tekstu (poziome)',
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
          name: 'verticalAlignment',
          title: 'Wyrównanie tekstu (wertykalne)',
          type: 'string',
          options: {
            list: [
              { title: 'Góra', value: 'top' },
              { title: 'Środek', value: 'center' },
              { title: 'Dół', value: 'bottom' },
            ],
            layout: 'radio',
          },
          initialValue: 'center',
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
