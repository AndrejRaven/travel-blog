"use client";

import { X, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";
import type { RateVerificationResult } from "@/lib/travel-wallet/rate-verification";

interface ExchangeRateVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  verification: RateVerificationResult;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
}

function formatRate(rate: number): string {
  return new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(rate);
}

export default function ExchangeRateVerificationModal({
  isOpen,
  onClose,
  onConfirm,
  verification,
  fromCurrency,
  toCurrency,
  fromAmount,
  toAmount,
}: ExchangeRateVerificationModalProps) {
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

  const differencePercent = verification.differencePercent ?? 0;
  const isAbove = verification.isAboveLimit;
  const isBelow = verification.isBelowLimit;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rate-verification-modal-title"
    >
      <div className="relative w-full max-w-md rounded-lg shadow-xl bg-white dark:bg-gray-800 border border-yellow-500 dark:border-yellow-600 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Zamknij"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1">
            <h2
              id="rate-verification-modal-title"
              className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2"
            >
              Ostrzeżenie: Kurs poza granicami
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Kurs wymiany, który wprowadziłeś, znacznie odbiega od kursu z API.
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {/* Kurs wprowadzony przez użytkownika */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Kurs wprowadzony przez Ciebie:
            </div>
            <div
              className={`text-lg font-semibold ${
                isBelow
                  ? "text-red-600 dark:text-red-400"
                  : isAbove
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-900 dark:text-gray-100"
              }`}
            >
              1 {fromCurrency} = {formatRate(verification.transactionRate)} {toCurrency}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {fromAmount} {fromCurrency} → {toAmount} {toCurrency}
            </div>
          </div>

          {/* Kurs z API */}
          {verification.referenceRate !== null ? (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Kurs z API:
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                1 {fromCurrency} = {formatRate(verification.referenceRate)} {toCurrency}
              </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <div className="text-sm font-medium text-red-800 dark:text-red-200">
                ⚠️ Nie znaleziono kursu referencyjnego w API
              </div>
              <div className="text-xs text-red-700 dark:text-red-300 mt-1">
                Nie można zweryfikować kursu dla pary {fromCurrency}/{toCurrency}. Sprawdź czy kurs jest poprawny.
              </div>
            </div>
          )}

          {/* Różnica */}
          {verification.differencePercent !== null && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Różnica:{" "}
                {differencePercent > 0 ? "+" : ""}
                {formatRate(Math.abs(differencePercent))}%{" "}
                {isAbove
                  ? "powyżej kursu z API"
                  : isBelow
                  ? "poniżej kursu z API"
                  : ""}
              </div>
            </div>
          )}

          {/* Ostrzeżenie */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
              Czy na pewno wymieniłeś po tym kursie?
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Kurs różni się o więcej niż 10% od kursu referencyjnego. Sprawdź czy nie pomyliłeś kwot lub walut.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Anuluj i popraw
          </Button>
          <Button variant="primary" onClick={onConfirm} className="flex-1">
            Tak, zapisz mimo to
          </Button>
        </div>
      </div>
    </div>
  );
}
