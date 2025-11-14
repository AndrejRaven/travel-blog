/**
 * Centralny plik z funkcjami do generowania Schema.org (JSON-LD)
 * Wszystkie funkcje zwracają obiekty zgodne ze specyfikacją Schema.org
 */

import { SITE_CONFIG } from "./config";
import { SanityImage, getImageUrl } from "./sanity";

// Typy dla Schema.org
export interface BreadcrumbItem {
  name: string;
  url: string;
  position: number;
}

export interface ArticleItem {
  title: string;
  url: string;
  description?: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface PersonData {
  name: string;
  url?: string;
  image?: SanityImage | string | null;
  jobTitle?: string;
  sameAs?: string[];
}

export interface VideoData {
  name: string;
  description?: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  duration?: string;
  contentUrl?: string;
  embedUrl?: string;
}

// Typy dla Schema.org objects
interface SchemaOrgBase {
  "@context": string;
  "@type": string;
}

interface OrganizationSchema extends SchemaOrgBase {
  "@type": "Organization";
  "@id"?: string;
  name: string;
  url: string;
  description?: string;
  logo?: string;
  sameAs?: string[];
  contactPoint?: ContactPointSchema;
  paymentAccepted?: string[];
}

interface ContactPointSchema {
  "@type": "ContactPoint";
  contactType: string;
  telephone?: string;
  email?: string;
}

interface WebSiteSchema extends SchemaOrgBase {
  "@type": "WebSite";
  name: string;
  url: string;
  description?: string;
  publisher?: {
    "@type": "Organization";
    "@id"?: string;
    name: string;
    url: string;
  };
  potentialAction?: {
    "@type": "SearchAction";
    target: {
      "@type": "EntryPoint";
      urlTemplate: string;
    };
    "query-input": string;
  };
}

interface BlogPostingSchema extends SchemaOrgBase {
  "@type": "BlogPosting";
  headline: string;
  description?: string;
  image?: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author?: PersonSchema | {
    "@type": "Person" | "Organization";
    name: string;
    url?: string;
  };
  publisher?: OrganizationSchema | {
    "@type": "Organization";
    "@id"?: string;
    name: string;
    url: string;
    logo?: string;
  };
  articleSection?: string;
  keywords?: string;
  mainEntityOfPage?: {
    "@type": "WebPage";
    "@id": string;
  };
}

interface PersonSchema extends SchemaOrgBase {
  "@type": "Person";
  name: string;
  url?: string;
  image?: string;
  jobTitle?: string;
  sameAs?: string[];
}

interface CollectionPageSchema extends SchemaOrgBase {
  "@type": "CollectionPage";
  name: string;
  description?: string;
  url: string;
  image?: string;
  breadcrumb?: object;
}

interface ItemListSchema extends SchemaOrgBase {
  "@type": "ItemList";
  numberOfItems: number;
  name?: string;
  description?: string;
  url?: string;
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    item: {
      "@type": "Article";
      headline: string;
      url: string;
      description?: string;
      image?: string;
      datePublished?: string;
      dateModified?: string;
    };
  }>;
}

interface ContactPageSchema extends SchemaOrgBase {
  "@type": "ContactPage";
  name: string;
  description?: string;
  url: string;
  mainEntity?: {
    "@type": "Organization";
    contactPoint: ContactPointSchema;
  };
}

interface FAQPageSchema extends SchemaOrgBase {
  "@type": "FAQPage";
  name?: string;
  description?: string;
  url: string;
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

interface VideoObjectSchema extends SchemaOrgBase {
  "@type": "VideoObject";
  name: string;
  description?: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  duration?: string;
  contentUrl?: string;
  embedUrl?: string;
  url?: string;
}

interface WebPageSchema extends SchemaOrgBase {
  "@type": "WebPage";
  name: string;
  description?: string;
  url: string;
  image?: string;
  breadcrumb?: object;
  datePublished?: string;
  dateModified?: string;
}

/**
 * Pomocnicza funkcja do zapewnienia absolutnego URL
 */
function ensureAbsoluteUrl(url: string | null | undefined, baseUrl: string): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${baseUrl}${url}`;
  return null;
}

/**
 * Generuje Schema.org Organization
 */
export function generateOrganizationSchema(options?: {
  logo?: SanityImage | string | null;
  contactPoint?: {
    telephone?: string;
    email?: string;
    contactType?: string;
  };
  paymentAccepted?: string[];
}): object {
  const baseUrl = SITE_CONFIG.url;
  const organizationId = `${baseUrl}#organization`;
  const organizationName = SITE_CONFIG.author.name;

