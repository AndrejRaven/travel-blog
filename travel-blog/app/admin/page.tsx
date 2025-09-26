import { redirect } from "next/navigation";

export default function AdminPage() {
  // Przekieruj do strony komentarzy jako domyślnej strony admin
  redirect("/admin/komentarze");
}
