import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import InfoCard from "@/components/shared/InfoCard";
import BackToHome from "@/components/shared/BackToHome";
import Link from "@/components/ui/Link";

export default function PolitykaCookies() {
  return (
    <PageLayout maxWidth="4xl">
      <PageHeader
        title="Polityka cookies"
        subtitle="Informacje o używaniu plików cookies na naszej stronie"
      />

      <div className="space-y-8">
        {/* Wprowadzenie */}
        <InfoCard variant="blue">
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100">
              Co to są pliki cookies?
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Pliki cookies to małe pliki tekstowe, które są zapisywane na Twoim
              urządzeniu (komputerze, telefonie, tablecie) podczas odwiedzania
              stron internetowych. Pomagają one stronom internetowym zapamiętać
              informacje o Twojej wizycie, takie jak preferencje językowe i inne
              ustawienia.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Na naszej stronie używamy plików cookies, aby zapewnić Ci
              najlepsze doświadczenia podczas przeglądania i aby strona działała
              prawidłowo.
            </p>
          </div>
        </InfoCard>

        {/* Rodzaje cookies */}
        <InfoCard variant="green">
          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100">
              Jakie pliki cookies używamy?
            </h2>

            <div className="space-y-6">
              {/* Niezbędne cookies */}
              <div>
                <h3 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  🍪 Niezbędne cookies
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Te pliki cookies są absolutnie niezbędne do prawidłowego
                  funkcjonowania naszej strony internetowej. Nie można ich
                  wyłączyć, ponieważ są wymagane do podstawowych funkcji.
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Przykłady użycia:
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Przechowywanie preferencji motywu (jasny/ciemny)</li>
                    <li>• Zarządzanie sesją użytkownika</li>
                    <li>• Zabezpieczenia i ochrona przed atakami</li>
                    <li>• Podstawowa funkcjonalność nawigacji</li>
                    <li>• Zapamiętywanie ustawień cookies</li>
                  </ul>
                </div>
              </div>

              {/* Analityczne cookies */}
              <div>
                <h3 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  📊 Analityczne cookies
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Te pliki cookies pomagają nam zrozumieć, jak odwiedzający
                  wchodzą w interakcję ze stroną internetową, dostarczając
                  informacji o odwiedzonych stronach i problemach, które mogą
                  napotkać.
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Przykłady użycia:
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Vercel Analytics - analiza ruchu na stronie i metryki wydajności</li>
                    <li>• Google Analytics - analiza ruchu na stronie</li>
                    <li>• Statystyki odwiedzin i popularności treści</li>
                    <li>• Identyfikacja problemów technicznych</li>
                    <li>• Optymalizacja wydajności strony</li>
                    <li>• Zrozumienie preferencji użytkowników</li>
                  </ul>
                </div>
              </div>

              {/* Marketingowe cookies */}
              <div>
                <h3 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  🎯 Marketingowe cookies
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Te pliki cookies są używane do wyświetlania reklam, które są
                  bardziej odpowiednie dla Ciebie i Twoich zainteresowań. Mogą
                  być również używane do ograniczenia liczby wyświetlanych
                  reklam.
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Przykłady użycia:
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Spersonalizowane reklamy</li>
                    <li>• Śledzenie konwersji</li>
                    <li>• Retargeting (ponowne wyświetlanie reklam)</li>
                    <li>• Integracje z mediami społecznościowymi</li>
                    <li>• Pomiar skuteczności kampanii reklamowych</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </InfoCard>

        {/* Zarządzanie cookies */}
        <InfoCard variant="yellow">
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100">
              Jak zarządzać plikami cookies?
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Możesz zarządzać swoimi preferencjami dotyczącymi plików cookies
              na kilka sposobów:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-serif font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Na naszej stronie
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Użyj naszego bannera cookies lub przejdź do
                  <Link href="/ustawienia-cookies" className="mx-1">
                    ustawień cookies
                  </Link>
                  , aby dostosować swoje preferencje.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-serif font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  W przeglądarce
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Większość przeglądarek pozwala na kontrolowanie plików cookies
                  przez ustawienia prywatności. Możesz ustawić przeglądarkę tak,
                  aby blokowała pliki cookies lub powiadamiała Cię, gdy są one
                  wysyłane.
                </p>
              </div>
            </div>
          </div>
        </InfoCard>

        {/* Prawne podstawy */}
        <InfoCard variant="red">
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100">
              Prawne podstawy przetwarzania
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Przetwarzanie plików cookies odbywa się na podstawie:
            </p>
            <ul className="text-gray-600 dark:text-gray-300 space-y-2">
              <li>
                • <strong>Niezbędne cookies:</strong> Prawnie uzasadniony
                interes (art. 6 ust. 1 lit. f RODO)
              </li>
              <li>
                • <strong>Analityczne cookies:</strong> Twoja zgoda (art. 6 ust.
                1 lit. a RODO)
              </li>
              <li>
                • <strong>Marketingowe cookies:</strong> Twoja zgoda (art. 6
                ust. 1 lit. a RODO)
              </li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300">
              Masz prawo do cofnięcia zgody w każdej chwili. Cofnięcie zgody nie
              wpływa na zgodność z prawem przetwarzania, którego dokonano na
              podstawie zgody przed jej cofnięciem.
            </p>
          </div>
        </InfoCard>

        {/* Kontakt */}
        <InfoCard variant="gray">
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100">
              Kontakt
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Jeśli masz pytania dotyczące naszej polityki cookies lub chcesz
              skorzystać ze swoich praw, skontaktuj się z nami:
            </p>
            <div className="space-y-2 text-gray-600 dark:text-gray-300">
              <p>
                📧 Email:{" "}
                <Link href="mailto:kontakt@nasz-blog.pl" external>
                  kontakt@nasz-blog.pl
                </Link>
              </p>
              <p>
                📄 <Link href="/kontakt">Formularz kontaktowy</Link>
              </p>
            </div>
          </div>
        </InfoCard>

        {/* Aktualizacje */}
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Aktualizacje tej polityki
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Możemy aktualizować tę politykę cookies od czasu do czasu. Wszelkie
            zmiany będą publikowane na tej stronie z datą ostatniej
            aktualizacji. Zachęcamy do regularnego sprawdzania tej strony.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Ostatnia aktualizacja: {new Date().toLocaleDateString("pl-PL")}
          </p>
        </div>
      </div>

      <BackToHome className="mt-12" />
    </PageLayout>
  );
}
