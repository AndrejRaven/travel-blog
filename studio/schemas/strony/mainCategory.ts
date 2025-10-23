export default {
  name: 'mainCategory',
  type: 'document',
  title: 'Kategoria główna',
  // Indeksy dla lepszej wydajności zapytań
  indexes: [
    { name: 'slug', fields: [{ name: 'slug.current', direction: 'asc' }] },
    { name: 'isActive', fields: [{ name: 'isActive', direction: 'asc' }] },
    { name: 'name', fields: [{ name: 'name', direction: 'asc' }] },
  ],
  fields: [
    {
      name: 'name',
      title: 'Nazwa kategorii głównej',
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
      title: 'Opis kategorii głównej',
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
      name: 'icon',
      title: 'Ikona kategorii',
      type: 'image',
      options: { hotspot: true },
      description: 'Opcjonalna ikona dla kategorii głównej',
    },
    {
      name: 'invertOnDark',
      title: 'Odwróć kolory ikony w dark theme',
      type: 'boolean',
      description: 'Czy ikona ma zmieniać kolory w ciemnym motywie',
      initialValue: true,
    },
    {
      name: 'superCategory',
      title: 'Kategoria nadrzędna',
      type: 'reference',
      to: [{ type: 'superCategory' }],
      validation: (Rule: any) => Rule.required().error('Kategoria główna musi mieć przypisaną kategorię nadrzędną'),
    },
    {
      name: 'isActive',
      title: 'Aktywna',
      type: 'boolean',
      description: 'Czy kategoria główna ma być widoczna na stronie',
      initialValue: true,
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'description',
      color: 'color',
      icon: 'icon',
      superCategory: 'superCategory.name',
    },
    prepare(selection: any) {
      const { title, subtitle, color, icon, superCategory } = selection;
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
        subtitle: superCategory ? `${superCategory} • ${subtitle || 'Brak opisu'}` : subtitle || 'Brak opisu',
        media: icon,
      };
    },
  },
}
