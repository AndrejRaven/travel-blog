"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileSection, setOpenMobileSection] = useState<number | null>(
    null
  );

  return (
    <div className="min-h-screen font-sans text-gray-900">
      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="#" className="flex items-center gap-2">
            <Image src="/globe.svg" alt="Logo" width={28} height={28} />
            <span className="text-lg font-semibold">Nasz Blog</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {/* Menu 1 */}
            <div className="group relative">
              <button className="text-sm font-medium hover:text-gray-700 transition-colors">
                Podróże
              </button>
              <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all absolute left-1/2 -translate-x-1/2 mt-3 w-48 rounded-lg border border-gray-100 bg-white shadow-lg p-2">
                <Link
                  href="#"
                  className="block px-3 py-2 text-sm rounded hover:bg-gray-50"
                >
                  Europa
                </Link>
                <Link
                  href="#"
                  className="block px-3 py-2 text-sm rounded hover:bg-gray-50"
                >
                  Azja
                </Link>
                <Link
                  href="#"
                  className="block px-3 py-2 text-sm rounded hover:bg-gray-50"
                >
                  Ameryki
                </Link>
              </div>
            </div>
            {/* Menu 2 */}
            <div className="group relative">
              <button className="text-sm font-medium hover:text-gray-700 transition-colors">
                Poradniki
              </button>
              <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all absolute left-1/2 -translate-x-1/2 mt-3 w-48 rounded-lg border border-gray-100 bg-white shadow-lg p-2">
                <Link
                  href="#"
                  className="block px-3 py-2 text-sm rounded hover:bg-gray-50"
                >
                  Pakowanie
                </Link>
                <Link
                  href="#"
                  className="block px-3 py-2 text-sm rounded hover:bg-gray-50"
                >
                  Budżet
                </Link>
                <Link
                  href="#"
                  className="block px-3 py-2 text-sm rounded hover:bg-gray-50"
                >
                  Planowanie
                </Link>
              </div>
            </div>
            {/* Menu 3 */}
            <div className="group relative">
              <button className="text-sm font-medium hover:text-gray-700 transition-colors">
                Sprzęt
              </button>
              <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all absolute left-1/2 -translate-x-1/2 mt-3 w-52 rounded-lg border border-gray-100 bg-white shadow-lg p-2">
                <Link
                  href="#"
                  className="block px-3 py-2 text-sm rounded hover:bg-gray-50"
                >
                  Aparaty
                </Link>
                <Link
                  href="#"
                  className="block px-3 py-2 text-sm rounded hover:bg-gray-50"
                >
                  Plecaki
                </Link>
                <Link
                  href="#"
                  className="block px-3 py-2 text-sm rounded hover:bg-gray-50"
                >
                  Buty i odzież
                </Link>
              </div>
            </div>
          </nav>

          <button
            className="md:hidden inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
          >
            {isMobileMenuOpen ? "Zamknij" : "Menu"}
          </button>
        </div>
        {/* MOBILE MENU */}
        <div
          id="mobile-menu"
          className={`md:hidden border-t border-gray-100 overflow-hidden transition-[max-height] duration-300 ${
            isMobileMenuOpen ? "max-h-[600px]" : "max-h-0"
          }`}
        >
          <nav className="px-4 py-2" aria-label="Główne">
            {/* Sekcja 1 */}
            <div className="py-2">
              <button
                className="w-full flex items-center justify-between py-2 text-sm font-medium"
                onClick={() =>
                  setOpenMobileSection((s) => (s === 1 ? null : 1))
                }
                aria-expanded={openMobileSection === 1}
              >
                <span>Podróże</span>
                <span className="text-xs text-gray-500">
                  {openMobileSection === 1 ? "−" : "+"}
                </span>
              </button>
              <div
                className={`pl-3 overflow-hidden transition-[max-height] duration-300 ${
                  openMobileSection === 1 ? "max-h-40" : "max-h-0"
                }`}
              >
                <Link
                  href="#"
                  className="block px-2 py-2 text-sm rounded hover:bg-gray-50"
                >
                  Europa
                </Link>
                <Link
                  href="#"
                  className="block px-2 py-2 text-sm rounded hover:bg-gray-50"
                >
                  Azja
                </Link>
                <Link
                  href="#"
                  className="block px-2 py-2 text-sm rounded hover:bg-gray-50"
                >
                  Ameryki
                </Link>
              </div>
            </div>

            {/* Sekcja 2 */}
            <div className="py-2">
              <button
                className="w-full flex items-center justify-between py-2 text-sm font-medium"
                onClick={() =>
                  setOpenMobileSection((s) => (s === 2 ? null : 2))
                }
                aria-expanded={openMobileSection === 2}
              >
                <span>Poradniki</span>
                <span className="text-xs text-gray-500">
                  {openMobileSection === 2 ? "−" : "+"}
                </span>
              </button>
              <div
                className={`pl-3 overflow-hidden transition-[max-height] duration-300 ${
                  openMobileSection === 2 ? "max-h-40" : "max-h-0"
                }`}
              >
                <Link
                  href="#"
                  className="block px-2 py-2 text-sm rounded hover:bg-gray-50"
                >
                  Pakowanie
                </Link>
                <Link
                  href="#"
                  className="block px-2 py-2 text-sm rounded hover:bg-gray-50"
                >
                  Budżet
                </Link>
                <Link
                  href="#"
                  className="block px-2 py-2 text-sm rounded hover:bg-gray-50"
                >
                  Planowanie
                </Link>
              </div>
            </div>

            {/* Sekcja 3 */}
            <div className="py-2">
              <button
                className="w-full flex items-center justify-between py-2 text-sm font-medium"
                onClick={() =>
                  setOpenMobileSection((s) => (s === 3 ? null : 3))
                }
                aria-expanded={openMobileSection === 3}
              >
                <span>Sprzęt</span>
                <span className="text-xs text-gray-500">
                  {openMobileSection === 3 ? "−" : "+"}
                </span>
              </button>
              <div
                className={`pl-3 overflow-hidden transition-[max-height] duration-300 ${
                  openMobileSection === 3 ? "max-h-40" : "max-h-0"
                }`}
              >
                <Link
                  href="#"
                  className="block px-2 py-2 text-sm rounded hover:bg-gray-50"
                >
                  Aparaty
                </Link>
                <Link
                  href="#"
                  className="block px-2 py-2 text-sm rounded hover:bg-gray-50"
                >
                  Plecaki
                </Link>
                <Link
                  href="#"
                  className="block px-2 py-2 text-sm rounded hover:bg-gray-50"
                >
                  Buty i odzież
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center py-14 md:py-20">
        <div className="order-2 md:order-1">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Odkrywaj świat z nami
          </h1>
          <p className="text-gray-600 mb-6">
            Krótki opis bloga z zachętą do eksploracji. Tutaj dodamy inspirujący
            tekst o podróżach, historii i przygodach. Placeholder lorem ipsum.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="#najnowsze"
              className="inline-flex items-center justify-center rounded-md bg-gray-900 text-white px-4 py-2 text-sm hover:bg-gray-800"
            >
              Zobacz nowości
            </Link>
            <Link
              href="#o-nas"
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Dowiedz się więcej
            </Link>
          </div>
        </div>
        <div className="order-1 md:order-2 flex justify-center">
          <div className="relative w-full max-w-md aspect-[4/3] overflow-hidden rounded-2xl border bg-gray-50">
            <Image
              src="/window.svg"
              alt="Hero"
              fill
              className="object-contain p-6"
            />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="kategorie" className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6">
          Kategorie artykułów
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {["Przygoda", "Kuchnia", "Kultura", "Natura"].map((name) => (
            <Link
              key={name}
              href="#"
              className="group rounded-xl border p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-sm text-gray-600">Krótki opis kategorii</p>
                </div>
                <Image
                  src="/file.svg"
                  alt="Ikona"
                  width={28}
                  height={28}
                  className="opacity-70 group-hover:opacity-100"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ABOUT US */}
      <section
        id="o-nas"
        className="mx-auto max-w-7xl px-6 py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
      >
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-semibold">Kim jesteśmy</h2>
          <p className="text-gray-600">
            Jesteśmy parą, która kocha podróże. To miejsce to nasz dziennik
            wypraw i inspiracji. Teksty i zdjęcia są przykładowe – placeholder.
          </p>
          <p className="text-gray-600">
            Docelowo tu pojawi się prawdziwy content: krótkie bio, zdjęcia,
            linki do social mediów.
          </p>
          <Link
            href="#kontakt"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm hover:bg-gray-50 w-fit"
          >
            Skontaktuj się
          </Link>
        </div>
        <div className="relative w-full aspect-video overflow-hidden rounded-2xl border bg-gray-50">
          <Image
            src="/next.svg"
            alt="O nas"
            fill
            className="object-contain p-10 dark:invert"
          />
        </div>
      </section>

      {/* LATEST ARTICLES */}
      <section id="najnowsze" className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold">
            Najnowsze artykuły
          </h2>
          <Link href="#" className="text-sm text-gray-600 hover:text-gray-900">
            Zobacz wszystko
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <article
              key={i}
              className="rounded-xl border overflow-hidden hover:shadow-sm transition-shadow"
            >
              <div className="relative aspect-[16/10] bg-gray-50">
                <Image
                  src="/window.svg"
                  alt={`Artykuł ${i}`}
                  fill
                  className="object-contain p-6"
                />
              </div>
              <div className="p-4 space-y-2">
                <p className="text-xs text-gray-500">Kategoria · 2 dni temu</p>
                <h3 className="font-medium">
                  Tytuł przykładowego artykułu {i}
                </h3>
                <p className="text-sm text-gray-600">
                  Krótki opis artykułu. Placeholder tekst do wypełnienia
                  treścią.
                </p>
                <Link
                  href="#"
                  className="text-sm font-medium text-gray-900 hover:underline"
                >
                  Czytaj dalej →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} Nasz Blog. Wszelkie prawa zastrzeżone.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-gray-900">
              Polityka prywatności
            </Link>
            <Link href="#" className="hover:text-gray-900">
              Kontakt
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
