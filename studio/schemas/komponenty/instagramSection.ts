import baseContainer from "../shared/baseContainer";

export default {
  name: 'instagramSection',
  type: 'object',
  title: 'Sekcja Instagram (Main)',
  fields: [
    ...baseContainer.fields,
    {
      name: 'title',
      title: 'Tytuł',
      type: 'string',
      initialValue: 'Śledź nas na Instagramie',
    },
    {
      name: 'subtitle',
      title: 'Podtytuł',
      type: 'string',
      initialValue: 'Najnowsze zdjęcia z naszych podróży',
    },
    {
      name: 'instagramHandle',
      title: 'Handle Instagram',
      type: 'string',
      initialValue: '@naszblog',
    },
    {
      name: 'instagramUrl',
      title: 'Link do Instagram',
      type: 'url',
      initialValue: 'https://instagram.com',
    },
    {
      name: 'buttonText',
      title: 'Tekst przycisku',
      type: 'string',
      initialValue: '@naszblog',
    },
    {
      name: 'posts',
      title: 'Posty Instagram',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'instagramPost',
          title: 'Post Instagram',
          fields: [
            {
              name: 'id',
              title: 'ID',
              type: 'string',
              description: 'Unikalny identyfikator posta',
            },
            {
              name: 'imageUrl',
              title: 'Zdjęcie',
              type: 'image',
              options: { hotspot: true },
            },
            {
              name: 'caption',
              title: 'Podpis',
              type: 'text',
              rows: 3,
            },
            {
              name: 'likes',
              title: 'Liczba polubień',
              type: 'string',
              initialValue: '1.2k',
            },
          ],
          preview: {
            select: {
              title: 'caption',
              subtitle: 'likes',
              media: 'imageUrl',
            },
            prepare(selection: any) {
              const { title, subtitle, media } = selection;
              return {
                title: title ? title.substring(0, 30) + '...' : 'Brak podpisu',
                subtitle: subtitle || '0 polubień',
                media: media,
              };
            },
          },
        },
      ],
      initialValue: [
        {
          id: '1',
          caption: 'Piękny zachód słońca nad morzem w Grecji 🇬🇷 #podróże #grecja',
          likes: '1.2k',
        },
        {
          id: '2',
          caption: 'Włoska kuchnia to najlepsza na świecie! 🍝 #włochy #kuchnia',
          likes: '856',
        },
        {
          id: '3',
          caption: 'Górskie wędrówki w Alpach 🏔️ #góry #alpy #wędrówki',
          likes: '2.1k',
        },
        {
          id: '4',
          caption: 'Kolorowe ulice Lizbony 🌈 #portugalia #lizbona',
          likes: '743',
        },
        {
          id: '5',
          caption: 'Tradycyjne targi w Maroku 🛍️ #maroko #targi',
          likes: '1.5k',
        },
        {
          id: '6',
          caption: 'Plaża w Tajlandii 🏖️ #tajlandia #plaża',
          likes: '3.2k',
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'instagramHandle',
    },
    prepare(selection: any) {
      const { title, subtitle } = selection;
      return {
        title: title || 'Sekcja Instagram',
        subtitle: subtitle || 'Brak handle',
      };
    },
  },
}
