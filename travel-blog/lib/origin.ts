import {
  getSanityPreviewOrigins,
  normalizeOrigin as normalizeOriginValue,
} from "./origin-helpers";

const FALLBACK_ORIGIN = "https://www.vlogizdrogi.pl";
const PRIMARY_ORIGIN =
  normalizeOriginValue(process.env.NEXT_PUBLIC_SITE_URL) ||
  normalizeOriginValue(FALLBACK_ORIGIN)!;
const SANITY_PREVIEW_ORIGINS = getSanityPreviewOrigins();

// W development dodaj localhost:3000 do dozwolonych originów
const DEVELOPMENT_ORIGINS = process.env.NODE_ENV === 'development' 
  ? ['http://localhost:3000', 'http://127.0.0.1:3000']
  : [];

export const ALLOWED_ORIGINS = Array.from(
  new Set([
    PRIMARY_ORIGIN, 
    ...SANITY_PREVIEW_ORIGINS,
    ...DEVELOPMENT_ORIGINS.map(normalizeOriginValue).filter((o): o is string => Boolean(o))
  ])
);

export const getAllowedOrigin = (origin?: string | null) => {
  const normalized = normalizeOriginValue(origin);
  return normalized && ALLOWED_ORIGINS.includes(normalized)
    ? normalized
    : null;
};

export { SANITY_PREVIEW_ORIGINS };

