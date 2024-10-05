import HeroBanner from "./components/HeroBanner";
import Spacer from "./components/ui/Spacer";
import Cards from "./components/Cards";
import { CustomLink } from "./components/ui/Link";
import { Nav } from "./components/ui/Nav";
const cardData = [
  {
    title: "Karta 1",
    description:
      "Opis karty 1. To jest przykładowy tekst, który pojawi się po najechaniu myszką.",
    imageUrl: "/images/card1.jpg",
  },
  {
    title: "Karta 2",
    description:
      "Opis karty 2. Tutaj możesz umieścić więcej informacji o tej karcie.",
    imageUrl: "/images/card2.jpg",
  },
  {
    title: "Karta 3",
    description:
      "Opis karty 3. Ten tekst będzie widoczny po najechaniu na kartę.",
    imageUrl: "/images/card3.jpg",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroBanner
        backgroundImage="/images/hero-banner.jpg"
        backgroundImageAlt="Hero Banner"
        title="Witaj na naszej stronie"
        subtitle="Odkryj niezwykłe możliwości z nami"
        ctaText="Dowiedz się więcej"
        ctaLink="/o-nas"
      />
      <Nav />
      <Cards cards={cardData} />
      <Spacer size={8} />
      <CustomLink href="/o-nas" variant="default" size="sm">
        O nas a
      </CustomLink>
    </main>
  );
}
