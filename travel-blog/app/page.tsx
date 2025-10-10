"use client";

import React from "react";
import { getHomepageData } from "@/lib/queries/functions";
import ComponentRenderer from "@/components/ui/ComponentRenderer";
import Popup from "@/components/ui/Popup";
import { useAnimation } from "@/lib/useAnimation";

// Import komponentów dla nowych typów
import AboutUs from "@/components/sections/AboutUs";
import YouTubeChannel from "@/components/sections/YouTubeChannel";
import SupportSection from "@/components/sections/SupportSection";
import CategoriesSection from "@/components/sections/CategoriesSection";
import InstagramSection from "@/components/sections/InstagramSection";
import Newsletter from "@/components/sections/Newsletter";

interface HomepageData {
  _id: string;
  seo?: {
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    canonicalUrl?: string;
    noIndex?: boolean;
    noFollow?: boolean;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: {
      asset: {
        _id: string;
        url: string;
        metadata: {
          dimensions: {
            width: number;
            height: number;
          };
        };
      };
      hotspot?: any;
      crop?: any;
    };
  };
  heroComponents?: any[];
  mainComponents?: any[];
  asideComponents?: any[];
  additionalComponents?: any[];
  pageSettings?: {
    showBreadcrumbs?: boolean;
    showLastUpdated?: boolean;
    enableComments?: boolean;
    showSocialShare?: boolean;
  };
}

export default function Home() {
  const [homepageData, setHomepageData] = React.useState<HomepageData | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Użyj ujednoliconego hook useAnimation
  const { isLoaded, isInView, containerRef } = useAnimation();

  // Pobieranie danych homepage z Sanity
  React.useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        const data = await getHomepageData();
        setHomepageData(data);
      } catch (err) {
        setError("Błąd podczas pobierania danych strony głównej");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

  // Funkcja do renderowania komponentów aside
  const renderAsideComponent = (component: any, index: number) => {
    const { _type, ...props } = component;

    switch (_type) {
      case "aboutUs":
        return <AboutUs key={`aside-${index}`} data={props} />;
      case "youtubeChannel":
        return <YouTubeChannel key={`aside-${index}`} data={props} />;
      case "supportSection":
        return <SupportSection key={`aside-${index}`} data={props} />;
      default:
        return null;
    }
  };

  // Funkcja do renderowania komponentów main
  const renderMainComponent = (component: any, index: number) => {
    const { _type, ...props } = component;

    switch (_type) {
      case "categoriesSection":
        return <CategoriesSection key={`main-${index}`} data={props} />;
      case "instagramSection":
        return <InstagramSection key={`main-${index}`} data={props} />;
      case "newsletter":
        return <Newsletter key={`main-${index}`} data={props} />;
      default:
        // Dla pozostałych komponentów używaj ComponentRenderer
        return (
          <ComponentRenderer key={`main-${index}`} component={component} />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/50 mx-auto mb-4"></div>
          <p className="text-white">Ładowanie</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Błąd
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!homepageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Brak danych
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Nie znaleziono danych strony głównej w Sanity
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900">
      {/* HERO COMPONENTS */}
      {homepageData.heroComponents &&
        homepageData.heroComponents.length > 0 && (
          <div className="hero-section">
            {homepageData.heroComponents.map((component, index) => (
              <ComponentRenderer key={`hero-${index}`} component={component} />
            ))}
          </div>
        )}

      {/* MAIN CONTENT WITH ASIDE */}
      <div
        ref={containerRef}
        data-main-content
        className="mx-auto max-w-7xl px-6 py-4"
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* MAIN CONTENT - 75% */}
          <div className="lg:col-span-3">
            {homepageData.mainComponents &&
            homepageData.mainComponents.length > 0 ? (
              homepageData.mainComponents.map((component, index) =>
                renderMainComponent(component, index)
              )
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>Brak komponentów głównych w Sanity</p>
              </div>
            )}
          </div>

          {/* ASIDE - 25% */}
          <aside className="lg:col-span-1 space-y-6">
            {homepageData.asideComponents &&
            homepageData.asideComponents.length > 0 ? (
              homepageData.asideComponents.map((component, index) =>
                renderAsideComponent(component, index)
              )
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>Brak komponentów bocznych w Sanity</p>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ADDITIONAL COMPONENTS */}
      {homepageData.additionalComponents &&
        homepageData.additionalComponents.length > 0 && (
          <div className="additional-components">
            {homepageData.additionalComponents.map((component, index) => (
              <ComponentRenderer
                key={`additional-${index}`}
                component={component}
              />
            ))}
          </div>
        )}

      {/* POPUP DEMO - pojawia się po przewinięciu 60% strony, cooldown 60 minut */}
      <Popup scrollThreshold={60} cooldownMinutes={60} />
    </div>
  );
}
