const normalizeOriginValue = (origin?: string | null) =>
  origin?.replace(/\/$/, "") || null;

const parseOriginList = (value?: string | null) =>
  value
    ?.split(/[\s,]+/)
    .map((entry) => normalizeOriginValue(entry))
    .filter((entry): entry is string => Boolean(entry));

const DEFAULT_SANITY_PREVIEW_ORIGINS = [
  "http://localhost:3333",
  "https://k5fsny25.sanity.studio",
];

export const normalizeOrigin = (origin?: string | null) =>
  normalizeOriginValue(origin);

export const getSanityPreviewOrigins = () =>
  parseOriginList(process.env.SANITY_STUDIO_PREVIEW_ORIGINS) ||
  DEFAULT_SANITY_PREVIEW_ORIGINS.map(
    (origin) => normalizeOriginValue(origin)!
  );


