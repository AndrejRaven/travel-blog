"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Crown, Mail, CheckCircle2, AlertCircle, Loader2, Send, Shield, ChevronDown, ChevronUp } from "lucide-react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth/AuthContext";
import { getErrorMessage } from "@/lib/utils/error-handling";
import { updateSubscriptionTier } from "@/lib/supabase/auth-helpers";
import { subscribeNewsletter } from "@/lib/newsletter";

interface UpgradeToPremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Wywoływane po udanym upgrade
  userEmail?: string; // Pre-wypełnij email
}

export default function UpgradeToPremiumModal({
  isOpen,
  onClose,
  onSuccess,
  userEmail,
}: UpgradeToPremiumModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isCheckingPremium, setIsCheckingPremium] = useState(false);
  const [newsletterExpanded, setNewsletterExpanded] = useState(false);

  // Pre-wypełnij email z profilu lub prop
  useEffect(() => {
    if (isOpen) {
      const emailToUse = userEmail || user?.email || profile?.email || "";
      setEmail(emailToUse);
    }
  }, [isOpen, userEmail, user?.email, profile?.email]);

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

  const checkPremiumStatus = async (emailToCheck: string): Promise<boolean> => {
    try {
      setIsCheckingPremium(true);
      const response = await fetch("/api/premium/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailToCheck }),
      });

      if (!response.ok) {
        throw new Error("Błąd podczas sprawdzania statusu premium");
      }

      const data = await response.json();
      return data.isPremium === true;
    } catch (error) {
      console.error("Error checking premium status:", error);
      return false;
    } finally {
      setIsCheckingPremium(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      addToast({
        type: "error",
        title: "Błąd",
        message: "Podaj prawidłowy adres email.",
        duration: 4000,
      });
      return;
    }

    setIsSubscribing(true);

    try {
      // 1. Zapisz się do newslettera
      const subscribeResult = await subscribeNewsletter(email);

      if (!subscribeResult.success) {
        addToast({
          type: "error",
          title: "Błąd zapisu",
          message: subscribeResult.message || "Nie udało się zapisać do newslettera.",
          duration: 5000,
        });
        setIsSubscribing(false);
        return;
      }

      // 2. Dla zalogowanego użytkownika od razu przyznaj Premium (zapisał się w tym modalu = premium)
      if (user?.id) {
        try {
          await updateSubscriptionTier(user.id, "premium");
          if (refreshProfile) await refreshProfile();

          addToast({
            type: "success",
            title: "Premium włączone!",
            message: "Zapisano do newslettera i odblokowano Premium. Możesz tworzyć nieograniczoną liczbę podróży.",
            duration: 5000,
          });
          if (onSuccess) onSuccess();
          onClose();
          return;
        } catch (tierError) {
          console.error("Error updating subscription tier:", tierError);
          addToast({
            type: "warning",
            title: "Zapisano do newslettera",
            message: "Wystąpił problem z aktualizacją statusu premium. Odśwież stronę lub skontaktuj się z nami.",
            duration: 5000,
          });
        }
      }

      // 3. Niezalogowany lub błąd aktualizacji tier — tylko potwierdzenie zapisu
      addToast({
        type: "info",
        title: "Zapisano do newslettera",
        message: subscribeResult.message || "Dziękujemy! Sprawdź skrzynkę — wysłaliśmy potwierdzenie.",
        duration: 5000,
      });
      onClose();
    } catch (error: unknown) {
      console.error("Error subscribing to newsletter:", error);
      const errorMessage = getErrorMessage(error);
      addToast({
        type: "error",
        title: "Błąd",
        message: errorMessage || "Nie udało się zapisać do newslettera. Spróbuj ponownie.",
        duration: 5000,
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 dark:bg-black/70 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-premium-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
              <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2
              id="upgrade-premium-title"
              className="text-xl font-semibold text-gray-900 dark:text-gray-100"
            >
              Przejdź na Premium
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Główny tytuł — widoczny i czytelny */}
          <div className="flex flex-col items-center gap-3 py-4 px-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
            <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
              <Mail className="w-5 h-5" />
              <Crown className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center leading-snug">
              Zapisz się do newslettera i odblokuj Premium za darmo
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Jedna wiadomość e-mail — pełny dostęp do funkcji.
            </p>
          </div>

          {/* Opis korzyści Premium */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Co daje Premium?
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Nieograniczona liczba podróży</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Dostęp do wszystkich funkcji</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Priorytetowe wsparcie</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Najnowsze funkcje jako pierwszy</span>
              </li>
            </ul>
          </div>

          {/* O newsletterze (zwijane) */}
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 overflow-hidden">
            <button
              type="button"
              onClick={() => setNewsletterExpanded((v) => !v)}
              className="w-full flex items-center justify-between gap-2 p-4 text-left hover:bg-gray-100/80 dark:hover:bg-gray-600/30 transition-colors"
              aria-expanded={newsletterExpanded}
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Send className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                O newsletterze
              </span>
              {newsletterExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              )}
            </button>
            {newsletterExpanded && (
              <div className="px-4 pb-4 pt-0 space-y-3 border-t border-gray-200 dark:border-gray-600">
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400 pt-3">
                  <li>• Nowe wpisy z bloga, porady podróżnicze i plany na wycieczki</li>
                  <li>• Wysyłamy rzadko — tylko gdy jest coś wartościowego (bez spamu)</li>
                  <li>• W każdej wiadomości link do wypisania się w jednym kliknięciu</li>
                  <li>• Adres używamy wyłącznie do newslettera, nie przekazujemy go dalej</li>
                </ul>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                  Zapisując się, otrzymasz dostęp do Premium i potwierdzenie na podany email.
                </p>
              </div>
            )}
          </div>

          {/* Formularz zapisu */}
          <form onSubmit={handleSubscribe} className="space-y-4">
            <div>
              <label
                htmlFor="premium-email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Adres email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="premium-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubscribing || isCheckingPremium}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="twoj@email.pl"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Zapisz się do newslettera, aby otrzymać dostęp do Premium
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubscribing || isCheckingPremium || !email}
                className="w-full flex items-center justify-center gap-2"
              >
                {isSubscribing || isCheckingPremium ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Przetwarzanie...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    <span>Zapisz się i uzyskaj Premium</span>
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={onClose}
                className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                disabled={isSubscribing || isCheckingPremium}
              >
                Anuluj
              </button>
            </div>
          </form>

          {/* Informacja o przyszłej płatnej subskrypcji */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-300">
                W przyszłości dostępna będzie płatna subskrypcja Premium. Obecnie Premium otrzymujesz poprzez zapis do newslettera.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
