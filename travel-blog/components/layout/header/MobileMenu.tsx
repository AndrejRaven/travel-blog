import React from "react";
import ToggleChevron from "@/components/ui/ToggleChevron";
import { Section } from "@/components/layout/header/header-data";
import MobileSection from "@/components/layout/header/MobileSection";

type Props = {
  sections: Section[];
  mobileOpen: boolean;
  mobileCategoriesOpen: boolean;
  onToggleMobile: () => void;
  onToggleMobileCategories: () => void;
  open: Record<string, boolean>;
  onToggleSection: (key: string) => void;
};

export default function MobileMenu({
  sections,
  mobileOpen,
  mobileCategoriesOpen,
  onToggleMobile,
  onToggleMobileCategories,
  open,
  onToggleSection,
}: Props) {
  return (
    <>
      <button
        type="button"
        aria-label="Otwórz menu"
        aria-expanded={mobileOpen}
        onClick={onToggleMobile}
        className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
      >
        <svg
          className={`h-6 w-6 transition-transform duration-200 ${
            mobileOpen ? "scale-0" : "scale-100"
          }`}
          viewBox="0 0 24 24"
          stroke="currentColor"
          fill="none"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        <svg
          className={`-ml-6 h-6 w-6 transition-transform duration-200 ${
            mobileOpen ? "scale-100" : "scale-0"
          }`}
          viewBox="0 0 24 24"
          stroke="currentColor"
          fill="none"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {mobileOpen && (
        <div className="md:hidden absolute left-0 right-0 top-full mt-2 rounded-lg border border-gray-100 bg-white shadow-lg">
          <div className="px-4 py-3 space-y-2 text-gray-700 text-sm">
            <a
              href="/"
              className="block rounded-md px-2 py-2 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              Główna
            </a>
            <a
              href="#o-nas"
              className="block rounded-md px-2 py-2 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              O nas
            </a>

            <div>
              <button
                type="button"
                aria-expanded={mobileCategoriesOpen}
                onClick={onToggleMobileCategories}
                className="w-full flex items-center justify-between rounded-md px-2 py-2 text-left font-medium text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <span>Kategorie</span>
                </span>
                <ToggleChevron
                  isOpen={mobileCategoriesOpen}
                  className="h-4 w-4 transition-transform duration-300"
                  aria-hidden
                />
              </button>

              <div
                className={`${mobileCategoriesOpen ? "block" : "hidden"} mt-1`}
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
          </div>
          <div className="border-t border-gray-100" />
          <div className="px-4 py-3">
            <a
              href="#kontakt"
              className="block rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              Kontakt
            </a>
          </div>
        </div>
      )}
    </>
  );
}
