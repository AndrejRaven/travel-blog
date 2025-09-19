"use client";

import React, { useState, useEffect } from "react";
import SectionHeader from "@/components/shared/SectionHeader";
import {
  resolveVideoId,
  getLatestYouTubeVideoClient,
  type YouTubeVideo,
} from "@/lib/youtube";
import { useAnimation } from "@/lib/useAnimation";
import { ANIMATION_PRESETS } from "@/lib/animations";
import AnimatedSection from "@/components/shared/AnimatedSection";

interface EmbedYoutubeProps {
  title?: string;
  description?: string;
  videoId: string;
  useLatestVideo?: boolean;
}

export default function EmbedYoutube({
  title = "Zobacz nasz najnowszy film",
  description = "Odkryj najpiękniejsze miejsca z naszych podróży w najnowszym filmie na YouTube.",
  videoId,
  useLatestVideo = false,
}: EmbedYoutubeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, isInView, containerRef } = useAnimation();
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

    fetchLatestVideo();
  }, [videoId, useLatestVideo]);
  // Loading state
  if (isLoading) {
    return (
      <AnimatedSection
        ref={containerRef}
        aria-labelledby="video-heading"
        itemScope
        itemType="https://schema.org/VideoObject"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2">
              {title}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Ładowanie najnowszego filmu z naszego kanału YouTube...
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
      </AnimatedSection>
    );
  }

  // Error state - fallback to default video
  if (error && (videoId === "latest" || useLatestVideo)) {
    return (
      <AnimatedSection
        ref={containerRef}
        aria-labelledby="video-heading"
        itemScope
        itemType="https://schema.org/VideoObject"
      >
        <div className="mx-auto max-w-7xl px-6">
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
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105">
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
        </div>
      </AnimatedSection>
    );
  }

  return (
    <AnimatedSection
      ref={containerRef}
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
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105">
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
    </AnimatedSection>
  );
}
