import Image from "next/image";
import Link from "next/link";
import HeroBanner from "@/components/sections/HeroBanner";
import BackgroundHeroBanner from "@/components/sections/BackgroundHeroBanner";
import { heroTestData, backgroundHeroTestData } from "@/lib/hero-test-data";

export default function Home() {
  return (
    <div className="min-h-screen font-sans text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900">
      <BackgroundHeroBanner data={backgroundHeroTestData} />

      {/* CATEGORIES */}
      <section
        id="kategorie"
        className="mx-auto max-w-7xl px-6 py-12 md:py-16"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <h2 className="text-2xl md:text-3xl font-serif font-semibold mb-6 text-gray-900 dark:text-gray-100">
          Kategorie artykułów
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {["Przygoda", "Kuchnia", "Kultura", "Natura"].map((name) => (
            <Link
              key={name}
              href="#"
              className="group rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-sm transition-shadow"
              style={{ backgroundColor: "var(--color-card)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans font-medium text-gray-900 dark:text-gray-100">
                    {name}
                  </p>
                  <p className="text-sm font-sans text-gray-600 dark:text-gray-400">
                    Krótki opis kategorii
                  </p>
                </div>
                <Image
                  src="/file.svg"
                  alt="Ikona"
                  width={28}
                  height={28}
                  className="opacity-70 group-hover:opacity-100 dark:invert"
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
          <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 dark:text-gray-100">
            Kim jesteśmy
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Jesteśmy parą, która kocha podróże. To miejsce to nasz dziennik
            wypraw i inspiracji. Teksty i zdjęcia są przykładowe – placeholder.
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Docelowo tu pojawi się prawdziwy content: krótkie bio, zdjęcia,
            linki do social mediów.
          </p>
          <Link
            href="#kontakt"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-sans text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 w-fit transition-colors"
          >
            Skontaktuj się
          </Link>
        </div>
        <div className="relative w-full aspect-video overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
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
          <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 dark:text-gray-100">
            Najnowsze artykuły
          </h2>
          <Link
            href="#"
            className="text-sm font-sans text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Zobacz wszystko
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <article
              key={i}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden hover:shadow-sm transition-shadow"
            >
              <div className="relative aspect-[16/10] bg-gray-50 dark:bg-gray-700">
                <Image
                  src="/window.svg"
                  alt={`Artykuł ${i}`}
                  fill
                  className="object-contain p-6 dark:invert"
                />
              </div>
              <div className="p-4 space-y-2">
                <p className="text-xs font-sans text-gray-500 dark:text-gray-400">
                  Kategoria · 2 dni temu
                </p>
                <h3 className="font-sans font-medium text-gray-900 dark:text-gray-100">
                  Tytuł przykładowego artykułu {i}
                </h3>
                <p className="text-sm font-sans text-gray-600 dark:text-gray-300">
                  Krótki opis artykułu. Placeholder tekst do wypełnienia
                  treścią.
                </p>
                <Link
                  href="#"
                  className="text-sm font-sans font-medium text-gray-900 dark:text-gray-100 hover:underline"
                >
                  Czytaj dalej →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FOOTER przeniesiony globalnie do layoutu */}
    </div>
  );
}