  const sameAs: string[] = [];
  if (SITE_CONFIG.social.twitter) {
    sameAs.push(`https://twitter.com/${SITE_CONFIG.social.twitter}`);
  }
  if (SITE_CONFIG.social.facebook) {
    sameAs.push(`https://facebook.com/${SITE_CONFIG.social.facebook}`);
  }
  if (SITE_CONFIG.social.instagram) {
    sameAs.push(`https://instagram.com/${SITE_CONFIG.social.instagram}`);
  }
  if (SITE_CONFIG.social.youtube) {
    sameAs.push(`https://youtube.com/${SITE_CONFIG.social.youtube}`);
  }

  const schema: OrganizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId,
    name: organizationName,
    url: baseUrl,
    description: SITE_CONFIG.description,
  };

  // Logo
  if (options?.logo) {
    const logoUrl =
      typeof options.logo === "string"
        ? ensureAbsoluteUrl(options.logo, baseUrl)
        : getImageUrl(options.logo, { width: 600, height: 60, format: "webp" });

    if (logoUrl) {
      const absoluteLogoUrl = ensureAbsoluteUrl(logoUrl, baseUrl);
      if (absoluteLogoUrl) {
        schema.logo = absoluteLogoUrl;
      }
    }
  }

  // Social media
  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  // Contact point
  if (options?.contactPoint) {
    const contactPoint: ContactPointSchema = {
      "@type": "ContactPoint",
      contactType: options.contactPoint.contactType || "customer service",
    };
    if (options.contactPoint.telephone) {
      contactPoint.telephone = options.contactPoint.telephone;
    }
    if (options.contactPoint.email) {
      contactPoint.email = options.contactPoint.email;
    }
    schema.contactPoint = contactPoint;
  }

  // Payment accepted
  if (options?.paymentAccepted && options.paymentAccepted.length > 0) {
    schema.paymentAccepted = options.paymentAccepted;
  }

  return schema;
}

/**
 * Generuje Schema.org WebSite z SearchAction
 */
export function generateWebSiteSchema(options?: {
  potentialAction?: {
    target: string;
    queryInput: string;
  };
}): object {
  const baseUrl = SITE_CONFIG.url;

  const schema: WebSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    url: baseUrl,
    description: SITE_CONFIG.description,
    publisher: {
      "@type": "Organization",
      "@id": `${baseUrl}#organization`,
      name: SITE_CONFIG.author.name,
      url: baseUrl,
    },
  };

  // SearchAction
  if (options?.potentialAction) {
    schema.potentialAction = {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: options.potentialAction.target,
      },
      "query-input": options.potentialAction.queryInput,
    };
  } else {
    // Domyślne SearchAction
    schema.potentialAction = {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/wszystkie-artykuly?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    };
  }

  return schema;
}

/**
 * Generuje Schema.org BlogPosting
 */
