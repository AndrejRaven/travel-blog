export default {
  name: 'category',
  type: 'document',
  title: 'Kategoria',
  fields: [
    {
      name: 'name',
      title: 'Nazwa kategorii',
      type: 'string',
      validation: (Rule: any) => Rule.required().min(2).max(50),
    },
    {
      name: 'slug',
      title: 'Slug (adres URL)',
      type: 'slug',
      options: { source: 'name', maxLength: 50 },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Opis kategorii',
      type: 'text',
      rows: 3,
      validation: (Rule: any) => Rule.max(200),
    },
    {
      name: 'color',
      title: 'Kolor kategorii',
      type: 'string',
      options: {
        list: [
          { title: 'Niebieski', value: 'blue' },
          { title: 'Zielony', value: 'green' },
          { title: 'Żółty', value: 'yellow' },
          { title: 'Czerwony', value: 'red' },
          { title: 'Fioletowy', value: 'purple' },
          { title: 'Szary', value: 'gray' },
        ],
        layout: 'radio',
      },
      initialValue: 'blue',
    },
    {
      name: 'isActive',
      title: 'Aktywna',
      type: 'boolean',
      description: 'Czy kategoria ma być widoczna na stronie',
      initialValue: true,
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'description',
      color: 'color',
    },
    prepare(selection: any) {
      const { title, subtitle, color } = selection;
      const colorEmojis: Record<string, string> = {
        blue: '🔵',
        green: '🟢',
        yellow: '🟡',
        red: '🔴',
        purple: '🟣',
        gray: '⚪',
      };
      
      return {
        title: `${colorEmojis[color] || '⚪'} ${title}`,
        subtitle: subtitle || 'Brak opisu',
      };
    },
  },
}
