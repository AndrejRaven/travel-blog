export default {
  name: 'categoriesSection',
  type: 'object',
  title: 'Sekcja kategorii (Main)',
  fields: [
    {
      name: 'container',
      title: 'Kontener',
      type: 'baseContainer',
      description: 'Podstawowe ustawienia layoutu (szerokość, odstępy, wyrównanie, wysokość)',
      group: 'properties',
    },
    {
      name: 'title',
      title: 'Tytuł',
      type: 'string',
      initialValue: 'Kategorie artykułów',
      group: 'content',
    },
    {
      name: 'showBackground',
      title: 'Pokaż tło',
      type: 'boolean',
      initialValue: true,
      description: 'Czy sekcja ma mieć szare tło',
      group: 'content',
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
      title: 'title',
    },
    prepare(selection: any) {
      const { title } = selection;
      return {
        title: title || 'Sekcja kategorii',
        subtitle: 'Kategorie pobierane dynamicznie z SuperCategory',
      };
    },
  },
}
