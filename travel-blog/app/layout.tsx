import type { Metadata } from "next";
import { Inter, Playfair_Display, Source_Code_Pro } from "next/font/google";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import CookieBanner from "@/components/ui/CookieBanner";
import ScrollToTop from "@/components/ui/ScrollToTop";
import "./globals.css";

// Font główny - Inter - doskonały do czytania
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Font dla nagłówków - Playfair Display - elegancki i czytelny
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

// Font monospace - Source Code Pro - dla kodu
const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code",
  subsets: ["latin"],
  display: "swap",
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 
                    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  // Fallback do light theme jeśli localStorage nie jest dostępny
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${playfairDisplay.variable} ${sourceCodePro.variable} antialiased`}
      >
        <ThemeProvider>
          <Header />
          {/* Main content */}
          {children}
          <Footer />
          <CookieBanner />
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
