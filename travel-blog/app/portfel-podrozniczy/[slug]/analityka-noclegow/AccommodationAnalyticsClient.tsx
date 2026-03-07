"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Download, X, Wallet, Calendar, TrendingUp, MapPin, Tag, ChevronUp, ChevronDown } from "lucide-react";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import Link from "@/components/ui/Link";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import SearchBar from "@/components/ui/SearchBar";
import LineChart from "@/components/ui/LineChart";
import InsightsCard from "@/components/ui/InsightsCard";
import ComparisonCard from "@/components/ui/ComparisonCard";
import CalendarHeatmap from "@/components/ui/CalendarHeatmap";
import { CategoryPieChart } from "@/components/pages/TravelWalletCharts";
import { getAllExpenses } from "@/lib/travel-wallet/expenses";
import { getCountryById } from "@/lib/travel-wallet/countries";
import { formatCurrency, formatDate } from "@/lib/travel-wallet/formatters";
import { getTripBySlug } from "@/lib/travel-wallet/trips-storage";
import { getAccommodationLabel as getLabel } from "@/lib/travel-wallet/constants";
import type { Expense } from "@/lib/travel-wallet/types";
import { generateDaysBetween } from "@/lib/travel-wallet/calendar";
import { calculateTotalActualCostByTripId } from "@/lib/travel-wallet/country-calculations";
import {
  groupExpensesByWeek,
  groupExpensesByMonth,
  getExpensesThisWeek,
  getExpensesPreviousWeek,
  getExpensesThisMonth,
  getExpensesPreviousMonth,
  calculateTrend,
} from "@/lib/travel-wallet/expense-analytics";

type SortField = "date" | "country" | "type" | "amount" | null;
type SortDirection = "asc" | "desc";

interface AccommodationAnalyticsClientProps {
  slug: string;
  embedded?: boolean;
}

function getAccommodationLabel(type?: string): string {
  if (!type) return "Nie podano";
  return getLabel(type) || type;
}

/** Liczba nocy dla wydatku noclegu (uwzględnia date + endDate). */
function getExpenseNights(e: Expense): number {
  if (!e.endDate || e.endDate < e.date) return 1;
  const start = new Date(e.date);
  const end = new Date(e.endDate);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(1, diffDays);
}

