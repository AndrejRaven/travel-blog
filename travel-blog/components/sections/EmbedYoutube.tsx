import React from "react";
import SectionHeader from "@/components/shared/SectionHeader";
import {
  resolveVideoId,
  getLatestYouTubeVideo,
  type YouTubeVideo,
} from "@/lib/youtube";

interface EmbedYoutubeProps {
  title?: string;
  description?: string;
  videoId: string;
  useLatestVideo?: boolean;
}

export default async function EmbedYoutube({
  title = "Zobacz nasz najnowszy film",
  description = "Odkryj najpiękniejsze miejsca z naszych podróży w najnowszym filmie na YouTube.",
  videoId,
  useLatestVideo = false,
}: EmbedYoutubeProps) {
  // Rozwiąż videoId - jeśli to "latest" lub useLatestVideo jest true, pobierz najnowszy film
  let resolvedVideoId = videoId;
  let videoData: YouTubeVideo | null = null;

  if (videoId === "latest" || useLatestVideo) {
    videoData = await getLatestYouTubeVideo();
    if (videoData) {
      resolvedVideoId = videoData.id;
      // Użyj danych z YouTube tylko jeśli nie podano własnych
      if (videoId === "latest" && !title) {
        title = videoData.title;
      }
      if (videoId === "latest" && !description) {
        description = videoData.description || description;
      }
    }
  }
  return (
    <figure
      aria-labelledby="video-heading"
      itemScope
      itemType="https://schema.org/VideoObject"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* HEADER */}
        <div className="mb-8">
          <h2
            id="video-heading"
            className="text-2xl md:text-3xl font-serif font-bold mb-2"
          >
            {title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {description}
          </p>
        </div>

        {/* VIDEO CONTAINER */}
        <div className="relative w-full max-w-4xl mx-auto mb-8">
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <iframe
              src={`https://www.youtube.com/embed/${resolvedVideoId}?rel=0&modestbranding=1&showinfo=0`}
              title={title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              itemProp="embedUrl"
            />
          </div>
          <meta itemProp="name" content={title} />
          <meta itemProp="description" content={description} />
          <meta
            itemProp="thumbnailUrl"
            content={`https://img.youtube.com/vi/${resolvedVideoId}/maxresdefault.jpg`}
          />
        </div>
      </div>
    </figure>
  );
}
