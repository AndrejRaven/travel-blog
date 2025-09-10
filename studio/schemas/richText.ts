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
                title: 'URL',
                name: 'href',
                type: 'url',
                validation: (Rule: any) => Rule.required(),
              },
              {
                title: 'Otwórz w nowej karcie',
                name: 'blank',
                type: 'boolean',
                initialValue: false,
              },
            ],
          },
        ],
      },
    },
  ],
}
