"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, AlertCircle, Image as ImageIcon, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { updateUserProfile } from "@/lib/supabase/auth-helpers";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth/AuthContext";
import { getErrorMessage, errorMessageIncludes } from "@/lib/utils/error-handling";

export default function ProfileEditSection() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    // Załaduj aktualne dane profilu
    if (profile) {
      setFullName(profile.full_name || "");
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Walidacja rozmiaru (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors({
        avatar: "Plik jest zbyt duży. Maksymalny rozmiar to 2MB.",
      });
      return;
    }

    // Walidacja typu
    if (!file.type.startsWith("image/")) {
      setErrors({
        avatar: "Nieprawidłowy typ pliku. Wybierz zdjęcie.",
      });
      return;
    }

    setAvatarFile(file);
    setErrors({});

    // Utwórz podgląd
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(profile?.avatar_url || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Imię i nazwisko jest wymagane";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !user) {
      return;
    }

    // Sprawdź czy są jakieś zmiany
    const hasNameChange = fullName.trim() !== (profile?.full_name || "");
    const hasAvatarChange = avatarFile !== null;
    
    if (!hasNameChange && !hasAvatarChange) {
      addToast({
        type: "info",
        title: "Brak zmian",
        message: "Nie wprowadzono żadnych zmian do zapisania.",
        duration: 2000,
      });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const oldAvatarUrl = profile?.avatar_url || undefined;
      
      // Timeout dla całej operacji (30 sekund)
      const updatePromise = updateUserProfile(
        user.id,
        {
          full_name: fullName.trim(),
          avatar_file: avatarFile || undefined,
        },
        oldAvatarUrl
      );

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Operacja trwa zbyt długo. Sprawdź połączenie z internetem i spróbuj ponownie.')), 30000)
      );

      const updatedProfile = await Promise.race([updatePromise, timeoutPromise]) as { avatar_url?: string | null } | null;

      // Odśwież profil w AuthContext (z timeout)
      try {
        await Promise.race([
          refreshProfile(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout podczas odświeżania profilu')), 5000)
          )
        ]);
      } catch (refreshError: unknown) {
        console.warn('[ProfileEditSection] Error refreshing profile:', refreshError);
        // Nie przerywaj procesu jeśli refresh się nie powiódł - dane są już zapisane
      }

      // Reset file input
      setAvatarFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Zaktualizuj preview avatara jeśli został zmieniony
      if (updatedProfile?.avatar_url) {
        setAvatarPreview(updatedProfile.avatar_url);
      }

      addToast({
        type: "success",
        title: "Profil zaktualizowany",
        message: "Zmiany zostały zapisane.",
        duration: 2000,
      });
    } catch (error: unknown) {
      console.error("[ProfileEditSection] Error updating profile:", error);

      const errorMessage = getErrorMessage(error);
      let finalErrorMessage = "Wystąpił błąd podczas aktualizacji profilu";

      // Obsłuż różne typy błędów
      if (errorMessageIncludes(error, "zbyt duży")) {
        finalErrorMessage = errorMessage;
        setErrors({
          avatar: errorMessage,
        });
      } else if (errorMessageIncludes(error, "typ pliku")) {
        finalErrorMessage = errorMessage;
        setErrors({
          avatar: errorMessage,
        });
      } else if (errorMessageIncludes(error, "przerwany") || errorMessageIncludes(error, "AbortError") || errorMessageIncludes(error, "signal is aborted")) {
        finalErrorMessage = "Upload został przerwany. Spróbuj ponownie.";
        setErrors({
          form: finalErrorMessage,
        });
      } else if (errorMessageIncludes(error, "bucket") || errorMessageIncludes(error, "Storage")) {
        finalErrorMessage = "Błąd podczas zapisywania zdjęcia. Sprawdź czy bucket 'avatars' istnieje w Supabase Storage.";
        setErrors({
          form: finalErrorMessage,
        });
      } else {
        setErrors({
          form: errorMessage || finalErrorMessage,
        });
      }

      addToast({
        type: "error",
        title: "Błąd aktualizacji",
        message: errorMessage,
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
        Edycja profilu
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-300">
              {errors.form}
            </p>
          </div>
        )}

        {/* Avatar Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Zdjęcie profilowe
          </label>
          <div className="flex items-center gap-3">
            {/* Avatar Preview */}
            <div className="relative">
              {avatarPreview ? (
                <div className="relative">
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    aria-label="Usuń zdjęcie"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border border-gray-300 dark:border-gray-600">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="avatar-upload"
                disabled={isLoading}
              />
              <label
                htmlFor="avatar-upload"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {avatarPreview ? "Zmień zdjęcie" : "Wybierz zdjęcie"}
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Maksymalny rozmiar: 2MB
              </p>
            </div>
          </div>
          {errors.avatar && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.avatar}
            </p>
          )}
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <label
            htmlFor="edit-fullname"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Imię i nazwisko
          </label>
          <input
            id="edit-fullname"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors ${
              errors.fullName
                ? "border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            }`}
            placeholder="Jan Kowalski"
            disabled={isLoading}
            autoComplete="name"
          />
          {errors.fullName && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="px-4 py-2 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              "Zapisz zmiany"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