export default function AccommodationAnalyticsClient({
  slug,
  embedded = false,
}: AccommodationAnalyticsClientProps) {
  const trip = getTripBySlug(slug);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeView, setTimeView] = useState<"day" | "week" | "month">("day");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showCalendarHeatmap, setShowCalendarHeatmap] = useState(false);

  const { accommodationExpenses, summary, byType, countryIds } = useMemo(() => {
    if (!trip) {
      return {
        accommodationExpenses: [] as Expense[],
        summary: { totalPLN: 0, nights: 0, avgPerNight: 0 },
        byType: [] as { type: string; label: string; count: number; totalPLN: number; avgPLN: number }[],
        countryIds: [] as string[],
      };
    }
    const all = getAllExpenses(trip.id).filter((e) => e.category === "Noclegi");
    let filtered = all;
    if (dateFrom) {
      filtered = filtered.filter((e) => e.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((e) => e.date <= dateTo);
    }
    if (countryFilter) {
      filtered = filtered.filter((e) => e.countryId === countryFilter);
    }
    const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

    const totalPLN = sorted.length > 0 ? calculateTotalActualCostByTripId(sorted, trip.id) : 0;
    const totalNights = sorted.reduce((sum, e) => sum + getExpenseNights(e), 0);
    const avgPerNight = totalNights > 0 ? totalPLN / totalNights : 0;

    const typeMap = new Map<string, { nights: number; expenses: Expense[] }>();
    sorted.forEach((e) => {
      const t = e.accommodationType || "unknown";
      const cur = typeMap.get(t) ?? { nights: 0, expenses: [] };
      cur.nights += getExpenseNights(e);
      cur.expenses.push(e);
      typeMap.set(t, cur);
    });
    const byType = Array.from(typeMap.entries()).map(([type, { nights, expenses }]) => {
      const totalPLNForType = expenses.length > 0 ? calculateTotalActualCostByTripId(expenses, trip.id) : 0;
      return {
        type,
        label: getAccommodationLabel(type === "unknown" ? undefined : type),
        nights,
        totalPLN: totalPLNForType,
        avgPLN: nights > 0 ? totalPLNForType / nights : 0,
      };
    });

    const countryIds = Array.from(new Set(trip.data.countries.map((c) => c.id)));

    return {
      accommodationExpenses: sorted,
      summary: { totalPLN, nights: totalNights, avgPerNight },
      byType,
      countryIds,
    };
  }, [trip, dateFrom, dateTo, countryFilter]);

  const allAccommodation = useMemo(() => {
    if (!trip) return [];
    return getAllExpenses(trip.id).filter((e) => e.category === "Noclegi");
  }, [trip]);

  const periodComparisonData = useMemo(() => {
    const thisWeek = getExpensesThisWeek(allAccommodation);
    const previousWeek = getExpensesPreviousWeek(allAccommodation);
    const thisMonth = getExpensesThisMonth(allAccommodation);
    const previousMonth = getExpensesPreviousMonth(allAccommodation);
    const toBase = (arr: Expense[]) => (trip && arr.length > 0 ? calculateTotalActualCostByTripId(arr, trip.id) : 0);
    return {
      week: { current: toBase(thisWeek), previous: toBase(previousWeek) },
      month: { current: toBase(thisMonth), previous: toBase(previousMonth) },
    };
  }, [allAccommodation, trip]);

  const dailyTotals = useMemo(() => {
    const byDate = new Map<string, { total: number; count: number }>();
    accommodationExpenses.forEach((e) => {
      const amountInBase = trip ? calculateTotalActualCostByTripId([e], trip.id) : 0;
      const nights = getExpenseNights(e);
      const days = (e.endDate ? generateDaysBetween(e.date, e.endDate) : [e.date]).slice(0, nights);
      const portion = days.length > 0 ? amountInBase / days.length : 0;
      days.forEach((d) => {
        const cur = byDate.get(d) ?? { total: 0, count: 0 };
        byDate.set(d, { total: cur.total + portion, count: cur.count + 1 });
      });
    });
    return Array.from(byDate.entries())
      .map(([date, { total, count }]) => ({ date, total, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [accommodationExpenses, trip]);

  const weeklyTotals = useMemo(() => {
    if (!trip) return [];
    const grouped = groupExpensesByWeek(accommodationExpenses);
    return Object.entries(grouped)
      .map(([week, weekExpenses]) => ({
        week,
        total: weekExpenses.length > 0 ? calculateTotalActualCostByTripId(weekExpenses, trip.id) : 0,
        count: weekExpenses.length,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [accommodationExpenses, trip]);

  const monthlyTotals = useMemo(() => {
    if (!trip) return [];
    const grouped = groupExpensesByMonth(accommodationExpenses);
    return Object.entries(grouped)
      .map(([month, monthExpenses]) => ({
        month,
        total: monthExpenses.length > 0 ? calculateTotalActualCostByTripId(monthExpenses, trip.id) : 0,
        count: monthExpenses.length,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [accommodationExpenses, trip]);

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
    if (!searchQuery.trim()) return accommodationExpenses;
    const q = searchQuery.toLowerCase();
    return accommodationExpenses.filter((e) => {
      const country = trip ? getCountryById(e.countryId, trip.id) : null;
      const countryName = (country?.name || "").toLowerCase();
      const desc = (e.description || "").toLowerCase();
      const loc = (e.location || "").toLowerCase();
      const note = (e.note || "").toLowerCase();
      const typeLabel = getAccommodationLabel(e.accommodationType).toLowerCase();
      return (
        desc.includes(q) || loc.includes(q) || note.includes(q) || countryName.includes(q) || typeLabel.includes(q)
      );
    });
  }, [accommodationExpenses, searchQuery, trip]);

  const sortedExpenses = useMemo(() => {
    if (!sortField) return filteredBySearch;
    const sorted = [...filteredBySearch].sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") cmp = a.date.localeCompare(b.date);
      else if (sortField === "country") {
        const ca = trip ? getCountryById(a.countryId, trip.id)?.name ?? "" : "";
        const cb = trip ? getCountryById(b.countryId, trip.id)?.name ?? "" : "";
        cmp = ca.localeCompare(cb);
      } else if (sortField === "type")
        cmp = getAccommodationLabel(a.accommodationType).localeCompare(getAccommodationLabel(b.accommodationType));
      else if (sortField === "amount")
        cmp =
          trip && accommodationExpenses.length > 0
            ? calculateTotalActualCostByTripId([a], trip.id) - calculateTotalActualCostByTripId([b], trip.id)
            : a.amount - b.amount;
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredBySearch, sortField, sortDirection, trip]);

  type AccommodationInsightsShape = {
    highestNight: { date: string; totalPLN: number } | null;
    topType: { label: string; totalPLN: number; nights: number } | null;
    topCountry: { name: string; total: number } | null;
    trend: { direction: "up" | "down" | "stable"; percentage: number; message: string } | null;
  };
  const insights = useMemo((): AccommodationInsightsShape => {
    if (accommodationExpenses.length === 0)
      return { highestNight: null, topType: null, topCountry: null, trend: null };
    const highestNight =
      dailyTotals.length > 0
        ? (() => {
            const best = dailyTotals.reduce((a, b) => (a.total >= b.total ? a : b));
            return { date: best.date, totalPLN: best.total };
          })()
        : null;
    const topType = byType.length > 0 ? byType.reduce((best, r) => (r.nights > best.nights ? r : best), byType[0]) : null;
    const byCountry = new Map<string, number>();
    if (trip) {
      const countryToExpenses = new Map<string, Expense[]>();
      accommodationExpenses.forEach((e) => {
        const name = getCountryById(e.countryId, trip.id)?.name ?? "";
        if (name) {
          const arr = countryToExpenses.get(name) ?? [];
          arr.push(e);
          countryToExpenses.set(name, arr);
        }
      });
      countryToExpenses.forEach((expenses, name) => {
        byCountry.set(name, calculateTotalActualCostByTripId(expenses, trip.id));
      });
    }
    const topCountryEntry =
      byCountry.size > 0
        ? Array.from(byCountry.entries()).reduce<{ name: string; total: number } | null>(
            (best, [name, total]) => (total > (best?.total ?? 0) ? { name, total } : best),
            null
          )
        : null;
    const topCountry = topCountryEntry;
    const trend = calculateTrend(accommodationExpenses);
    return { highestNight, topType, topCountry, trend };
  }, [accommodationExpenses, byType, trip, dailyTotals]);

  const byTypeChartData = useMemo(
    () => byType.map((row) => ({ category: row.label, value: row.totalPLN })),
    [byType]
  );

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
    const headers = ["Data", "Kraj", "Typ noclegu", "Kwota", "Waluta", "Opis"];
    const rows = accommodationExpenses.map((e) => {
      const country = getCountryById(e.countryId, trip.id);
      return [
        e.date,
        country?.name ?? "",
        getAccommodationLabel(e.accommodationType),
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
    a.download = `noclegi-${trip.slug}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!trip) {
    const msg = (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          Nie udało się załadować danych podróży.
        </p>
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
            {accommodationExpenses.length > 0 && (
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

      {/* Podsumowanie */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Łącznie na noclegi</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(summary.totalPLN, baseCurrency)}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 flex-shrink-0 ml-4 group-hover:scale-110 transition-transform duration-300">
              <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Liczba nocy</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{summary.nights}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 flex-shrink-0 ml-4 group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Średnia za noc</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{summary.nights > 0 ? formatCurrency(summary.avgPerNight, baseCurrency) : "—"}</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3 flex-shrink-0 ml-4 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Porównanie okresów */}
      {allAccommodation.length > 0 && (
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
      {accommodationExpenses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {insights.highestNight && (
            <InsightsCard
              title="Najdroższa noc"
              value={formatCurrency(insights.highestNight.totalPLN, baseCurrency)}
              subtitle={formatDate(insights.highestNight.date)}
              icon={<Calendar className="w-5 h-5" />}
              variant="highlight"
            />
          )}
          {insights.topType && (
            <InsightsCard
              title="Najczęstszy typ"
              value={insights.topType.label}
              subtitle={`${insights.topType.nights} nocy`}
              icon={<Tag className="w-5 h-5" />}
              variant="info"
            />
          )}
          {insights.topCountry && (
            <InsightsCard
              title="Top kraj (noclegi)"
              value={insights.topCountry.name}
              subtitle={formatCurrency(insights.topCountry.total, baseCurrency)}
              icon={<MapPin className="w-5 h-5" />}
              variant="success"
            />
          )}
          {insights.trend && (
            <InsightsCard
              title="Trend wydatków na noclegi"
              value={insights.trend.message}
              subtitle={`${accommodationExpenses.length} noclegów`}
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
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Wydatki na noclegi w czasie</h4>
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

      {/* Według typu */}
      {byType.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Według typu noclegu</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Typ</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Nocy</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Suma ({baseCurrency})</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Śr. za noc</th>
                  </tr>
                </thead>
                <tbody>
                  {byType.map((row) => (
                    <tr key={row.type} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{row.label}</td>
                      <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{row.nights}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-gray-100">{formatCurrency(row.totalPLN, baseCurrency)}</td>
                      <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">{formatCurrency(row.avgPLN, baseCurrency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-center">
              <CategoryPieChart data={byTypeChartData} size={200} currency={baseCurrency} />
            </div>
          </div>
        </div>
      )}

      {/* Lista noclegów */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Lista noclegów</h2>
        <div className="mb-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Szukaj po opisie, lokalizacji, kraju..."
          />
        </div>
        {accommodationExpenses.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
            Brak wydatków z kategorii Noclegi w wybranym okresie.
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
                    className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("type")}
                  >
                    <div className="flex items-center gap-2">Typ {renderSortIndicator("type")}</div>
                  </th>
                  <th
                    className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center justify-end gap-2">Kwota {renderSortIndicator("amount")}</div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Opis</th>
                </tr>
              </thead>
              <tbody>
                {sortedExpenses.map((e) => {
                  const country = getCountryById(e.countryId, tripId);
                  const amountInBase = tripId ? calculateTotalActualCostByTripId([e], tripId) : 0;
                  return (
                    <tr key={e.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {e.endDate && e.endDate !== e.date
                          ? `${formatDate(e.date)} – ${formatDate(e.endDate)} (${getExpenseNights(e)} ${getExpenseNights(e) === 1 ? "noc" : getExpenseNights(e) < 5 ? "noce" : "nocy"})`
                          : formatDate(e.date)}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{country?.name ?? "—"}</td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{getAccommodationLabel(e.accommodationType)}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(amountInBase, baseCurrency)}
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

      {/* Kalendarz nocy (zwinięty domyślnie) */}
      {accommodationExpenses.length > 0 && (
        <div className="mb-8">
          {showCalendarHeatmap ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Kalendarz noclegów</h3>
                <button
                  type="button"
                  onClick={() => setShowCalendarHeatmap(false)}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Ukryj
                </button>
              </div>
              <CalendarHeatmap
                data={dailyTotals.map((d) => ({ date: d.date, value: d.total, count: d.count }))}
                currency={baseCurrency}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCalendarHeatmap(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Pokaż kalendarz noclegów
            </button>
          )}
        </div>
      )}
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
        title="Analityka noclegów"
        subtitle="Podsumowanie wydatków na noclegi według typu"
      />
      {content}
    </PageLayout>
  );
}
