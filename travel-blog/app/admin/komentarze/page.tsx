import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import CommentsModeration from "@/components/ui/CommentsModeration";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import { requireAdmin } from "@/lib/auth";
import AdminHeader from "@/components/shared/AdminHeader";

// Force dynamic rendering because we use cookies() for authentication
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CommentsAdminPage() {
  noStore(); // Explicitly prevent static generation and caching
  try {
    const user = await requireAdmin();

    return (
      <PageLayout maxWidth="6xl">
        <AdminHeader user={user} />

        <PageHeader
          title="Moderacja komentarzy"
          subtitle="Zarządzaj komentarzami użytkowników"
        />

        <CommentsModeration />
      </PageLayout>
    );
  } catch {
    // User not authenticated, redirect to login
    redirect("/admin/login");
  }
}
