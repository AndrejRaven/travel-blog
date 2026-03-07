"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { signIn } from "@/lib/supabase/auth-helpers";
import { useToast } from "@/components/ui/Toast";
import { getErrorMessage, errorMessageIncludes } from "@/lib/utils/error-handling";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToRegister,
}: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      // Znajdź lub utwórz kontener dla portalu
      let container = document.getElementById('modal-root');
      if (!container) {
        container = document.createElement('div');
        container.id = 'modal-root';
        document.body.appendChild(container);
      }
      setPortalContainer(container);
    } else {
      setIsMounted(false);
    }
  }, [isOpen]);

  if (!isOpen || !portalContainer) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "Email jest wymagany";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Nieprawidłowy format email";
    }

    if (!password) {
      newErrors.password = "Hasło jest wymagane";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await signIn(email.trim(), password);
      addToast({
        type: "success",
        title: "Zalogowano pomyślnie",
        message: "Witamy z powrotem!",
        duration: 2000,
      });
      
      // Daj czas na aktualizację auth state
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 100);
      
      // Reset formularza
      setEmail("");
      setPassword("");
    } catch (error: unknown) {
      console.error("Login error:", error);
      const errorMessage = getErrorMessage(error);
      
      let finalErrorMessage = "Wystąpił błąd podczas logowania";
      
      if (errorMessageIncludes(error, "Invalid login credentials")) {
        finalErrorMessage = "Nieprawidłowy email lub hasło";
        setErrors({
          email: "Nieprawidłowy email lub hasło",
          password: "Nieprawidłowy email lub hasło",
        });
      } else if (errorMessageIncludes(error, "Email not confirmed")) {
        finalErrorMessage = "Email nie został potwierdzony. Sprawdź skrzynkę pocztową.";
        setErrors({
          email: "Email nie został potwierdzony",
        });
      } else {
        setErrors({
          form: errorMessage || finalErrorMessage,
        });
      }

      addToast({
        type: "error",
        title: "Błąd logowania",
        message: errorMessage,
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 dark:bg-black/70 transition-opacity duration-300 overflow-y-auto p-4 ${
        isMounted ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full my-auto transition-all duration-300 ${
          isMounted ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2
            id="login-modal-title"
            className="text-2xl font-semibold text-gray-900 dark:text-gray-100"
          >
            Zaloguj się
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          {errors.form && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300 flex-1">
                {errors.form}
              </p>
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                errors.email ? "text-red-500 dark:text-red-400" : "text-gray-400"
              }`} />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-11 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors ${
                  errors.email
                    ? "border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
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

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Hasło
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                errors.password ? "text-red-500 dark:text-red-400" : "text-gray-400"
              }`} />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-11 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors ${
                  errors.password
                    ? "border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
                placeholder="••••••••"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
            {errors.password && (
              <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Actions */}
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
                  Logowanie...
                </>
              ) : (
                "Zaloguj się"
              )}
            </Button>

            {onSwitchToRegister && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Nie masz konta?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSwitchToRegister();
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                  >
                    Zarejestruj się
                  </button>
                </p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, portalContainer);
}
