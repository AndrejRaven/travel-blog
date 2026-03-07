import LogowanieClient from "./LogowanieClient";
import { buildStaticPageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = buildStaticPageMetadata({
  path: "/logowanie",
  title: "Logowanie | Vlogi Z Drogi",
  description: "Zaloguj się do swojego konta.",
});

export default function LogowaniePage() {
  return <LogowanieClient />;
}
