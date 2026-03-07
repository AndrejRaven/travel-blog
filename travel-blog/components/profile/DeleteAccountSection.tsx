"use client";

import { useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { deleteUserAccount } from "@/lib/supabase/auth-helpers";
import { getErrorMessage } from "@/lib/utils/error-handling";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";

export default function DeleteAccountSection() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!user) {
    return null;
  }

  const userEmail = user.email || "";

  const handleDeleteClick = () => {
    setIsModalOpen(true);
    setConfirmEmail("");
    setErrors({});
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setConfirmEmail("");
    setErrors({});
  };

  const handleDeleteAccount = async () => {
    // Walidacja emaila
    if (confirmEmail.trim() !== userEmail.trim()) {
      setErrors({
        email: "Email nie pasuje do konta",
      });
      return;
    }

    setIsDeleting(true);
    setErrors({});

    try {
      await deleteUserAccount(user.id);

      addToast({
        type: "success",
        title: "Konto usunięte",
        message: "Twoje konto zostało pomyślnie usunięte.",
        duration: 3000,
      });

      // Przekieruj do strony głównej
      router.push("/");
    } catch (error: unknown) {
      console.error("Error deleting account:", error);
      const errorMessage = getErrorMessage(error);

      addToast({
        type: "error",
        title: "Błąd usuwania konta",
        message: errorMessage || "Wystąpił błąd podczas usuwania konta.",
        duration: 4000,
      });

      setErrors({
        form: errorMessage || "Wystąpił błąd podczas usuwania konta",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
              Usuń konto
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Usunięcie konta jest nieodwracalne. Wszystkie Twoje dane zostaną trwale usunięte.
            </p>
            <button
              onClick={handleDeleteClick}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              Usuń konto
            </button>
          </div>
        </div>
      </div>

      {/* Modal potwierdzenia */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Usuń konto
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Zamknij"
                disabled={isDeleting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 py-4 space-y-3">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                  To działanie jest nieodwracalne
                </p>
                <p className="text-xs text-red-700 dark:text-red-400">
                  Wszystkie Twoje dane zostaną trwale usunięte, w tym podróże, wydatki i zdjęcia.
                </p>
              </div>

              {errors.form && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-xs text-red-800 dark:text-red-300">
                    {errors.form}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="confirm-email"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  Aby potwierdzić, wpisz swój email: <span className="font-semibold">{userEmail}</span>
                </label>
                <input
                  id="confirm-email"
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => {
                    setConfirmEmail(e.target.value);
                    setErrors({});
                  }}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:focus:ring-red-500 transition-colors text-sm ${
                    errors.email
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder={userEmail}
                  disabled={isDeleting}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={isDeleting}
                  className="flex-1 px-3 py-1.5 text-xs"
                >
                  Anuluj
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || confirmEmail.trim() !== userEmail.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-600 px-3 py-1.5 text-xs"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      Usuwanie...
                    </>
                  ) : (
                    "Usuń konto"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
