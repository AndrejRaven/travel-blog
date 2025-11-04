"use client";

import { useRouter, usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import Link from "@/components/ui/Link";
import { LogOut, User, LayoutDashboard, MessageSquare } from "lucide-react";
import { AdminUser } from "@/lib/auth";

interface AdminHeaderProps {
  user: AdminUser;
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", {
        method: "DELETE",
      });

      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Panel administracyjny
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              Zalogowany jako: {user.username}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Nawigacja między sekcjami */}
          <nav className="flex items-center gap-2">
            <Link
              href="/admin"
              className={`px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                isActive("/admin")
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 inline sm:mr-1.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link
              href="/admin/komentarze"
              className={`px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                isActive("/admin/komentarze")
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <MessageSquare className="w-4 h-4 inline sm:mr-1.5" />
              <span className="hidden sm:inline">Komentarze</span>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="text-sm flex-1 sm:flex-initial whitespace-nowrap"
            >
              <span className="hidden sm:inline">Strona główna</span>
              <span className="sm:hidden">Strona</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 whitespace-nowrap"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Wyloguj</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
