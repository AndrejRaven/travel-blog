// Typy dla komponentów Sanity
import { SanityImage } from './sanity';

export type RichTextBlock = {
  _type: 'block';
  _key: string;
  style?: 'h1' | 'h2' | 'h3' | 'normal' | 'bullet' | 'number';
  listItem?: 'bullet' | 'number';
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

export type BaseContainer = {
  maxWidth: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full';
  padding: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  margin: {
    top: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    bottom: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  };
  backgroundColor: 'transparent' | 'subtle' | 'accent';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  height: 'auto' | '10vh' | '20vh' | '30vh' | '40vh' | '50vh' | '60vh' | '70vh' | '80vh' | '90vh' | '100vh';
  contentTitle?: string;
};

export type HeroBanner = {
  _type: 'heroBanner';
  _key: string;
  container: BaseContainer;
  content: RichTextBlock[];
  image: {
    asset?: {
      _id: string;
      url: string;
    };
  };
  mobileImage?: {
    asset?: {
      _id: string;
      url: string;
    };
  };
  buttons?: Button[];
  layout: {
    textAlignment: 'left' | 'center' | 'right';
    imageWidth: 25 | 50 | 75;
    imagePosition: 'left' | 'right';
    mobileLayout: 'top' | 'bottom';
    textSpacing: 'with-spacing' | 'no-spacing';
    height: 25 | 50 | 75;
  };
};

export type BackgroundHeroBanner = {
  _type: 'backgroundHeroBanner';
  _key: string;
  container: BaseContainer;
  content: RichTextBlock[];
  image: {
    asset?: {
      _id: string;
      url: string;
    };
  };
  mobileImage?: {
    asset?: {
      _id: string;
      url: string;
    };
  };
  buttons?: Button[];
  layout: {
    textAlignment: 'left' | 'center' | 'right';
    overlayOpacity: 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90;
    textStyle: 'normal' | 'bold' | 'outline' | 'shadow';
    showScrollIndicator?: boolean;
    showBottomGradient?: boolean;
  };
};

// Union type dla wszystkich komponentów
export type PostComponent = HeroBanner | BackgroundHeroBanner | TextContent | ImageCollage | EmbedYoutube;

// Utility type do usunięcia _type i _key z PostComponent
export type ComponentData<T extends PostComponent> = Omit<T, '_type' | '_key'>;

// Typy dla danych komponentu (używają utility type)
export type HeroBannerData = ComponentData<HeroBanner>;
export type BackgroundHeroBannerData = ComponentData<BackgroundHeroBanner>;

export type TextContent = {
  _type: 'textContent';
  _key: string;
  container: BaseContainer;
  content: RichTextBlock[];
  layout: {
    textSize: 'sm' | 'base' | 'lg' | 'xl';
  };
};

export type TextContentData = ComponentData<TextContent>;

export type ImageCollage = {
  _type: 'imageCollage';
  _key: string;
  container: BaseContainer;
  images: Array<{
    asset?: {
      _id: string;
      url: string;
    };
    alt?: string;
  }>;
  layout: {
    thumbnailCount: 2 | 3 | 4;
  };
};

export type ImageCollageData = ComponentData<ImageCollage>;

export type EmbedYoutube = {
  _type: 'embedYoutube';
  _key: string;
  container: BaseContainer;
  title?: string;
  description?: string;
  videoId: string;
  useLatestVideo?: boolean;
};

export type EmbedYoutubeData = ComponentData<EmbedYoutube>;

