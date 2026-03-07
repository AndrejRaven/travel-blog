"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Download, X, Wallet, List, TrendingUp, MapPin, Calendar, ChevronUp, ChevronDown } from "lucide-react";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import Link from "@/components/ui/Link";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import SearchBar from "@/components/ui/SearchBar";
import LineChart from "@/components/ui/LineChart";
import InsightsCard from "@/components/ui/InsightsCard";
import ComparisonCard from "@/components/ui/ComparisonCard";
import { getAllExpenses, convertExpenseToPLN } from "@/lib/travel-wallet/expenses";
import { getCountryById } from "@/lib/travel-wallet/countries";
import { formatCurrency, formatDate } from "@/lib/travel-wallet/formatters";
import { getTripBySlug } from "@/lib/travel-wallet/trips-storage";
import type { Expense } from "@/lib/travel-wallet/types";
import {
  calculateDailyTotalsInPLN,
  groupExpensesByWeek,
  groupExpensesByMonth,
  getExpensesThisWeek,
  getExpensesPreviousWeek,
  getExpensesThisMonth,
  getExpensesPreviousMonth,
  calculateTrend,
} from "@/lib/travel-wallet/expense-analytics";

type SortField = "date" | "country" | "amount" | null;
type SortDirection = "asc" | "desc";

interface TransportAnalyticsClientProps {
  slug: string;
  embedded?: boolean;
}

