"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Eye, Edit, Plus, Minus, Trash2 } from "lucide-react";
import Link from "@/components/ui/Link";
import type { Country } from "@/lib/travel-wallet/types";

interface CountryActionsMenuProps {
  country: Country;
  slug: string;
  onEdit?: (country: Country) => void;
  onAddBudget?: (country: Country) => void;
  onReduceBudget?: (country: Country) => void;
  onDelete?: (country: Country) => void;
}

export default function CountryActionsMenu({
  country,
  slug,
  onEdit,
  onAddBudget,
  onReduceBudget,
  onDelete,
}: CountryActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleActionClick = (e: React.MouseEvent, action?: () => void) => {
    e.stopPropagation();
    setIsOpen(false);
    action?.();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleMenuClick}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Akcje"
      >
        <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="py-1">
            <Link
              href={`/portfel-podrozniczy/${slug}/kraje/${country.slug}`}
              variant="default"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={(e) => handleActionClick(e)}
            >
              <Eye className="w-4 h-4" />
              Zobacz szczegóły
            </Link>
            {onEdit && (
              <button
                onClick={(e) => handleActionClick(e, () => onEdit(country))}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Edit className="w-4 h-4" />
                Edytuj kraj
              </button>
            )}
            {onAddBudget && (
              <button
                onClick={(e) => handleActionClick(e, () => onAddBudget(country))}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Plus className="w-4 h-4" />
                Dodaj budżet
              </button>
            )}
            {onReduceBudget && (
              <button
                onClick={(e) => handleActionClick(e, () => onReduceBudget(country))}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Minus className="w-4 h-4" />
                Zmniejsz budżet
              </button>
            )}
            {onDelete && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <button
                  onClick={(e) => handleActionClick(e, () => onDelete(country))}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Usuń kraj
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

