"use client";

import { useState, useMemo } from "react";
import { History, Trash2, ArrowRight, Edit, Filter, Calendar, ArrowUpDown, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import type { CurrencyTransaction } from "@/lib/travel-wallet/types";
import { formatCurrency, formatDateWithTime, formatDateShort } from "@/lib/travel-wallet/formatters";
import { TRANSACTION_TYPE_LABELS } from "@/lib/travel-wallet/constants";

interface CurrencyTransactionsHistoryProps {
  transactions: CurrencyTransaction[];
  onDelete?: (transactionId: string) => void;
  onEdit?: (transaction: CurrencyTransaction) => void;
  onTransactionClick?: (transaction: CurrencyTransaction) => void;
}

function groupByDate(
  transactions: CurrencyTransaction[]
): Record<string, CurrencyTransaction[]> {
  const grouped: Record<string, CurrencyTransaction[]> = {};

  transactions.forEach((tx) => {
    // Grupuj po dacie (bez godziny)
    if (!grouped[tx.date]) {
      grouped[tx.date] = [];
    }
    grouped[tx.date].push(tx);
  });

  return grouped;
}

function getTransactionTimestamp(tx: CurrencyTransaction): number {
  const date = new Date(tx.date);
  if (tx.time) {
    const [hours, minutes] = tx.time.split(":");
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  } else {
    date.setHours(0, 0);
  }
  return date.getTime();
}

export default function CurrencyTransactionsHistory({
  transactions,
  onDelete,
  onEdit,
  onTransactionClick,
}: CurrencyTransactionsHistoryProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Pobierz wszystkie unikalne waluty z transakcji
  const availableCurrencies = useMemo(() => {
    const currencies = new Set<string>();
    transactions.forEach((tx) => {
      currencies.add(tx.fromCurrency);
      currencies.add(tx.toCurrency);
    });
    return Array.from(currencies).sort();
  }, [transactions]);

  // Filtruj i sortuj transakcje
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filtrowanie po walucie
    if (selectedCurrency) {
      filtered = filtered.filter(
        (tx) =>
          tx.fromCurrency === selectedCurrency ||
          tx.toCurrency === selectedCurrency
      );
    }

    // Filtrowanie po zakresie dat
    if (dateFrom) {
      filtered = filtered.filter((tx) => tx.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((tx) => tx.date <= dateTo);
    }

    // Sortowanie
    filtered.sort((a, b) => {
      const timestampA = getTransactionTimestamp(a);
      const timestampB = getTransactionTimestamp(b);
      return sortOrder === "newest"
        ? timestampB - timestampA
        : timestampA - timestampB;
    });

    return filtered;
  }, [transactions, selectedCurrency, dateFrom, dateTo, sortOrder]);

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <History className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Historia transakcji walutowych
          </h3>
        </div>

        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            Nie masz jeszcze żadnych transakcji walutowych
          </p>
        </div>
      </div>
    );
  }

  const groupedTransactions = groupByDate(filteredAndSortedTransactions);
  const dates = Object.keys(groupedTransactions).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );
  
  // Sort transactions within each date group by time
  Object.keys(groupedTransactions).forEach((date) => {
    groupedTransactions[date].sort((a, b) => {
      const timestampA = getTransactionTimestamp(a);
      const timestampB = getTransactionTimestamp(b);
      return sortOrder === "newest"
        ? timestampB - timestampA
        : timestampA - timestampB;
    });
  });

  const hasActiveFilters = selectedCurrency || dateFrom || dateTo;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <History className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Historia transakcji walutowych
          </h3>
          {hasActiveFilters && (
            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
              Filtry aktywne
            </span>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filtry</span>
        </button>
      </div>

      {/* Filtry */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filtry i sortowanie
            </h4>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSelectedCurrency("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Wyczyść filtry
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Filtrowanie po walucie */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Waluta
              </label>
              <Select
                value={selectedCurrency}
                onChange={setSelectedCurrency}
                options={[
                  { value: "", label: "Wszystkie" },
                  ...availableCurrencies.map((currency) => ({
                    value: currency,
                    label: currency,
                  })),
                ]}
                placeholder="Wszystkie"
                className="text-sm"
              />
            </div>

            {/* Data od */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Data od
              </label>
              <div className="relative">
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Data do */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Data do
              </label>
              <div className="relative">
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Sortowanie */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Sortowanie
              </label>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "newest" ? "oldest" : "newest")
                }
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span>{sortOrder === "newest" ? "Najnowsze" : "Najstarsze"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {dates.map((date) => (
          <div key={date}>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              {formatDateShort(date)}
            </div>

            <div className="space-y-3">
              {groupedTransactions[date].map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => onTransactionClick?.(tx)}
                  className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors ${
                    onTransactionClick
                      ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Type */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          {TRANSACTION_TYPE_LABELS[tx.type]}
                        </span>
                      </div>

                      {/* Transaction details */}
                      <div className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-gray-100">
                        <span>{formatCurrency(tx.fromAmount, tx.fromCurrency)}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span>{formatCurrency(tx.toAmount, tx.toCurrency)}</span>
                      </div>

                      {/* Exchange rate */}
                      {tx.type !== "initial" && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Kurs: 1 {tx.fromCurrency} = {tx.rate.toFixed(4)} {tx.toCurrency}
                        </div>
                      )}

                      {/* Fee */}
                      {tx.fee && tx.feeCurrency && (
                        <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                          Prowizja: {formatCurrency(tx.fee, tx.feeCurrency)}
                        </div>
                      )}

                      {/* Location */}
                      {tx.location && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          📍 {tx.location}
                        </div>
                      )}

                      {/* Note */}
                      {tx.note && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                          {tx.note}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(tx);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                          title="Edytuj transakcję"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(tx.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Usuń transakcję"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
