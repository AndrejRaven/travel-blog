import React, { useState, memo } from "react";
import { ChevronDown } from "lucide-react";
import { Section } from "@/components/layout/header/header-data";
import MobileSection from "@/components/layout/header/MobileSection";
import { MenuItem } from "@/lib/sanity";
import NavLink from "@/components/layout/header/NavLink";
import Link from "@/components/ui/Link";
import { Menu, X } from "lucide-react";

type Props = {
  sections: Section[];
  mainMenu?: MenuItem[];
  mobileOpen: boolean;
  mobileCategoriesOpen: boolean;
  onToggleMobile: () => void;
  onToggleMobileCategories: () => void;
  open: Record<string, boolean>;
  onToggleSection: (key: string) => void;
};

const MobileMenu = memo(function MobileMenu({
  sections,
  mainMenu,
  mobileOpen,
  mobileCategoriesOpen,
  onToggleMobile,
  onToggleMobileCategories,
  open,
  onToggleSection,
}: Props) {
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(
    {}
  );

  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  return (
    <>
      <button
        type="button"
        aria-label="Otwórz menu"
        aria-expanded={mobileOpen}
        onClick={onToggleMobile}
        className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <Menu
          className={`h-6 w-6 transition-transform duration-200 ${
            mobileOpen ? "scale-0" : "scale-100"
          }`}
          aria-hidden="true"
        />
        <X
          className={`-ml-6 h-6 w-6 transition-transform duration-200 ${
            mobileOpen ? "scale-100" : "scale-0"
          }`}
          aria-hidden="true"
        />
      </button>

      {mobileOpen && (
        <div className="md:hidden absolute left-0 right-0 top-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 shadow-lg">
          <div className="px-4 py-3 space-y-2 text-gray-700 dark:text-gray-300 text-sm font-sans">
            {mainMenu && mainMenu.length > 0 ? (
              // Nowe menu z Sanity
              mainMenu.map((menuItem, index) => (
                <React.Fragment key={index}>
                  <div>
                    {menuItem.href ? (
                      <NavLink
                        href={menuItem.href}
                        external={menuItem.isExternal}
                        className="block rounded-md px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                      >
                        {menuItem.label}
                      </NavLink>
                    ) : (
                      <div>
                        <button
                          type="button"
                          aria-expanded={openDropdowns[menuItem.label]}
                          onClick={() => toggleDropdown(menuItem.label)}
                          className="w-full flex items-center justify-between rounded-md px-2 py-2 text-left font-sans text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <span className="inline-flex items-center">
                            {menuItem.label}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-300 ${
                              openDropdowns[menuItem.label]
                                ? "rotate-180"
                                : "rotate-0"
                            }`}
                            aria-hidden
                          />
                        </button>

                        {menuItem.hasDropdown && menuItem.dropdownItems && (
                          <div
                            className={`${
                              openDropdowns[menuItem.label] ? "block" : "hidden"
                            } mt-1 ml-4`}
                          >
                            {menuItem.dropdownItems.map((item, itemIdx) => (
                              <React.Fragment key={itemIdx}>
                                <div>
                                  {item.hasSubmenu && item.submenuItems ? (
                                    <div>
                                      <button
                                        type="button"
                                        aria-expanded={
                                          openDropdowns[
                                            `${menuItem.label}-${item.label}`
                                          ]
                                        }
                                        onClick={() =>
                                          toggleDropdown(
                                            `${menuItem.label}-${item.label}`
                                          )
                                        }
                                        className="w-full flex items-center justify-between rounded-md px-2 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                      >
                                        <span>{item.label}</span>
                                        <ChevronDown
                                          className={`h-3 w-3 transition-transform duration-300 ${
                                            openDropdowns[
                                              `${menuItem.label}-${item.label}`
                                            ]
                                              ? "rotate-180"
                                              : "rotate-0"
                                          }`}
                                          aria-hidden
                                        />
                                      </button>
                                      <div
                                        className={`${
                                          openDropdowns[
                                            `${menuItem.label}-${item.label}`
                                          ]
                                            ? "block"
                                            : "hidden"
                                        } mt-1 ml-4`}
                                      >
                                        {item.submenuItems.map(
                                          (subItem, subIdx) => (
                                            <React.Fragment key={subIdx}>
                                              <NavLink
                                                href={subItem.href}
                                                external={subItem.isExternal}
                                                className="block rounded-md px-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                              >
                                                {subItem.label}
                                              </NavLink>
                                              {item.submenuItems &&
                                                subIdx <
                                                  item.submenuItems.length -
                                                    1 && (
                                                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                                )}
                                            </React.Fragment>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <NavLink
                                      href={item.href!}
                                      external={item.isExternal}
                                      className="block rounded-md px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                    >
                                      {item.label}
                                    </NavLink>
                                  )}
                                </div>
                                {menuItem.dropdownItems &&
                                  itemIdx <
                                    menuItem.dropdownItems.length - 1 && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                  )}
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {index < mainMenu.length - 1 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  )}
                </React.Fragment>
              ))
            ) : (
              // Fallback do starego menu
              <>
                <Link
                  href="/"
                  className="block rounded-md px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Główna
                </Link>
                <a
                  href="#o-nas"
                  className="block rounded-md px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  O nas
                </a>

                <div>
                  <button
                    type="button"
                    aria-expanded={mobileCategoriesOpen}
                    onClick={onToggleMobileCategories}
                    className="w-full flex items-center justify-between rounded-md px-2 py-2 text-left font-sans font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span>Kategorie</span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-300 ${
                        mobileCategoriesOpen ? "rotate-180" : "rotate-0"
                      }`}
                      aria-hidden
                    />
                  </button>

                  <div
                    className={`${
                      mobileCategoriesOpen ? "block" : "hidden"
                    } mt-1`}
                  >
                    {sections.map((s) => (
                      <MobileSection
                        key={s.key}
                        section={s}
                        isOpen={!!open[s.key]}
                        onToggle={() => onToggleSection(s.key)}
                      />
                    ))}
                  </div>
                </div>

                <a
                  href="#kontakt"
                  className="block rounded-md px-2 py-2 text-sm font-sans text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Kontakt
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
});

export default MobileMenu;
