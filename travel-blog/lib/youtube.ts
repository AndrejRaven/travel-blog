import { cache } from "react";
import { unstable_cache } from "next/cache";
import type {
  PostComponent,
  EmbedYoutube as EmbedYoutubeComponent,
} from "./component-types";

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  channelTitle: string;
}

export interface YouTubeChannelInfo {
  channelId: string;
  channelTitle: string;
  latestVideoId: string;
  latestVideo: YouTubeVideo;
}

const YOUTUBE_CHANNEL_ID = "UCUUm2vkbs-W7KulrJZIpNDA";
const YOUTUBE_RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;
const YOUTUBE_FEED_CACHE_KEY = ["youtube-rss-feed"];

const fetchYouTubeFeed = unstable_cache(
  async () => {
    const response = await fetch(YOUTUBE_RSS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NaszBlogBot/1.0)",
        "accept-language": "en-US,en;q=0.9",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`YouTube RSS error: ${response.status}`);
    }

    return response.text();
  },
  YOUTUBE_FEED_CACHE_KEY,
  { revalidate: 3600 }
);

const getFeedDocument = cache(async () => {
  const xml = await fetchYouTubeFeed();
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
  return { xml, entries };
});

function normalizeIsoDate(dateString?: string | null): string | null {
  if (!dateString) {
    return null;
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

async function fetchWatchPagePublishedDate(videoId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      next: { revalidate: 3600 },
      headers: {
        "accept-language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const publishDateMatch = html.match(/"publishDate":"([^"]+)"/);
    const uploadDateMatch = html.match(/"uploadDate":"([^"]+)"/);

    const resolved =
      normalizeIsoDate(publishDateMatch?.[1]) || normalizeIsoDate(uploadDateMatch?.[1]);

    return resolved;
  } catch (error) {
    console.error("Error fetching YouTube watch page publish date:", error);
    return null;
  }
}

function entryContainsShort(entryTitle: string, videoUrl: string | null): boolean {
  const normalizedTitle = entryTitle.toLowerCase();
  return (
    normalizedTitle.includes("#shorts") ||
    normalizedTitle.includes("shorts") ||
    entryTitle.includes("#Shorts") ||
    (videoUrl?.includes("/shorts/") ?? false)
  );
}

async function resolvePublishedDateFromEntry(
  entry: string,
  videoId: string
): Promise<string | null> {
  const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
  const updatedMatch = entry.match(/<updated>([^<]+)<\/updated>/);

  const resolved =
    normalizeIsoDate(publishedMatch?.[1]) || normalizeIsoDate(updatedMatch?.[1]);

  if (resolved) {
    return resolved;
  }

  return fetchWatchPagePublishedDate(videoId);
}

/**
 * Pobiera najnowszy film z kanału YouTube poprzez RSS feed (server-side)
 * Filtruje długie filmy (nie shorts)
 */
export async function getLatestYouTubeVideo(): Promise<YouTubeVideo | null> {
  try {
    const { xml, entries } = await getFeedDocument();

    // Szukaj pierwszego długiego filmu (nie short)
    for (const entry of entries) {
      const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      if (!videoIdMatch) continue;

      const videoId = videoIdMatch[1];
      const title =
        entry.match(/<title>([^<]+)<\/title>/)?.[1] || "Brak tytułu";
      const description =
        entry.match(/<media:description>([^<]+)<\/media:description>/)?.[1] ||
        "";
      const channelTitle =
        entry.match(/<author><name>([^<]+)<\/name><\/author>/)?.[1] ||
        "Vlogi z Drogi";
      const videoUrl =
        entry.match(/<link[^>]*href="([^"]*)"[^>]*>/)?.[1] ||
        `https://www.youtube.com/watch?v=${videoId}`;

      // Sprawdź czy to nie jest short (tytuł lub URL zawiera shorts)
      const isShort = entryContainsShort(title, videoUrl);

      // Jeśli to nie jest short, zwróć film
      if (!isShort) {
        const publishedAt =
          (await resolvePublishedDateFromEntry(entry, videoId)) || "";
        return {
          id: videoId,
          title,
          description,
          publishedAt,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          channelTitle,
        };
      }
    }

    // Jeśli nie znaleziono długiego filmu, zwróć pierwszy dostępny
    const fallbackVideoId = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const fallbackTitle = xml.match(/<title>([^<]+)<\/title>/)?.[1] || "Brak tytułu";
    const fallbackDescription =
      xml.match(/<media:description>([^<]+)<\/media:description>/)?.[1] || "";
    const fallbackChannelTitle =
      xml.match(/<author><name>([^<]+)<\/name><\/author>/)?.[1] ||
      "Vlogi z Drogi";
    const publishedMatch = xml.match(/<published>([^<]+)<\/published>/);
    const updatedMatch = xml.match(/<updated>([^<]+)<\/updated>/);

    if (!fallbackVideoId) {
      throw new Error("No video ID found in RSS feed");
    }

    const fallbackPublishedAt =
      normalizeIsoDate(publishedMatch?.[1]) ||
      normalizeIsoDate(updatedMatch?.[1]) ||
      (await fetchWatchPagePublishedDate(fallbackVideoId)) ||
      "";

    return {
      id: fallbackVideoId,
      title: fallbackTitle,
      description: fallbackDescription,
      publishedAt: fallbackPublishedAt,
      thumbnailUrl: `https://img.youtube.com/vi/${fallbackVideoId}/maxresdefault.jpg`,
      channelTitle: fallbackChannelTitle,
    };
  } catch (error) {
    console.error("Error fetching latest YouTube video:", error);
    return null;
  }
}

/**
 * Pobiera informacje o kanale YouTube
 */
export async function getYouTubeChannelInfo(): Promise<YouTubeChannelInfo | null> {
  try {
    const latestVideo = await getLatestYouTubeVideo();
    if (!latestVideo) {
      return null;
    }

    return {
      channelId: YOUTUBE_CHANNEL_ID,
      channelTitle: latestVideo.channelTitle,
      latestVideoId: latestVideo.id,
      latestVideo,
    };
  } catch (error) {
    console.error("Error fetching YouTube channel info:", error);
    return null;
  }
}

/**
 * Pobiera datę publikacji dla konkretnego videoId z RSS feed (server-side)
 * Zwraca publishedAt jeśli film jest w RSS feed, w przeciwnym razie null
 */
export async function getYouTubeVideoById(
  videoId: string
): Promise<string | null> {
  try {
    const { entries } = await getFeedDocument();

    // Szukaj filmu o podanym ID
    for (const entry of entries) {
      const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const linkMatch = entry.match(/<link[^>]*href="([^"]*)"[^>]*>/);

      if (!videoIdMatch && !linkMatch) continue;

      let entryVideoId: string | null = null;

      // Spróbuj wyciągnąć ID z yt:videoId
      if (videoIdMatch) {
        entryVideoId = videoIdMatch[1];
      }

      // Jeśli nie ma yt:videoId, spróbuj wyciągnąć z URL
      if (!entryVideoId && linkMatch) {
        const videoUrl = linkMatch[1];
        entryVideoId = videoUrl.split("v=")[1]?.split("&")[0] || null;
      }

      if (!entryVideoId) continue;

      // Jeśli znaleziono film o podanym ID, zwróć datę publikacji
      if (entryVideoId === videoId) {
        return resolvePublishedDateFromEntry(entry, videoId);
      }
    }

    // Film nie został znaleziony w RSS feed - spróbuj pobrać datę bezpośrednio z YouTube
    return fetchWatchPagePublishedDate(videoId);
  } catch (error) {
    console.error("Error fetching YouTube video by ID:", error);
    return null;
  }
}

