"use client";

import { useState, useCallback, useEffect } from "react";
import ChevronIcon from "@/components/ui/icons/ChevronIcon";
import CircleIcon from "@/components/ui/icons/CircleIcon";
import ToggleChevron from "@/components/ui/ToggleChevron";
import DesktopNav from "@/components/layout/header/DesktopNav";
import MobileMenu from "@/components/layout/header/MobileMenu";
import {
  sections,
  getSectionsFromHeaderData,
} from "@/components/layout/header/header-data";
import { getHeaderData, HeaderData, getImageUrl } from "@/lib/sanity";
import { headerFallback } from "@/lib/header-fallback";

const Header = () => {
  const [openSections, setOpenSections] = useState({
    places: false,
    guides: false,
    culture: false,
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [headerData, setHeaderData] = useState<HeaderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pobierz dane header z Sanity
  useEffect(() => {
    const fetchHeader = async () => {
      try {
        const data = await getHeaderData();
        setHeaderData(data);
      } catch (error) {
        console.error("Error fetching header data:", error);
        setHeaderData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeader();
  }, []);

  const toggleSection = useCallback((key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Użyj danych z Sanity lub fallback
  const currentHeaderData = headerData || headerFallback;
  const currentSections = getSectionsFromHeaderData(headerData);
  // Loading state
  if (isLoading) {
    return (
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="relative mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="hidden md:flex gap-6">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="relative mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 group">
          {(() => {
            const logoUrl = getImageUrl(currentHeaderData.logo);
            return (
              <>
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt={currentHeaderData.title}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                )}
                <span className="text-lg font-semibold tracking-tight transition-colors duration-200 group-hover:text-gray-900">
                  {currentHeaderData.title}
                </span>
              </>
            );
          })()}
        </a>
        <DesktopNav
          sections={currentSections}
          open={openSections}
          onToggle={(key) => toggleSection(key as keyof typeof openSections)}
        />
        <MobileMenu
          sections={currentSections}
          mobileOpen={mobileOpen}
          mobileCategoriesOpen={mobileCategoriesOpen}
          onToggleMobile={() =>
            setMobileOpen((prev) => {
              const next = !prev;
              if (next) {
                setOpenSections({
                  places: false,
                  guides: false,
                  culture: false,
                });
                setMobileCategoriesOpen(false);
              }
              return next;
            })
          }
          onToggleMobileCategories={() => setMobileCategoriesOpen((v) => !v)}
          open={openSections}
          onToggleSection={(key) =>
            toggleSection(key as keyof typeof openSections)
          }
        />
      </div>
    </header>
  );
};

export default Header;
