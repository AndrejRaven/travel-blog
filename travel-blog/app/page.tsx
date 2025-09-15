import Image from "next/image";
import Link from "next/link";
import BackgroundHeroBanner from "@/components/sections/BackgroundHeroBanner";
import InstagramSection from "@/components/sections/InstagramSection";
import EmbedYoutube from "@/components/sections/EmbedYoutube";
import Newsletter from "@/components/sections/Newsletter";
import Button from "@/components/ui/Button";
import CustomLink from "@/components/ui/Link";
import SectionHeader from "@/components/shared/SectionHeader";
import Popup from "@/components/ui/Popup";
import { backgroundHeroTestData } from "@/lib/hero-test-data";

export default function Home() {
  return (
    <div className="min-h-screen font-sans text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900">
      <BackgroundHeroBanner data={backgroundHeroTestData} />

      {/* MAIN CONTENT WITH ASIDE */}
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* MAIN CONTENT - 75% */}
          <div className="lg:col-span-3 space-y-12">
            {/* LATEST ARTICLES */}
            <section id="najnowsze" className="mx-auto max-w-7xl px-6">
              <div className="flex items-end justify-between mb-6">
                <SectionHeader title="Najnowsze artykuły" />
                <CustomLink href="#" variant="underline">
                  Zobacz wszystko
                </CustomLink>
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
                      <CustomLink href="#" variant="arrow">
                        Czytaj dalej
                      </CustomLink>
                    </div>
                  </article>
                ))}
              </div>
            </section>
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

            {/* INSTAGRAM SECTION */}
            <InstagramSection />

            {/* YOUTUBE SECTION */}
            <EmbedYoutube
              videoId="latest"
              title="Zobacz nasz najnowszy film"
              description="Odkryj najpiękniejsze miejsca z naszych podróży w najnowszym filmie na YouTube! 🎬 Zasubskrybuj nasz kanał i kliknij dzwoneczek 🔔, aby nie przegapić żadnej przygody!"
            />

            {/* NEWSLETTER SECTION */}
            <Newsletter />
          </div>

          {/* ASIDE - 25% */}
          <aside className="lg:col-span-1 space-y-6">
            {/* ABOUT US */}
            <section
              id="o-nas"
              className="rounded-xl border border-gray-200 dark:border-gray-700 p-6"
              style={{ backgroundColor: "var(--color-card)" }}
            >
              <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Kim jesteśmy
              </h2>

              {/* ZDJĘCIE */}
              <div className="relative w-full aspect-square overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 mb-4">
                <Image
                  src="/demo-images/demo-asset.png"
                  alt="O nas - para podróżników"
                  fill
                  className="object-cover"
                />
              </div>

              {/* OPIS */}
              <div className="space-y-3 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Jesteśmy Aga i Andrej - para, która od kilku lat przemierza
                  świat w poszukiwaniu najpiękniejszych miejsc i
                  najsmaczniejszych potraw. Nasze podróże to nie tylko
                  zwiedzanie, ale przede wszystkim poznawanie lokalnych kultur i
                  tradycji.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Na tym blogu dzielimy się naszymi doświadczeniami,
                  praktycznymi poradami podróżniczymi oraz przepisami
                  kulinarnymi z różnych zakątków świata. Każda podróż to nowa
                  historia do opowiedzenia.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Dołącz do nas w tej podróży pełnej przygód, smaków i
                  niezapomnianych wspomnień!
                </p>
              </div>

              <Button
                href="#kontakt"
                variant="outline"
                className="w-full text-xs px-3 py-2"
              >
                Skontaktuj się z nami
              </Button>
            </section>

            {/* YOUTUBE CHANNEL */}
            <section
              className="rounded-xl border border-gray-200 dark:border-gray-700 p-6"
              style={{ backgroundColor: "var(--color-card)" }}
            >
              <h3 className="text-lg font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Nasz kanał YouTube
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-sans font-medium text-gray-900 dark:text-gray-100 text-sm">
                      Nasz Blog
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Podróżnicze filmy
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Obejrzyj nasze najnowsze filmy z podróży i dowiedz się więcej
                  o miejscach, które odwiedzamy.
                </p>
                <Button
                  href="https://www.youtube.com/channel/UCUUm2vkbs-W7KulrJZIpNDA"
                  variant="youtube"
                  external
                  className="w-full text-xs px-3 py-2"
                >
                  Przejdź na kanał
                </Button>
              </div>
            </section>

            {/* SUPPORT SECTION */}
            <section
              className="rounded-xl border border-gray-200 dark:border-gray-700 p-6"
              style={{ backgroundColor: "var(--color-card)" }}
            >
              <h3 className="text-lg font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Wsparcie naszego bloga
              </h3>
              <div className="space-y-4">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Jeśli podoba Ci się nasza treść, możesz nas wesprzeć. Każda
                  złotówka pomaga nam w tworzeniu lepszych artykułów i filmów.
                </p>

                {/* BUY ME A COFFEE */}
                <Button
                  href="https://buymeacoffee.com/naszblog"
                  variant="outline"
                  external
                  className="w-full text-xs px-3 py-2 flex items-center justify-center space-x-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.5 3h-17C2.67 3 2 3.67 2 4.5v15C2 20.33 2.67 21 3.5 21h17c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5zm-17 1h17v15h-17v-15z" />
                    <path d="M6 8h12v1H6V8zm0 2h12v1H6v-1zm0 2h8v1H6v-1z" />
                  </svg>
                  <span>Buy Me a Coffee</span>
                </Button>

                {/* PATRONITE */}
                <Button
                  href="https://patronite.pl/naszblog"
                  variant="outline"
                  external
                  className="w-full text-xs px-3 py-2 flex items-center justify-center space-x-2"
                >
                  <Image
                    src="/patronite.svg"
                    alt="Patronite"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                  <span>Patronite</span>
                </Button>

                {/* REVOLUT */}
                <Button
                  href="https://revolut.com"
                  variant="outline"
                  external
                  className="w-full text-xs px-3 py-2 flex items-center justify-center space-x-2"
                >
                  <Image
                    src="/revolut.svg"
                    alt="Revolut"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                  <span>Revolut</span>
                </Button>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Dziękujemy za wsparcie! ❤️
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* FOOTER przeniesiony globalnie do layoutu */}

      {/* POPUP DEMO - pojawia się po przewinięciu 60% strony, cooldown 60 minut */}
      <Popup scrollThreshold={60} cooldownMinutes={60} />
    </div>
  );
}
