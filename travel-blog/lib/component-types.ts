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
  image: SanityImage;
  mobileImage?: SanityImage;
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
  mobileContent?: RichTextBlock[];
  image: SanityImage;
  mobileImage?: SanityImage;
  buttons?: Button[];
  layout: {
    textAlignment: 'left' | 'center' | 'right';
    verticalAlignment: 'top' | 'center' | 'bottom';
    overlayOpacity: 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90;
    textStyle: 'normal' | 'bold' | 'outline' | 'shadow';
    showScrollIndicator?: boolean;
    showBottomGradient?: boolean;
  };
};

// Union type dla wszystkich komponentów - zostanie zaktualizowany na końcu

// Utility type do usunięcia _type i _key z komponentów
export type ComponentData<T extends { _type: string; _key: string }> = Omit<T, '_type' | '_key'>;

// Type guard functions dla bezpiecznego sprawdzania typów komponentów - zostaną zaktualizowane na końcu

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
  images: Array<SanityImage>;
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

export type Articles = {
  _type: 'articles';
  _key: string;
  container: BaseContainer;
  title: string;
  showViewAll: boolean;
  viewAllHref?: string;
  articlesType: 'latest' | 'selected';
  selectedArticles?: Array<{
    _ref: string;
  }>;
  maxArticles: number;
};

export type ArticlesData = ComponentData<Articles>;

// Typy dla komponentów sekcji bez Sanity CMS
export type AboutUs = {
  _type: 'aboutUs';
  _key: string;
  container: BaseContainer;
  title: string;
  image: SanityImage;
  imageAlt: string;
  description: string[];
  contactHref: string;
  contactText: string;
};

export type AboutUsData = ComponentData<AboutUs>;

export type CategoriesSection = {
  _type: 'categoriesSection';
  _key: string;
  container: BaseContainer;
  title: string;
  showBackground: boolean;
};

export type SubcategoryList = {
  _type: 'subcategoryList';
  _key: string;
  container: BaseContainer;
  title: string;
  subcategories: Array<{
    id: string;
    name: string;
    description: string;
    href: string;
    color: string;
    icon?: {
      asset?: {
        url?: string;
      };
    };
    articleCount?: number;
    invertOnDark?: boolean;
  }>;
};

export type MainCategoryList = {
  _type: 'mainCategoryList';
  _key: string;
  container: BaseContainer;
  title: string;
  mainCategories: Array<{
    id: string;
    name: string;
    description: string;
    href: string;
    color: string;
    icon?: {
      asset?: {
        url?: string;
      };
    };
    articleCount?: number;
    invertOnDark?: boolean;
  }>;
};

export type CategoriesSectionData = ComponentData<CategoriesSection>;
export type SubcategoryListData = ComponentData<SubcategoryList>;
export type MainCategoryListData = ComponentData<MainCategoryList>;

export type InstagramSection = {
  _type: 'instagramSection';
  _key: string;
  container: BaseContainer;
  title: string;
  subtitle: string;
  instagramHandle: string;
  instagramUrl: string;
  buttonText: string;
  posts: Array<{
    id: string;
    imageUrl?: {
      asset: {
        _id: string;
        url: string;
        metadata: {
          dimensions: {
            width: number;
            height: number;
          };
        };
      };
      hotspot?: any;
      crop?: any;
    };
    caption?: string;
    likes?: string;
  }>;
};

export type InstagramSectionData = ComponentData<InstagramSection>;

export type Newsletter = {
  _type: 'newsletter';
  _key: string;
  container: BaseContainer;
  title: string;
  subtitle: string;
  buttonText: string;
  privacyText: string;
  placeholder?: string;
  successMessage?: string;
  errorMessage?: string;
  features: Array<{
    icon: string;
    text: string;
  }>;
};

export type NewsletterData = ComponentData<Newsletter>;

export type Slider = {
  _type: 'slider';
  _key: string;
  container: BaseContainer;
  title: string;
  slides: Array<{
    id: string;
    imageUrl: string;
    title: string;
    caption: string;
  }>;
};

export type SliderData = ComponentData<Slider>;

export type SupportSection = {
  _type: 'supportSection';
  _key: string;
  container: BaseContainer;
  title: string;
  description: string;
  thankYouMessage: string;
  supportOptions: Array<{
    id: string;
    name: string;
    href: string;
    icon?: string | { asset?: { url?: string } };
    iconSvg?: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'youtube';
    invertOnDark?: boolean;
  }>;
};

export type SupportSectionData = ComponentData<SupportSection>;

export type YouTubeChannel = {
  _type: 'youtubeChannel';
  _key: string;
  container: BaseContainer;
  title: string;
  channelName: string;
  channelDescription: string;
  channelHref: string;
  buttonText: string;
  buttonVariant: 'primary' | 'secondary' | 'outline' | 'youtube';
  channelImage?: SanityImage;
};

export type YouTubeChannelData = ComponentData<YouTubeChannel>;

// Union type dla wszystkich komponentów
export type PostComponent = HeroBanner | BackgroundHeroBanner | TextContent | ImageCollage | EmbedYoutube | Articles | AboutUs | CategoriesSection | SubcategoryList | MainCategoryList | InstagramSection | Newsletter | Slider | SupportSection | YouTubeChannel;

// Type guard functions dla wszystkich komponentów
export function isHeroBanner(component: PostComponent): component is HeroBanner {
  return component._type === 'heroBanner';
}

export function isBackgroundHeroBanner(component: PostComponent): component is BackgroundHeroBanner {
  return component._type === 'backgroundHeroBanner';
}

export function isTextContent(component: PostComponent): component is TextContent {
  return component._type === 'textContent';
}

export function isImageCollage(component: PostComponent): component is ImageCollage {
  return component._type === 'imageCollage';
}

export function isEmbedYoutube(component: PostComponent): component is EmbedYoutube {
  return component._type === 'embedYoutube';
}

export function isArticles(component: PostComponent): component is Articles {
  return component._type === 'articles';
}

export function isAboutUs(component: PostComponent): component is AboutUs {
  return component._type === 'aboutUs';
}

export function isCategoriesSection(component: PostComponent): component is CategoriesSection {
  return component._type === 'categoriesSection';
}

export function isSubcategoryList(component: PostComponent): component is SubcategoryList {
  return component._type === 'subcategoryList';
}

export function isMainCategoryList(component: PostComponent): component is MainCategoryList {
  return component._type === 'mainCategoryList';
}

export function isInstagramSection(component: PostComponent): component is InstagramSection {
  return component._type === 'instagramSection';
}

export function isNewsletter(component: PostComponent): component is Newsletter {
  return component._type === 'newsletter';
}

export function isSlider(component: PostComponent): component is Slider {
  return component._type === 'slider';
}

export function isSupportSection(component: PostComponent): component is SupportSection {
  return component._type === 'supportSection';
}

export function isYouTubeChannel(component: PostComponent): component is YouTubeChannel {
  return component._type === 'youtubeChannel';
}

