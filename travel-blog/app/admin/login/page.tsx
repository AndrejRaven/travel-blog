"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import Button from "@/components/ui/Button";
import { Lock, User, Eye, EyeOff } from "lucide-react";

interface ErrorDetails {
  message: string;
  details?: string;
  type?: string;
  fields?: {
    username?: boolean;
    password?: boolean;
  };
}

export default function AdminLoginPage() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorDetails | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        router.push("/admin/komentarze");
        router.refresh();
      } else {
        const data = await response.json();
        setError(data as ErrorDetails);
      }
    } catch (err) {
      setError({
        message: "Wystąpił błąd podczas logowania",
        details:
          "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.",
        type: "network_error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout maxWidth="md">
      <PageHeader
        title="Panel administracyjny"
        subtitle="Zaloguj się aby uzyskać dostęp"
      />

      <div className="max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Nazwa użytkownika
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  required
                  value={credentials.username}
                  onChange={(e) => {
                    setCredentials({
                      ...credentials,
                      username: e.target.value,
                    });
                    // Czyść błąd dla username gdy użytkownik zaczyna pisać
                    if (error?.fields?.username) {
                      setError(null);
                    }
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    error?.fields?.username
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Wprowadź nazwę użytkownika"
                />
              </div>
              {error?.fields?.username && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  Nieprawidłowa nazwa użytkownika
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Hasło
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={credentials.password}
                  onChange={(e) => {
                    setCredentials({
                      ...credentials,
                      password: e.target.value,
                    });
                    // Czyść błąd dla password gdy użytkownik zaczyna pisać
                    if (error?.fields?.password) {
                      setError(null);
                    }
                  }}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    error?.fields?.password
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Wprowadź hasło"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                  aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {error?.fields?.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  Nieprawidłowe hasło
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-2">
              <p className="text-red-600 dark:text-red-400 font-medium text-sm">
                {error.message}
              </p>
              {error.details && (
                <p className="text-red-500 dark:text-red-400 text-xs">
                  {error.details}
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Panel administracyjny - dostęp tylko dla uprawnionych użytkowników
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
