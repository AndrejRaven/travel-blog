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

export default function TestHomepage() {
  const [homepageData, setHomepageData] = React.useState<HomepageData | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isInView, setIsInView] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Debug: logowanie stanów animacji
  React.useEffect(() => {
    console.log("🎬 Animation states:", { isLoaded, isInView });
  }, [isLoaded, isInView]);

  // Pobieranie danych homepage z Sanity
  React.useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        console.log("🔄 Fetching homepage data from Sanity...");
        const data = await getHomepageData();
        console.log("✅ Homepage data fetched:", data);
        setHomepageData(data);

        // Ustaw animacje na true po załadowaniu danych
        setTimeout(() => {
          console.log("🎬 Setting animation states to true");
          setIsInView(true);
          setIsLoaded(true);
        }, 100);
      } catch (err) {
        console.error("❌ Error fetching homepage data:", err);
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
        return (
          <AboutUs
            key={`aside-${index}`}
            title={props.title}
            image={props.image?.asset?.url}
            imageAlt={props.imageAlt}
            description={props.description}
            contactHref={props.contactHref}
            contactText={props.contactText}
          />
        );
      case "youtubeChannel":
        return (
          <YouTubeChannel
            key={`aside-${index}`}
            title={props.title}
            channelName={props.channelName}
            channelDescription={props.channelDescription}
            channelHref={props.channelHref}
            buttonText={props.buttonText}
            buttonVariant={props.buttonVariant}
          />
        );
      case "supportSection":
        return (
          <SupportSection
            key={`aside-${index}`}
            title={props.title}
            description={props.description}
            supportOptions={props.supportOptions}
            thankYouMessage={props.thankYouMessage}
          />
        );
      default:
        console.warn(`Unknown aside component type: ${_type}`);
        return null;
    }
  };

  // Funkcja do renderowania komponentów main
  const renderMainComponent = (component: any, index: number) => {
    const { _type, ...props } = component;

    switch (_type) {
      case "categoriesSection":
        return (
          <CategoriesSection
            key={`main-${index}`}
            categories={props.categories}
            title={props.title}
            showBackground={props.showBackground}
          />
        );
      case "instagramSection":
        return (
          <InstagramSection
            key={`main-${index}`}
            // Przekaż dane z Sanity do komponentu
            // InstagramSection będzie musiał być zaktualizowany, żeby przyjmować props
          />
        );
      case "newsletter":
        return (
          <Newsletter
            key={`main-${index}`}
            // Przekaż dane z Sanity do komponentu
            // Newsletter będzie musiał być zaktualizowany, żeby przyjmować props
          />
        );
      default:
        // Dla pozostałych komponentów używaj ComponentRenderer
        return (
          <ComponentRenderer key={`main-${index}`} component={component} />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Ładowanie danych z Sanity...
          </p>
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
      {/* DEBUG INFO */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 border-b border-blue-200 dark:border-blue-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            🧪 Test Homepage - Dane z Sanity
          </h2>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <p>Hero Components: {homepageData.heroComponents?.length || 0}</p>
            <p>Main Components: {homepageData.mainComponents?.length || 0}</p>
            <p>Aside Components: {homepageData.asideComponents?.length || 0}</p>
            <p>
              Additional Components:{" "}
              {homepageData.additionalComponents?.length || 0}
            </p>
            <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
              <p className="font-semibold">Animation States:</p>
              <p>isLoaded: {isLoaded ? "✅ true" : "❌ false"}</p>
              <p>isInView: {isInView ? "✅ true" : "❌ false"}</p>
              <p>Opacity: {isLoaded && isInView ? "1" : "0.3"}</p>
            </div>
          </div>
        </div>
      </div>

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
        className="mx-auto max-w-7xl px-6 py-4 transition-all duration-1000 ease-out translate-y-0"
        style={{
          opacity: isLoaded && isInView ? 1 : 0.3,
        }}
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

      {/* POPUP DEMO */}
      <Popup scrollThreshold={60} cooldownMinutes={60} />
    </div>
  );
}
