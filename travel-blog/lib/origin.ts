const PRIMARY_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.vlogizdrogi.pl";

const normalizeOrigin = (origin?: string | null) =>
  origin?.replace(/\/$/, "") || null;

export const ALLOWED_ORIGINS = [PRIMARY_ORIGIN];

export const getAllowedOrigin = (origin?: string | null) => {
  const normalized = normalizeOrigin(origin);
  return normalized && ALLOWED_ORIGINS.includes(normalized)
    ? normalized
    : null;
};



