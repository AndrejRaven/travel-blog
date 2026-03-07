import RejestracjaClient from "./RejestracjaClient";
import { buildStaticPageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = buildStaticPageMetadata({
  path: "/rejestracja",
  title: "Rejestracja | Vlogi Z Drogi",
  description: "Utwórz konto w serwisie.",
});

export default function RejestracjaPage() {
  return <RejestracjaClient />;
}
