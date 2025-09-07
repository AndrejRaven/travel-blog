"use client";

import { useState } from "react";

const Header = () => {
  const [openSections, setOpenSections] = useState({
    places: false,
    guides: false,
    culture: false,
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="relative mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 group">
          <span className="text-lg font-semibold tracking-tight transition-colors duration-200 group-hover:text-gray-900">
            Nasz Blog
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          {/* Główna */}
          <div className="group relative">
            <a
              href="/"
              className="inline-flex items-center gap-1 transition-colors duration-200 group-hover:text-gray-900"
            >
              <span>Główna</span>
            </a>
            <span className="pointer-events-none absolute -bottom-1 left-0 h-[2px] w-0 bg-gray-900 transition-all duration-300 group-hover:w-full" />
          </div>

          {/* O nas */}
          <div className="group relative">
            <a
              href="#o-nas"
              className="inline-flex items-center gap-1 transition-colors duration-200 group-hover:text-gray-900"
            >
              <span>O nas</span>
            </a>
            <span className="pointer-events-none absolute -bottom-1 left-0 h-[2px] w-0 bg-gray-900 transition-all duration-300 group-hover:w-full" />
          </div>

          {/* Kategorie (z podmenu) */}
          <div className="group relative">
            <button
              aria-haspopup="true"
              aria-expanded="false"
              className="inline-flex items-center gap-1 transition-colors duration-200 group-hover:text-gray-900"
            >
              <span>Kategorie</span>
              <svg
                className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.177l3.71-3.946a.75.75 0 111.08 1.04l-4.24 4.51a.75.75 0 01-1.08 0l-4.24-4.51a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <span className="pointer-events-none absolute -bottom-1 left-0 h-[2px] w-0 bg-gray-900 transition-all duration-300 group-hover:w-full" />

            {/* Dropdown */}
            <div className="invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 absolute left-0 top-full mt-3 w-[320px] rounded-lg border border-gray-100 bg-white shadow-lg">
              <div className="p-3">
                {/* Miejsca */}
                <div className="px-2 py-2">
                  <button
                    type="button"
                    aria-expanded={openSections.places}
                    onClick={() => toggleSection("places")}
                    className="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-left text-gray-900 font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="text-base">🌍</span>
                      <span>Miejsca</span>
                    </span>
                    <svg
                      className={`h-4 w-4 transition-transform duration-300 ${
                        openSections.places ? "rotate-180" : "rotate-0"
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.177l3.71-3.946a.75.75 0 111.08 1.04l-4.24 4.51a.75.75 0 01-1.08 0l-4.24-4.51a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <ul
                    className={`${
                      openSections.places ? "block" : "hidden"
                    } mt-2 space-y-1 text-sm text-gray-700`}
                  >
                    <li>
                      <a
                        href="#europa"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M10 2a6 6 0 100 12A6 6 0 0010 2z" />
                        </svg>
                        <span>Europa</span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#azja"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M10 2a6 6 0 100 12A6 6 0 0010 2z" />
                        </svg>
                        <span>Azja</span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#ameryka-lacinska"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M10 2a6 6 0 100 12A6 6 0 0010 2z" />
                        </svg>
                        <span>Ameryka Łacińska</span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#afryka"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M10 2a6 6 0 100 12A6 6 0 0010 2z" />
                        </svg>
                        <span>Afryka</span>
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="my-2 h-px bg-gray-100" />

                {/* Poradniki */}
                <div className="px-2 py-2">
                  <button
                    type="button"
                    aria-expanded={openSections.guides}
                    onClick={() => toggleSection("guides")}
                    className="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-left text-gray-900 font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="text-base">🧭</span>
                      <span>Poradniki</span>
                    </span>
                    <svg
                      className={`h-4 w-4 transition-transform duration-300 ${
                        openSections.guides ? "rotate-180" : "rotate-0"
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.177l3.71-3.946a.75.75 0 111.08 1.04l-4.24 4.51a.75.75 0 01-1.08 0l-4.24-4.51a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <ul
                    className={`${
                      openSections.guides ? "block" : "hidden"
                    } mt-2 space-y-1 text-sm text-gray-700`}
                  >
                    <li>
                      <a
                        href="#transport"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M3 9h14M5 13h10M7 17h6" />
                        </svg>
                        <span>Transport (loty, autostop, pociągi)</span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#budzet"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M4 6h12v8H4z" />
                        </svg>
                        <span>Budżet i oszczędzanie w podróży</span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#sprzet"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M5 6h10l-1 8H6z" />
                        </svg>
                        <span>Sprzęt i pakowanie</span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#bezpieczenstwo"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M10 2l6 3v5c0 4-3 6-6 8-3-2-6-4-6-8V5l6-3z" />
                        </svg>
                        <span>Bezpieczeństwo w podróży</span>
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="my-2 h-px bg-gray-100" />

                {/* Kultura i jedzenie */}
                <div className="px-2 py-2">
                  <button
                    type="button"
                    aria-expanded={openSections.culture}
                    onClick={() => toggleSection("culture")}
                    className="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-left text-gray-900 font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="text-base">🍲</span>
                      <span>Kultura i jedzenie</span>
                    </span>
                    <svg
                      className={`h-4 w-4 transition-transform duration-300 ${
                        openSections.culture ? "rotate-180" : "rotate-0"
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.177l3.71-3.946a.75.75 0 111.08 1.04l-4.24 4.51a.75.75 0 01-1.08 0l-4.24-4.51a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <ul
                    className={`${
                      openSections.culture ? "block" : "hidden"
                    } mt-2 space-y-1 text-sm text-gray-700`}
                  >
                    <li>
                      <a
                        href="#lokalne-potrawy"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M4 10h12M6 6h8" />
                        </svg>
                        <span>Lokalne potrawy</span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#festiwale"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M4 6h12v10H4z" />
                        </svg>
                        <span>Festiwale i wydarzenia</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Kontakt */}
          <div className="group relative">
            <a
              href="#kontakt"
              className="inline-flex items-center gap-1 transition-colors duration-200 group-hover:text-gray-900"
            >
              <span>Kontakt</span>
            </a>
            <span className="pointer-events-none absolute -bottom-1 left-0 h-[2px] w-0 bg-gray-900 transition-all duration-300 group-hover:w-full" />
          </div>
        </nav>
        <button
          type="button"
          aria-label="Otwórz menu"
          aria-expanded={mobileOpen}
          onClick={() =>
            setMobileOpen((prev) => {
              const next = !prev;
              if (next) {
                setOpenSections({
                  places: false,
                  guides: false,
                  culture: false,
                });
                setMobileCategoriesOpen(false);
              }
              return next;
            })
          }
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

              {/* Kategorie (mobile) */}
              <div>
                <button
                  type="button"
                  aria-expanded={mobileCategoriesOpen}
                  onClick={() => setMobileCategoriesOpen((v) => !v)}
                  className="w-full flex items-center justify-between rounded-md px-2 py-2 text-left font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <span>Kategorie</span>
                  </span>
                  <svg
                    className={`h-4 w-4 transition-transform duration-300 ${
                      mobileCategoriesOpen ? "rotate-180" : "rotate-0"
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.177l3.71-3.946a.75.75 0 111.08 1.04l-4.24 4.51a.75.75 0 01-1.08 0l-4.24-4.51a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Miejsca */}
                <div
                  className={`${
                    mobileCategoriesOpen ? "block" : "hidden"
                  } mt-1`}
                >
                  <button
                    type="button"
                    aria-expanded={openSections.places}
                    onClick={() => toggleSection("places")}
                    className="w-full flex items-center justify-between rounded-md px-2 py-2 text-left text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="text-base">🌍</span>
                      <span className="font-medium">Miejsca</span>
                    </span>
                    <svg
                      className={`h-4 w-4 transition-transform duration-300 ${
                        openSections.places ? "rotate-180" : "rotate-0"
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.177l3.71-3.946a.75.75 0 111.08 1.04l-4.24 4.51a.75.75 0 01-1.08 0l-4.24-4.51a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <ul
                    className={`${
                      openSections.places ? "block" : "hidden"
                    } mt-1 space-y-1 pl-6 text-sm`}
                  >
                    <li>
                      <a
                        href="#europa"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M10 2a6 6 0 100 12A6 6 0 0010 2z" />
                        </svg>
                        <span>Europa</span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#azja"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M10 2a6 6 0 100 12A6 6 0 0010 2z" />
                        </svg>
                        <span>Azja</span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#ameryka-lacinska"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M10 2a6 6 0 100 12A6 6 0 0010 2z" />
                        </svg>
                        <span>Ameryka Łacińska</span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#afryka"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M10 2a6 6 0 100 12A6 6 0 0010 2z" />
                        </svg>
                        <span>Afryka</span>
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Poradniki */}
                <div
                  className={`${
                    mobileCategoriesOpen ? "block" : "hidden"
                  } mt-1`}
                >
                  <button
                    type="button"
                    aria-expanded={openSections.guides}
                    onClick={() => toggleSection("guides")}
                    className="w-full flex items-center justify-between rounded-md px-2 py-2 text-left text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="text-base">🧭</span>
                      <span className="font-medium">Poradniki</span>
                    </span>
                    <svg
                      className={`h-4 w-4 transition-transform duration-300 ${
                        openSections.guides ? "rotate-180" : "rotate-0"
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.177l3.71-3.946a.75.75 0 111.08 1.04l-4.24 4.51a.75.75 0 01-1.08 0l-4.24-4.51a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <ul
                    className={`${
                      openSections.guides ? "block" : "hidden"
                    } mt-1 space-y-1 pl-6 text-sm`}
                  >
                    <li>
                      <a
                        href="#transport"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M3 9h14M5 13h10M7 17h6" />
                        </svg>
                        <span>Transport (loty, autostop, pociągi)</span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#budzet"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M4 6h12v8H4z" />
                        </svg>
                        <span>Budżet i oszczędzanie w podróży</span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#sprzet"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M5 6h10l-1 8H6z" />
                        </svg>
                        <span>Sprzęt i pakowanie</span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#bezpieczenstwo"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M10 2l6 3v5c0 4-3 6-6 8-3-2-6-4-6-8V5l6-3z" />
                        </svg>
                        <span>Bezpieczeństwo w podróży</span>
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Kultura i jedzenie */}
                <div
                  className={`${
                    mobileCategoriesOpen ? "block" : "hidden"
                  } mt-1`}
                >
                  <button
                    type="button"
                    aria-expanded={openSections.culture}
                    onClick={() => toggleSection("culture")}
                    className="w-full flex items-center justify-between rounded-md px-2 py-2 text-left text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="text-base">🍲</span>
                      <span className="font-medium">Kultura i jedzenie</span>
                    </span>
                    <svg
                      className={`h-4 w-4 transition-transform duration-300 ${
                        openSections.culture ? "rotate-180" : "rotate-0"
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.177l3.71-3.946a.75.75 0 111.08 1.04l-4.24 4.51a.75.75 0 01-1.08 0l-4.24-4.51a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <ul
                    className={`${
                      openSections.culture ? "block" : "hidden"
                    } mt-1 space-y-1 pl-6 text-sm`}
                  >
                    <li>
                      <a
                        href="#lokalne-potrawy"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M4 10h12M6 6h8" />
                        </svg>
                        <span>Lokalne potrawy</span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#festiwale"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M4 6h12v10H4z" />
                        </svg>
                        <span>Festiwale i wydarzenia</span>
                      </a>
                    </li>
                  </ul>
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
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