export default function TransportAnalyticsClient({
  slug,
  embedded = false,
}: TransportAnalyticsClientProps) {
  const trip = getTripBySlug(slug);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeView, setTimeView] = useState<"day" | "week" | "month">("day");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { transportExpenses, summary } = useMemo(() => {
    if (!trip) {
      return {
        transportExpenses: [] as Expense[],
        summary: { totalPLN: 0, count: 0, avgPerEntry: 0 },
      };
    }
    const all = getAllExpenses(trip.id).filter((e) => e.category === "Transport");
    let filtered = all;
    if (dateFrom) filtered = filtered.filter((e) => e.date >= dateFrom);
    if (dateTo) filtered = filtered.filter((e) => e.date <= dateTo);
    if (countryFilter) filtered = filtered.filter((e) => e.countryId === countryFilter);
    const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

    const totalPLN = sorted.reduce((sum, e) => sum + convertExpenseToPLN(e), 0);
    const count = sorted.length;
    const avgPerEntry = count > 0 ? totalPLN / count : 0;

    return {
      transportExpenses: sorted,
      summary: { totalPLN, count, avgPerEntry },
    };
  }, [trip, dateFrom, dateTo, countryFilter]);

  const allTransport = useMemo(() => {
    if (!trip) return [];
    return getAllExpenses(trip.id).filter((e) => e.category === "Transport");
  }, [trip]);

  const periodComparisonData = useMemo(() => {
    const thisWeek = getExpensesThisWeek(allTransport);
    const previousWeek = getExpensesPreviousWeek(allTransport);
    const thisMonth = getExpensesThisMonth(allTransport);
    const previousMonth = getExpensesPreviousMonth(allTransport);
    const toPLN = (arr: Expense[]) => arr.reduce((sum, e) => sum + convertExpenseToPLN(e), 0);
    return {
      week: { current: toPLN(thisWeek), previous: toPLN(previousWeek) },
      month: { current: toPLN(thisMonth), previous: toPLN(previousMonth) },
    };
  }, [allTransport]);

  const dailyTotals = useMemo(
    () => calculateDailyTotalsInPLN(transportExpenses, convertExpenseToPLN),
    [transportExpenses]
  );

  const weeklyTotals = useMemo(() => {
    const grouped = groupExpensesByWeek(transportExpenses);
    return Object.entries(grouped)
      .map(([week, weekExpenses]) => ({
        week,
        total: weekExpenses.reduce((sum, e) => sum + convertExpenseToPLN(e), 0),
        count: weekExpenses.length,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [transportExpenses]);

  const monthlyTotals = useMemo(() => {
    const grouped = groupExpensesByMonth(transportExpenses);
    return Object.entries(grouped)
      .map(([month, monthExpenses]) => ({
        month,
        total: monthExpenses.reduce((sum, e) => sum + convertExpenseToPLN(e), 0),
        count: monthExpenses.length,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transportExpenses]);

  const timeChartData = useMemo(() => {
    if (timeView === "day") {
      return dailyTotals.map((d) => ({
        label: formatDate(d.date),
        value: d.total,
        count: d.count,
        date: d.date,
      }));
    }
    if (timeView === "week") {
      return weeklyTotals.map((w) => ({
        label: `Tydzień ${formatDate(w.week)}`,
        value: w.total,
        count: w.count,
      }));
    }
    return monthlyTotals.map((m) => ({
      label: m.month,
      value: m.total,
      count: m.count,
    }));
  }, [timeView, dailyTotals, weeklyTotals, monthlyTotals]);

  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return transportExpenses;
    const q = searchQuery.toLowerCase();
    return transportExpenses.filter((e) => {
      const country = trip ? getCountryById(e.countryId, trip.id) : null;
      const countryName = (country?.name || "").toLowerCase();
      const desc = (e.description || "").toLowerCase();
      const loc = (e.location || "").toLowerCase();
      const note = (e.note || "").toLowerCase();
      return desc.includes(q) || loc.includes(q) || note.includes(q) || countryName.includes(q);
    });
  }, [transportExpenses, searchQuery, trip]);

  const sortedExpenses = useMemo(() => {
    if (!sortField) return filteredBySearch;
    const sorted = [...filteredBySearch].sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") cmp = a.date.localeCompare(b.date);
      else if (sortField === "country") {
        const ca = trip ? getCountryById(a.countryId, trip.id)?.name ?? "" : "";
        const cb = trip ? getCountryById(b.countryId, trip.id)?.name ?? "" : "";
        cmp = ca.localeCompare(cb);
      } else if (sortField === "amount") cmp = convertExpenseToPLN(a) - convertExpenseToPLN(b);
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredBySearch, sortField, sortDirection, trip]);

  type TransportInsightsShape = {
    highestExpense: { date: string; amountPLN: number; id: string } | null;
    topCountry: { name: string; total: number } | null;
    trend: { direction: "up" | "down" | "stable"; percentage: number; message: string } | null;
  };
  const insights = useMemo((): TransportInsightsShape => {
    if (transportExpenses.length === 0)
      return { highestExpense: null, topCountry: null, trend: null };
    let highestExpense: { date: string; amountPLN: number; id: string } | null = null;
    transportExpenses.forEach((e) => {
      const pln = convertExpenseToPLN(e);
      if (!highestExpense || pln > highestExpense.amountPLN)
        highestExpense = { date: e.date, amountPLN: pln, id: e.id };
    });
    const byCountry = new Map<string, number>();
    transportExpenses.forEach((e) => {
      const name = trip ? getCountryById(e.countryId, trip.id)?.name ?? "" : "";
      if (name) byCountry.set(name, (byCountry.get(name) ?? 0) + convertExpenseToPLN(e));
    });
    const topCountryEntry =
      byCountry.size > 0
        ? Array.from(byCountry.entries()).reduce<{ name: string; total: number } | null>(
            (best, [name, total]) => (total > (best?.total ?? 0) ? { name, total } : best),
            null
          )
        : null;
    const trend = calculateTrend(transportExpenses);
    return { highestExpense, topCountry: topCountryEntry, trend };
  }, [transportExpenses, trip]);

  const hasActiveFilters = !!(dateFrom || dateTo || countryFilter);
  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setCountryFilter("");
    setSearchQuery("");
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
  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDirection("asc");
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

  const handleExportCSV = () => {
    if (!trip) return;
    const headers = ["Data", "Kraj", "Kwota", "Waluta", "Opis"];
    const rows = transportExpenses.map((e) => {
      const country = getCountryById(e.countryId, trip.id);
      return [
        e.date,
        country?.name ?? "",
        e.amount.toString().replace(".", ","),
        e.currency,
        (e.description || "").replace(/;/g, ","),
      ].join(";");
    });
    const csv = [headers.join(";"), ...rows].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transport-${trip.slug}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!trip) {
    const msg = (
      <div className="text-center py-12 text-gray-600 dark:text-gray-400">
        Nie udało się załadować danych podróży.
      </div>
    );
    return embedded ? msg : <PageLayout maxWidth="6xl">{msg}</PageLayout>;
  }

  const tripId = trip.id;
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
            <div className="min-w-[160px]">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kraj</label>
              <Select
                value={countryFilter}
                onChange={setCountryFilter}
                options={[{ value: "", label: "Wszystkie" }, ...trip.data.countries.map((c) => ({ value: c.id, label: c.name }))]}
                placeholder="Wszystkie"
              />
            </div>
            {transportExpenses.length > 0 && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
              >
                <Download className="w-4 h-4" />
                Eksport CSV
              </button>
            )}
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <X className="w-4 h-4" />
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
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap mt-3">
            {dateFrom && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                Od: {formatDate(dateFrom)}
                <button onClick={() => setDateFrom("")} className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5" aria-label="Usuń"><X className="w-3.5 h-3.5" /></button>
              </span>
            )}
            {dateTo && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                Do: {formatDate(dateTo)}
                <button onClick={() => setDateTo("")} className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5" aria-label="Usuń"><X className="w-3.5 h-3.5" /></button>
              </span>
            )}
            {countryFilter && (() => {
              const c = trip.data.countries.find((x) => x.id === countryFilter);
              return c ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                  Kraj: {c.name}
                  <button onClick={() => setCountryFilter("")} className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5" aria-label="Usuń"><X className="w-3.5 h-3.5" /></button>
                </span>
              ) : null;
            })()}
          </div>
        )}
      </div>

      {/* Karty podsumowania */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Łącznie ({baseCurrency})</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(summary.totalPLN, baseCurrency)}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 flex-shrink-0 ml-4">
              <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Liczba wpisów</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{summary.count}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 flex-shrink-0 ml-4">
              <List className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Średnia per wpis</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{summary.count > 0 ? formatCurrency(summary.avgPerEntry, baseCurrency) : "—"}</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3 flex-shrink-0 ml-4">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Porównanie okresów */}
      {allTransport.length > 0 && (
        <div className="mb-8 space-y-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Porównanie okresów</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComparisonCard
              title="Ten tydzień vs Poprzedni tydzień"
              currentValue={periodComparisonData.week.current}
              previousValue={periodComparisonData.week.previous}
              currentLabel="Ten tydzień"
              previousLabel="Poprzedni tydzień"
              currency={baseCurrency}
            />
            <ComparisonCard
              title="Ten miesiąc vs Poprzedni miesiąc"
              currentValue={periodComparisonData.month.current}
              previousValue={periodComparisonData.month.previous}
              currentLabel="Ten miesiąc"
              previousLabel="Poprzedni miesiąc"
              currency={baseCurrency}
            />
          </div>
        </div>
      )}

      {/* Insights */}
      {transportExpenses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {insights.highestExpense && (
            <InsightsCard
              title="Najdroższy wydatek transportowy"
              value={formatCurrency(insights.highestExpense.amountPLN, baseCurrency)}
              subtitle={formatDate(insights.highestExpense.date)}
              icon={<Calendar className="w-5 h-5" />}
              variant="highlight"
            />
          )}
          {insights.topCountry && (
            <InsightsCard
              title="Top kraj (transport)"
              value={insights.topCountry.name}
              subtitle={formatCurrency(insights.topCountry.total, baseCurrency)}
              icon={<MapPin className="w-5 h-5" />}
              variant="success"
            />
          )}
          {insights.trend && (
            <InsightsCard
              title="Trend wydatków na transport"
              value={insights.trend.message}
              subtitle={`${transportExpenses.length} wpisów`}
              trend={{ direction: insights.trend.direction, percentage: insights.trend.percentage }}
              icon={<TrendingUp className="w-5 h-5" />}
              variant={insights.trend.direction === "up" ? "warning" : insights.trend.direction === "down" ? "success" : "default"}
            />
          )}
        </div>
      )}

      {/* Wykres w czasie */}
      {timeChartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Wydatki na transport w czasie</h4>
            <div className="flex gap-2">
              {(["day", "week", "month"] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setTimeView(view)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    timeView === view ? "bg-blue-600 dark:bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {view === "day" ? "Dzień" : view === "week" ? "Tydzień" : "Miesiąc"}
                </button>
              ))}
            </div>
          </div>
          <LineChart data={timeChartData} height={250} currency={baseCurrency} />
        </div>
      )}

      {/* Lista wydatków */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Lista wydatków</h2>
        <div className="mb-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Szukaj po opisie, lokalizacji, kraju..."
          />
        </div>
        {transportExpenses.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
            Brak wydatków z kategorii Transport w wybranym okresie.
          </div>
        ) : sortedExpenses.length === 0 && searchQuery ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
            Brak wyników wyszukiwania.
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                    onClick={() => handleSort("country")}
                  >
                    <div className="flex items-center gap-2">Kraj {renderSortIndicator("country")}</div>
                  </th>
                  <th
                    className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex justify-end gap-2">Kwota {renderSortIndicator("amount")}</div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Opis</th>
                </tr>
              </thead>
              <tbody>
                {sortedExpenses.map((e) => {
                  const country = getCountryById(e.countryId, tripId);
                  const pln = convertExpenseToPLN(e);
                  return (
                    <tr key={e.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatDate(e.date)}</td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{country?.name ?? "—"}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(pln, baseCurrency)}
                        {e.currency !== baseCurrency && (
                          <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                            ({formatCurrency(e.amount, e.currency)})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{e.description || "—"}</td>
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
        title="Analityka transportu"
        subtitle="Podsumowanie wydatków na transport"
      />
      {content}
    </PageLayout>
  );
}
