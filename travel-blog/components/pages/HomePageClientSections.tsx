"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { InstagramSectionData, NewsletterData } from "@/lib/component-types";

const LazyPopup = dynamic(() => import("@/components/ui/Popup"), {
  ssr: false,
});

const LazyInstagramSection = dynamic(
  () => import("@/components/sections/InstagramSection"),
  { ssr: false }
);

const LazyNewsletter = dynamic(
  () => import("@/components/sections/Newsletter"),
  { ssr: false }
);

const useDeferredRender = () => {
  const [shouldRender, setShouldRender] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (shouldRender) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldRender(true);
          }
        });
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldRender]);

  return { ref, shouldRender };
};

const PlaceholderCard = ({ label }: { label: string }) => (
  <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400 animate-pulse">
    {label}
  </div>
);

export function ClientPopup({
  scrollThreshold,
  cooldownMinutes,
}: {
  scrollThreshold: number;
  cooldownMinutes: number;
}) {
  const { ref, shouldRender } = useDeferredRender();

  return (
    <div ref={ref}>
      {shouldRender ? (
        <LazyPopup
          scrollThreshold={scrollThreshold}
          cooldownMinutes={cooldownMinutes}
        />
      ) : null}
    </div>
  );
}

export function ClientInstagramSection({ data }: { data: InstagramSectionData }) {
  const { ref, shouldRender } = useDeferredRender();

  return (
    <div ref={ref} className="min-h-[200px]">
      {shouldRender ? (
        <LazyInstagramSection data={data} />
      ) : (
        <PlaceholderCard label="Ładujemy Instagram..." />
      )}
    </div>
  );
}

export function ClientNewsletterSection({ data }: { data: NewsletterData }) {
  const { ref, shouldRender } = useDeferredRender();

  return (
    <div ref={ref} className="min-h-[200px]">
      {shouldRender ? (
        <LazyNewsletter data={data} />
      ) : (
        <PlaceholderCard label="Ładujemy newsletter..." />
      )}
    </div>
  );
}

