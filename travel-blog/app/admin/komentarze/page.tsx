import { redirect } from "next/navigation";
import CommentsModeration from "@/components/ui/CommentsModeration";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import { requireAdmin } from "@/lib/auth";
import AdminHeader from "@/components/shared/AdminHeader";

export default async function CommentsAdminPage() {
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
  } catch (error) {
    redirect("/admin/login");
  }
}
