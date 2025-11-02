"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { usePathname } from "next/navigation";
import DesktopNav from "@/components/layout/header/DesktopNav";
import MobileMenu from "@/components/layout/header/MobileMenu";
import {
  getSectionsFromHeaderData,
  getMainMenuFromHeaderData,
  HierarchicalSection,
} from "@/components/layout/header/header-data";
import { HeaderData } from "@/lib/sanity";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Logo from "@/components/ui/Logo";

interface HeaderClientProps {
  headerData: HeaderData | null;
  hierarchicalCategories: HierarchicalSection[];
}

export default function HeaderClient({
  headerData,
  hierarchicalCategories,
}: HeaderClientProps) {
  const [openSections, setOpenSections] = useState({
    places: false,
    guides: false,
    culture: false,
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const pathname = usePathname();

  const toggleSection = useCallback((key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Reset menu state when pathname changes
  useEffect(() => {
    setMobileOpen(false);
    setMobileCategoriesOpen(false);
    setOpenSections({
      places: false,
      guides: false,
      culture: false,
    });
  }, [pathname]);

  // Użyj danych z Sanity lub placeholder - memoized
  const currentSections = useMemo(
    () => getSectionsFromHeaderData(headerData),
    [headerData]
  );
  const currentMainMenu = useMemo(
    () => getMainMenuFromHeaderData(headerData),
    [headerData]
  );

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800">
      <div className="relative mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Logo headerData={headerData} />
        <div className="flex items-center gap-4">
          <DesktopNav
            sections={currentSections}
            mainMenu={currentMainMenu}
            hierarchicalCategories={hierarchicalCategories}
            open={openSections}
            onToggle={(key) => toggleSection(key as keyof typeof openSections)}
          />
          <ThemeToggle />
        </div>
        <MobileMenu
          sections={currentSections}
          mainMenu={currentMainMenu}
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
}