export type EmbedResolutionContext = {
  latestVideo: YouTubeVideo | null;
  publishedAtById: Map<string, string | null>;
};

export async function createEmbedResolutionContext(
  componentGroups: Array<PostComponent[] | undefined>
): Promise<EmbedResolutionContext> {
  const embedComponents = componentGroups.flatMap((group) =>
    (group ?? []).filter(
      (component): component is EmbedYoutubeComponent =>
        component._type === "embedYoutube"
    )
  );

  if (embedComponents.length === 0) {
    return {
      latestVideo: null,
      publishedAtById: new Map(),
    };
  }

  const requiresLatest = embedComponents.some(
    (component) =>
      component.useLatestVideo || component.videoId === "latest"
  );

  const latestVideo = requiresLatest ? await getLatestYouTubeVideo() : null;

  const idsToResolve = new Set<string>();
  embedComponents.forEach((component) => {
    if (
      component.videoId &&
      component.videoId !== "latest" &&
      !(component as { videoPublishedAt?: string | null }).videoPublishedAt
    ) {
      idsToResolve.add(component.videoId);
    }
  });

  const publishedAtEntries = await Promise.all(
    Array.from(idsToResolve).map(async (id) => {
      const publishedAt = await getYouTubeVideoById(id);
      return [id, publishedAt] as const;
    })
  );

  return {
    latestVideo,
    publishedAtById: new Map(publishedAtEntries),
  };
}

export function resolveEmbedYoutubeComponents(
  components: PostComponent[] | undefined,
  context: EmbedResolutionContext
): PostComponent[] | undefined {
  if (!components) {
    return undefined;
  }

  return components.map((component) => {
    if (component._type !== "embedYoutube") {
      return component;
    }

    const embed = component as EmbedYoutubeComponent & {
      publishedAt?: string | null;
      videoPublishedAt?: string | null;
    };

    let resolvedVideoId =
      embed.videoId && embed.videoId !== "latest" ? embed.videoId : null;
    let publishedAt = embed.videoPublishedAt || embed.publishedAt || null;

    if (embed.useLatestVideo || embed.videoId === "latest") {
      resolvedVideoId = context.latestVideo?.id ?? null;
      publishedAt = publishedAt || context.latestVideo?.publishedAt || null;
    } else if (resolvedVideoId && !publishedAt) {
      publishedAt = context.publishedAtById.get(resolvedVideoId) || null;
    }

    return {
      ...component,
      ...(resolvedVideoId ? { videoId: resolvedVideoId } : {}),
      publishedAt,
    };
  });
}
