import Button from "@/components/ui/Button";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import InfoCard from "@/components/shared/InfoCard";
import BackToHome from "@/components/shared/BackToHome";

export default function Wsparcie() {
  return (
    <PageLayout maxWidth="6xl">
      <PageHeader
        title="Wsparcie naszego bloga"
        subtitle="Pomóż nam tworzyć lepsze treści i kontynuować nasze podróżnicze przygody"
      />
      {/* INTRODUCTION */}
      <div className="text-center mb-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Dlaczego warto nas wesprzeć?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Tworzenie wysokiej jakości treści podróżniczych wymaga czasu, pasji
            i środków. Każde wsparcie pomaga nam w podróżach, tworzeniu lepszych
            artykułów, filmów i inspirowaniu innych do odkrywania świata.
          </p>
          <InfoCard variant="blue">
            <p>
              <strong>Dziękujemy!</strong> Twoje wsparcie oznacza dla nas bardzo
              dużo i motywuje do dalszego dzielenia się naszymi przygodami z
              całym światem.
            </p>
          </InfoCard>
        </div>
      </div>

      {/* SUPPORT METHODS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {/* BUY ME A COFFEE */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center hover:shadow-lg transition-shadow">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20.5 3h-17C2.67 3 2 3.67 2 4.5v15C2 20.33 2.67 21 3.5 21h17c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5zm-17 1h17v15h-17v-15z" />
              <path d="M6 8h12v1H6V8zm0 2h12v1H6v-1zm0 2h8v1H6v-1z" />
            </svg>
          </div>
          <h3 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Buy Coffee
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Postaw nam kawę! To szybki i prosty sposób na wsparcie naszych
            działań.
          </p>
          <Button
            href="https://buycoffee.to/vlogizdrogi"
            variant="outline"
            external
            className="w-full"
          >
            Postaw kawę ☕
          </Button>
        </div>

        {/* PATRONITE */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center hover:shadow-lg transition-shadow">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/patronite.svg" alt="Patronite" className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Patronite
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Zostań naszym patronem i otrzymuj ekskluzywne treści oraz
            podziękowania.
          </p>
          <Button
            href="https://patronite.pl/vlogizdrogi"
            variant="outline"
            external
            className="w-full"
          >
            Zostań patronem 💜
          </Button>
        </div>

        {/* REVOLUT */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center hover:shadow-lg transition-shadow">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/revolut.svg" alt="Revolut" className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Revolut
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Prześlij nam darowiznę przez Revolut - szybko i bezpiecznie.
          </p>
          <Button
            href="https://revolut.me/vlogizdrogi"
            variant="outline"
            external
            className="w-full"
          >
            Prześlij darowiznę 💳
          </Button>
        </div>
      </div>

      {/* HOW WE USE SUPPORT */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 mb-16">
        <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-6 text-center">
          Na co przeznaczamy Twoje wsparcie?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Podróże
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Transport, noclegi, wyżywienie
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Sprzęt
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Kamera, aparat, sprzęt do nagrywania
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Tworzenie treści
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Oprogramowanie, hosting, domeny
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-orange-600 dark:text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Motywacja
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Czas i energia na tworzenie
            </p>
          </div>
        </div>
      </div>

      {/* THANK YOU MESSAGE */}
      <div className="text-center mb-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Dziękujemy za wsparcie!
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Każda złotówka, każdy komentarz i każde udostępnienie to dla nas
            ogromna motywacja do dalszego dzielenia się naszymi przygodami. Bez
            Was nie byłoby tego bloga!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/" variant="primary">
              Zobacz nasze artykuły
            </Button>
            <Button href="/kontakt" variant="outline">
              Skontaktuj się z nami
            </Button>
          </div>
        </div>
      </div>

      <BackToHome className="mt-12" />
    </PageLayout>
  );
}
