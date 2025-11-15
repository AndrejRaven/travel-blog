import { SITE_CONFIG } from "@/lib/config";

const siteUrl = SITE_CONFIG.url.replace(/\/+$/, "");

const ensureLeadingSlash = (path: string) => {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
};

export const buildAbsoluteUrl = (path?: string | null) => {
  if (!path) {
    return siteUrl;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${siteUrl}${ensureLeadingSlash(path)}`;
};

export const buildAlternates = (path?: string | null) => {
  const canonical = buildAbsoluteUrl(path);

  return {
    canonical,
    languages: {
      "pl-PL": canonical,
      "x-default": canonical,
    },
  };
};

type OpenGraphImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

export const buildOpenGraph = (params: {
  title: string;
  description: string;
  path?: string | null;
  image?: OpenGraphImage | null;
}) => {
  const absoluteUrl = buildAbsoluteUrl(params.path);

  return {
    type: "website" as const,
    title: params.title,
    description: params.description,
    url: absoluteUrl,
    siteName: SITE_CONFIG.name,
    locale: "pl_PL",
    ...(params.image && {
      images: [
        {
          url: params.image.url,
          width: params.image.width ?? 1200,
          height: params.image.height ?? 630,
          alt: params.image.alt ?? params.title,
        },
      ],
    }),
  };
};

