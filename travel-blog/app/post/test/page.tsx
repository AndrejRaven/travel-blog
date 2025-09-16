import Image from "next/image";
import ComponentRenderer from "@/components/ui/ComponentRenderer";
import LatestArticles from "@/components/sections/LatestArticles";
import { PostComponent } from "@/lib/component-types";

export default function TestArticle() {
  // Przykładowe dane z Sanity - w rzeczywistości będą pobierane z API
  const testComponents: PostComponent[] = [
    {
      _type: "textContent",
      _key: "intro",
      content: [
        {
          _type: "block",
          _key: "intro-1",
          style: "normal",
          children: [
            {
              _type: "span",
              _key: "intro-span-1",
              text: 'Tajlandia – czyli jeden z najchętniej odwiedzanych krajów Azji Południowo-Wschodniej. Co roku przyciąga miliony turystów z całego świata. To kraj prawie dwukrotnie większy od Polski, a jego walutą jest baht tajski (we wrześniu 2025 roku 1 baht to około 11 groszy). Jeśli szukacie miejsca na swoją pierwszą „dziką destynację", Tajlandia będzie świetnym wyborem na początek. Jest tanio, smacznie i przepięknie.',
              marks: [],
            },
          ],
        },
      ],
      layout: {
        maxWidth: "4xl",
        padding: "md",
        textSize: "lg",
      },
    },
    {
      _type: "textContent",
      _key: "wizy",
      content: [
        {
          _type: "block",
          _key: "wizy-h2",
          style: "h2",
          children: [
            {
              _type: "span",
              _key: "wizy-title",
              text: "Wizy i szczepienia",
              marks: [],
            },
          ],
        },
        {
          _type: "block",
          _key: "wizy-1",
          style: "normal",
          children: [
            {
              _type: "span",
              _key: "wizy-span-1",
              text: "Jako Polacy jesteśmy dość uprzywilejowani – aby wybrać się do Tajlandii, potrzebujemy właściwie tylko paszportu, trochę złotówek i dobrego humoru. Obowiązuje nas ruch bezwizowy na 60 dni, a od 1 maja 2025 roku dodatkowo trzeba wypełnić TDAC – elektroniczną kartę przyjazdową, w której wpisujemy nasze dane: imię, nazwisko, datę urodzenia, datę przyjazdu i planowaną datę opuszczenia kraju.",
              marks: [],
            },
          ],
        },
      ],
      layout: {
        maxWidth: "4xl",
        padding: "md",
        textSize: "lg",
      },
    },
    {
      _type: "textContent",
      _key: "klimat",
      content: [
        {
          _type: "block",
          _key: "klimat-h2",
          style: "h2",
          children: [
            {
              _type: "span",
              _key: "klimat-title",
              text: "Klimat - kiedy najlepiej się wybrać",
              marks: [],
            },
          ],
        },
        {
          _type: "block",
          _key: "klimat-1",
          style: "normal",
          children: [
            {
              _type: "span",
              _key: "klimat-span-1",
              text: "Tajlandia znajduje się w strefie klimatu zwrotnikowego monsunowego, co oznacza wyraźny podział na porę suchą i deszczową. Najlepsze miesiące na podróż do Tajlandii to listopad–luty, choć warto pamiętać, że jest to wysoki sezon turystyczny. My byliśmy w grudniu i turystów było naprawdę mnóstwo.",
              marks: [],
            },
          ],
        },
      ],
      layout: {
        maxWidth: "4xl",
        padding: "md",
        textSize: "lg",
      },
    },
    {
      _type: "imageCollage",
      _key: "tajlandia-zdjecia",
      images: [
        {
          asset: {
            _id: "main-photo",
            url: "/demo-images/demo-asset.png",
          },
          alt: "Główne zdjęcie z Tajlandii - krajobraz z palmami",
        },
        {
          asset: {
            _id: "thumb1",
            url: "/demo-images/demo-asset1.png",
          },
          alt: "Tajskie jedzenie - pad thai",
        },
        {
          asset: {
            _id: "thumb2",
            url: "/demo-images/demo-asset.png",
          },
          alt: "Świątynia w Bangkoku",
        },
        {
          asset: {
            _id: "thumb3",
            url: "/demo-images/demo-asset1.png",
          },
          alt: "Plaża w Phuket",
        },
        {
          asset: {
            _id: "thumb4",
            url: "/demo-images/demo-asset.png",
          },
          alt: "Tradycyjny targ w Chiang Mai",
        },
      ],
      layout: {
        maxWidth: "4xl",
        thumbnailCount: 4,
      },
    },
  ];

  return (
    <main>
      {/* Meta */}
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-sans text-gray-600 dark:text-gray-400">
          <time dateTime="2025-01-15">15 stycznia 2025</time>
          <span>•</span>
          <span>Podróże</span>
        </div>

        {/* Tytuł */}
        <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight mb-6 text-gray-900 dark:text-gray-100">
          Tajlandia na własną rękę - porady praktyczne
        </h1>

        {/* Okładka */}
        <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 mb-8">
          <Image
            src="/demo-images/demo-asset.png"
            alt="Tajlandia - kraj uśmiechu"
            fill
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Komponenty z Sanity */}
      {testComponents.map((component) => (
        <ComponentRenderer key={component._key} component={component} />
      ))}

      {/* Najnowsze artykuły */}
      <div className="bg-gray-50 dark:bg-gray-900 py-16">
        <LatestArticles />
      </div>
    </main>
  );
}
