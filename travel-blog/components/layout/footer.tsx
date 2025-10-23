import { Facebook, Youtube, Instagram } from "lucide-react";

const Footer = function Footer() {
  const YEAR = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 mt-10 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* GŁÓWNA ZAWARTOŚĆ FOOTERU */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* O NAS */}
          <div>
            <h3 className="text-lg font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Nasz Blog
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Dzielimy się naszymi podróżami, przepisami kulinarnymi i
              praktycznymi poradami z różnych zakątków świata. Dołącz do nas w
              tej przygodzie!
            </p>
            {/* SOCIAL MEDIA */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-sans text-gray-600 dark:text-gray-400">
                Śledź nas:
              </span>
              <div className="flex items-center space-x-3">
                {/* FACEBOOK */}
                <a
                  href="https://facebook.com/naszblog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4 text-white" />
                </a>

                {/* YOUTUBE */}
                <a
                  href="https://youtube.com/@naszblog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4 text-white" />
                </a>

                {/* INSTAGRAM */}
                <a
                  href="https://instagram.com/naszblog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4 text-white" />
                </a>
              </div>
            </div>
          </div>

          {/* LINKI PRAWNE */}
          <div className="text-center md:text-right">
            <h4 className="text-sm font-sans font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Przydatne linki
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/polityka-prywatnosci"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-sans"
                >
                  Polityka prywatności
                </a>
              </li>
              <li>
                <a
                  href="/regulamin"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-sans"
                >
                  Regulamin
                </a>
              </li>
              <li>
                <a
                  href="/kontakt"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-sans"
                >
                  Kontakt
                </a>
              </li>
              <li>
                <a
                  href="/wsparcie"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-sans"
                >
                  Wsparcie
                </a>
              </li>
              <li>
                <a
                  href="/polityka-cookies"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-sans"
                >
                  Polityka cookies
                </a>
              </li>
              <li>
                <a
                  href="/ustawienia-cookies"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-sans"
                >
                  Ustawienia cookies
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* DOLNA LINIA FOOTERU */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-sans text-gray-600 dark:text-gray-400">
              © <span suppressHydrationWarning>{YEAR}</span> Nasz Blog.
              Wszelkie prawa zastrzeżone.
            </p>
            <p className="text-xs font-sans text-gray-500 dark:text-gray-500">
              Stworzone z ❤️ dla podróżników
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
