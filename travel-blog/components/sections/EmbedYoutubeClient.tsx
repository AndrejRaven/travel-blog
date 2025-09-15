"use client";

import React, { useState, useEffect } from "react";
import { getLatestYouTubeVideoClient, type YouTubeVideo } from "@/lib/youtube";

interface EmbedYoutubeClientProps {
  title?: string;
  description?: string;
  videoId: string;
  useLatestVideo?: boolean;
}

export default function EmbedYoutubeClient({
  title = "Zobacz nasz najnowszy film",
  description = "Odkryj najpiękniejsze miejsca z naszych podróży w najnowszym filmie na YouTube.",
  videoId,
  useLatestVideo = false,
}: EmbedYoutubeClientProps) {
  const [resolvedVideoId, setResolvedVideoId] = useState(videoId);
  const [videoData, setVideoData] = useState<YouTubeVideo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestVideo = async () => {
      if (videoId === "latest" || useLatestVideo) {
        setIsLoading(true);
        setError(null);

        try {
          const latestVideo = await getLatestYouTubeVideoClient();
          if (latestVideo) {
            setVideoData(latestVideo);
            setResolvedVideoId(latestVideo.id);
          } else {
            setError("Nie udało się pobrać najnowszego filmu");
          }
        } catch (err) {
          setError("Błąd podczas pobierania filmu");
          console.error("Error fetching latest video:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchLatestVideo();
  }, [videoId, useLatestVideo]);

  const displayTitle = videoData?.title || title;
  const displayDescription = videoData?.description || description;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2">
            Ładowanie najnowszego filmu...
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Pobieramy najnowszy film z naszego kanału YouTube
          </p>
        </div>
        <div className="relative w-full max-w-4xl mx-auto mb-8">
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-gray-200 dark:bg-gray-700 animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2">
            {title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {description}
          </p>
          <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
        </div>
        <div className="relative w-full max-w-4xl mx-auto mb-8">
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-gray-200 dark:bg-gray-700">
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">
                Film niedostępny
              </p>
            </div>
          </div>
        </div>
      </div>
    );
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
            {displayTitle}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {displayDescription}
          </p>
        </div>

        {/* VIDEO CONTAINER */}
        <div className="relative w-full max-w-4xl mx-auto mb-8">
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <iframe
              src={`https://www.youtube.com/embed/${resolvedVideoId}?rel=0&modestbranding=1&showinfo=0`}
              title={displayTitle}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              itemProp="embedUrl"
            />
          </div>
          <meta itemProp="name" content={displayTitle} />
          <meta itemProp="description" content={displayDescription} />
          <meta
            itemProp="thumbnailUrl"
            content={`https://img.youtube.com/vi/${resolvedVideoId}/maxresdefault.jpg`}
          />
        </div>
      </div>
    </figure>
  );
}
