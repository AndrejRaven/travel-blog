import type { Metadata } from "next";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import CookieSettings from "@/components/ui/CookieSettings";
import BackToHome from "@/components/shared/BackToHome";
import { buildStaticPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildStaticPageMetadata({
  path: "/ustawienia-cookies",
  title: "Ustawienia cookies | Vlogi Z Drogi",
  description:
    "Zarządzaj swoimi preferencjami dotyczącymi plików cookies. Dostosuj ustawienia analitycznych i marketingowych cookies.",
});

export default function UstawieniaCookies() {
  return (
    <PageLayout maxWidth="4xl">
      <PageHeader
        title="Ustawienia cookies"
        subtitle="Zarządzaj swoimi preferencjami dotyczącymi plików cookies"
      />

      <CookieSettings />

      <BackToHome className="mt-12" />
    </PageLayout>
  );
}
