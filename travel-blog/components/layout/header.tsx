"use client";

import { useState, useCallback, useEffect, useMemo, memo } from "react";
import ChevronIcon from "@/components/ui/icons/ChevronIcon";
import CircleIcon from "@/components/ui/icons/CircleIcon";
import ToggleChevron from "@/components/ui/ToggleChevron";
import DesktopNav from "@/components/layout/header/DesktopNav";
import MobileMenu from "@/components/layout/header/MobileMenu";
import {
  sections,
  getSectionsFromHeaderData,
  getMainMenuFromHeaderData,
} from "@/components/layout/header/header-data";
import { HeaderData } from "@/lib/sanity";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Logo from "@/components/ui/Logo";
import { getCachedHeaderData, fetchHeaderData } from "@/lib/header-cache";

const Header = memo(function Header() {
  const [openSections, setOpenSections] = useState({
    places: false,
    guides: false,
    culture: false,
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [headerData, setHeaderData] = useState<HeaderData | null>(
    getCachedHeaderData()
  );

  // Pobierz dane header z cache
  useEffect(() => {
    // Jeśli mamy już dane w cache, ustaw je
    const cachedData = getCachedHeaderData();
    if (cachedData) {
      setHeaderData(cachedData);
      return;
    }

    // Pobierz dane w tle
    fetchHeaderData().then((data) => {
      setHeaderData(data);
    });
  }, []); // Pusta dependency array - uruchamia się tylko raz

  const toggleSection = useCallback((key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Użyj danych z Sanity lub placeholder - memoized
  const currentHeaderData = useMemo(() => headerData, [headerData]);
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
        <Logo headerData={currentHeaderData} />
        <div className="flex items-center gap-4">
          <DesktopNav
            sections={currentSections}
            mainMenu={currentMainMenu}
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
});

export default Header;
