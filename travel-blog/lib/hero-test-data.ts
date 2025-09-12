// Import typów z component-types
import { Button, RichTextBlock, HeroBannerData, BackgroundHeroBannerData } from './component-types';

// Alias dla kompatybilności wstecznej
export type HeroButton = Button;

// Dostępne kolory theme dla hero bannerów
export type ThemeColorKey = 'background' | 'card' | 'accent' | 'hero' | 'button' | 'navigation';

export const heroTestData: HeroBannerData = {
  content: [
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
    },
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
          linkType: 'internal',
          internalHref: '#kategorie',
          blank: false
        },
        {
          _type: 'link',
          _key: 'link-2',
          linkType: 'internal',
          internalHref: '#najnowsze',
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
      _type: "button",
      _key: "btn-1",
      label: "Przykładowy post",
      href: "/post/indonezja",
      variant: "primary",
    },
    {
      _type: "button",
      _key: "btn-2",
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
  content: [
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
    },
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
      _type: "button",
      _key: "bg-btn-1",
      label: "Zobacz nasze podróże",
      href: "/post/indonezja",
      variant: "primary",
    },
    {
      _type: "button",
      _key: "bg-btn-2",
      label: "Poznaj nas",
      href: "#o-nas",
      variant: "outlinewhite",
    },
  ],
  layout: {
    height: 75,
    textAlignment: 'left',
    overlayOpacity: 10,
    textStyle: 'shadow',
  },
};
