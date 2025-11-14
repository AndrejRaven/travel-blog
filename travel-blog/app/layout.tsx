import type { Metadata } from "next";
import { Inter, Playfair_Display, Source_Code_Pro } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import NavigationProgressProvider from "@/components/providers/NavigationProgressProvider";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import CookieBanner from "@/components/ui/CookieBanner";
import ScrollToTop from "@/components/ui/ScrollToTop";
import TopLoadingBar from "@/components/ui/TopLoadingBar";
import NotificationProvider from "@/components/providers/NotificationProvider";
import { ToastContainer } from "@/components/ui/Toast";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const draft = await draftMode();
  const isDraftMode = draft.isEnabled;

  return (
    <html lang="pl">
      <head>
        <meta
          httpEquiv="Permissions-Policy"
          content="autoplay=*, encrypted-media=*, fullscreen=*, accelerometer=*, gyroscope=*, clipboard-write=*, clipboard-read=*"
        />
        <Script
          src="/scripts/theme-init.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${inter.variable} ${playfairDisplay.variable} ${sourceCodePro.variable} antialiased bg-white dark:bg-gray-900`}
      >
        <ThemeProvider>
          <AnalyticsProvider>
            <Suspense fallback={null}>
              <NavigationProgressProvider>
                <NotificationProvider>
                  <TopLoadingBar />
                  <Header />
                  {/* Main content */}
                  {children}
                  <Footer />
                  <CookieBanner />
                  <ScrollToTop />
                  <ToastContainer />
                  {/* Visual Editing - tylko gdy draft mode jest aktywny */}
                  {isDraftMode && <VisualEditing />}
                </NotificationProvider>
              </NavigationProgressProvider>
            </Suspense>
          </AnalyticsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
