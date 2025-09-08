export const projectId = "k5fsny25";
export const dataset = "production";
export const apiVersion = "2023-10-10";

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

export type Post = {
  _id: string;
  title: string;
  slug?: { current: string };
  publishedAt?: string;
  coverImage?: { asset?: { url?: string } } | string | null;
  body?: PortableBlock[];
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
  mainNavigation: Array<{
    label: string;
    href: string;
    isExternal?: boolean;
  }>;
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
  ctaButton: {
    isEnabled: boolean;
    label?: string;
    href?: string;
    style?: 'primary' | 'secondary' | 'outline';
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
    mainNavigation,
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
    },
    ctaButton {
      isEnabled,
      label,
      href,
      style
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

// Funkcja do generowania URL obrazu z Sanity
export function getImageUrl(image: any): string | null {
  if (!image) return null;
  
  if (typeof image === 'string') {
    return image;
  }
  
  if (image.asset?.url) {
    return image.asset.url;
  }
  
  return null;
}


