"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Wallet, TrendingUp, Globe } from "lucide-react";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import Link from "@/components/ui/Link";
import DatePicker from "@/components/ui/DatePicker";
import { getAllExpenses } from "@/lib/travel-wallet/expenses";
import { formatCurrency } from "@/lib/travel-wallet/formatters";
import { getTripBySlug } from "@/lib/travel-wallet/trips-storage";
import type { Expense } from "@/lib/travel-wallet/types";
import { calculateTotalActualCostByTripId } from "@/lib/travel-wallet/country-calculations";

interface CountryComparisonClientProps {
  slug: string;
  embedded?: boolean;
}

function getDaysInRange(startDate?: string, endDate?: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

export default function CountryComparisonClient({ slug, embedded }: CountryComparisonClientProps) {
  const trip = getTripBySlug(slug);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { countryStats, summary, countryChartData } = useMemo(() => {
    if (!trip) {
      return {
        countryStats: [] as Array<{
          countryId: string;
          name: string;
          days: number;
          spentPLN: number;
          avgPerDay: number;
          topCategories: Array<{ category: string; totalPLN: number }>;
        }>,
        summary: { totalCountries: 0, mostExpensiveName: "", mostExpensivePLN: 0, cheapestAvgName: "", cheapestAvg: 0 },
        countryChartData: [] as Array<{ country: string; value: number }>,
      };
    }
    const allExpenses = getAllExpenses(trip.id);
    let filteredExpenses = allExpenses;
    if (dateFrom) filteredExpenses = filteredExpenses.filter((e) => e.date >= dateFrom);
    if (dateTo) filteredExpenses = filteredExpenses.filter((e) => e.date <= dateTo);

    const stats = trip.data.countries.map((country) => {
      const countryExpenses = filteredExpenses.filter((e) => e.countryId === country.id);
      const spentBase = calculateTotalActualCostByTripId(countryExpenses, trip.id);
      const days = getDaysInRange(country.startDate, country.endDate) || 1;
      const avgPerDay = days > 0 ? spentBase / days : 0;
      const categoryMap = new Map<string, Expense[]>();
      countryExpenses.forEach((e) => {
        const arr = categoryMap.get(e.category) ?? [];
        arr.push(e);
        categoryMap.set(e.category, arr);
      });
      const topCategories = Array.from(categoryMap.entries())
        .map(([category, expenses]) => ({
          category,
          totalPLN: calculateTotalActualCostByTripId(expenses, trip.id),
        }))
        .sort((a, b) => b.totalPLN - a.totalPLN)
        .slice(0, 3);
      return {
        countryId: country.id,
        name: country.name,
        days,
        spentPLN: spentBase,
        avgPerDay,
        topCategories,
      };
    });

    const mostExpensive = stats.reduce(
      (best, s) => (s.spentPLN > best.spentPLN ? s : best),
      stats[0] ?? { name: "", spentPLN: 0 }
    );
    const withDays = stats.filter((s) => s.days > 0);
    const cheapestAvg = withDays.reduce(
      (best, s) => (s.avgPerDay > 0 && (best.avgPerDay === 0 || s.avgPerDay < best.avgPerDay) ? s : best),
      withDays[0] ?? { name: "", avgPerDay: 0 }
    );

    const countryChartData = stats
      .map((s) => ({ country: s.name, value: s.spentPLN }))
      .sort((a, b) => b.value - a.value);

    return {
      countryStats: stats,
      summary: {
        totalCountries: trip.data.countries.length,
        mostExpensiveName: mostExpensive?.name ?? "",
        mostExpensivePLN: mostExpensive?.spentPLN ?? 0,
        cheapestAvgName: cheapestAvg?.name ?? "",
        cheapestAvg: cheapestAvg?.avgPerDay ?? 0,
      },
      countryChartData,
    };
  }, [trip, dateFrom, dateTo]);

  const hasActiveFilters = !!(dateFrom || dateTo);
  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
  };
  const handleQuickFilter = (preset: "last7" | "last30" | "all") => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (preset === "last7") {
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      setDateFrom(start.toISOString().split("T")[0]);
      setDateTo(today.toISOString().split("T")[0]);
    } else if (preset === "last30") {
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      setDateFrom(start.toISOString().split("T")[0]);
      setDateTo(today.toISOString().split("T")[0]);
    } else {
      setDateFrom("");
      setDateTo("");
    }
  };

  if (!trip) {
    const noTripMessage = (
      <div className="text-center py-12 text-gray-600 dark:text-gray-400">
        Nie udało się załadować danych podróży.
      </div>
    );
    if (embedded) return noTripMessage;
    return <PageLayout maxWidth="6xl">{noTripMessage}</PageLayout>;
  }

  const baseCurrency = trip.data?.wallet?.baseCurrency ?? "PLN";

  const content = (
    <>
      {/* Filtry */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Od</label>
              <DatePicker value={dateFrom} onChange={setDateFrom} />
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Do</label>
              <DatePicker value={dateTo} onChange={setDateTo} />
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
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Szybkie filtry:</span>
          {[
            { key: "last7" as const, label: "Ostatnie 7 dni" },
            { key: "last30" as const, label: "Ostatni miesiąc" },
            { key: "all" as const, label: "Cała podróż" },
          ].map((preset) => (
            <button
              key={preset.key}
              onClick={() => handleQuickFilter(preset.key)}
              className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Karty podsumowania */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Łącznie krajów</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{summary.totalCountries}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 flex-shrink-0 ml-4">
              <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Najdroższy kraj</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate" title={summary.mostExpensiveName}>{summary.mostExpensiveName || "—"}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(summary.mostExpensivePLN, baseCurrency)}</p>
            </div>
            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3 flex-shrink-0 ml-4">
              <Wallet className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Najtańszy dzień średnio</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate" title={summary.cheapestAvgName}>{summary.cheapestAvgName || "—"}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{summary.cheapestAvg > 0 ? formatCurrency(summary.cheapestAvg, baseCurrency) + " / dzień" : "—"}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 flex-shrink-0 ml-4">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Wykres słupkowy */}
      {countryChartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Wydatki per kraj</h3>
          <div className="space-y-3">
            {countryChartData.slice(0, 10).map((item, index) => {
              const maxValue = Math.max(...countryChartData.map((c) => c.value), 1);
              const percentage = (item.value / maxValue) * 100;
              return (
                <div key={item.country} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{item.country}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(item.value, baseCurrency)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabela krajów */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 p-6 pb-0">Szczegóły per kraj</h3>
        {countryStats.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Brak krajów w podróży.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Kraj</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Dni</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Wydane ({baseCurrency})</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Śr. dzienna</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Top 3 kategorie</th>
                </tr>
              </thead>
              <tbody>
                {countryStats.map((row) => (
                  <tr key={row.countryId} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{row.days}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-gray-100">{formatCurrency(row.spentPLN, baseCurrency)}</td>
                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">{row.days > 0 ? formatCurrency(row.avgPerDay, baseCurrency) : "—"}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {row.topCategories.length > 0 ? row.topCategories.map((c) => c.category).join(", ") : "—"}
                    </td>
                  </tr>
                ))}
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
        title="Porównanie krajów"
        subtitle="Wydatki i średnie dzienne w podziale na kraje"
      />

      {content}
    </PageLayout>
  );
}
