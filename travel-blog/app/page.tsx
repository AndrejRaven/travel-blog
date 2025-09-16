"use client";

import React, { useState, useEffect, useRef } from "react";
import BackgroundHeroBanner from "@/components/sections/BackgroundHeroBanner";
import InstagramSection from "@/components/sections/InstagramSection";
import EmbedYoutube from "@/components/sections/EmbedYoutube";
import Newsletter from "@/components/sections/Newsletter";
import LatestArticles from "@/components/sections/LatestArticles";
import CategoriesSection from "@/components/sections/CategoriesSection";
import AboutUs from "@/components/sections/AboutUs";
import YouTubeChannel from "@/components/sections/YouTubeChannel";
import SupportSection from "@/components/sections/SupportSection";
import Popup from "@/components/ui/Popup";
import { backgroundHeroTestData } from "@/lib/hero-test-data";

export default function Home() {
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
        threshold: 0.05,
        rootMargin: "0px 0px -100px 0px",
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
    <div
      ref={containerRef}
      className="min-h-screen font-sans text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
    >
      <BackgroundHeroBanner data={backgroundHeroTestData} />

      {/* MAIN CONTENT WITH ASIDE */}
      <div
        data-main-content
        className={`mx-auto max-w-7xl px-6 py-12 md:py-16 transition-all duration-1000 ease-out ${
          isLoaded && isInView
            ? "opacity-100 translate-y-0"
            : "opacity-30 translate-y-4"
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* MAIN CONTENT - 75% */}
          <div className="lg:col-span-3 space-y-12">
            {/* LATEST ARTICLES */}
            <LatestArticles />

            {/* CATEGORIES */}
            <CategoriesSection />

            {/* INSTAGRAM SECTION */}
            <InstagramSection />

            {/* YOUTUBE SECTION */}
            <EmbedYoutube
              videoId="latest"
              title="Zobacz nasz najnowszy film"
              description="Odkryj najpiękniejsze miejsca z naszych podróży w najnowszym filmie na YouTube! 🎬 Zasubskrybuj nasz kanał i kliknij dzwoneczek 🔔, aby nie przegapić żadnej przygody!"
            />

            {/* NEWSLETTER SECTION */}
            <Newsletter />
          </div>

          {/* ASIDE - 25% */}
          <aside className="lg:col-span-1 space-y-6">
            {/* ABOUT US */}
            <AboutUs />

            {/* YOUTUBE CHANNEL */}
            <YouTubeChannel />

            {/* SUPPORT SECTION */}
            <SupportSection />
          </aside>
        </div>
      </div>

      {/* FOOTER przeniesiony globalnie do layoutu */}

      {/* POPUP DEMO - pojawia się po przewinięciu 60% strony, cooldown 60 minut */}
      <Popup scrollThreshold={60} cooldownMinutes={60} />
    </div>
  );
}