export function generateBlogPostingSchema(options: {
  headline: string;
  description?: string;
  image?: SanityImage | string | null;
  url: string;
  datePublished: string;
  dateModified?: string;
  author?: PersonData | string;
  publisher?: {
    name: string;
    url: string;
    logo?: SanityImage | string | null;
  };
  articleSection?: string | string[];
  keywords?: string[];
  mainEntityOfPage?: string;
}): object {
  const baseUrl = SITE_CONFIG.url;
  const absoluteUrl = ensureAbsoluteUrl(options.url, baseUrl) || options.url;

  const schema: BlogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: options.headline,
    url: absoluteUrl,
    datePublished: options.datePublished,
  };

  // Description
  if (options.description) {
    schema.description = options.description;
  }

  // Image
  if (options.image) {
    const imageUrl =
      typeof options.image === "string"
        ? ensureAbsoluteUrl(options.image, baseUrl)
        : getImageUrl(options.image, { width: 1200, height: 630, format: "webp" });

    if (imageUrl) {
      const absoluteImageUrl = ensureAbsoluteUrl(imageUrl, baseUrl);
      if (absoluteImageUrl) {
        schema.image = absoluteImageUrl;
      }
    }
  }

  // Author
  if (options.author) {
    if (typeof options.author === "string") {
      schema.author = {
        "@type": "Person",
        name: options.author,
      };
    } else {
      const authorSchema: PersonSchema = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: options.author.name,
      };
      if (options.author.url) {
        const authorUrl = ensureAbsoluteUrl(options.author.url, baseUrl);
        if (authorUrl) {
          authorSchema.url = authorUrl;
        }
      }
      if (options.author.image) {
        const authorImageUrl =
          typeof options.author.image === "string"
            ? ensureAbsoluteUrl(options.author.image, baseUrl)
            : getImageUrl(options.author.image, { width: 400, height: 400, format: "webp" });
        if (authorImageUrl) {
          const absoluteAuthorImageUrl = ensureAbsoluteUrl(authorImageUrl, baseUrl);
          if (absoluteAuthorImageUrl) {
            authorSchema.image = absoluteAuthorImageUrl;
          }
        }
      }
      if (options.author.jobTitle) {
        authorSchema.jobTitle = options.author.jobTitle;
      }
      if (options.author.sameAs && options.author.sameAs.length > 0) {
        authorSchema.sameAs = options.author.sameAs;
      }
      schema.author = authorSchema;
    }
  } else {
    // Domyślny autor z konfiguracji
    schema.author = {
      "@type": SITE_CONFIG.author.type === "Person" ? "Person" : "Organization",
      name: SITE_CONFIG.author.name,
      url: SITE_CONFIG.author.url || baseUrl,
    };
  }

  // Publisher
  if (options.publisher) {
    const publisherSchema: Omit<OrganizationSchema, "@context"> = {
      "@type": "Organization",
      name: options.publisher.name,
      url: ensureAbsoluteUrl(options.publisher.url, baseUrl) || options.publisher.url,
    };
    if (options.publisher.logo) {
      const logoUrl =
        typeof options.publisher.logo === "string"
          ? ensureAbsoluteUrl(options.publisher.logo, baseUrl)
          : getImageUrl(options.publisher.logo, { width: 600, height: 60, format: "webp" });
      if (logoUrl) {
        const absoluteLogoUrl = ensureAbsoluteUrl(logoUrl, baseUrl);
        if (absoluteLogoUrl) {
          publisherSchema.logo = absoluteLogoUrl;
        }
      }
    }
    schema.publisher = publisherSchema;
  } else {
    // Domyślny publisher
    schema.publisher = {
      "@type": "Organization",
      "@id": `${baseUrl}#organization`,
      name: SITE_CONFIG.author.name,
      url: baseUrl,
    };
  }

  // Date modified
  if (options.dateModified) {
    schema.dateModified = options.dateModified;
  } else {
    schema.dateModified = options.datePublished;
  }

  // Article section
  if (options.articleSection) {
    if (Array.isArray(options.articleSection)) {
      schema.articleSection = options.articleSection.join(", ");
    } else {
      schema.articleSection = options.articleSection;
    }
  }

  // Keywords
  if (options.keywords && options.keywords.length > 0) {
    schema.keywords = options.keywords.join(", ");
  }

  // Main entity of page
  if (options.mainEntityOfPage) {
    schema.mainEntityOfPage = {
      "@type": "WebPage",
      "@id": ensureAbsoluteUrl(options.mainEntityOfPage, baseUrl) || options.mainEntityOfPage,
    };
  } else {
    schema.mainEntityOfPage = {
      "@type": "WebPage",
      "@id": absoluteUrl,
    };
  }

  return schema;
}

/**
 * Generuje Schema.org Article (dla ogólnych artykułów)
 */
export function generateArticleSchema(options: {
  headline: string;
  description?: string;
  image?: SanityImage | string | null;
  url: string;
  datePublished: string;
  dateModified?: string;
  author?: PersonData | string;
  publisher?: {
    name: string;
    url: string;
    logo?: SanityImage | string | null;
  };
}): object {
  // Article jest podobny do BlogPosting, ale bez specyficznych pól blogowych
  return generateBlogPostingSchema({
    ...options,
  });
}

/**
 * Generuje Schema.org BreadcrumbList
 */
