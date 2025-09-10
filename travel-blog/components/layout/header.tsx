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
import { getHeaderData, HeaderData } from "@/lib/sanity";
import { headerFallback } from "@/lib/header-fallback";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Logo from "@/components/ui/Logo";

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
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800">
        <div className="relative mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="hidden md:flex gap-6 items-center">
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800">
      <div className="relative mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Logo headerData={currentHeaderData} />
        <div className="flex items-center gap-4">
          <DesktopNav
            sections={currentSections}
            open={openSections}
            onToggle={(key) => toggleSection(key as keyof typeof openSections)}
          />
          <ThemeToggle />
        </div>
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
