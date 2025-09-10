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

// Dostępne kolory theme dla hero bannerów
export type ThemeColorKey = 'background' | 'card' | 'accent' | 'hero' | 'button' | 'navigation';

export type HeroBannerData = {
  title: RichTextBlock[];
  description: RichTextBlock[];
  image: {
    src: string;
    alt: string;
  };
  buttons: HeroButton[];
  layout: {
    imageWidth: 25 | 50 | 75; // Procent szerokości obrazka
    imagePosition: 'left' | 'right'; // Pozycja obrazka na desktop
    mobileLayout: 'top' | 'bottom'; // Pozycja obrazka na mobile
    textSpacing: 'with-spacing' | 'no-spacing'; // Czy tekst ma mieć odstępy
    height: 25 | 50 | 75; // Wysokość baneru w vh
    backgroundColor: ThemeColorKey; // Kolor tła baneru z dostępnych theme colors
  };
};

export type BackgroundHeroBannerData = {
  title: RichTextBlock[];
  description: RichTextBlock[];
  image: {
    src: string;
    alt: string;
  };
  buttons: HeroButton[];
  layout: {
    height: 25 | 50 | 75; // Wysokość baneru w vh
    textAlignment: 'left' | 'center' | 'right'; // Wyrównanie tekstu
    overlayOpacity: 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90; // Przezroczystość nakładki w %
    textStyle: 'normal' | 'bold' | 'outline' | 'shadow'; // Styl tekstu dla lepszej widoczności
  };
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
      variant: "secondary",
    },
  ],
  layout: {
    imageWidth: 50,
    imagePosition: 'right',
    mobileLayout: 'top',
    textSpacing: 'with-spacing',
    height: 75,
    backgroundColor: 'card', // Dostępne: 'background', 'card', 'accent', 'hero', 'button', 'navigation'
  },
};

// Przykłady innych konfiguracji hero bannerów z różnymi kolorami
export const heroExamples = {
  // Hero z tłem sekcji
  sectionBackground: {
    ...heroTestData,
    layout: {
      ...heroTestData.layout,
      backgroundColor: 'background' as ThemeColorKey,
    }
  },
  
  // Hero z tłem karty
  cardBackground: {
    ...heroTestData,
    layout: {
      ...heroTestData.layout,
      backgroundColor: 'card' as ThemeColorKey,
    }
  },
  
  // Hero z tłem akcentu
  accentBackground: {
    ...heroTestData,
    layout: {
      ...heroTestData.layout,
      backgroundColor: 'accent' as ThemeColorKey,
    }
  },
};

// Dane testowe dla baneru z obrazkiem w tle
export const backgroundHeroTestData: BackgroundHeroBannerData = {
  title: [
    {
      _type: 'block',
      _key: 'bg-title-1',
      style: 'h1',
      children: [
        {
          _type: 'span',
          _key: 'bg-title-span-1',
          text: 'Odkryj piękno ',
          marks: []
        },
        {
          _type: 'span',
          _key: 'bg-title-span-2',
          text: 'świata',
          marks: ['strong']
        }
      ]
    }
  ],
  description: [
    {
      _type: 'block',
      _key: 'bg-desc-1',
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: 'bg-desc-span-1',
          text: 'Zanurz się w fascynujące historie z naszych podróży. Od egzotycznych plaż po górskie szczyty - każda podróż to nowa przygoda.',
          marks: []
        }
      ]
    }
  ],
  image: {
    src: "/demo-images/demo-asset.png",
    alt: "Tło hero",
  },
  buttons: [
    {
      label: "Zobacz nasze podróże",
      href: "/post/indonezja",
      variant: "primary",
    },
    {
      label: "Poznaj nas",
      href: "#o-nas",
      variant: "secondary",
    },
  ],
  layout: {
    height: 75,
    textAlignment: 'left',
    overlayOpacity: 10,
    textStyle: 'shadow',
  },
};
