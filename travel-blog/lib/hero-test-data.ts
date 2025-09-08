export type HeroButton = {
  label: string;
  href: string;
  variant: 'primary' | 'secondary' | 'outline';
  external?: boolean;
};

export type RichTextBlock = {
  _type: 'block';
  _key: string;
  style?: 'h1' | 'h2' | 'h3' | 'normal';
  children: Array<{
    _type: 'span';
    _key: string;
    text: string;
    marks?: string[];
  }>;
  markDefs?: Array<{
    _type: 'link';
    _key: string;
    href: string;
    blank?: boolean;
  }>;
};

export type HeroBannerData = {
  title: RichTextBlock[];
  description: RichTextBlock[];
  image: {
    src: string;
    alt: string;
  };
  buttons: HeroButton[];
};

export const heroTestData: HeroBannerData = {
  title: [
    {
      _type: 'block',
      _key: 'title-1',
      style: 'h1',
      children: [
        {
          _type: 'span',
          _key: 'title-span-1',
          text: 'Odkrywaj świat z ',
          marks: []
        },
        {
          _type: 'span',
          _key: 'title-span-2',
          text: 'nami',
          marks: ['strong']
        }
      ]
    }
  ],
  description: [
    {
      _type: 'block',
      _key: 'desc-1',
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: 'desc-span-1',
          text: 'Krótki opis bloga z zachętą do eksploracji. Tutaj dodamy inspirujący tekst o ',
          marks: []
        },
        {
          _type: 'span',
          _key: 'desc-span-2',
          text: 'podróżach',
          marks: ['link-1']
        },
        {
          _type: 'span',
          _key: 'desc-span-3',
          text: ', historii i przygodach. ',
          marks: []
        },
        {
          _type: 'span',
          _key: 'desc-span-4',
          text: 'Sprawdź nasze najnowsze artykuły',
          marks: ['link-2']
        },
        {
          _type: 'span',
          _key: 'desc-span-5',
          text: '!',
          marks: []
        }
      ],
      markDefs: [
        {
          _type: 'link',
          _key: 'link-1',
          href: '#kategorie',
          blank: false
        },
        {
          _type: 'link',
          _key: 'link-2',
          href: '#najnowsze',
          blank: false
        }
      ]
    }
  ],
  image: {
    src: "/demo-images/demo-asset.png",
    alt: "Hero",
  },
  buttons: [
    {
      label: "Przykładowy post",
      href: "/post/indonezja",
      variant: "primary",
    },
    {
      label: "Dowiedz się więcej",
      href: "#o-nas",
      variant: "outline",
    },
  ],
};
