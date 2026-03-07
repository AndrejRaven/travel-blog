"use client";

import { X, Crown, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  currentCount: number;
  limit: number;
  onUpgrade?: () => void;
}

export default function UpgradePrompt({
  isOpen,
  onClose,
  currentCount,
  limit,
  onUpgrade,
}: UpgradePromptProps) {
  if (!isOpen) return null;

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-prompt-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-500" />
            <h2
              id="upgrade-prompt-title"
              className="text-xl font-semibold text-gray-900 dark:text-gray-100"
            >
              Limit podróży osiągnięty
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
        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Masz już {currentCount} {currentCount === 1 ? 'podróż' : 'podróże'} w chmurze. Darmowy plan pozwala na utworzenie tylko {limit} {limit === 1 ? 'podróży' : 'podróży'}.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Co daje Premium?
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <Crown className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>Nielimitowana liczba podróży w chmurze</span>
              </li>
              <li className="flex items-start gap-2">
                <Crown className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>Synchronizacja na wszystkich urządzeniach</span>
              </li>
              <li className="flex items-start gap-2">
                <Crown className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>Automatyczne backupy danych</span>
              </li>
              <li className="flex items-start gap-2">
                <Crown className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>Priorytetowe wsparcie</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 space-y-3">
            {onUpgrade ? (
              <Button
                onClick={() => {
                  onUpgrade();
                  onClose();
                }}
                variant="primary"
                className="w-full flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" />
                <span>Przejdź na Premium</span>
              </Button>
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Skontaktuj się z nami aby uzyskać dostęp do Premium
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
