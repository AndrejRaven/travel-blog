"use client";

import { X, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";
import type { Country } from "@/lib/travel-wallet/types";

interface DeleteCountryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  country: Country | null;
  isDeleting?: boolean;
}

export default function DeleteCountryModal({
  isOpen,
  onClose,
  onConfirm,
  country,
  isDeleting = false,
}: DeleteCountryModalProps) {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !isDeleting) {
      onClose();
    }
  };

  if (!isOpen || !country) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-country-modal-title"
    >
      <div className="relative w-full max-w-md rounded-lg shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Zamknij"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="flex-1">
            <h2
              id="delete-country-modal-title"
              className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2"
            >
              Usuń kraj
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Czy na pewno chcesz usunąć kraj <strong className="text-gray-900 dark:text-gray-100">&quot;{country.name}&quot;</strong>?
            </p>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                Ta operacja jest nieodwracalna
              </p>
              <ul className="text-xs text-red-800 dark:text-red-300 space-y-1 list-disc list-inside">
                <li>Wszystkie dane kraju zostaną trwale usunięte</li>
                <li>Wszystkie wydatki związane z tym krajem zostaną usunięte</li>
                <li>Nie będziesz mógł cofnąć tej operacji</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Anuluj
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white"
          >
            {isDeleting ? "Usuwanie..." : "Usuń kraj"}
          </Button>
        </div>
      </div>
    </div>
  );
}

