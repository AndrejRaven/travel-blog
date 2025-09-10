import React from "react";
import ChevronIcon from "@/components/ui/icons/ChevronIcon";
import CircleIcon from "@/components/ui/icons/CircleIcon";
import { Section } from "@/components/layout/header/header-data";

type Props = {
  section: Section;
  isOpen: boolean;
  onToggle: () => void;
};

export default function DropdownSection({ section, isOpen, onToggle }: Props) {
  return (
    <div className="px-2 py-2">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-left font-sans text-gray-900 dark:text-gray-100 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <span className="inline-flex items-center gap-2">
          <span className="text-base">{section.emoji}</span>
          <span>{section.title}</span>
        </span>
        <ChevronIcon
          className={`h-4 w-4 transition-transform duration-300 text-gray-600 dark:text-gray-400 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          aria-hidden
        />
      </button>
      <ul
        className={`${
          isOpen ? "block" : "hidden"
        } mt-2 space-y-1 text-sm font-sans text-gray-700 dark:text-gray-300 overflow-hidden`}
      >
        {section.items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 font-sans hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors min-w-0 group/item"
            >
              <CircleIcon
                className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 group-hover/item:text-gray-600 dark:group-hover/item:text-gray-400 flex-shrink-0 transition-colors"
                aria-hidden
              />
              <span className="truncate group-hover/item:font-medium transition-all">
                {item.label}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
