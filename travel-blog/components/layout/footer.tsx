const Footer = () => {
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
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* YOUTUBE */}
                <a
                  href="https://youtube.com/@naszblog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                  aria-label="YouTube"
                >
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>

                {/* INSTAGRAM */}
                <a
                  href="https://instagram.com/naszblog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all"
                  aria-label="Instagram"
                >
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.281c-.49 0-.98-.49-.98-.98s.49-.98.98-.98.98.49.98.98-.49.98-.98.98zm-7.83 1.297c-2.026 0-3.323 1.297-3.323 3.323s1.297 3.323 3.323 3.323 3.323-1.297 3.323-3.323-1.297-3.323-3.323-3.323z" />
                  </svg>
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
            </ul>
          </div>
        </div>

        {/* DOLNA LINIA FOOTERU */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-sans text-gray-600 dark:text-gray-400">
              © <span suppressHydrationWarning>{YEAR}</span> Nasz Blog. Wszelkie
              prawa zastrzeżone.
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
