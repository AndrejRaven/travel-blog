import Link from "next/link";
import Image from "next/image";

const Header = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={50}
            height={50}
            className="rounded-full border-2 border-foreground"
          />
        </Link>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link href="/" className="hover:text-blue-600">
                Strona główna
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-blue-600">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/o-nas" className="hover:text-blue-600">
                O nas
              </Link>
            </li>
            <li>
              <Link href="/kontakt" className="hover:text-blue-600">
                Kontakt
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
