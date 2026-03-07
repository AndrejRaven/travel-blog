"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Wallet, TrendingUp, Globe } from "lucide-react";
import Button from "@/components/ui/Button";
import { setOnboardingSeen } from "@/lib/onboarding-storage";

interface OnboardingFirstTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: () => void;
}

export default function OnboardingFirstTripModal({
  isOpen,
  onClose,
  onCreateTrip,
}: OnboardingFirstTripModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      prev?.focus();
    };
  }, [isOpen]);

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

  const handleCreateClick = () => {
    setOnboardingSeen();
    onClose();
    onCreateTrip();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 dark:bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-first-trip-title"
      aria-describedby="onboarding-first-trip-desc"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-xl shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 animate-fade-in-up"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
          aria-label="Zamknij"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pr-8">
          <h2
            id="onboarding-first-trip-title"
            className="text-xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-2"
          >
            Planujesz wyjazd?
          </h2>
          <p
            id="onboarding-first-trip-desc"
            className="text-gray-600 dark:text-gray-300 text-sm mb-8"
          >
            W kilku krokach ustawimy budżet, a Ty będziesz widzieć na bieżąco wydatki i statystyki.
          </p>
        </div>

        <ul className="space-y-3 mb-8" aria-hidden>
          <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 animate-fade-in-up [animation-delay:80ms] [animation-fill-mode:both]">
            <span className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden />
            </span>
            <span>Ustal budżet i śledź wydatki w czasie rzeczywistym</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 animate-fade-in-up [animation-delay:160ms] [animation-fill-mode:both]">
            <span className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden />
            </span>
            <span>Wiele walut, kursy i proste zestawienia</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 animate-fade-in-up [animation-delay:240ms] [animation-fill-mode:both]">
            <span className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex-shrink-0">
              <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden />
            </span>
            <span>Kraje, lokacje i analizy wydatków</span>
          </li>
        </ul>

        <Button
          variant="primary"
          onClick={handleCreateClick}
          className="w-full inline-flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Stwórz pierwszą podróż
        </Button>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
