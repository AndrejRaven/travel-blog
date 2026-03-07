"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Lock, Receipt, Coins, BarChart3 } from "lucide-react";
import Button from "@/components/ui/Button";
import { setTripOnboardingSeen } from "@/lib/onboarding-storage";

const STEPS = [
  {
    id: "expenses",
    title: "Dodawanie wydatków",
    description: "*Dodaj wydatek* i *Kalendarz* – wpisuj wydatki na bieżąco.",
    icon: Receipt,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "transactions",
    title: "Transakcje i miejsca",
    description: "W *Saldach* dodawaj wymiany walut. W krajach dodawaj *lokacje* (miejsca).",
    icon: Coins,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "analytics",
    title: "Analityka i edycja",
    description: "*Statystyki* i *Analityka* pokażą podsumowania. W *Edycja podróży* zmienisz budżet, kraje i daty.",
    icon: BarChart3,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
] as const;

/** Zamienia *tekst* w opisie na <strong>tekst</strong> */
function formatDescription(text: string) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) =>
    part.startsWith("*") && part.endsWith("*") ? (
      <strong key={i} className="font-semibold text-gray-900 dark:text-gray-100">
        {part.slice(1, -1)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

interface TripOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripName?: string;
  tripSlug?: string;
}

export default function TripOnboardingModal({
  isOpen,
  onClose,
  tripId,
  tripName,
}: TripOnboardingModalProps) {
  const [step, setStep] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      prev?.focus();
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  const handleClose = () => {
    setTripOnboardingSeen(tripId);
    onClose();
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const modalContent = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 dark:bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trip-onboarding-title"
      aria-describedby="trip-onboarding-desc"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-xl shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 animate-fade-in-up"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
          aria-label="Zamknij"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pr-8 space-y-3">
          <h2
            id="trip-onboarding-title"
            className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100 leading-tight"
          >
            Witaj w podróży{tripName ? ` „${tripName}"` : ""}
          </h2>
          <div
            id="trip-onboarding-desc"
            className="flex items-start gap-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 px-3 py-2 border border-gray-200 dark:border-gray-600"
          >
            <Lock className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" aria-hidden />
            <p className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Twoje dane są tylko u Ciebie – nikt inny nie ma do nich wglądu.
            </p>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">
            Podróż zawsze możesz edytować. Oto co jest najważniejsze:
          </p>
        </div>

        <div className="mb-8 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 p-5">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl ${current.iconBg} flex-shrink-0`}
              aria-hidden
            >
              <Icon className={`w-9 h-9 ${current.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                Krok {step + 1} z {STEPS.length}
              </p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {current.title}
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                {formatDescription(current.description)}
              </p>
            </div>
          </div>
        </div>

        {/* Progress: kropki */}
        <div className="mb-8">
          <p className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3" aria-live="polite">
            Krok {step + 1} z {STEPS.length}
          </p>
          <div className="flex items-center justify-center gap-2" role="tablist" aria-label="Kroki onboardingu">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === step}
                aria-label={`Krok ${i + 1} z ${STEPS.length}`}
                onClick={() => setStep(i)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i === step
                    ? "bg-blue-600 dark:bg-blue-400"
                    : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            onClick={handleNext}
            className="w-full inline-flex items-center justify-center gap-2"
          >
            {isLast ? "Przejdź do podróży" : "Dalej"}
          </Button>
          <button
            type="button"
            onClick={handleClose}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Pomiń
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
