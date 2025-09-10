export default {
  name: 'richText',
  type: 'array',
  title: 'Rich Text',
  of: [
    {
      type: 'block',
      styles: [
        { title: 'Normalny', value: 'normal' },
        { title: 'H1', value: 'h1' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
      ],
      marks: {
        decorators: [
          { title: 'Pogrubiony', value: 'strong' },
          { title: 'Kursywa', value: 'em' },
          { title: 'Podkreślenie', value: 'underline' },
        ],
        annotations: [
          {
            title: 'Link',
            name: 'link',
            type: 'object',
            fields: [
              {
                title: 'Typ linku',
                name: 'linkType',
                type: 'string',
                options: {
                  list: [
                    { title: 'Wewnętrzny (Internal)', value: 'internal' },
                    { title: 'Zewnętrzny (External)', value: 'external' },
                  ],
                  layout: 'radio',
                },
                initialValue: 'internal',
                validation: (Rule: any) => Rule.required(),
              },
              {
                title: 'URL wewnętrzny',
                name: 'internalHref',
                type: 'string',
                description: 'Ścieżka wewnętrzna (np. /o-nas, /kontakt)',
                hidden: ({ parent }: any) => parent?.linkType !== 'internal',
                validation: (Rule: any) => Rule.custom((value: any, context: any) => {
                  const { parent } = context;
                  if (parent?.linkType === 'internal' && !value) {
                    return 'URL wewnętrzny jest wymagany';
                  }
                  return true;
                }),
              },
              {
                title: 'URL zewnętrzny',
                name: 'externalHref',
                type: 'url',
                description: 'Pełny URL (np. https://example.com)',
                hidden: ({ parent }: any) => parent?.linkType !== 'external',
                validation: (Rule: any) => Rule.custom((value: any, context: any) => {
                  const { parent } = context;
                  if (parent?.linkType === 'external' && !value) {
                    return 'URL zewnętrzny jest wymagany';
                  }
                  return true;
                }),
              },
              {
                title: 'Otwórz w nowej karcie',
                name: 'blank',
                type: 'boolean',
                initialValue: false,
                description: 'Zalecane dla linków zewnętrznych',
              },
            ],
          },
          {
            title: '🎨 Custom Style',
            name: 'customStyle',
            type: 'object',
            fields: [
              {
                title: 'Styl',
                name: 'style',
                type: 'array',
                of: [{ type: 'string' }],
                options: {
                  list: [
                    { title: '🔗 Link Primary', value: 'link-primary' },
                    { title: '🔗 Link Secondary', value: 'link-secondary' },
                    { title: '📏 Margin Top', value: 'margin-top' },
                    { title: '📏 Margin Bottom', value: 'margin-bottom' },
                    { title: '✨ Highlight', value: 'highlight' },
                    { title: '⚠️ Warning', value: 'warning' },
                    { title: '✅ Success', value: 'success' },
                    { title: '❌ Error', value: 'error' },
                    { title: '💡 Info', value: 'info' },
                  ],
                  layout: 'grid',
                },
                validation: (Rule: any) => Rule.required(),
              },
            ],
          },
        ],
      },
    },
  ],
}
