import React from "react";
import NavLink from "@/components/layout/header/NavLink";
import Divider from "@/components/layout/header/Divider";
import DropdownSection from "@/components/layout/header/DropdownSection";
import ChevronIcon from "@/components/ui/icons/ChevronIcon";
import { Section } from "@/components/layout/header/header-data";

type Props = {
  sections: Section[];
  open: Record<string, boolean>;
  onToggle: (key: string) => void;
};

export default function DesktopNav({ sections, open, onToggle }: Props) {
  return (
    <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
      <div className="group relative">
        <NavLink
          href="/"
          className="inline-flex items-center gap-1 transition-colors duration-200 group-hover:text-gray-900"
        >
          <span>Główna</span>
        </NavLink>
        <span className="pointer-events-none absolute -bottom-1 left-0 h-[2px] w-0 bg-gray-900 transition-all duration-300 group-hover:w-full" />
      </div>

      <div className="group relative">
        <NavLink
          href="#o-nas"
          className="inline-flex items-center gap-1 transition-colors duration-200 group-hover:text-gray-900"
        >
          <span>O nas</span>
        </NavLink>
        <span className="pointer-events-none absolute -bottom-1 left-0 h-[2px] w-0 bg-gray-900 transition-all duration-300 group-hover:w-full" />
      </div>

      <div className="group relative">
        <button
          aria-haspopup="true"
          aria-expanded="false"
          className="inline-flex items-center gap-1 transition-colors duration-200 group-hover:text-gray-900"
        >
          <span>Kategorie</span>
          <ChevronIcon
            className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180"
            aria-hidden
          />
        </button>
        <span className="pointer-events-none absolute -bottom-1 left-0 h-[2px] w-0 bg-gray-900 transition-all duration-300 group-hover:w-full" />

        <div className="invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 absolute right-0 top-full mt-3 w-[480px] max-w-[calc(100vw-2rem)] rounded-lg border border-gray-100 bg-white shadow-lg">
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
          className="inline-flex items-center gap-1 transition-colors duration-200 group-hover:text-gray-900"
        >
          <span>Kontakt</span>
        </NavLink>
        <span className="pointer-events-none absolute -bottom-1 left-0 h-[2px] w-0 bg-gray-900 transition-all duration-300 group-hover:w-full" />
      </div>
    </nav>
  );
}
