import baseContainer from "../shared/baseContainer";

export default {
  name: 'youtubeChannel',
  type: 'object',
  title: 'Kanał YouTube (Aside)',
  fields: [
    ...baseContainer.fields,
    {
      name: 'title',
      title: 'Tytuł',
      type: 'string',
      initialValue: 'Nasz kanał YouTube',
    },
    {
      name: 'channelName',
      title: 'Nazwa kanału',
      type: 'string',
      initialValue: 'Nasz Blog',
    },
    {
      name: 'channelDescription',
      title: 'Opis kanału',
      type: 'string',
      initialValue: 'Podróżnicze filmy',
    },
    {
      name: 'channelHref',
      title: 'Link do kanału',
      type: 'url',
      initialValue: 'https://www.youtube.com/channel/UCUUm2vkbs-W7KulrJZIpNDA',
    },
    {
      name: 'buttonText',
      title: 'Tekst przycisku',
      type: 'string',
      initialValue: 'Przejdź na kanał',
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
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'channelName',
    },
    prepare(selection: any) {
      const { title, subtitle } = selection;
      return {
        title: title || 'Kanał YouTube',
        subtitle: subtitle || 'Brak nazwy kanału',
      };
    },
  },
}
