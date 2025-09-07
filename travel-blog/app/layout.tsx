import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blog Agnieszki i Andreja",
  description:
    "Witamy na naszym blogu! Tutaj znajdziesz nasze najnowsze wyprawy i informacje o naszych przygodach.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Global Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              {/* Proste logo jako tekst – można podmienić na Image */}
              <span className="text-lg font-semibold">Nasz Blog</span>
            </a>
            <nav className="hidden md:flex items-center gap-8 text-sm">
              <a href="/" className="hover:text-gray-700">
                Start
              </a>
              <a href="#kategorie" className="hover:text-gray-700">
                Kategorie
              </a>
              <a href="#o-nas" className="hover:text-gray-700">
                O nas
              </a>
              <a href="/post/przykladowy-post" className="hover:text-gray-700">
                Artykuł
              </a>
            </nav>
            <div className="md:hidden text-sm">Menu</div>
          </div>
        </header>

        {/* Main content */}
        {children}

        {/* Global Footer */}
        <footer className="border-t border-gray-100 mt-10">
          <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>
              © {new Date().getFullYear()} Nasz Blog. Wszelkie prawa
              zastrzeżone.
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
      </body>
    </html>
  );
}
