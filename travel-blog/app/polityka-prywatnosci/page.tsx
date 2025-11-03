import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import InfoCard from "@/components/shared/InfoCard";
import BackToHome from "@/components/shared/BackToHome";

export default function PolitykaPrywatnosci() {
  return (
    <PageLayout>
      <PageHeader
        title="Polityka Prywatności | RODO"
        subtitle="Informacje o przetwarzaniu danych osobowych na naszym blogu podróżniczym"
      />
      <div className="prose prose-lg max-w-none">
        <InfoCard variant="blue" className="mb-8">
          <h2 className="text-xl font-serif font-semibold mb-3">
            Drodzy czytelnicy, subskrybenci, fani bloga
          </h2>
          <p>
            W związku ze zmianami prawnymi wynikającymi z Rozporządzenia PE i
            Rady (UE) 2016/679 z dnia 27.04.2016r. w sprawie ochrony osób
            fizycznych w związku z przetwarzaniem danych osobowych i w sprawie
            swobodnego przepływu takich danych oraz uchylenia dyrektywy 95/46/WE
            (dalej &quot;RODO&quot;) oraz by zapewnić Wam pełną wiedzę na temat
            przetwarzanych przez nas danych, chcielibyśmy poinformować, że Wasze
            dane osobowe znajdują się w naszej bazie.
          </p>
        </InfoCard>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Administrator danych
          </h2>
          <InfoCard variant="gray">
            <p className="mb-2">
              <strong>Nazwa:</strong> Nasz Blog - Blog Podróżniczy
            </p>
            <p className="mb-2">
              <strong>Adres:</strong> [Wpisz swój adres]
            </p>
            <p className="mb-2">
              <strong>NIP:</strong> [Wpisz swój NIP]
            </p>
            <p>
              <strong>E-mail:</strong> kontakt@naszblog.pl
            </p>
          </InfoCard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Jakie dane przetwarzamy?
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Dane te pozyskaliśmy od Was podczas:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
            <li>Zapisu do bezpłatnego newslettera</li>
            <li>Udzielenia komentarza pod wpisem na blogu</li>
            <li>Kontaktu przez formularz kontaktowy</li>
            <li>Korzystania z naszych usług</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Przetwarzamy następujące dane:</strong> imię, nazwisko,
            adres e-mail, adres IP, dane dotyczące aktywności na stronie (w
            ramach plików cookies).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Cel przetwarzania danych
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Przetwarzamy Wasze dane w celu:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
            <li>
              Dostarczania aktualnych informacji dotyczących promocji
              turystycznych
            </li>
            <li>
              Wysyłania najnowszych artykułów na blogu i filmów na kanale
              YouTube w formie newslettera
            </li>
            <li>
              Odpowiadania na komentarze pozostawione pod wpisami na blogu
            </li>
            <li>Analizy ruchu na stronie internetowej (Google Analytics)</li>
            <li>Wyświetlania reklam dopasowanych do Twoich zainteresowań</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Podstawa prawna
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              <strong>Art. 6 ust. 1 lit. a RODO</strong> - zgoda na
              przetwarzanie danych osobowych (newsletter, komentarze, formularz
              kontaktowy)
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              <strong>Art. 6 ust. 1 lit. f RODO</strong> - prawnie uzasadniony
              interes administratora (analiza ruchu na stronie, bezpieczeństwo)
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Art. 6 ust. 1 lit. b RODO</strong> - wykonanie umowy
              (świadczenie usług)
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Newsletter
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            W przypadku subskrypcji newslettera użytkownik podaje dane: imię i
            adres e-mail, na który przesyłane będą informacje o nowych wpisach
            lub informacje handlowe. Z newslettera można zrezygnować w każdej
            chwili klikając link anulujący subskrypcję znajdujący się w stopce
            każdego newslettera.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>Uwaga:</strong> Kierowane do Was informacje nie noszą
              znamion ofert sprzedażowych w rozumieniu prawa handlowego. W
              newsletterze mogą zostać umieszczane linki do materiałów
              zewnętrznych, mających charakter afiliacyjny Partnerów.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Pliki Cookies
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Przeglądanie Serwisu nie wymaga podawania danych osobowych, lecz
            może się wiązać z korzystaniem z plików Cookies, w zależności od
            ustawień, jakich dokonał Użytkownik. Użytkownik może nie wyrazić
            zgody na umieszczanie na jego komputerze &quot;Ciasteczek&quot;
            m.in. za pomocą ustawień przeglądarki.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Używamy plików cookies do: analizy ruchu na stronie (Google
            Analytics), wyświetlania reklam (Google Ads), zapamiętywania
            preferencji użytkownika.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Przekazywanie danych
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Wasze dane osobowe mogą być przekazywane naszym podwykonawcom:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
            <li>
              <strong>Google LLC</strong> - usługa Google Analytics i Google Ads
            </li>
            <li>
              <strong>Dostawcy hostingu</strong> - przechowywanie danych na
              serwerach
            </li>
            <li>
              <strong>Dostawcy usług email marketing</strong> - wysyłanie
              newsletterów
            </li>
            <li>
              <strong>Partnerzy afiliacyjni</strong> - w przypadku kliknięcia w
              linki partnerskie
            </li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 mt-4">
            Dane przekazywane poza Europejski Obszar Gospodarczy są chronione
            odpowiednimi zabezpieczeniami prawnymi (standardowe klauzule
            umowne).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Twoje prawa
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Dostęp do danych
              </h3>
              <p className="text-green-800 dark:text-green-200 text-sm">
                Możesz żądać informacji o przetwarzanych danych
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Sprostowanie
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                Możesz żądać poprawienia nieprawidłowych danych
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                Usunięcie
              </h3>
              <p className="text-red-800 dark:text-red-200 text-sm">
                Możesz żądać usunięcia swoich danych
              </p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                Sprzeciw
              </h3>
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                Możesz sprzeciwić się przetwarzaniu danych
              </p>
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mt-4">
            Przysługuje Wam także prawo wniesienia skargi do organu nadzorczego
            zajmującego się ochroną danych osobowych, gdy uznacie, że
            przetwarzanie Waszych danych osobowych narusza przepisy prawa
            polskiego.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Okres przechowywania
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Wasze dane przetwarzane są na zasadzie dobrowolności i będą
            przechowywane tylko do momentu złożenia przez Was sprzeciwu wobec
            przetwarzania danych lub zgłoszenia żądania ich usunięcia. Dane
            analityczne przechowywane są przez okres 26 miesięcy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Bezpieczeństwo
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Przykładamy dużą wagę do ochrony Waszej prywatności. Pragniemy
            zapewnić, że traktujemy Wasze dane ze starannością i uwzględnieniem
            zobowiązań wynikających z obowiązujących przepisów dotyczących
            ochrony danych osobowych.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Kontakt
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              W każdej sprawie dotyczącej przetwarzania danych osobowych można
              się z nami skontaktować:
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              <strong>E-mail:</strong> kontakt@naszblog.pl
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Telefon:</strong> [Wpisz swój numer telefonu]
            </p>
          </div>
        </section>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Ostatnia aktualizacja: {new Date().toLocaleDateString("pl-PL")}
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Wyrażenie zgody jest dobrowolne i wiąże się z akceptacją powyższej
            polityki prywatności. W każdej chwili można ją wycofać, kierując
            informację na adres kontakt@naszblog.pl
          </p>
        </div>
      </div>

      <BackToHome className="mt-12" />
    </PageLayout>
  );
}