export function generateBreadcrumbListSchema(items: BreadcrumbItem[]): object {
  const baseUrl = SITE_CONFIG.url;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      item: ensureAbsoluteUrl(item.url, baseUrl) || item.url,
    })),
  };
}

/**
 * Generuje Schema.org CollectionPage
 */
export function generateCollectionPageSchema(options: {
  name: string;
  description?: string;
  url: string;
  image?: SanityImage | string | null;
  breadcrumb?: BreadcrumbItem[];
}): object {
  const baseUrl = SITE_CONFIG.url;
  const absoluteUrl = ensureAbsoluteUrl(options.url, baseUrl) || options.url;

  const schema: CollectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: options.name,
    url: absoluteUrl,
  };

  if (options.description) {
    schema.description = options.description;
  }

  if (options.image) {
    const imageUrl =
      typeof options.image === "string"
        ? ensureAbsoluteUrl(options.image, baseUrl)
        : getImageUrl(options.image, { width: 1200, height: 630, format: "webp" });
    if (imageUrl) {
      const absoluteImageUrl = ensureAbsoluteUrl(imageUrl, baseUrl);
      if (absoluteImageUrl) {
        schema.image = absoluteImageUrl;
      }
    }
  }

  if (options.breadcrumb && options.breadcrumb.length > 0) {
    schema.breadcrumb = generateBreadcrumbListSchema(options.breadcrumb);
  }

  return schema;
}

/**
 * Generuje Schema.org ItemList
 */
export function generateItemListSchema(options: {
  name?: string;
  description?: string;
  items: ArticleItem[];
  url?: string;
}): object {
  const baseUrl = SITE_CONFIG.url;

  const schema: ItemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: options.items.length,
    itemListElement: options.items.map((item, index) => {
      const itemSchema: {
        "@type": "ListItem";
        position: number;
        item: {
          "@type": "Article";
          headline: string;
          url: string;
          description?: string;
          image?: string;
          datePublished?: string;
          dateModified?: string;
        };
      } = {
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Article",
          headline: item.title,
          url: ensureAbsoluteUrl(item.url, baseUrl) || item.url,
        },
      };

      if (item.description) {
        itemSchema.item.description = item.description;
      }

      if (item.image) {
        const imageUrl = ensureAbsoluteUrl(item.image, baseUrl);
        if (imageUrl) {
          itemSchema.item.image = imageUrl;
        }
      }

      if (item.datePublished) {
        itemSchema.item.datePublished = item.datePublished;
      }

      if (item.dateModified) {
        itemSchema.item.dateModified = item.dateModified;
      }

      return itemSchema;
    }),
  };

  if (options.name) {
    schema.name = options.name;
  }

  if (options.description) {
    schema.description = options.description;
  }

  if (options.url) {
    schema.url = ensureAbsoluteUrl(options.url, baseUrl) || options.url;
  }

  return schema;
}

/**
 * Generuje Schema.org ContactPage
 */
export function generateContactPageSchema(options: {
  name: string;
  description?: string;
  url: string;
  contactPoint?: {
    telephone?: string;
    email?: string;
    contactType?: string;
  };
}): object {
  const baseUrl = SITE_CONFIG.url;
  const absoluteUrl = ensureAbsoluteUrl(options.url, baseUrl) || options.url;

  const schema: ContactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: options.name,
    url: absoluteUrl,
  };

  if (options.description) {
    schema.description = options.description;
  }

  if (options.contactPoint) {
    const contactPoint: ContactPointSchema = {
      "@type": "ContactPoint",
      contactType: options.contactPoint.contactType || "customer service",
    };
    if (options.contactPoint.telephone) {
      contactPoint.telephone = options.contactPoint.telephone;
    }
    if (options.contactPoint.email) {
      contactPoint.email = options.contactPoint.email;
    }
    schema.mainEntity = {
      "@type": "Organization",
      contactPoint: contactPoint,
    };
  }

  return schema;
}

/**
 * Generuje Schema.org FAQPage
 */
export function generateFAQPageSchema(options: {
  name?: string;
  description?: string;
  url: string;
  faqs: FAQItem[];
}): object {
  const baseUrl = SITE_CONFIG.url;
  const absoluteUrl = ensureAbsoluteUrl(options.url, baseUrl) || options.url;

  const schema: FAQPageSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: absoluteUrl,
    mainEntity: options.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  if (options.name) {
    schema.name = options.name;
  }

  if (options.description) {
    schema.description = options.description;
  }

  return schema;
}

