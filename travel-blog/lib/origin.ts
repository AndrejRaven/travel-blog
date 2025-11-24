import {
  getSanityPreviewOrigins,
  normalizeOrigin as normalizeOriginValue,
} from "./origin-helpers";

const FALLBACK_ORIGIN = "https://www.vlogizdrogi.pl";
const PRIMARY_ORIGIN =
  normalizeOriginValue(process.env.NEXT_PUBLIC_SITE_URL) ||
  normalizeOriginValue(FALLBACK_ORIGIN)!;
const SANITY_PREVIEW_ORIGINS = getSanityPreviewOrigins();

export const ALLOWED_ORIGINS = Array.from(
  new Set([PRIMARY_ORIGIN, ...SANITY_PREVIEW_ORIGINS])
);

export const getAllowedOrigin = (origin?: string | null) => {
  const normalized = normalizeOriginValue(origin);
  return normalized && ALLOWED_ORIGINS.includes(normalized)
    ? normalized
    : null;
};

export { SANITY_PREVIEW_ORIGINS };

