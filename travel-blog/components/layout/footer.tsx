const Footer = () => {
  const YEAR = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 mt-10 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-8 text-sm font-sans text-gray-600 dark:text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>
          © <span suppressHydrationWarning>{YEAR}</span> Nasz Blog. Wszelkie
          prawa zastrzeżone.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-sans"
          >
            Polityka prywatności
          </a>
          <a
            href="#"
            className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-sans"
          >
            Kontakt
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
