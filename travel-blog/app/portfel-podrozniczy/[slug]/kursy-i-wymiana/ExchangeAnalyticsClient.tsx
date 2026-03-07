"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Wallet, List, ChevronUp, ChevronDown } from "lucide-react";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import Link from "@/components/ui/Link";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import { getCurrencyTransactions } from "@/lib/travel-wallet/currency-transactions";
import { getCountryById } from "@/lib/travel-wallet/countries";
import { formatCurrency, formatDate } from "@/lib/travel-wallet/formatters";
import { getTripBySlug } from "@/lib/travel-wallet/trips-storage";
import type { CurrencyTransaction, ExchangeRate } from "@/lib/travel-wallet/types";
import { convertToBaseCurrency } from "@/lib/travel-wallet/reference-rates";

type SortField = "date" | "from" | "to" | "amount" | "rate" | "fee" | "country" | null;
type SortDirection = "asc" | "desc";

interface ExchangeAnalyticsClientProps {
  slug: string;
  embedded?: boolean;
}

export default function ExchangeAnalyticsClient({ slug, embedded }: ExchangeAnalyticsClientProps) {
  const trip = getTripBySlug(slug);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { transactions, summary } = useMemo(() => {
    if (!trip) {
      return {
        transactions: [] as CurrencyTransaction[],
        summary: { totalFeeBase: 0, count: 0, baseCurrency: "PLN" as const, rates: [] as ExchangeRate[] },
      };
    }
    let list = getCurrencyTransactions(trip.id).filter((t) => t.type === "exchange");
    if (dateFrom) list = list.filter((t) => t.date >= dateFrom);
    if (dateTo) list = list.filter((t) => t.date <= dateTo);
    if (countryFilter) list = list.filter((t) => t.countryId === countryFilter);

    const baseCurrency = trip.data?.wallet?.baseCurrency ?? "PLN";
    const rates = trip.data?.wallet?.referenceRates ?? [];
    const totalFeeBase = list.reduce(
      (sum, t) =>
        sum +
        convertToBaseCurrency(t.fee ?? 0, t.feeCurrency ?? "PLN", baseCurrency, rates),
      0
    );

    return {
      transactions: list,
      summary: { totalFeeBase, count: list.length, baseCurrency, rates },
    };
  }, [trip, dateFrom, dateTo, countryFilter]);

  const sortedTransactions = useMemo(() => {
    if (!sortField || !trip) return transactions;
    return [...transactions].sort((a, b) => {
      let cmp = 0;
      const nameA = a.countryId ? getCountryById(a.countryId, trip.id)?.name ?? "" : "";
      const nameB = b.countryId ? getCountryById(b.countryId, trip.id)?.name ?? "" : "";
      if (sortField === "date") cmp = a.date.localeCompare(b.date);
      else if (sortField === "from") cmp = a.fromCurrency.localeCompare(b.fromCurrency);
      else if (sortField === "to") cmp = a.toCurrency.localeCompare(b.toCurrency);
      else if (sortField === "amount") cmp = a.fromAmount - b.fromAmount;
      else if (sortField === "rate") cmp = (a.rate ?? 0) - (b.rate ?? 0);
      else if (sortField === "fee")
        cmp =
          convertToBaseCurrency(a.fee ?? 0, a.feeCurrency ?? "PLN", trip.data?.wallet?.baseCurrency ?? "PLN", trip.data?.wallet?.referenceRates ?? []) -
          convertToBaseCurrency(b.fee ?? 0, b.feeCurrency ?? "PLN", trip.data?.wallet?.baseCurrency ?? "PLN", trip.data?.wallet?.referenceRates ?? []);
      else if (sortField === "country") cmp = nameA.localeCompare(nameB);
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [transactions, sortField, sortDirection, trip]);

  const hasActiveFilters = !!(dateFrom || dateTo || countryFilter);
  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setCountryFilter("");
  };
  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDirection("desc");
    }
  };
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return <ChevronUp className="w-4 h-4 text-gray-400 opacity-30" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    ) : (
      <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    );
  };

  if (!trip) {
    const noTripMessage = (
      <div className="text-center py-12 text-gray-600 dark:text-gray-400">
        Nie udało się załadować danych podróży.
      </div>
    );
    if (embedded) return noTripMessage;
    return (
      <PageLayout maxWidth="6xl">
        {noTripMessage}
      </PageLayout>
    );
  }

  const content = (
    <>
      {/* Filtry */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Od</label>
              <DatePicker value={dateFrom} onChange={setDateFrom} />
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Do</label>
              <DatePicker value={dateTo} onChange={setDateTo} />
            </div>
            <div className="min-w-[160px]">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kraj</label>
              <Select
                value={countryFilter}
                onChange={setCountryFilter}
                options={[{ value: "", label: "Wszystkie" }, ...trip.data.countries.map((c) => ({ value: c.id, label: c.name }))]}
                placeholder="Wszystkie"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Wyczyść
            </button>
          )}
        </div>
      </div>

      {/* Karty podsumowania */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Łączna prowizja ({summary.baseCurrency})</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(summary.totalFeeBase, summary.baseCurrency)}</p>
            </div>
            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3 flex-shrink-0 ml-4">
              <Wallet className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Liczba wymian</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{summary.count}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 flex-shrink-0 ml-4">
              <List className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 p-6 pb-0">Lista transakcji wymiany</h3>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Brak transakcji wymiany w wybranym okresie.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th
                    className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-2">Data {renderSortIndicator("date")}</div>
                  </th>
                  <th
                    className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("from")}
                  >
                    <div className="flex items-center gap-2">Z {renderSortIndicator("from")}</div>
                  </th>
                  <th
                    className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("to")}
                  >
                    <div className="flex items-center gap-2">Na {renderSortIndicator("to")}</div>
                  </th>
                  <th
                    className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex justify-end gap-2">Kwota {renderSortIndicator("amount")}</div>
                  </th>
                  <th
                    className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("rate")}
                  >
                    <div className="flex justify-end gap-2">Kurs {renderSortIndicator("rate")}</div>
                  </th>
                  <th
                    className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("fee")}
                  >
                    <div className="flex justify-end gap-2">Prowizja {renderSortIndicator("fee")}</div>
                  </th>
                  <th
                    className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("country")}
                  >
                    <div className="flex items-center gap-2">Kraj {renderSortIndicator("country")}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map((t) => {
                  const countryName = t.countryId ? getCountryById(t.countryId, trip.id)?.name ?? "—" : "—";
                  const feeInBase =
                    (t.fee ?? 0) > 0
                      ? convertToBaseCurrency(t.fee ?? 0, t.feeCurrency ?? "PLN", summary.baseCurrency, summary.rates)
                      : 0;
                  return (
                    <tr key={t.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatDate(t.date)}</td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{t.fromCurrency}</td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{t.toCurrency}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(t.fromAmount, t.fromCurrency)} → {formatCurrency(t.toAmount, t.toCurrency)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">{t.rate != null ? t.rate.toFixed(4) : "—"}</td>
                      <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                        {t.fee != null && t.fee > 0 ? formatCurrency(t.fee, t.feeCurrency ?? "PLN") : "—"}
                        {feeInBase > 0 && (
                          <span className="text-gray-500 dark:text-gray-400 ml-1">({formatCurrency(feeInBase, summary.baseCurrency)})</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{countryName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  if (embedded) return content;
  return (
    <PageLayout maxWidth="6xl">
      <div className="mb-8">
        <Link
          href={`/portfel-podrozniczy/${slug}`}
          variant="default"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Powrót do dashboardu
        </Link>
      </div>

      <PageHeader
        title="Kursy i wymiana"
        subtitle="Transakcje wymiany walut i prowizje"
      />

      {content}
    </PageLayout>
  );
}
