import imageUrlBuilder from '@sanity/image-url';

export const projectId = "k5fsny25";
export const dataset = "production";
export const apiVersion = "2023-10-10";

// Konfiguracja dla image-url builder
const builder = imageUrlBuilder({
  projectId,
  dataset,
});

// Eksport urlFor dla użycia w komponentach
export const urlFor = (source: SanityImage) => builder.image(source);

type GroqParams = Record<string, unknown>;

export async function fetchGroq<T>(query: string, params: GroqParams = {}): Promise<T> {
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, params }),
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sanity query failed: ${res.status} ${res.statusText} ${text}`);
  }
  const data = await res.json();
  return data.result as T;
}

export type PortableBlock = {
  _key: string;
  _type: string;
  children?: Array<{ _key: string; _type: string; text?: string }>;
};

export type SanityImage = {
  asset?: {
    _id: string;
    url: string;
    metadata?: {
      dimensions?: {
        width: number;
        height: number;
      };
    };
  };
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
  crop?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
};

export type Post = {
  _id: string;
  title: string;
  subtitle?: string;
  slug?: { current: string };
  publishedAt?: string;
  categories?: Array<{
    _id: string;
    name: string;
    slug: { current: string };
    color: string;
  }>;
  coverImage?: SanityImage | null;
  coverMobileImage?: SanityImage | null;
  components?: Array<{
    _type: string;
    _key: string;
    [key: string]: any;
  }>;
};


export type SubmenuItem = {
  label: string;
  href: string;
  isExternal?: boolean;
};

export type DropdownItem = {
  label: string;
  href?: string;
  isExternal?: boolean;
  hasSubmenu?: boolean;
  submenuItems?: SubmenuItem[];
};

export type MenuItem = {
  label: string;
  href?: string;
  isExternal?: boolean;
  hasDropdown?: boolean;
  dropdownItems?: DropdownItem[];
};

export type HeaderData = {
  _id: string;
  title: string;
  logo?: {
    asset?: {
      _id: string;
      url: string;
    };
  } | null;
  mainMenu?: MenuItem[];
  categoriesDropdown: {
    label: string;
    sections: Array<{
      key: string;
      title: string;
      emoji: string;
      items: Array<{
        label: string;
        href: string;
        isExternal?: boolean;
      }>;
    }>;
  };
  mobileMenu: {
    isEnabled: boolean;
    label: string;
  };
};

export async function getHeaderData(): Promise<HeaderData | null> {
  const query = `*[_type == "header"][0] {
    _id,
    title,
    logo {
      asset->{
        _id,
        url
      }
    },
    mainMenu[] {
      label,
      href,
      isExternal,
      hasDropdown,
      dropdownItems[] {
        label,
        href,
        isExternal,
        hasSubmenu,
        submenuItems[] {
          label,
          href,
          isExternal
        }
      }
    },
    categoriesDropdown {
      label,
      sections[] {
        key,
        title,
        emoji,
        items[] {
          label,
          href,
          isExternal
        }
      }
    },
    mobileMenu {
      isEnabled,
      label
    }
  }`;
  
  try {
    const result = await fetchGroq<HeaderData>(query);
    return result;
  } catch (error) {
    console.error('Error fetching header data:', error);
    return null;
  }
}

// Funkcja do generowania URL obrazu z Sanity z obsługą crop i hotspot
export function getImageUrl(
  image: SanityImage | string | null | undefined,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
    fit?: 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min';
  }
): string | null {
  if (!image) return null;
  
  if (typeof image === 'string') {
    return image;
  }
  
  if (!image.asset?.url) {
    return null;
  }

  try {
    const imageBuilder = builder.image(image);
    
    // Zastosuj crop i hotspot jeśli są dostępne
    if (image.crop && image.asset?.metadata?.dimensions) {
      // Użyj rect() zamiast crop() - rect przyjmuje współrzędne w pikselach
      const { width, height } = image.asset.metadata.dimensions;
      const left = Math.round(image.crop.left * width);
      const top = Math.round(image.crop.top * height);
      const right = Math.round(image.crop.right * width);
      const bottom = Math.round(image.crop.bottom * height);
      
      imageBuilder.rect(left, top, right - left, bottom - top);
    }
    
    if (image.hotspot) {
      imageBuilder.fit('crop').focalPoint(image.hotspot.x, image.hotspot.y);
    }
    
    // Zastosuj opcjonalne parametry
    if (options?.width) {
      imageBuilder.width(options.width);
    }
    
    if (options?.height) {
      imageBuilder.height(options.height);
    }
    
    if (options?.quality) {
      imageBuilder.quality(options.quality);
    }
    
    if (options?.format) {
      imageBuilder.format(options.format);
    }
    
    if (options?.fit) {
      imageBuilder.fit(options.fit);
    }
    
    return imageBuilder.url();
  } catch (error) {
    console.error('Error generating image URL:', error);
    // Fallback do podstawowego URL
    return image.asset.url;
  }
}


