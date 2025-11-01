"use client";

import React from "react";
import ComponentRenderer from "@/components/ui/ComponentRenderer";
import Popup from "@/components/ui/Popup";
import {
  PostComponent,
  AboutUs as AboutUsType,
  YouTubeChannel as YouTubeChannelType,
  SupportSection as SupportSectionType,
  CategoriesSection as CategoriesSectionType,
  InstagramSection as InstagramSectionType,
  Newsletter as NewsletterType,
} from "@/lib/component-types";
import { SanityImage } from "@/lib/sanity";

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
    ogImage?: SanityImage;
  };
  heroComponents?: PostComponent[];
  mainComponents?: PostComponent[];
  asideComponents?: PostComponent[];
  additionalComponents?: PostComponent[];
  pageSettings?: {
    showBreadcrumbs?: boolean;
    showLastUpdated?: boolean;
    enableComments?: boolean;
    showSocialShare?: boolean;
  };
}

interface HomePageClientProps {
  homepageData: HomepageData;
}

export default function HomePageClient({ homepageData }: HomePageClientProps) {
  // Użyj prostego state zamiast useAnimation - animacje od razu
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isInView, setIsInView] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Uruchom animacje od razu po zamontowaniu komponentu
  React.useEffect(() => {
    setIsInView(true);
    setIsLoaded(true);
  }, []);

  // Funkcja do renderowania komponentów aside
  const renderAsideComponent = (component: PostComponent, index: number) => {
    const { _type } = component;

    switch (_type) {
      case "aboutUs": {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _type, _key, ...data } = component as AboutUsType;
        return <AboutUs key={`aside-${index}`} data={data} />;
      }
      case "youtubeChannel": {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _type, _key, ...data } = component as YouTubeChannelType;
        return <YouTubeChannel key={`aside-${index}`} data={data} />;
      }
      case "supportSection": {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _type, _key, ...data } = component as SupportSectionType;
        return <SupportSection key={`aside-${index}`} data={data} />;
      }
      default:
        return null;
    }
  };

  // Funkcja do renderowania komponentów main
  const renderMainComponent = (component: PostComponent, index: number) => {
    const { _type } = component;

    switch (_type) {
      case "categoriesSection": {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _type, _key, ...data } = component as CategoriesSectionType;
        return <CategoriesSection key={`main-${index}`} data={data} />;
      }
      case "instagramSection": {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _type, _key, ...data } = component as InstagramSectionType;
        return <InstagramSection key={`main-${index}`} data={data} />;
      }
      case "newsletter": {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _type, _key, ...data } = component as NewsletterType;
        return <Newsletter key={`main-${index}`} data={data} />;
      }
      default:
        // Dla pozostałych komponentów używaj ComponentRenderer
        return (
          <ComponentRenderer
            key={`main-${index}`}
            component={component}
            animationProps={{
              isLoaded,
              isInView,
              containerRef: containerRef as React.RefObject<HTMLDivElement>,
            }}
          />
        );
    }
  };

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
