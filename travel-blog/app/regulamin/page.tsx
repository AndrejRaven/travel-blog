import Link from "@/components/ui/Link";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import InfoCard from "@/components/shared/InfoCard";
import BackToHome from "@/components/shared/BackToHome";

export default function Regulamin() {
  return (
    <PageLayout>
      <PageHeader
        title="Regulamin"
        subtitle="Regulamin korzystania z bloga podróżniczego Nasz Blog"
      />
      <div className="prose prose-lg max-w-none">
        <InfoCard variant="blue" className="mb-8">
          <h2 className="text-xl font-serif font-semibold mb-3">
            Informacje podstawowe
          </h2>
          <p>
            Niniejszy regulamin określa zasady korzystania z bloga podróżniczego
            &quot;Nasz Blog&quot; dostępnego pod adresem [Wpisz swój adres
            domeny]. Korzystanie z bloga oznacza akceptację postanowień
            niniejszego regulaminu.
          </p>
        </InfoCard>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            § 1. Definicje
          </h2>
          <InfoCard variant="gray">
            <ul className="space-y-3">
              <li>
                <strong>Blog</strong> - strona internetowa dostępna pod adresem
                [Wpisz swój adres domeny]
              </li>
              <li>
                <strong>Użytkownik</strong> - osoba fizyczna, prawna lub
                jednostka organizacyjna nieposiadająca osobowości prawnej,
                korzystająca z Blogu
              </li>
              <li>
                <strong>Administrator</strong> - właściciel i administrator
                Blogu
              </li>
              <li>
                <strong>Treści</strong> - wszystkie materiały zamieszczone na
                Blogu, w tym artykuły, zdjęcia, filmy, komentarze
              </li>
              <li>
                <strong>Newsletter</strong> - bezpłatna usługa informacyjna
                wysyłana drogą elektroniczną
              </li>
            </ul>
          </InfoCard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            § 2. Postanowienia ogólne
          </h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              1. Blog &quot;Nasz Blog&quot; jest blogiem podróżniczym
              prowadzonym przez [Wpisz swoje imię i nazwisko] z siedzibą w
              [Wpisz swój adres].
            </p>
            <p>
              2. Celem Blogu jest dzielenie się doświadczeniami podróżniczymi,
              informacjami o miejscach wartych odwiedzenia oraz inspirowanie do
              podróży.
            </p>
            <p>
              3. Administrator zastrzega sobie prawo do zmiany treści Regulaminu
              w każdym czasie. O zmianach Użytkownicy będą informowani poprzez
              zamieszczenie nowej wersji na stronie Blogu.
            </p>
            <p>
              4. W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie
              mają przepisy prawa polskiego.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            § 3. Zasady korzystania z Blogu
          </h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              1. Użytkownik może korzystać z Blogu w sposób zgodny z prawem,
              dobrymi obyczajami oraz postanowieniami niniejszego Regulaminu.
            </p>
            <p>2. Zabrania się:</p>
            <ul className="list-disc list-inside ml-6 space-y-2">
              <li>
                zamieszczania treści niezgodnych z prawem, wulgarnych,
                obraźliwych lub naruszających dobra osobiste
              </li>
              <li>
                prób włamania się do systemu lub naruszania jego bezpieczeństwa
              </li>
              <li>
                używania automatycznych programów do pobierania treści (botów,
                crawlerów) bez zgody Administratora
              </li>
              <li>
                kopiowania, rozpowszechniania lub modyfikowania treści Blogu bez
                zgody Administratora
              </li>
              <li>
                zamieszczania spamu, reklam lub treści komercyjnych bez zgody
                Administratora
              </li>
            </ul>
            <p>
              3. Użytkownik ponosi pełną odpowiedzialność za treści zamieszczone
              przez siebie na Blogu.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            § 4. Prawa autorskie
          </h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              1. Wszystkie treści zamieszczone na Blogu, w tym teksty, zdjęcia,
              filmy, grafiki, są chronione prawem autorskim i stanowią własność
              Administratora lub osób trzecich.
            </p>
            <p>2. Użytkownik może:</p>
            <ul className="list-disc list-inside ml-6 space-y-2">
              <li>przeglądać treści Blogu w celach osobistych</li>
              <li>
                udostępniać linki do artykułów w mediach społecznościowych
              </li>
              <li>
                cytować fragmenty artykułów z podaniem źródła i linku do
                oryginalnego artykułu
              </li>
            </ul>
            <p>3. Zabrania się:</p>
            <ul className="list-disc list-inside ml-6 space-y-2">
              <li>kopiowania całych artykułów lub ich znaczących fragmentów</li>
              <li>używania zdjęć bez zgody Administratora</li>
              <li>
                publikowania treści Blogu na innych stronach internetowych
              </li>
              <li>
                używania treści w celach komercyjnych bez zgody Administratora
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            § 5. Komentarze
          </h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              1. Użytkownicy mogą zamieszczać komentarze pod artykułami na
              Blogu.
            </p>
            <p>2. Komentarze muszą być:</p>
            <ul className="list-disc list-inside ml-6 space-y-2">
              <li>zgodne z prawem i dobrymi obyczajami</li>
              <li>związane z tematem artykułu</li>
              <li>konstruktywne i merytoryczne</li>
              <li>pozbawione treści obraźliwych, wulgarnych lub spamowych</li>
            </ul>
            <p>3. Administrator zastrzega sobie prawo do:</p>
            <ul className="list-disc list-inside ml-6 space-y-2">
              <li>moderowania komentarzy przed publikacją</li>
              <li>usuwania komentarzy naruszających Regulamin</li>
              <li>blokowania Użytkowników naruszających zasady</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            § 6. Newsletter
          </h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              1. Użytkownik może zapisać się do bezpłatnego newslettera, podając
              swój adres e-mail.
            </p>
            <p>2. Newsletter zawiera:</p>
            <ul className="list-disc list-inside ml-6 space-y-2">
              <li>informacje o nowych artykułach na Blogu</li>
              <li>najlepsze treści z poprzedniego tygodnia</li>
              <li>promocje i okazje podróżnicze</li>
              <li>informacje o nowych filmach na kanale YouTube</li>
            </ul>
            <p>
              3. Użytkownik może zrezygnować z newslettera w każdej chwili,
              klikając link &quot;Wypisz się&quot; znajdujący się w stopce
              każdego e-maila.
            </p>
            <p>4. Newsletter wysyłany jest maksymalnie raz w tygodniu.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            § 7. Współpraca i reklamy
          </h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              1. Blog może zawierać treści sponsorowane, reklamy oraz linki
              afiliacyjne.
            </p>
            <p>
              2. Wszystkie treści sponsorowane są wyraźnie oznaczone jako
              &quot;materiał sponsorowany&quot; lub &quot;współpraca&quot;.
            </p>
            <p>
              3. Linki afiliacyjne to linki do produktów lub usług, za które
              Administrator może otrzymać prowizję, nie wpływając na cenę dla
              Użytkownika.
            </p>
            <p>4. Administrator zobowiązuje się do:</p>
            <ul className="list-disc list-inside ml-6 space-y-2">
              <li>rekomendowania tylko sprawdzonych produktów i usług</li>
              <li>uczciwego przedstawiania swoich doświadczeń</li>
              <li>wyraźnego oznaczania treści sponsorowanych</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            § 8. Odpowiedzialność
          </h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              1. Administrator dołoży wszelkich starań, aby informacje na Blogu
              były aktualne i rzetelne, jednak nie ponosi odpowiedzialności za
              ich kompletność i aktualność.
            </p>
            <p>2. Administrator nie ponosi odpowiedzialności za:</p>
            <ul className="list-disc list-inside ml-6 space-y-2">
              <li>
                szkody wynikające z korzystania z informacji zamieszczonych na
                Blogu
              </li>
              <li>działania Użytkowników na Blogu</li>
              <li>treści zamieszczone przez Użytkowników w komentarzach</li>
              <li>dostępność Blogu w każdym momencie</li>
              <li>działanie linków zewnętrznych</li>
            </ul>
            <p>3. Użytkownik korzysta z Blogu na własną odpowiedzialność.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            § 9. Ochrona danych osobowych
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Szczegółowe informacje dotyczące przetwarzania danych osobowych
              znajdują się w{" "}
              <Link href="/polityka-prywatnosci" variant="underline">
                Polityce Prywatności
              </Link>
              .
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Administrator przetwarza dane osobowe Użytkowników zgodnie z
              obowiązującymi przepisami RODO oraz ustawy o ochronie danych
              osobowych.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            § 10. Postanowienia końcowe
          </h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>1. Regulamin wchodzi w życie z dniem [Wpisz datę].</p>
            <p>
              2. W przypadku naruszenia postanowień Regulaminu, Administrator
              może:
            </p>
            <ul className="list-disc list-inside ml-6 space-y-2">
              <li>usunąć treści naruszające Regulamin</li>
              <li>zablokować dostęp Użytkownika do Blogu</li>
              <li>wystąpić z roszczeniami cywilnoprawnymi</li>
            </ul>
            <p>
              3. Wszelkie spory wynikające z korzystania z Blogu będą
              rozstrzygane przez sądy właściwe dla siedziby Administratora.
            </p>
            <p>
              4. Administrator zastrzega sobie prawo do zmiany Regulaminu w
              każdym czasie. O zmianach Użytkownicy będą informowani poprzez
              zamieszczenie nowej wersji na stronie Blogu.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Kontakt
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              W sprawach związanych z Regulaminem można się z nami skontaktować:
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              <strong>E-mail:</strong> kontakt@naszblog.pl
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              <strong>Telefon:</strong> [Wpisz swój numer telefonu]
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Adres:</strong> [Wpisz swój adres]
            </p>
          </div>
        </section>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Ostatnia aktualizacja: {new Date().toLocaleDateString("pl-PL")}
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Niniejszy Regulamin jest dostępny na stronie Blogu w sposób
            umożliwiający jego pobranie, odtworzenie i utrwalenie.
          </p>
        </div>
      </div>

      <BackToHome className="mt-12" />
    </PageLayout>
  );
}
