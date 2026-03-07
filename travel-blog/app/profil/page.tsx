import ProfilClient from "./ProfilClient";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import { buildStaticPageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = buildStaticPageMetadata({
  path: "/profil",
  title: "Ustawienia profilu | Vlogi Z Drogi",
  description:
    "Zarządzaj swoim profilem, ustawieniami cookies i kontem. Edytuj dane osobowe, zdjęcie profilowe i preferencje prywatności.",
});

export default function ProfilPage() {
  // Sprawdzanie autentykacji przeniesione do ProfilClient (client component)
  // Server component zawsze renderuje stronę, client component sprawdza auth i przekierowuje jeśli potrzeba
  return (
    <PageLayout maxWidth="2xl" className="py-8">
      <PageHeader
        title="Ustawienia profilu"
        subtitle="Zarządzaj swoim profilem, ustawieniami cookies i kontem"
      />
      <ProfilClient />
    </PageLayout>
  );
}
