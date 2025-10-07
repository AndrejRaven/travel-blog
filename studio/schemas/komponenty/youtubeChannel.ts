import baseContainer from "../shared/baseContainer";

export default {
  name: 'youtubeChannel',
  type: 'object',
  title: 'Kanał YouTube (Aside)',
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
      initialValue: 'Nasz kanał YouTube',
      group: 'content',
    },
    {
      name: 'channelName',
      title: 'Nazwa kanału',
      type: 'string',
      initialValue: 'Nasz Blog',
      group: 'content',
    },
    {
      name: 'channelDescription',
      title: 'Opis kanału',
      type: 'string',
      initialValue: 'Podróżnicze filmy',
      group: 'content',
    },
    {
      name: 'channelHref',
      title: 'Link do kanału',
      type: 'url',
      initialValue: 'https://www.youtube.com/channel/UCUUm2vkbs-W7KulrJZIpNDA',
      group: 'content',
    },
    {
      name: 'buttonText',
      title: 'Tekst przycisku',
      type: 'string',
      initialValue: 'Przejdź na kanał',
      group: 'content',
    },
    {
      name: 'buttonVariant',
      title: 'Wariant przycisku',
      type: 'string',
      options: {
        list: [
          { title: 'Primary', value: 'primary' },
          { title: 'Secondary', value: 'secondary' },
          { title: 'Outline', value: 'outline' },
          { title: 'YouTube', value: 'youtube' },
        ],
      },
      initialValue: 'youtube',
      group: 'content',
    },
    {
      name: 'channelImage',
      title: 'Obrazek kanału',
      type: 'image',
      description: 'Opcjonalny obrazek kanału YouTube. Jeśli nie zostanie dodany, zostanie użyta domyślna ikonka YouTube.',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Tekst alternatywny',
          type: 'string',
          description: 'Opis obrazka dla czytników ekranu',
        },
      ],
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
      subtitle: 'channelName',
      media: 'channelImage',
    },
    prepare(selection: any) {
      const { title, subtitle, media } = selection;
      return {
        title: title || 'Kanał YouTube',
        subtitle: subtitle || 'Brak nazwy kanału',
        media: media,
      };
    },
  },
}
