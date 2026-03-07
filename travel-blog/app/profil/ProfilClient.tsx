"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import ProfileEditSection from "@/components/profile/ProfileEditSection";
import DeleteAccountSection from "@/components/profile/DeleteAccountSection";
import CookieSettings from "@/components/ui/CookieSettings";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

export default function ProfilClient() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Sprawdź autentykację po załadowaniu
    if (!loading && !user) {
      // Przekieruj do strony głównej jeśli nie zalogowany
      router.push("/");
    }
  }, [user, loading, router]);

  // Podczas ładowania pokaż skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton dla edycji profilu */}
        <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
          <SkeletonLoader width="30%" height="1.5rem" className="mb-4" />
          <div className="space-y-4">
            <SkeletonLoader width="40%" height="1rem" />
            <SkeletonLoader width="100%" height="4rem" />
            <SkeletonLoader width="100%" height="2.5rem" />
            <SkeletonLoader width="25%" height="2.5rem" />
          </div>
        </div>
        {/* Skeleton dla ustawień cookies */}
        <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
          <SkeletonLoader width="30%" height="1.5rem" className="mb-4" />
          <div className="space-y-3">
            <SkeletonLoader width="100%" height="3rem" />
            <SkeletonLoader width="100%" height="3rem" />
            <SkeletonLoader width="100%" height="3rem" />
          </div>
        </div>
        {/* Skeleton dla usunięcia konta */}
        <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
          <SkeletonLoader width="25%" height="1.5rem" className="mb-2" />
          <SkeletonLoader width="80%" height="1rem" className="mb-3" />
          <SkeletonLoader width="20%" height="1rem" />
        </div>
      </div>
    );
  }

  // Jeśli nie zalogowany, nie renderuj nic (przekierowanie w useEffect)
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Edycja profilu */}
      <ProfileEditSection />

      {/* Ustawienia cookies */}
      <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Ustawienia cookies
        </h2>
        <CookieSettings />
      </div>

      {/* Usunięcie konta */}
      <DeleteAccountSection />
    </div>
  );
}
