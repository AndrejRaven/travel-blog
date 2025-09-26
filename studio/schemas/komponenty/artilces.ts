import baseContainer from '../shared/baseContainer';

export default {
  name: 'articles',
  type: 'object',
  title: 'Artykuły',
  fields: [
    {
      name: 'container',
      title: 'Kontener',
      type: 'baseContainer',
      description: 'Podstawowe ustawienia layoutu (szerokość, odstępy, wyrównanie)',
      group: 'properties',
    },
    {
      name: 'title',
      title: 'Tytuł sekcji',
      type: 'string',
      initialValue: 'Najnowsze artykuły',
      validation: (Rule: any) => Rule.required().error('Tytuł sekcji jest wymagany'),
      group: 'content',
    },
    {
      name: 'showViewAll',
      title: 'Pokaż link "Zobacz wszystko"',
      type: 'boolean',
      initialValue: true,
      group: 'content',
    },
    {
      name: 'viewAllHref',
      title: 'Link "Zobacz wszystko"',
      type: 'string',
      hidden: ({ parent }: any) => !parent?.showViewAll,
      validation: (Rule: any) => Rule.custom((value: string, context: any) => {
        const { parent } = context;
        if (parent?.showViewAll && (!value || value.trim() === '')) {
          return 'Link jest wymagany gdy "Pokaż link" jest włączone';
        }
        return true;
      }),
      group: 'content',
    },
    {
      name: 'articlesType',
      title: 'Typ artykułów',
      type: 'string',
      options: {
        list: [
          { title: 'Najnowsze artykuły', value: 'latest' },
          { title: 'Wybrane artykuły', value: 'selected' },
        ],
        layout: 'radio',
      },
      initialValue: 'latest',
      group: 'content',
    },
    {
      name: 'selectedArticles',
      title: 'Wybrane artykuły',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'post' }],
        },
      ],
      hidden: ({ parent }: any) => parent?.articlesType !== 'selected',
      validation: (Rule: any) => Rule.custom((value: any[], context: any) => {
        const { parent } = context;
        if (parent?.articlesType === 'selected' && (!value || value.length === 0)) {
          return 'Wybierz przynajmniej jeden artykuł';
        }
        if (parent?.articlesType === 'selected' && value && value.length > 3) {
          return 'Można wybrać maksymalnie 3 artykuły';
        }
        return true;
      }),
      group: 'content',
    },
    {
      name: 'maxArticles',
      title: 'Maksymalna liczba artykułów',
      type: 'number',
      initialValue: 3,
      validation: (Rule: any) => Rule.min(1).max(3).error('Można wyświetlić od 1 do 3 artykułów'),
      hidden: ({ parent }: any) => parent?.articlesType !== 'latest',
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
      articlesType: 'articlesType',
      maxArticles: 'maxArticles',
    },
    prepare({ title, articlesType, maxArticles }: any) {
      const typeText = articlesType === 'latest' ? 'najnowsze' : 'wybrane';
      const countText = articlesType === 'latest' ? ` (max ${maxArticles})` : '';
      return {
        title: title || 'Artykuły',
        subtitle: `${typeText} artykuły${countText}`,
      };
    },
  },
};
