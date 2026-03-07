"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, User, Loader2, AlertCircle } from "lucide-react";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import Link from "@/components/ui/Link";
import Button from "@/components/ui/Button";
import { signUp } from "@/lib/supabase/auth-helpers";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth/AuthContext";
import { getErrorMessage, errorMessageIncludes } from "@/lib/utils/error-handling";

function getSafeRedirect(redirect: string | null): string {
  if (!redirect || typeof redirect !== "string") return "/";
  const decoded = decodeURIComponent(redirect);
  if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
  return "/";
}

export default function RejestracjaClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const redirectParam = searchParams.get("redirect");
  const redirectTo = getSafeRedirect(redirectParam);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  if (loading || user) {
    return (
      <PageLayout maxWidth="md" className="py-8">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 dark:text-gray-500" />
        </div>
      </PageLayout>
    );
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) {
      newErrors.email = "Email jest wymagany";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Nieprawidłowy format email";
    }
    if (!password) {
      newErrors.password = "Hasło jest wymagane";
    } else if (password.length < 8) {
      newErrors.password = "Hasło musi mieć minimum 8 znaków";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Potwierdzenie hasła jest wymagane";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Hasła nie są identyczne";
    }
    if (!fullName.trim()) {
      newErrors.fullName = "Imię i nazwisko jest wymagane";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await signUp(email.trim(), password, fullName.trim());
      addToast({
        type: "success",
        title: "Konto utworzone",
        message: "Sprawdź email aby potwierdzić konto.",
        duration: 4000,
      });
      router.replace(redirectTo);
    } catch (error: unknown) {
      console.error("Registration error:", error);
      const errorMessage = getErrorMessage(error);
      let finalErrorMessage = "Wystąpił błąd podczas rejestracji";
      if (errorMessageIncludes(error, "User already registered")) {
        finalErrorMessage = "Użytkownik z tym emailem już istnieje";
        setErrors({ email: "Użytkownik z tym emailem już istnieje" });
      } else if (errorMessageIncludes(error, "Password")) {
        finalErrorMessage = "Hasło jest zbyt słabe";
        setErrors({ password: "Hasło jest zbyt słabe" });
      } else {
        setErrors({ form: errorMessage || finalErrorMessage });
      }
      addToast({
        type: "error",
        title: "Błąd rejestracji",
        message: errorMessage,
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loginHref = redirectParam
    ? `/logowanie?redirect=${encodeURIComponent(redirectParam)}`
    : "/logowanie";

  return (
    <PageLayout maxWidth="md" className="py-8">
      <PageHeader
        title="Utwórz konto"
        subtitle="Wypełnij formularz, aby się zarejestrować"
      />
      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.form && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300 flex-1">
              {errors.form}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="register-fullname"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Imię i nazwisko
          </label>
          <div className="relative">
            <User
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                errors.fullName
                  ? "text-red-500 dark:text-red-400"
                  : "text-gray-400"
              }`}
            />
            <input
              id="register-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                errors.fullName
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Jan Kowalski"
              disabled={isLoading}
              autoComplete="name"
            />
          </div>
          {errors.fullName && (
            <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              {errors.fullName}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="register-email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email
          </label>
          <div className="relative">
            <Mail
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                errors.email ? "text-red-500 dark:text-red-400" : "text-gray-400"
              }`}
            />
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                errors.email
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="twoj@email.pl"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="register-password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Hasło
          </label>
          <div className="relative">
            <Lock
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                errors.password
                  ? "text-red-500 dark:text-red-400"
                  : "text-gray-400"
              }`}
            />
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                errors.password
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Minimum 8 znaków"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>
          {errors.password && (
            <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              {errors.password}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="register-confirm-password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Potwierdź hasło
          </label>
          <div className="relative">
            <Lock
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                errors.confirmPassword
                  ? "text-red-500 dark:text-red-400"
                  : "text-gray-400"
              }`}
            />
            <input
              id="register-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                errors.confirmPassword
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Powtórz hasło"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>
          {errors.confirmPassword && (
            <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4 pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="w-full py-3 text-base font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Tworzenie konta...
              </>
            ) : (
              "Utwórz konto"
            )}
          </Button>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Masz już konto?{" "}
            <Link href={loginHref} variant="underline" className="font-medium">
              Zaloguj się
            </Link>
          </p>
        </div>
      </form>
    </PageLayout>
  );
}
