"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, MapPin, DollarSign, ChevronDown } from "lucide-react";

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

interface QuickActionsMenuProps {
  actions: QuickAction[];
  className?: string;
}

export default function QuickActionsMenu({
  actions,
  className = "",
}: QuickActionsMenuProps) {
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

  const handleActionClick = (action: QuickAction) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
        aria-label="Szybkie akcje"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Szybkie akcje</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-50 animate-fade-in-up">
          <div className="p-2">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleActionClick(action)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-left group"
                >
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors duration-200">
                    <Icon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
