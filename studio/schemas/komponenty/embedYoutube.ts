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
    },
    {
      name: 'title',
      title: 'Tytuł',
      type: 'string',
      description: 'Opcjonalny tytuł sekcji z filmem YouTube',
    },
    {
      name: 'description',
      title: 'Opis',
      type: 'text',
      rows: 3,
      description: 'Opcjonalny opis sekcji z filmem YouTube',
    },
    {
      name: 'videoId',
      title: 'ID filmu YouTube',
      type: 'string',
      description: 'ID filmu YouTube (np. dQw4w9WgXcQ) lub "latest" dla najnowszego filmu z kanału',
      validation: (Rule: any) => Rule.required().min(1).error('ID filmu YouTube jest wymagane'),
    },
    {
      name: 'useLatestVideo',
      title: 'Użyj najnowszego filmu',
      type: 'boolean',
      description: 'Jeśli zaznaczone, automatycznie pobierze najnowszy film z kanału YouTube',
      initialValue: false,
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
