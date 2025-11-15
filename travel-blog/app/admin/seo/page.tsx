import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import AdminHeader from "@/components/shared/AdminHeader";
import SEODashboard from "@/components/ui/SEODashboard";
import { requireAdmin } from "@/lib/auth";

// Force dynamic rendering because we use cookies() for authentication
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SEOAdminPage() {
  noStore(); // Explicitly prevent static generation and caching
  try {
    const user = await requireAdmin();

    return (
      <PageLayout maxWidth="6xl">
        <AdminHeader user={user} />

        <PageHeader
          title="SEO"
          subtitle="Zarządzanie IndexNow i analiza SEO"
        />

        <SEODashboard />
      </PageLayout>
    );
  } catch {
    // User not authenticated, redirect to login
    redirect("/admin/login");
  }
}

