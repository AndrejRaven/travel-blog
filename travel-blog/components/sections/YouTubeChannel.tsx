"use client";

import React, { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/Button";

interface YouTubeChannelProps {
  title?: string;
  channelName?: string;
  channelDescription?: string;
  channelHref?: string;
  buttonText?: string;
  buttonVariant?: "primary" | "secondary" | "outline" | "youtube";
}

export default function YouTubeChannel({
  title = "Nasz kanał YouTube",
  channelName = "Nasz Blog",
  channelDescription = "Podróżnicze filmy",
  channelHref = "https://www.youtube.com/channel/UCUUm2vkbs-W7KulrJZIpNDA",
  buttonText = "Przejdź na kanał",
  buttonVariant = "youtube",
}: YouTubeChannelProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer - animacja uruchamia się gdy komponent wchodzi w viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            setTimeout(() => {
              setIsLoaded(true);
            }, 200);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800"
    >
      <h3
        className={`text-lg font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-all duration-1000 ease-out ${
          isLoaded && isInView
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        {title}
      </h3>

      <div className="space-y-4">
        <div
          className={`flex items-center space-x-3 transition-all duration-1000 ease-out delay-200 ${
            isLoaded && isInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110">
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <div>
            <p className="font-sans font-medium text-gray-900 dark:text-gray-100 text-sm">
              {channelName}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {channelDescription}
            </p>
          </div>
        </div>

        <p
          className={`text-xs text-gray-600 dark:text-gray-300 transition-all duration-1000 ease-out delay-300 ${
            isLoaded && isInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          Obejrzyj nasze najnowsze filmy z podróży i dowiedz się więcej o
          miejscach, które odwiedzamy.
        </p>

        <div
          className={`transition-all duration-1000 ease-out delay-400 ${
            isLoaded && isInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <Button
            href={channelHref}
            variant={buttonVariant}
            external
            className="w-full text-xs px-3 py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </section>
  );
}
