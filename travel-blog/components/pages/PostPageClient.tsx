"use client";

import React, { useState } from "react";
import TableOfContents from "@/components/ui/TableOfContents";
import CategoryBadge from "@/components/ui/CategoryBadge";
import CommentsSection from "@/components/ui/CommentsSection";
import ShareButtons from "@/components/ui/ShareButtons";
import ResponsiveImage from "@/components/shared/ResponsiveImage";
import { Post } from "@/lib/sanity";
import type { ReactNode } from "react";
import { useAnimation, ANIMATION_PRESETS } from "@/lib/useAnimation";
import { useComments } from "@/lib/useComments";
import { getPostUrl } from "@/lib/utils";

interface PostPageClientProps {
  post: Post;
  tableOfContentsItems: Array<{
    id: string;
    title: string;
    level: number;
  }>;
  postUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  renderedComponents?: ReactNode;
}

export default function PostPageClient({
  post,
  tableOfContentsItems,
  postUrl,
  ogTitle,
  ogDescription,
  ogImageUrl,
  renderedComponents,
}: PostPageClientProps) {
  const [isTocOpen, setIsTocOpen] = useState(false);

  // Hooki animacji dla różnych sekcji
  const imageAnimation = useAnimation();
  const titleAnimation = useAnimation();
  const metaAnimation = useAnimation();

  // Hook do zarządzania komentarzami
  const { comments, addComment, replyToComment } = useComments(post._id);

  const formattedDate = post.publishedAt
    ? new Intl.DateTimeFormat("pl-PL", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      }).format(new Date(post.publishedAt))
    : null;

  const resolvePostUrl = () =>
    postUrl ||
    (typeof window !== "undefined"
      ? `${window.location.origin}${getPostUrl(post)}`
      : getPostUrl(post));

  return (
    <main
      className={`relative transition-all duration-300 ${
        isTocOpen ? "lg:ml-80" : ""
      }`}
    >
      {/* Spis treści - tylko jeśli są sekcje z tytułami */}
      {tableOfContentsItems.length > 0 && (
        <TableOfContents
          items={tableOfContentsItems}
          onToggle={setIsTocOpen}
          className=""
        />
      )}

      {/* Obrazek na górze - tylko jeśli nie ma komponentów lub pierwszy komponent nie jest banerem */}
      {(!post.components ||
        post.components.length === 0 ||
        (post.components[0]?._type !== "heroBanner" &&
          post.components[0]?._type !== "backgroundHeroBanner")) &&
        (post.coverImage || post.coverMobileImage) && (
          <div
            ref={imageAnimation.containerRef}
            className={`relative w-full overflow-hidden ${ANIMATION_PRESETS.sectionHeader(
              imageAnimation.isLoaded && imageAnimation.isInView
            )}`}
          >
            <div className="relative w-full h-[35vh] md:aspect-[4/1] md:h-auto">
              <ResponsiveImage
                desktopImage={post.coverImage}
                mobileImage={post.coverMobileImage}
                fallback={{
                  src: "/demo-images/demo-asset.png",
                  alt: post.title,
                }}
                fill
                priority
                sizes="100vw"
                className="w-full h-full object-cover md:object-contain"
                onLoad={() => imageAnimation.setIsLoaded(true)}
              />
            </div>
          </div>
        )}

      {/* Meta - tylko jeśli nie ma komponentów lub pierwszy komponent nie jest banerem */}
      {(!post.components ||
        post.components.length === 0 ||
        (post.components[0]?._type !== "heroBanner" &&
          post.components[0]?._type !== "backgroundHeroBanner")) && (
        <div
          ref={titleAnimation.containerRef}
          className={`mx-auto max-w-3xl px-6 py-10 text-center ${ANIMATION_PRESETS.sectionHeader(
            titleAnimation.isLoaded && titleAnimation.isInView
          )}`}
        >
          {/* Tytuł */}
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-6 text-gray-900 dark:text-gray-100">
            {post.title}
          </h1>
          {/* Podtytuł */}
          {post?.subtitle && (
            <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight mb-6 text-gray-600 dark:text-gray-300">
              {post.subtitle}
            </h2>
          )}

          <div
            ref={metaAnimation.containerRef}
            className={`mb-4 flex flex-col items-center gap-3 text-sm font-sans text-gray-600 dark:text-gray-400 ${ANIMATION_PRESETS.text(
              metaAnimation.isLoaded && metaAnimation.isInView,
              "medium"
            )}`}
          >
            {/* Data i kategorie w jednym rzędzie na desktop, kolumnie na mobile */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              {formattedDate && (
                <time dateTime={post.publishedAt} className="text-center">
                  {formattedDate}
                </time>
              )}

              {/* Divider między datą a kategoriami */}
              {formattedDate &&
                post.categories &&
                post.categories.length > 0 && (
                  <div className="hidden sm:block w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                )}

              {/* Kategorie - ograniczone do 3 na mobile, więcej na desktop */}
              {post.categories && post.categories.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                  {/* Na mobile pokazujemy tylko 3, na desktop wszystkie */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 sm:hidden">
                    {post.categories.slice(0, 3).map((category) => (
                      <CategoryBadge key={category._id} category={category} />
                    ))}
                    {post.categories.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{post.categories.length - 3} więcej
                      </span>
                    )}
                  </div>
                  {/* Na desktop pokazujemy wszystkie */}
                  <div className="hidden sm:flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                    {post.categories.map((category) => (
                      <CategoryBadge key={category._id} category={category} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Małe przyciski udostępniania na górze */}
      <div className="mx-auto max-w-3xl px-6 pb-6 flex justify-center">
        <ShareButtons
          postTitle={post.title}
          postUrl={resolvePostUrl()}
          postDescription={post.subtitle}
          ogTitle={ogTitle}
          ogDescription={ogDescription}
          ogImageUrl={ogImageUrl}
          size="compact"
          align="center"
        />
      </div>
      {/* Komponenty */}
      {renderedComponents ? (
        <div className="relative">{renderedComponents}</div>
      ) : (
        <div className="mx-auto max-w-3xl px-6 py-10">
          <p className="text-gray-600 dark:text-gray-400 font-sans">
            Brak treści.
          </p>
        </div>
      )}

      {/* Sekcja komentarzy - tylko jeśli komentarze są włączone */}
      <CommentsSection
        postId={post._id}
        comments={comments}
        onAddComment={addComment}
        onReply={replyToComment}
        isModerated={post.comments?.moderation?.requireApproval !== false}
        allowReplies={post.comments?.moderation?.allowReplies !== false}
        maxLength={post.comments?.moderation?.maxLength || 1000}
      />

      {/* Sekcja udostępniania */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-2">
              Udostępnij ten artykuł
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Pomóż innym odkryć ten ciekawy artykuł
            </p>
          </div>

          <ShareButtons
            postTitle={post.title}
            postUrl={resolvePostUrl()}
            postDescription={post.subtitle}
            ogTitle={ogTitle}
            ogDescription={ogDescription}
            ogImageUrl={ogImageUrl}
          />
        </div>
      </section>
    </main>
  );
}
