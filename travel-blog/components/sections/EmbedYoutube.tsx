"use client";

import React, { useState, useEffect } from "react";
import SectionHeader from "@/components/shared/SectionHeader";
import {
  resolveVideoId,
  getLatestYouTubeVideoClient,
  type YouTubeVideo,
} from "@/lib/youtube";
import SectionContainer from "@/components/shared/SectionContainer";

import { EmbedYoutubeData } from "@/lib/component-types";

export default function EmbedYoutube({
  title = "Zobacz nasz najnowszy film",
  description = "Odkryj najpiękniejsze miejsca z naszych podróży w najnowszym filmie na YouTube.",
  videoId,
  useLatestVideo = false,
  container,
}: EmbedYoutubeData) {
  // Wszystkie hooki muszą być przed wczesnymi returnami
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Rozwiąż videoId - jeśli to "latest" lub useLatestVideo jest true, pobierz najnowszy film
  const [resolvedVideoId, setResolvedVideoId] = useState(videoId);
  const [videoData, setVideoData] = useState<YouTubeVideo | null>(null);

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
        } catch (error) {
          console.error("❌ Error fetching latest video:", error);
          setError(
            `Błąd podczas pobierania filmu: ${
              error instanceof Error ? error.message : "Nieznany błąd"
            }`
          );
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (container) {
      fetchLatestVideo();
    }
  }, [videoId, useLatestVideo, container]);

  // Zabezpieczenie na wypadek gdyby container był undefined
  if (!container) {
    console.error("EmbedYoutube: Missing container data", { container });
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <SectionContainer
        config={container}
        role="complementary"
        aria-labelledby="video-heading"
        itemScope
        itemType="https://schema.org/VideoObject"
      >
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2">
            {title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Ładowanie najnowszego filmu z naszego kanału YouTube...
          </p>
        </div>
        <div className="relative w-full max-w-4xl mx-auto mb-8">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse">
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
      </SectionContainer>
    );
  }

  // Error state - fallback to default video
  if (error && (videoId === "latest" || useLatestVideo)) {
    return (
      <SectionContainer
        config={container}
        role="complementary"
        aria-labelledby="video-heading"
        itemScope
        itemType="https://schema.org/VideoObject"
      >
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2">
            {title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {description}
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
            ⚠️ {error} - wyświetlamy przykładowy film
          </p>
        </div>
        <div className="relative w-full max-w-4xl mx-auto mb-8">
          <div className="relative aspect-video rounded-2xl overflow-hidden transition-transform duration-300 hover:scale-105">
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&showinfo=0"
              title={title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              itemProp="embedUrl"
            />
          </div>
        </div>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer
      config={container}
      role="complementary"
      aria-labelledby="video-heading"
      itemScope
      itemType="https://schema.org/VideoObject"
    >
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
        <div className="relative aspect-video rounded-2xl overflow-hidden transition-transform duration-300 hover:scale-105">
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
    </SectionContainer>
  );
}
