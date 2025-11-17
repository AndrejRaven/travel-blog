"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Props {
  videoId: string;
  title: string;
}

export default function YouTubeLitePlayer({ videoId, title }: Props) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!videoId) {
      return;
    }
    console.info("[YouTubeLitePlayer] Ready", { videoId, title });
  }, [videoId, title]);

  if (!videoId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[YouTubeLitePlayer] Missing videoId, player will not render");
    }
    return null;
  }

  const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  const handleActivate = () => {
    console.info("[YouTubeLitePlayer] Play button clicked", { videoId });
    setIsActive(true);
  };

  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
      {isActive ? (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0`}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() =>
            console.info("[YouTubeLitePlayer] iFrame loaded successfully", {
              videoId,
            })
          }
          onError={(event) =>
            console.error("[YouTubeLitePlayer] iFrame failed to load", {
              videoId,
              error: event,
            })
          }
        />
      ) : (
        <button
          type="button"
          onClick={handleActivate}
          className="absolute inset-0 w-full h-full"
          aria-label={`Odtwórz wideo ${title}`}
        >
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
            loading="lazy"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/15 text-white">
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              aria-hidden="true"
              className="drop-shadow-lg"
            >
              <circle cx="32" cy="32" r="32" fill="rgba(0,0,0,0.25)" />
              <path
                d="M26 21.5L46 32L26 42.5V21.5Z"
                fill="white"
              />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
