import ComponentRenderer from "@/components/ui/ComponentRenderer";
import {
  PostComponent,
  AboutUs as AboutUsType,
  YouTubeChannel as YouTubeChannelType,
  SupportSection as SupportSectionType,
  CategoriesSection as CategoriesSectionType,
  InstagramSection as InstagramSectionType,
  Newsletter as NewsletterType,
} from "@/lib/component-types";
import { SanityImage, SiteConfig } from "@/lib/sanity";

// Import komponentów dla nowych typów
import AboutUs from "@/components/sections/AboutUs";
import YouTubeChannel from "@/components/sections/YouTubeChannel";
import SupportSection from "@/components/sections/SupportSection";
import CategoriesSection from "@/components/sections/CategoriesSection";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import {
  ClientPopup,
  ClientInstagramSection,
  ClientNewsletterSection,
} from "@/components/pages/HomePageClientSections";

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

interface HomePageContentProps {
  homepageData: HomepageData;
  siteConfig?: SiteConfig | null;
}

const DEFAULT_ANIMATION_STATE = {
  isLoaded: true,
  isInView: true,
  containerRef: undefined,
} as const;

export default function HomePageContent({
  homepageData,
  siteConfig,
}: HomePageContentProps) {
  const mainComponents = Array.isArray(homepageData.mainComponents)
    ? homepageData.mainComponents
    : [];
  const asideComponents = Array.isArray(homepageData.asideComponents)
    ? homepageData.asideComponents
    : [];
  const additionalComponents = Array.isArray(
    homepageData.additionalComponents
  )
    ? homepageData.additionalComponents
    : [];

  const popupConfig = siteConfig?.popup;
  const hasMainComponents = mainComponents.length > 0;
  const hasAsideComponents = asideComponents.length > 0;

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
        const { _key, ...data } = component as InstagramSectionType & {
          _key?: string;
        };
        return (
          <ClientInstagramSection
            key={_key || `main-${index}`}
            data={data}
          />
        );
      }
      case "newsletter": {
        const { _key, ...data } = component as NewsletterType & {
          _key?: string;
        };
        return (
          <ClientNewsletterSection key={_key || `main-${index}`} data={data} />
        );
      }
      default:
        // Dla pozostałych komponentów używaj ComponentRenderer
        return (
          <ComponentRenderer
            key={`main-${index}`}
            component={component}
            animationProps={{
              ...DEFAULT_ANIMATION_STATE,
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900">
      {homepageData.pageSettings?.showBreadcrumbs && (
        <div className="mx-auto max-w-7xl px-6 pt-6">
          <Breadcrumbs
            items={[
              { label: "Strona główna", href: "/" },
              {
                label:
                  homepageData.seo?.seoTitle || "Najnowsze artykuły i inspiracje",
              },
            ]}
          />
        </div>
      )}
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
        id="main-content"
        data-main-content
        className="mx-auto max-w-7xl px-6 py-4"
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* MAIN CONTENT - 75% */}
          <div className="lg:col-span-3">
            {hasMainComponents ? (
              mainComponents.map((component, index) =>
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
            {hasAsideComponents ? (
              asideComponents.map((component, index) =>
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
      {additionalComponents.length > 0 && (
        <div className="additional-components">
          {additionalComponents.map((component, index) => (
            <ComponentRenderer
              key={`additional-${index}`}
              component={component}
            />
          ))}
        </div>
      )}

      {/* POPUP - zarządzany z Sanity */}
      <ClientPopup popupConfig={popupConfig} />
    </div>
  );
}
