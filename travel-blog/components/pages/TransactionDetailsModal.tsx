"use client";

import { X, Calendar, ArrowRight, MapPin, FileText, Globe, TrendingUp } from "lucide-react";
import Button from "@/components/ui/Button";
import type { CurrencyTransaction } from "@/lib/travel-wallet/types";
import { getTripById } from "@/lib/travel-wallet/trips-storage";
import { formatCurrency, formatDate } from "@/lib/travel-wallet/formatters";
import { TRANSACTION_TYPE_LABELS } from "@/lib/travel-wallet/constants";
import { convertToBaseCurrency } from "@/lib/travel-wallet/reference-rates";

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: CurrencyTransaction | null;
}

export default function TransactionDetailsModal({
  isOpen,
  onClose,
  transaction,
}: TransactionDetailsModalProps) {
  if (!isOpen || !transaction) return null;

  const trip = getTripById(transaction.tripId);
  const baseCurrency = trip?.data?.wallet?.baseCurrency ?? "PLN";
  const rates = trip?.data?.wallet?.referenceRates ?? [];
  const fromAmountInBase = convertToBaseCurrency(
    transaction.fromAmount,
    transaction.fromCurrency,
    baseCurrency,
    rates
  );
  const toAmountInBase = convertToBaseCurrency(
    transaction.toAmount,
    transaction.toCurrency,
    baseCurrency,
    rates
  );

  // Pobierz nazwę kraju jeśli countryId jest dostępne
  let countryName: string | null = null;
  if (transaction.countryId && trip) {
    const country = trip.data.countries.find((c) => c.id === transaction.countryId);
    if (country) countryName = country.name;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100">
              Szczegóły transakcji
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Type Badge */}
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
              {TRANSACTION_TYPE_LABELS[transaction.type] || transaction.type}
            </span>
          </div>

          {/* Exchange Details */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(transaction.fromAmount, transaction.fromCurrency, 2)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {transaction.fromCurrency}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  ≈ {formatCurrency(fromAmountInBase, baseCurrency)}
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(transaction.toAmount, transaction.toCurrency, 2)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {transaction.toCurrency}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  ≈ {formatCurrency(toAmountInBase, baseCurrency)}
                </div>
              </div>
            </div>
          </div>

          {/* Exchange Rate */}
          {transaction.type !== "initial" && (
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kurs wymiany
                </div>
                <div className="text-base text-gray-900 dark:text-gray-100 mt-1">
                  1 {transaction.fromCurrency} = {transaction.rate.toFixed(4)} {transaction.toCurrency}
                </div>
              </div>
            </div>
          )}

          {/* Date */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Data transakcji
              </div>
              <div className="text-base text-gray-900 dark:text-gray-100 mt-1">
                {formatDate(transaction.date)}
              </div>
            </div>
          </div>

          {/* Location */}
          {transaction.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Miejsce
                </div>
                <div className="text-base text-gray-900 dark:text-gray-100 mt-1">
                  {transaction.location}
                </div>
              </div>
            </div>
          )}

          {/* Country */}
          {countryName && (
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kraj
                </div>
                <div className="text-base text-gray-900 dark:text-gray-100 mt-1">
                  {countryName}
                </div>
              </div>
            </div>
          )}

          {/* Fee */}
          {transaction.fee && transaction.feeCurrency && (
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Prowizja
                </div>
                <div className="text-base text-red-600 dark:text-red-400 mt-1">
                  {formatCurrency(transaction.fee, transaction.feeCurrency, 2)}
                </div>
              </div>
            </div>
          )}

          {/* Note */}
          {transaction.note && (
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notatka
                </div>
                <div className="text-base text-gray-900 dark:text-gray-100 mt-1 italic">
                  {transaction.note}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Zamknij
          </Button>
        </div>
      </div>
    </div>
  );
}
