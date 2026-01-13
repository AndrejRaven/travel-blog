"use client";

import { X, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";
import type { Expense } from "@/lib/travel-wallet/types";
import { convertExpenseToPLN } from "@/lib/travel-wallet/expenses";

interface DeleteExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  expense: Expense;
}

export default function DeleteExpenseModal({
  isOpen,
  onClose,
  onConfirm,
  expense,
}: DeleteExpenseModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pl-PL", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const amountInPLN = convertExpenseToPLN(expense);
  const formattedDate = new Date(expense.date).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100">
              Usuń wydatek
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Treść */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Czy na pewno chcesz usunąć ten wydatek? Ta operacja nie może być cofnięta.
          </p>

          {/* Szczegóły wydatku */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Kategoria:
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {expense.category}
              </span>
            </div>
            {expense.description && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Opis:
                </span>
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {expense.description}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Data:
              </span>
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {formattedDate}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Kwota:
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(amountInPLN)} zł
                {expense.currency !== "PLN" && (
                  <span className="text-xs text-gray-500 dark:text-gray-500 ml-1">
                    ({formatCurrency(expense.amount)} {expense.currency})
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Przyciski */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Anuluj
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
          >
            Usuń
          </Button>
        </div>
      </div>
    </div>
  );
}

