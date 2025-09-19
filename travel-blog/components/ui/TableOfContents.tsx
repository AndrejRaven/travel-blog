"use client";

import { useEffect, useState } from "react";
import { List, X, ChevronRight } from "lucide-react";

interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  items: TableOfContentsItem[];
  className?: string;
  onToggle?: (isOpen: boolean) => void;
}

export default function TableOfContents({
  items,
  className = "",
  onToggle,
}: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Generuj ID na podstawie tytułu
  const generateId = (title: string) => {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/^-+|-+$/g, "") // Usuń myślniki z początku i końca
        .replace(/^-/, "section-") // Jeśli zaczyna się od myślnika, dodaj prefix
        .trim() || "section"
    ); // Fallback jeśli pusty string
  };

  // Obserwuj przewijanie i ustaw aktywną sekcję
  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0% -35% 0%",
        threshold: 0.1,
      }
    );

    // Obserwuj wszystkie sekcje z tytułami treści
    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [items]);

  // Płynne przewijanie do sekcji
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);

    if (element) {
      // Dynamicznie oblicz wysokość header
      const header = document.querySelector("header");
      const headerHeight = header ? header.offsetHeight + 16 : 80; // +16px margines
      const elementPosition = element.offsetTop - headerHeight;

      // Na mobile używaj scrollIntoView z offsetem, na desktop window.scrollTo
      if (window.innerWidth < 1024) {
        // Na mobile używamy scrollIntoView ale z dodatkowym offsetem
        const currentScrollY = window.scrollY;
        const targetScrollY = elementPosition;

        // Płynne skrolowanie z offsetem
        window.scrollTo({
          top: targetScrollY,
          behavior: "smooth",
        });
      } else {
        window.scrollTo({
          top: elementPosition,
          behavior: "smooth",
        });
      }
    }
    setIsOpen(false);
    onToggle?.(false);
  };

  // Funkcja do otwierania/zamykania
  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    onToggle?.(newIsOpen);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <aside className={`${className}`}>
      {/* Przycisk otwierający spis treści - fixed z lewej, ukryty gdy otwarty */}
      {!isOpen && (
        <div className="fixed top-20 left-4 sm:left-6 z-50 group">
          <button
            onClick={handleToggle}
            className="bg-gray-900/20 dark:bg-gray-100/20 backdrop-blur-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-900/30 dark:hover:bg-gray-100/30 transition-all duration-300 rounded-full p-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
            aria-label="Otwórz spis treści"
            title="Spis treści"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Podpowiedź przy hover - ukryta na mobile */}
          <div className="hidden sm:block absolute left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-gray-800/90 dark:bg-gray-200/90 backdrop-blur-sm text-white dark:text-gray-800 text-xs px-2 py-1.5 rounded-md whitespace-nowrap shadow-sm border border-gray-700/20 dark:border-gray-300/20">
              Spis treści
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-gray-800/90 dark:bg-gray-200/90 rotate-45"></div>
            </div>
          </div>
        </div>
      )}

      {/* Panel spisu treści */}
      <div
        className={`
          fixed left-0 top-20 h-[calc(100vh-5rem)] w-80 sm:w-80 min-w-80
          bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          shadow-xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100">
            Spis treści
          </h3>
          <button
            onClick={() => {
              setIsOpen(false);
              onToggle?.(false);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Zamknij spis treści"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Lista sekcji */}
        <div className="p-6 flex-1 overflow-y-auto">
          <nav className="space-y-2">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`
                  group flex items-center w-full text-left py-2 text-sm font-sans transition-colors duration-200
                  ${
                    activeId === item.id
                      ? "text-gray-900 dark:text-gray-100 font-medium"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  }
                `}
                style={{
                  paddingLeft: `${16 + (item.level - 1) * 20}px`,
                }}
              >
                <span className="flex-1">{item.title}</span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overlay - zamyka spis treści przy kliknięciu poza */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-transparent z-40"
          onClick={() => {
            setIsOpen(false);
            onToggle?.(false);
          }}
        />
      )}
    </aside>
  );
}
