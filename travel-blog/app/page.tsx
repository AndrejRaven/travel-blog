"use client";

import React from "react";
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
import { useAnimation } from "@/lib/useAnimation";
import { getArticlesComponentData } from "@/lib/queries/functions";
import { ArticlesData } from "@/lib/component-types";

export default function Home() {
  const { isLoaded, isInView, containerRef } = useAnimation();
  const [articlesData, setArticlesData] = React.useState<ArticlesData | null>(
    null
  );
  const [isLoadingArticles, setIsLoadingArticles] = React.useState(true);

  // Pobieranie danych komponentu articles z Sanity
  React.useEffect(() => {
    const fetchArticlesData = async () => {
      try {
        const data = await getArticlesComponentData();
        setArticlesData(data);
        console.log("🏠 Home - Articles data fetched:", data);
      } catch (error) {
        console.error("❌ Error fetching articles data:", error);
        // Fallback do domyślnych danych
        setArticlesData({
          container: {
            maxWidth: "6xl",
            padding: "lg",
            margin: { top: "lg", bottom: "lg" },
            backgroundColor: "transparent",
            borderRadius: "none",
            shadow: "none",
            height: "auto",
            contentTitle: "Najnowsze artykuły",
          },
          title: "Najnowsze artykuły",
          showViewAll: true,
          viewAllHref: "/post",
          articlesType: "latest",
          selectedArticles: [],
          maxArticles: 3,
        });
      } finally {
        setIsLoadingArticles(false);
      }
    };

    fetchArticlesData();
  }, []);

  return (
    <div className="min-h-screen font-sans text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900">
      <BackgroundHeroBanner data={backgroundHeroTestData} />
      {/* MAIN CONTENT WITH ASIDE */}
      <div
        ref={containerRef}
        data-main-content
        className="mx-auto max-w-7xl px-6 py-4 transition-all duration-1000 ease-out translate-y-0"
        style={{
          opacity: isLoaded && isInView ? 1 : 0.3,
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* MAIN CONTENT - 75% */}
          <div className="lg:col-span-3">
            {/* LATEST ARTICLES */}
            {isLoadingArticles ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-300 dark:bg-gray-700 rounded-xl h-64"
                    ></div>
                  ))}
                </div>
              </div>
            ) : articlesData ? (
              <LatestArticles data={articlesData} />
            ) : null}

            {/* CATEGORIES */}
            <CategoriesSection />

            {/* INSTAGRAM SECTION */}
            <InstagramSection />

            {/* YOUTUBE SECTION */}
            <EmbedYoutube
              container={{
                maxWidth: "6xl",
                padding: "lg",
                margin: {
                  top: "lg",
                  bottom: "lg",
                },
                backgroundColor: "transparent",
                borderRadius: "none",
                shadow: "none",
                height: "auto",
              }}
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
