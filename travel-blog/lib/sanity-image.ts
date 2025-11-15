import { SanityImage, urlFor } from "./sanity";

export type SanityImageLike =
  | SanityImage
  | {
      src: string;
      alt?: string;
      width?: number;
      height?: number;
    }
  | null
  | undefined;

export type SanityImageFit =
  | "clip"
  | "crop"
  | "fill"
  | "fillmax"
  | "scale"
  | "min"
  | "max";

type BuildOptions = {
  alt?: string;
  fit?: SanityImageFit;
  format?: "webp" | "jpg" | "png";
  quality?: number;
  width?: number;
  height?: number;
};

const FALLBACK_IMAGE = {
  src: "/demo-images/demo-asset.png",
  alt: "Obraz",
} as const;

const DEFAULT_OPTIONS: Omit<BuildOptions, "alt"> = {
  fit: "clip",
  format: "webp",
  quality: 80,
};

const getFallback = (alt?: string) => ({
  src: FALLBACK_IMAGE.src,
  alt: alt || FALLBACK_IMAGE.alt,
});

const hasSanityAsset = (image: SanityImage | undefined | null): image is SanityImage =>
  Boolean(image?.asset?.url);

const buildSanityUrl = (image: SanityImage, options: BuildOptions = {}) => {
  const { format, fit, quality, width, height } = { ...DEFAULT_OPTIONS, ...options };
  const resolvedQuality = typeof quality === "number" ? quality : DEFAULT_OPTIONS.quality ?? 80;
  let builder = urlFor(image).auto("format").quality(resolvedQuality);

  if (typeof width === "number") {
    builder = builder.width(width);
  }

  if (typeof height === "number") {
    builder = builder.height(height);
  }

  if (format) {
    builder = builder.format(format);
  }

  if (fit) {
    builder = builder.fit(fit);
  }

  return builder.url();
};

export type SanityImageProps = {
  src: string;
  alt: string;
};

export const getSanityImageProps = (
  image: SanityImageLike,
  options: BuildOptions = {}
): SanityImageProps => {
  if (!image) {
    return getFallback(options.alt);
  }

  if ("src" in image) {
    return {
      src: image.src || FALLBACK_IMAGE.src,
      alt: image.alt || options.alt || FALLBACK_IMAGE.alt,
    };
  }

  if (hasSanityAsset(image)) {
    return {
      src: buildSanityUrl(image, options),
      alt: image.alt || options.alt || FALLBACK_IMAGE.alt,
    };
  }

  return getFallback(options.alt);
};

export const getSanityImageDimensions = (
  image: SanityImageLike
): { width?: number; height?: number } => {
  if (!image || "src" in image) {
    return {
      width: image?.width,
      height: image?.height,
    };
  }

  const width = image.asset?.metadata?.dimensions?.width;
  const height = image.asset?.metadata?.dimensions?.height;

  return { width, height };
};

