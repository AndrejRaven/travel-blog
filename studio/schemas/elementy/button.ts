export default {
  name: 'button',
  type: 'object',
  title: 'Przycisk',
  fields: [
    {
      name: 'label',
      title: 'Etykieta',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'href',
      title: 'Link',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'variant',
      title: 'Wariant',
      type: 'string',
      options: {
        list: [
          { title: 'Primary', value: 'primary' },
          { title: 'Secondary', value: 'secondary' },
          { title: 'Outline', value: 'outline' },
        ],
        layout: 'radio',
      },
      initialValue: 'primary',
    },
    {
      name: 'external',
      title: 'Link zewnętrzny',
      type: 'boolean',
      description: 'Zaznacz jeśli link prowadzi poza stronę',
      initialValue: false,
    },
  ],
  preview: {
    select: {
      title: 'label',
      subtitle: 'href',
    },
  },
}
