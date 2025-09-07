const Footer = () => {
  const YEAR = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-100 mt-10">
      <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>
          © <span suppressHydrationWarning>{YEAR}</span> Nasz Blog. Wszelkie
          prawa zastrzeżone.
        </p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-gray-900">
            Polityka prywatności
          </a>
          <a href="#" className="hover:text-gray-900">
            Kontakt
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
