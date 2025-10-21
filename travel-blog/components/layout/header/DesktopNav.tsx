import React, { useState, memo } from "react";
import NavLink from "@/components/layout/header/NavLink";
import Divider from "@/components/layout/header/Divider";
import DropdownSection from "@/components/layout/header/DropdownSection";
import { ChevronDown } from "lucide-react";
import {
  Section,
  HierarchicalSection,
} from "@/components/layout/header/header-data";
import { MenuItem } from "@/lib/sanity";

type Props = {
  sections: Section[];
  mainMenu?: MenuItem[];
  hierarchicalCategories?: HierarchicalSection[];
  open: Record<string, boolean>;
  onToggle: (key: string) => void;
};

const DesktopNav = memo(function DesktopNav({
  sections,
  mainMenu,
  hierarchicalCategories,
  open,
  onToggle,
}: Props) {
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);

  // Jeśli mamy nowe menu z Sanity, używamy go
  if (mainMenu && mainMenu.length > 0) {
    return (
      <nav className="hidden md:flex items-center gap-6 text-sm font-sans text-gray-600 dark:text-gray-300">
        {mainMenu.map((menuItem, index) => (
          <div
            key={index}
            className="group relative"
            onMouseEnter={() => setHoveredMenu(menuItem.label)}
            onMouseLeave={() => setHoveredMenu(null)}
          >
            {menuItem.href ? (
              <NavLink
                href={menuItem.href}
                external={menuItem.isExternal}
                className="inline-flex items-center gap-1 transition-colors duration-200 group-hover:text-gray-900 dark:group-hover:text-gray-100"
              >
                <span>{menuItem.label}</span>
                {menuItem.hasDropdown && (
                  <ChevronDown
                    className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180"
                    aria-hidden
                  />
                )}
              </NavLink>
            ) : (
              <button
                aria-haspopup="true"
                aria-expanded={hoveredMenu === menuItem.label}
                className="inline-flex items-center gap-1 transition-colors duration-200 group-hover:text-gray-900 dark:group-hover:text-gray-100"
              >
                <span>{menuItem.label}</span>
                {menuItem.hasDropdown && (
                  <ChevronDown
                    className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180"
                    aria-hidden
                  />
                )}
              </button>
            )}
            <span className="pointer-events-none absolute -bottom-1 left-0 h-[2px] w-0 bg-gray-900 dark:bg-gray-100 transition-all duration-300 group-hover:w-full" />

            {menuItem.hasDropdown && menuItem.dropdownItems && (
              <div className="invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 absolute right-0 top-full mt-3 w-64 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                <div className="p-2">
                  {menuItem.dropdownItems.map((item, itemIdx) => (
                    <React.Fragment key={itemIdx}>
                      <div className="relative group/item">
                        {item.hasSubmenu && item.submenuItems ? (
                          <div className="relative">
                            <button
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 flex items-center justify-between"
                              onMouseEnter={() =>
                                setHoveredMenu(
                                  `${menuItem.label}-${item.label}`
                                )
                              }
                            >
                              <span>{item.label}</span>
                              <ChevronDown className="h-3 w-3 -rotate-90 group-hover/item:rotate-90 transition-transform duration-300" />
                            </button>
                            <div className="invisible opacity-0 translate-x-2 group-hover/item:visible group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-200 absolute left-full top-0 ml-1 w-48 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-md shadow-lg z-10">
                              <div className="p-2">
                                {item.submenuItems.map((subItem, subIdx) => (
                                  <React.Fragment key={subIdx}>
                                    <NavLink
                                      href={subItem.href}
                                      external={subItem.isExternal}
                                      className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                                    >
                                      {subItem.label}
                                    </NavLink>
                                    {subIdx < item.submenuItems.length - 1 && (
                                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <NavLink
                            href={item.href!}
                            external={item.isExternal}
                            className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                          >
                            {item.label}
                          </NavLink>
                        )}
                      </div>
                      {itemIdx < menuItem.dropdownItems.length - 1 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>
    );
  }

  // Jeśli mamy hierarchiczne kategorie, używamy ich jako fallback
  if (hierarchicalCategories && hierarchicalCategories.length > 0) {
    return (
      <nav className="hidden md:flex items-center gap-6 text-sm font-sans text-gray-600 dark:text-gray-300">
        <div className="group relative">
          <NavLink
            href="/"
            className="inline-flex items-center gap-1 transition-colors duration-200 group-hover:text-gray-900 dark:group-hover:text-gray-100"
          >
            <span>Główna</span>
          </NavLink>
          <span className="pointer-events-none absolute -bottom-1 left-0 h-[2px] w-0 bg-gray-900 dark:bg-gray-100 transition-all duration-300 group-hover:w-full" />
        </div>

        <div className="group relative">
          <button
            aria-haspopup="true"
            aria-expanded="false"
            className="inline-flex items-center gap-1 transition-colors duration-200 group-hover:text-gray-900 dark:group-hover:text-gray-100"
          >
            <span>Kategorie</span>
            <ChevronDown
              className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180"
              aria-hidden
            />
          </button>
          <span className="pointer-events-none absolute -bottom-1 left-0 h-[2px] w-0 bg-gray-900 dark:bg-gray-100 transition-all duration-300 group-hover:w-full" />

          <div className="invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 absolute right-0 top-full mt-3 w-[480px] max-w-[calc(100vw-2rem)] rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
            <div className="p-3">
              {hierarchicalCategories.map((category, idx) => (
                <React.Fragment key={category.key}>
                  <div className="mb-4 last:mb-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                      <span className="text-lg">{category.emoji}</span>
                      {category.title}
                    </h3>
                    <div className="grid grid-cols-1 gap-1">
                      {category.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="relative group/item">
                          {item.subcategories &&
                          item.subcategories.length > 0 ? (
                            <div className="relative">
                              <button
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 flex items-center justify-between"
                                onMouseEnter={() =>
                                  setHoveredMenu(
                                    `${category.key}-${item.label}`
                                  )
                                }
                              >
                                <span>{item.label}</span>
                                <ChevronDown className="h-3 w-3 -rotate-90 group-hover/item:rotate-90 transition-transform duration-300" />
                              </button>
                              <div className="invisible opacity-0 translate-x-2 group-hover/item:visible group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-200 absolute left-full top-0 ml-1 w-48 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-md shadow-lg z-10">
                                <div className="p-2">
                                  {item.subcategories.map((subItem, subIdx) => (
                                    <React.Fragment key={subIdx}>
                                      <NavLink
                                        href={subItem.href}
                                        external={subItem.isExternal}
                                        className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                                      >
                                        {subItem.label}
                                      </NavLink>
                                      {subIdx <
                                        item.subcategories.length - 1 && (
                                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <NavLink
                              href={item.href}
                              external={item.isExternal}
                              className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                            >
                              {item.label}
                            </NavLink>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {idx < hierarchicalCategories.length - 1 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="group relative">
          <NavLink
            href="#kontakt"
            className="inline-flex items-center gap-1 transition-colors duration-200 group-hover:text-gray-900 dark:group-hover:text-gray-100"
          >
            <span>Kontakt</span>
          </NavLink>
          <span className="pointer-events-none absolute -bottom-1 left-0 h-[2px] w-0 bg-gray-900 dark:bg-gray-100 transition-all duration-300 group-hover:w-full" />
        </div>
      </nav>
    );
  }

  // Loading state gdy nie ma danych
  if (!sections || sections.length === 0) {
    return (
      <nav className="hidden md:flex items-center gap-6 text-sm font-sans text-gray-600 dark:text-gray-300">
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </nav>
    );
  }

  // Fallback do starego menu
  return (
    <nav className="hidden md:flex items-center gap-6 text-sm font-sans text-gray-600 dark:text-gray-300">
      <div className="group relative">
        <NavLink
          href="/"
          className="inline-flex items-center gap-1 transition-colors duration-200 group-hover:text-gray-900 dark:group-hover:text-gray-100"
        >
          <span>Główna</span>
        </NavLink>
        <span className="pointer-events-none absolute -bottom-1 left-0 h-[2px] w-0 bg-gray-900 dark:bg-gray-100 transition-all duration-300 group-hover:w-full" />
      </div>

      <div className="group relative">
        <NavLink
          href="#o-nas"
          className="inline-flex items-center gap-1 transition-colors duration-200 group-hover:text-gray-900 dark:group-hover:text-gray-100"
        >
          <span>O nas</span>
        </NavLink>
        <span className="pointer-events-none absolute -bottom-1 left-0 h-[2px] w-0 bg-gray-900 dark:bg-gray-100 transition-all duration-300 group-hover:w-full" />
      </div>

      <div className="group relative">
        <button
          aria-haspopup="true"
          aria-expanded="false"
          className="inline-flex items-center gap-1 transition-colors duration-200 group-hover:text-gray-900 dark:group-hover:text-gray-100"
        >
          <span>Kategorie</span>
          <ChevronDown
            className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180"
            aria-hidden
          />
        </button>
        <span className="pointer-events-none absolute -bottom-1 left-0 h-[2px] w-0 bg-gray-900 dark:bg-gray-100 transition-all duration-300 group-hover:w-full" />

        <div className="invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 absolute right-0 top-full mt-3 w-[480px] max-w-[calc(100vw-2rem)] rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
          <div className="p-3">
            {sections.map((s, idx) => (
              <React.Fragment key={s.key}>
                <DropdownSection
                  section={s}
                  isOpen={!!open[s.key]}
                  onToggle={() => onToggle(s.key)}
                />
                {idx < sections.length - 1 ? <Divider /> : null}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="group relative">
        <NavLink
          href="#kontakt"
          className="inline-flex items-center gap-1 transition-colors duration-200 group-hover:text-gray-900 dark:group-hover:text-gray-100"
        >
          <span>Kontakt</span>
        </NavLink>
        <span className="pointer-events-none absolute -bottom-1 left-0 h-[2px] w-0 bg-gray-900 dark:bg-gray-100 transition-all duration-300 group-hover:w-full" />
      </div>
    </nav>
  );
});

export default DesktopNav;
