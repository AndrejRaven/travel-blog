import React from "react";
import SectionHeader from "@/components/shared/SectionHeader";

interface EmbedYoutubeProps {
  title?: string;
  description?: string;
  videoId: string;
}

export default function EmbedYoutube({
  title = "Zobacz nasz najnowszy film",
  description = "Odkryj najpiękniejsze miejsca z naszych podróży w najnowszym filmie na YouTube.",
  videoId,
}: EmbedYoutubeProps) {
  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6">
        {/* HEADER */}
        <SectionHeader
          title={title}
          description={description}
          className="mb-8"
        />

        {/* VIDEO CONTAINER */}
        <div className="relative w-full max-w-4xl mx-auto mb-8">
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`}
              title={title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
