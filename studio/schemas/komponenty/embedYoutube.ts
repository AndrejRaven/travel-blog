import { defineType } from 'sanity';

export default defineType({
  name: 'embedYoutube',
  title: 'YouTube Embed',
  type: 'object',
  fields: [
    {
      name: 'container',
      title: 'Kontener',
      type: 'baseContainer',
      validation: (Rule: any) => Rule.required(),
      group: 'properties',
    },
    {
      name: 'title',
      title: 'Tytuł',
      type: 'string',
      description: 'Opcjonalny tytuł sekcji z filmem YouTube',
      group: 'content',
    },
    {
      name: 'description',
      title: 'Opis',
      type: 'text',
      rows: 3,
      description: 'Opcjonalny opis sekcji z filmem YouTube',
      group: 'content',
    },
    {
      name: 'videoId',
      title: 'ID filmu YouTube',
      type: 'string',
      description: 'ID filmu YouTube (np. dQw4w9WgXcQ) lub "latest" dla najnowszego filmu z kanału',
      validation: (Rule: any) => Rule.required().min(1).error('ID filmu YouTube jest wymagane'),
      group: 'content',
    },
    {
      name: 'useLatestVideo',
      title: 'Użyj najnowszego filmu',
      type: 'boolean',
      description: 'Jeśli zaznaczone, automatycznie pobierze najnowszy film z kanału YouTube',
      initialValue: false,
      group: 'content',
    },
    {
      name: 'videoPublishedAt',
      title: 'Data publikacji filmu',
      type: 'datetime',
      description:
        'Uzupełnij ręcznie, jeśli YouTube RSS nie zwraca daty publikacji (np. dla starszych filmów).',
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
      videoId: 'videoId',
      useLatest: 'useLatestVideo',
    },
    prepare({ title, videoId, useLatest }) {
      const displayTitle = title || 'YouTube Embed';
      const videoInfo = useLatest ? 'Najnowszy film' : `ID: ${videoId}`;
      return {
        title: displayTitle,
        subtitle: videoInfo,
      };
    },
  },
});
