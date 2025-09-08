import Image from "next/image";
import Link from "next/link";
import HeroBanner from "@/components/sections/HeroBanner";
import { heroTestData } from "@/lib/hero-test-data";

export default function Home() {
  return (
    <div className="min-h-screen font-sans text-gray-900">
      {/* NAVIGATION przeniesione globalnie do layoutu */}

      {/* HERO */}
      <HeroBanner data={heroTestData} />

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

      {/* FOOTER przeniesiony globalnie do layoutu */}
    </div>
  );
}
