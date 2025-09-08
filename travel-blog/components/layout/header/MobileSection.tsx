import React from "react";
import ToggleChevron from "@/components/ui/ToggleChevron";
import CircleIcon from "@/components/ui/icons/CircleIcon";
import { Section } from "@/components/layout/header/header-data";

type Props = {
  section: Section;
  isOpen: boolean;
  onToggle: () => void;
};

export default function MobileSection({ section, isOpen, onToggle }: Props) {
  return (
    <div className="mt-1">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="w-full flex items-center justify-between rounded-md px-2 py-2 text-left text-gray-900 hover:bg-gray-50 transition-colors"
      >
        <span className="inline-flex items-center gap-2">
          <span className="text-base">{section.emoji}</span>
          <span className="font-medium">{section.title}</span>
        </span>
        <ToggleChevron
          isOpen={isOpen}
          className="h-4 w-4 transition-transform duration-300"
          aria-hidden
        />
      </button>
      <ul
        className={`${isOpen ? "block" : "hidden"} mt-1 space-y-1 pl-6 text-sm`}
      >
        {section.items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <CircleIcon className="h-3.5 w-3.5 text-gray-400" aria-hidden />
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
