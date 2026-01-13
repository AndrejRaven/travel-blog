import type { Metadata } from "next";
import { buildStaticPageMetadata } from "@/lib/metadata";
import CountriesListClient from "./CountriesListClient";

export const metadata: Metadata = buildStaticPageMetadata({
  path: "/portfel-podrozniczy/kraje",
  title: "Kraje | Portfel podróżniczy | Vlogi Z Drogi",
  description:
    "Lista wszystkich krajów w portfelu podróżniczym z informacjami o budżecie i wydatkach.",
});

export default function KrajePage() {
  return <CountriesListClient />;
}

