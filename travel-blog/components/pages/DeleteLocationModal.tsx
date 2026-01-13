"use client";

import { X, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";

interface DeleteLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  location: string;
  hasExpenses: boolean;
  isDeleting?: boolean;
}

export default function DeleteLocationModal({
  isOpen,
  onClose,
  onConfirm,
  location,
  hasExpenses,
  isDeleting = false,
}: DeleteLocationModalProps) {
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100">
            Usuń lokalizację
          </h2>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Treść */}
        <div className="p-6 space-y-4">
          {hasExpenses ? (
            <>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-gray-100 font-medium mb-2">
                    Nie można usunąć lokalizacji
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Lokalizacja <strong>"{location}"</strong> jest używana w wydatkach.
                    Aby ją usunąć, najpierw usuń lub zmień lokalizację we wszystkich
                    powiązanych wydatkach.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-900 dark:text-gray-100">
                Czy na pewno chcesz usunąć lokalizację <strong>"{location}"</strong>?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ta operacja nie może być cofnięta.
              </p>
            </>
          )}
        </div>

        {/* Przyciski */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1"
          >
            {hasExpenses ? "Zamknij" : "Anuluj"}
          </Button>
          {!hasExpenses && (
            <Button
              type="button"
              variant="primary"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {isDeleting ? "Usuwanie..." : "Usuń"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

