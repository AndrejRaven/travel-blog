import React from "react";
import { ChevronDown, Circle } from "lucide-react";
import Link from "@/components/ui/Link";
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
        className="w-full flex items-center justify-between rounded-md px-2 py-2 text-left font-sans text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="inline-flex items-center gap-2">
          <span className="text-base">{section.emoji}</span>
          <span className="font-medium">{section.title}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-300 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          aria-hidden
        />
      </button>
      <ul
        className={`${
          isOpen ? "block" : "hidden"
        } mt-1 space-y-1 pl-6 text-sm font-sans text-gray-700 dark:text-gray-300`}
      >
        {section.items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 font-sans hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <Circle
                className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500"
                aria-hidden
              />
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
