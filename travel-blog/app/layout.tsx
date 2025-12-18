import type { Metadata } from "next";
import { Inter, Playfair_Display, Source_Code_Pro } from "next/font/google";
import Script from "next/script";
import { draftMode } from "next/headers";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ClientShell from "@/components/layout/ClientShell";
import { SITE_CONFIG } from "@/lib/config";
import { buildAlternates, buildOpenGraph, buildAbsoluteUrl } from "@/lib/metadata";
import "./globals.css";

// Font główny - Inter - doskonały do czytania
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: true,
});

// Font dla nagłówków - Playfair Display - elegancki i czytelny
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

// Font monospace - Source Code Pro - dla kodu
const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code",
  subsets: ["latin", "latin-ext"],
  display: "optional",
});

const defaultTitle = SITE_CONFIG.name;
const defaultDescription = SITE_CONFIG.description;
const baseAlternates = buildAlternates("/");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: defaultTitle,
    template: `%s | ${defaultTitle}`,
  },
  description: defaultDescription,
  alternates: {
    ...baseAlternates,
    types: {
      "application/rss+xml": [
        {
          url: "/rss.xml",
          title: `${defaultTitle} RSS`,
        },
      ],
    },
  },
  openGraph: buildOpenGraph({
    title: defaultTitle,
    description: defaultDescription,
    path: "/",
  }),
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
  other: {
    "og:url": buildAbsoluteUrl("/"),
  },
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
        {/* Critical CSS inline - eliminuje render-blocking dla najważniejszych stylów */}
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --radius: 0.625rem;
              --content-font-size: 1rem;
              --background: oklch(1 0 0);
              --foreground: oklch(0.145 0 0);
            }
            .dark {
              --background: oklch(0.145 0 0);
              --foreground: oklch(0.985 0 0);
            }
            html {
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 16px;
              line-height: 1.5;
            }
            body {
              margin: 0;
              background-color: var(--background);
              color: var(--foreground);
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 12px;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            * {
              box-sizing: border-box;
            }
          `
        }} />
        {/* DNS prefetch dla Sanity CDN */}
        <link rel="dns-prefetch" href="https://cdn.sanity.io" />
        <Script
          src="/scripts/theme-init.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${inter.variable} ${playfairDisplay.variable} ${sourceCodePro.variable} antialiased bg-white dark:bg-gray-900`}
      >
        <ClientShell isDraftMode={isDraftMode}>
          <>
            <Header />
            {children}
            <Footer />
          </>
        </ClientShell>
      </body>
    </html>
  );
}