/**
 * Generuje Schema.org Person
 */
export function generatePersonSchema(person: PersonData): object {
  const baseUrl = SITE_CONFIG.url;

  const schema: PersonSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
  };

  if (person.url) {
    schema.url = ensureAbsoluteUrl(person.url, baseUrl) || person.url;
  }

  if (person.image) {
    const imageUrl =
      typeof person.image === "string"
        ? ensureAbsoluteUrl(person.image, baseUrl)
        : getImageUrl(person.image, { width: 400, height: 400, format: "webp" });
    if (imageUrl) {
      const absoluteImageUrl = ensureAbsoluteUrl(imageUrl, baseUrl);
      if (absoluteImageUrl) {
        schema.image = absoluteImageUrl;
      }
    }
  }

  if (person.jobTitle) {
    schema.jobTitle = person.jobTitle;
  }

  if (person.sameAs && person.sameAs.length > 0) {
    schema.sameAs = person.sameAs;
  }

  return schema;
}

/**
 * Generuje Schema.org VideoObject
 */
export function generateVideoObjectSchema(options: {
  name: string;
  description?: string;
  thumbnailUrl?: SanityImage | string | null;
  uploadDate?: string;
  duration?: string;
  contentUrl?: string;
  embedUrl?: string;
  url?: string;
}): object {
  const baseUrl = SITE_CONFIG.url;

  const schema: VideoObjectSchema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: options.name,
  };

  if (options.description) {
    schema.description = options.description;
  }

  if (options.thumbnailUrl) {
    const thumbnailUrl =
      typeof options.thumbnailUrl === "string"
        ? ensureAbsoluteUrl(options.thumbnailUrl, baseUrl)
        : getImageUrl(options.thumbnailUrl, { width: 1280, height: 720, format: "webp" });
    if (thumbnailUrl) {
      const absoluteThumbnailUrl = ensureAbsoluteUrl(thumbnailUrl, baseUrl);
      if (absoluteThumbnailUrl) {
        schema.thumbnailUrl = absoluteThumbnailUrl;
      }
    }
  }

  if (options.uploadDate) {
    schema.uploadDate = options.uploadDate;
  }

  if (options.duration) {
    schema.duration = options.duration;
  }

  if (options.contentUrl) {
    schema.contentUrl = ensureAbsoluteUrl(options.contentUrl, baseUrl) || options.contentUrl;
  }

  if (options.embedUrl) {
    schema.embedUrl = ensureAbsoluteUrl(options.embedUrl, baseUrl) || options.embedUrl;
  }

  if (options.url) {
    schema.url = ensureAbsoluteUrl(options.url, baseUrl) || options.url;
  }

  return schema;
}

/**
 * Generuje Schema.org WebPage
 */
export function generateWebPageSchema(options: {
  name: string;
  description?: string;
  url: string;
  image?: SanityImage | string | null;
  breadcrumb?: BreadcrumbItem[];
  datePublished?: string;
  dateModified?: string;
}): object {
  const baseUrl = SITE_CONFIG.url;
  const absoluteUrl = ensureAbsoluteUrl(options.url, baseUrl) || options.url;

  const schema: WebPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: options.name,
    url: absoluteUrl,
  };

  if (options.description) {
    schema.description = options.description;
  }

  if (options.image) {
    const imageUrl =
      typeof options.image === "string"
        ? ensureAbsoluteUrl(options.image, baseUrl)
        : getImageUrl(options.image, { width: 1200, height: 630, format: "webp" });
    if (imageUrl) {
      const absoluteImageUrl = ensureAbsoluteUrl(imageUrl, baseUrl);
      if (absoluteImageUrl) {
        schema.image = absoluteImageUrl;
      }
    }
  }

  if (options.breadcrumb && options.breadcrumb.length > 0) {
    schema.breadcrumb = generateBreadcrumbListSchema(options.breadcrumb);
  }

  if (options.datePublished) {
    schema.datePublished = options.datePublished;
  }

  if (options.dateModified) {
    schema.dateModified = options.dateModified;
  }

  return schema;
}

