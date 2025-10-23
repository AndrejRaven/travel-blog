export default {
  name: 'category',
  type: 'document',
  title: 'Podkategoria',
  // Indeksy dla lepszej wydajności zapytań
  indexes: [
    { name: 'slug', fields: [{ name: 'slug.current', direction: 'asc' }] },
    { name: 'isActive', fields: [{ name: 'isActive', direction: 'asc' }] },
    { name: 'name', fields: [{ name: 'name', direction: 'asc' }] },
  ],
  fields: [
    {
      name: 'name',
      title: 'Nazwa podkategorii',
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
      title: 'Opis podkategorii',
      type: 'text',
      rows: 3,
      validation: (Rule: any) => Rule.max(200),
    },
    {
      name: 'mainCategory',
      title: 'Kategoria główna',
      type: 'reference',
      to: [{ type: 'mainCategory' }],
      validation: (Rule: any) => Rule.required().error('Podkategoria musi mieć przypisaną kategorię główną'),
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
      description: 'Opcjonalna ikona dla podkategorii',
    },
    {
      name: 'invertOnDark',
      title: 'Odwróć kolory ikony w dark theme',
      type: 'boolean',
      description: 'Czy ikona ma zmieniać kolory w ciemnym motywie',
      initialValue: true,
    },
    {
      name: 'isActive',
      title: 'Aktywna',
      type: 'boolean',
      description: 'Czy podkategoria ma być widoczna na stronie',
      initialValue: true,
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'description',
      color: 'color',
      icon: 'icon',
      mainCategory: 'mainCategory.name',
    },
    prepare(selection: any) {
      const { title, subtitle, color, icon, mainCategory } = selection;
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
        subtitle: mainCategory ? `${mainCategory} • ${subtitle || 'Brak opisu'}` : subtitle || 'Brak opisu',
        media: icon,
      };
    },
  },
}
