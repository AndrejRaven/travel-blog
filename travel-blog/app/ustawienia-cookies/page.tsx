import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import CookieSettings from "@/components/ui/CookieSettings";
import BackToHome from "@/components/shared/BackToHome";

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
