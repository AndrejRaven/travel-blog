import SectionContainer from "@/components/shared/SectionContainer";
import YouTubeLitePlayer from "@/components/ui/YouTubeLitePlayer";
import { EmbedYoutubeData } from "@/lib/component-types";

export default function EmbedYoutube({
  title = "Zobacz nasz najnowszy film",
  description = "Odkryj najpiękniejsze miejsca z naszych podróży w najnowszym filmie na YouTube.",
  videoId,
  container,
  publishedAt,
}: EmbedYoutubeData) {
  if (!container) {
    console.error("EmbedYoutube: Missing container data", { container });
    return null;
  }

  const resolvedVideoId = videoId && videoId !== "latest" ? videoId : null;

  return (
    <SectionContainer
      config={container}
      role="complementary"
      aria-labelledby="video-heading"
      itemScope
      itemType="https://schema.org/VideoObject"
    >
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

      <div className="relative w-full max-w-4xl mx-auto mb-8">
        {resolvedVideoId ? (
          <YouTubeLitePlayer videoId={resolvedVideoId} title={title} />
        ) : (
          <div className="aspect-video rounded-2xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Nie udało się załadować filmu
          </div>
        )}
        <meta itemProp="name" content={title} />
        <meta itemProp="description" content={description} />
        {resolvedVideoId && (
          <meta
            itemProp="thumbnailUrl"
            content={`https://img.youtube.com/vi/${resolvedVideoId}/maxresdefault.jpg`}
          />
        )}
        {publishedAt && <meta itemProp="uploadDate" content={publishedAt} />}
      </div>
    </SectionContainer>
  );
}
