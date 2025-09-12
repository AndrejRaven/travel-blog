// Typy dla komponentów Sanity

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
    _type: 'link' | 'customStyle';
    _key: string;
    linkType?: 'internal' | 'external';
    internalHref?: string;
    externalHref?: string;
    blank?: boolean;
    style?: 'link-primary' | 'link-secondary' | 'margin-top' | 'margin-bottom' | 'highlight' | 'warning' | 'success' | 'error' | 'info';
  }>;
};

export type Button = {
  _type: 'button';
  _key: string;
  label: string;
  href: string;
  variant: 'primary' | 'secondary' | 'outline' | 'outlinewhite' | 'youtube';
  external?: boolean;
};

export type HeroBanner = {
  _type: 'heroBanner';
  _key: string;
  content: RichTextBlock[];
  image: {
    asset?: {
      _id: string;
      url: string;
    };
  };
  buttons?: Button[];
  layout: {
    imageWidth: 25 | 50 | 75;
    imagePosition: 'left' | 'right';
    mobileLayout: 'top' | 'bottom';
    textSpacing: 'with-spacing' | 'no-spacing';
    height: 25 | 50 | 75;
    backgroundColor: 'background' | 'card' | 'accent' | 'hero' | 'button' | 'navigation';
  };
};

export type BackgroundHeroBanner = {
  _type: 'backgroundHeroBanner';
  _key: string;
  content: RichTextBlock[];
  image: {
    asset?: {
      _id: string;
      url: string;
    };
  };
  buttons?: Button[];
  layout: {
    height: 25 | 50 | 75 | 100;
    textAlignment: 'left' | 'center' | 'right';
    overlayOpacity: 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90;
    textStyle: 'normal' | 'bold' | 'outline' | 'shadow';
  };
};

// Union type dla wszystkich komponentów
export type PostComponent = HeroBanner | BackgroundHeroBanner;

// Typ dla danych komponentu (bez _type i _key)
// Typy dla danych komponentu (kompatybilne z istniejącymi komponentami)
export type HeroBannerData = {
  content: RichTextBlock[];
  image: {
    src: string;
    alt: string;
  };
  buttons?: Button[];
  layout: {
    imageWidth: 25 | 50 | 75;
    imagePosition: 'left' | 'right';
    mobileLayout: 'top' | 'bottom';
    textSpacing: 'with-spacing' | 'no-spacing';
    height: 25 | 50 | 75;
    backgroundColor: 'background' | 'card' | 'accent' | 'hero' | 'button' | 'navigation';
  };
};

export type BackgroundHeroBannerData = {
  content: RichTextBlock[];
  image: {
    src: string;
    alt: string;
  };
  buttons?: Button[];
  layout: {
    height: 25 | 50 | 75 | 100;
    textAlignment: 'left' | 'center' | 'right';
    overlayOpacity: 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90;
    textStyle: 'normal' | 'bold' | 'outline' | 'shadow';
  };
};
