// YouTube API functions
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

/**
 * Pobiera najnowszy film z kanału YouTube poprzez RSS feed (server-side)
 * Filtruje długie filmy (nie shorts)
 */
export async function getLatestYouTubeVideo(): Promise<YouTubeVideo | null> {
  try {
    const response = await fetch(YOUTUBE_RSS_URL, {
      next: { revalidate: 0 }, // Pobieraj przy każdym odświeżeniu
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    
    // Parsowanie XML za pomocą regex (działa w Node.js)
    const entries = xmlText.match(/<entry>[\s\S]*?<\/entry>/g) || [];
    
    // Szukaj pierwszego długiego filmu (nie short)
    for (const entry of entries) {
      const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
      const descriptionMatch = entry.match(/<media:description>([^<]+)<\/media:description>/);
      const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
      const authorMatch = entry.match(/<author><name>([^<]+)<\/name><\/author>/);
      const linkMatch = entry.match(/<link[^>]*href="([^"]*)"[^>]*>/);

      if (!videoIdMatch) continue;

      const videoId = videoIdMatch[1];
      const title = titleMatch?.[1] || "Brak tytułu";
      const description = descriptionMatch?.[1] || "";
      const publishedAt = publishedMatch?.[1] || "";
      const channelTitle = authorMatch?.[1] || "Vlogi z Drogi";
      const videoUrl = linkMatch?.[1] || `https://www.youtube.com/watch?v=${videoId}`;

      // Sprawdź czy to nie jest short (tytuł lub URL zawiera shorts)
      const isShort = title.toLowerCase().includes('#shorts') || 
                     title.toLowerCase().includes('shorts') ||
                     title.includes('#Shorts') ||
                     videoUrl.includes('/shorts/');

      // Jeśli to nie jest short, zwróć film
      if (!isShort) {
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
    const videoIdMatch = xmlText.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const titleMatch = xmlText.match(/<title>([^<]+)<\/title>/);
    const descriptionMatch = xmlText.match(/<media:description>([^<]+)<\/media:description>/);
    const publishedMatch = xmlText.match(/<published>([^<]+)<\/published>/);
    const authorMatch = xmlText.match(/<author><name>([^<]+)<\/name><\/author>/);

    if (!videoIdMatch) {
      throw new Error("No video ID found in RSS feed");
    }

    const videoId = videoIdMatch[1];
    const title = titleMatch?.[1] || "Brak tytułu";
    const description = descriptionMatch?.[1] || "";
    const publishedAt = publishedMatch?.[1] || "";
    const channelTitle = authorMatch?.[1] || "Vlogi z Drogi";

    return {
      id: videoId,
      title,
      description,
      publishedAt,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      channelTitle,
    };
  } catch (error) {
    console.error("Error fetching latest YouTube video:", error);
    return null;
  }
}

/**
 * Pobiera najnowszy film z kanału YouTube poprzez RSS feed (client-side)
 * Filtruje długie filmy (nie shorts)
 */
export async function getLatestYouTubeVideoClient(): Promise<YouTubeVideo | null> {
  try {
    const response = await fetch(YOUTUBE_RSS_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    
    // Parsowanie XML za pomocą DOMParser (działa w przeglądarce)
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    // Pobierz wszystkie filmy
    const entries = xmlDoc.querySelectorAll("entry");
    
    // Szukaj pierwszego długiego filmu (nie short)
    for (const entry of entries) {
      // Wyciągnij ID filmu z URL
      const videoUrl = entry.querySelector("link")?.getAttribute("href");
      if (!videoUrl) continue;

      const videoId = videoUrl.split("v=")[1]?.split("&")[0];
      if (!videoId) continue;

      // Wyciągnij inne dane
      const title = entry.querySelector("title")?.textContent || "Brak tytułu";
      const description = entry.querySelector("media\\:description, description")?.textContent || "";
      const publishedAt = entry.querySelector("published")?.textContent || "";
      const channelTitle = entry.querySelector("author name")?.textContent || "Vlogi z Drogi";

      // Sprawdź czy to nie jest short (tytuł lub URL zawiera shorts)
      const isShort = title.toLowerCase().includes('#shorts') || 
                     title.toLowerCase().includes('shorts') ||
                     title.includes('#Shorts') ||
                     videoUrl.includes('/shorts/');

      // Jeśli to nie jest short, zwróć film
      if (!isShort) {
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
    const firstEntry = xmlDoc.querySelector("entry");
    if (!firstEntry) {
      throw new Error("No video entries found in RSS feed");
    }

    // Wyciągnij ID filmu z URL
    const videoUrl = firstEntry.querySelector("link")?.getAttribute("href");
    if (!videoUrl) {
      throw new Error("No video URL found");
    }

    const videoId = videoUrl.split("v=")[1]?.split("&")[0];
    if (!videoId) {
      throw new Error("Could not extract video ID from URL");
    }

    // Wyciągnij inne dane
    const title = firstEntry.querySelector("title")?.textContent || "Brak tytułu";
    const description = firstEntry.querySelector("media\\:description, description")?.textContent || "";
    const publishedAt = firstEntry.querySelector("published")?.textContent || "";
    const channelTitle = firstEntry.querySelector("author name")?.textContent || "Vlogi z Drogi";

    return {
      id: videoId,
      title,
      description,
      publishedAt,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      channelTitle,
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
 * Sprawdza czy videoId to "latest" i zwraca odpowiedni ID
 */
export async function resolveVideoId(videoId: string): Promise<string> {
  if (videoId === "latest") {
    const latestVideo = await getLatestYouTubeVideo();
    return latestVideo?.id || videoId;
  }
  return videoId;
}
