"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { InstagramSectionData, NewsletterData } from "@/lib/component-types";
import type { SiteConfig } from "@/lib/sanity";

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

const scheduleIdle = (callback: () => void, timeout = 200): number => {
  if (typeof window === "undefined") {
    return 0;
  }

  const idleWindow = window as Window &
    typeof globalThis & {
      requestIdleCallback?: (
        cb: IdleRequestCallback,
        options?: IdleRequestOptions
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

  if (idleWindow.requestIdleCallback) {
    return idleWindow.requestIdleCallback(() => callback(), {
      timeout,
    });
  }

  return window.setTimeout(callback, timeout);
};

const cancelIdle = (handle: number) => {
  if (!handle || typeof window === "undefined") {
    return;
  }

  const idleWindow = window as Window &
    typeof globalThis & {
      cancelIdleCallback?: (handle: number) => void;
    };

  if (idleWindow.cancelIdleCallback) {
    idleWindow.cancelIdleCallback(handle);
  } else {
    clearTimeout(handle);
  }
};

type DeferredRenderStrategy = "scroll" | "idle";

type DeferredRenderOptions = {
  strategy?: DeferredRenderStrategy;
  idleTimeout?: number;
  rootMargin?: string;
};

const useDeferredRender = (options: DeferredRenderOptions = {}) => {
  const {
    strategy = "scroll",
    idleTimeout = 2000,
    rootMargin = "200px",
  } = options;
  const [shouldRender, setShouldRender] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (shouldRender) return;

    const startIdleRender = () => {
      const handle = scheduleIdle(() => setShouldRender(true), idleTimeout);
      return () => cancelIdle(handle);
    };

    let cleanupIdle: (() => void) | undefined;

    if (strategy === "idle") {
      cleanupIdle = startIdleRender();
      return () => {
        cleanupIdle?.();
      };
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !cleanupIdle) {
            cleanupIdle = startIdleRender();
            observer.disconnect();
          }
        });
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cleanupIdle?.();
    };
  }, [shouldRender, strategy, idleTimeout, rootMargin]);

  return { ref, shouldRender };
};

const PlaceholderCard = ({ label }: { label: string }) => (
  <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400 animate-pulse">
    {label}
  </div>
);

export function ClientPopup({
  popupConfig,
}: {
  popupConfig?: SiteConfig["popup"];
}) {
  const { ref, shouldRender } = useDeferredRender({
    strategy: "idle",
    idleTimeout: 2500,
  });
  const isEnabled = popupConfig?.enabled !== false;
  const hasContent = Boolean(popupConfig?.title || popupConfig?.description);
  if (!popupConfig || !isEnabled || !hasContent) {
    return null;
  }


  return (
    <div ref={ref}>
      {shouldRender ? <LazyPopup popupData={popupConfig} /> : null}
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
  const { ref, shouldRender } = useDeferredRender({
    strategy: "idle",
    idleTimeout: 1800,
  });

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

