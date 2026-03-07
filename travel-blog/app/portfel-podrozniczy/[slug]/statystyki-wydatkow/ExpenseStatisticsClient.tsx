"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, X, ChevronUp, ChevronDown, Wallet, Receipt, TrendingUp, Calendar, MapPin, Tag, Funnel, TrendingDown } from "lucide-react";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import Link from "@/components/ui/Link";
import { getAllExpenses } from "@/lib/travel-wallet/expenses";
import { getCurrencyTransactions } from "@/lib/travel-wallet/currency-transactions";
import { getCountryById } from "@/lib/travel-wallet/countries";
import { formatCurrency, formatDate, formatExpenseDateRange } from "@/lib/travel-wallet/formatters";
import { getTripBySlug } from "@/lib/travel-wallet/trips-storage";
import type { Expense } from "@/lib/travel-wallet/types";
import DatePicker from "@/components/ui/DatePicker";
import LineChart from "@/components/ui/LineChart";
import { CategoryPieChart } from "@/components/pages/TravelWalletCharts";
import CalendarHeatmap from "@/components/ui/CalendarHeatmap";
import InsightsCard from "@/components/ui/InsightsCard";
import SearchBar, { highlightText } from "@/components/ui/SearchBar";
import ComparisonCard from "@/components/ui/ComparisonCard";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import DrillDownModal from "@/components/ui/DrillDownModal";
import PredictionCard from "@/components/ui/PredictionCard";
import { getExpenseDays } from "@/lib/travel-wallet/calendar";
import {
  getDayOfWeekStats,
  detectSpendingPatterns,
  comparePeriods,
  calculateTrend,
  getExpensesLastNDays,
  getExpensesThisWeek,
  getExpensesPreviousWeek,
  getExpensesThisMonth,
  getExpensesPreviousMonth,
  groupExpensesByWeek,
  groupExpensesByMonth,
} from "@/lib/travel-wallet/expense-analytics";
import { calculateTotalBudget } from "@/lib/travel-wallet/calculations";
import { getExpenseCategoryDisplay } from "@/lib/travel-wallet/constants";
import { calculateTotalActualCostByTripId } from "@/lib/travel-wallet/country-calculations";

// Kursy walut do PLN (muszą być takie same jak w expenses.ts)
const exchangeRates: Record<string, number> = {
  PLN: 1,
  USD: 4.0,
  EUR: 4.3,
  JPY: 0.027,
  THB: 0.11,
  GBP: 5.1,
  KRW: 0.003,
  TWD: 0.13,
  KZT: 0.007, // dodajemy KZT
};

// Pełne nazwy walut
const currencyNames: Record<string, string> = {
  PLN: "Polski złoty",
  USD: "Dolar amerykański",
  EUR: "Euro",
  JPY: "Jen japoński",
  THB: "Baht tajlandzki",
  GBP: "Funt szterling",
  KRW: "Won południowokoreański",
  TWD: "Dolar tajwański",
  KZT: "Tenge kazachskie",
};

function convertToPLN(amount: number, currency: string): number {
  const rate = exchangeRates[currency.toUpperCase()] || 1;
  return amount * rate;
}

function getCurrencyName(currency: string): string {
  return currencyNames[currency.toUpperCase()] || currency;
}

interface ExpenseStatisticsClientProps {
  slug: string;
}

type SortField = "date" | "description" | "category" | "country" | "amount" | null;
type SortDirection = "asc" | "desc";

export default function ExpenseStatisticsClient({
  slug,
}: ExpenseStatisticsClientProps) {
  const router = useRouter();
  const trip = getTripBySlug(slug);
  const tripId = trip?.id ?? null;

  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [timeView, setTimeView] = useState<"day" | "week" | "month">("day");
  const [showCharts, setShowCharts] = useState(true);
  const [showTimeAnalysis, setShowTimeAnalysis] = useState(false);
  const [showCalendarHeatmap, setShowCalendarHeatmap] = useState(false);
  const [selectedChartPoint, setSelectedChartPoint] = useState<{ date: string; index: number } | null>(null);
  const [_showMobileFilters, _setShowMobileFilters] = useState(false);
  const [drillDownData, setDrillDownData] = useState<{ type: "category" | "country"; name: string; expenses: Expense[] } | null>(null);

  // Pobierz wszystkie wydatki (w tym prowizje za transakcje walutowe)
  const allExpenses = useMemo(() => {
    if (!tripId) return [];
    const expenses = getAllExpenses(tripId);
    const transactions = getCurrencyTransactions(tripId);
    const firstCountryId = trip?.data?.countries?.[0]?.id ?? "";
    const feeExpenses: Expense[] = transactions
      .filter((tx) => tx.fee != null && tx.fee > 0 && tx.feeCurrency)
      .map((tx) => ({
        id: `fee-${tx.id}`,
        tripId,
        countryId: tx.countryId ?? firstCountryId,
        amount: tx.fee!,
        currency: tx.feeCurrency!,
        category: "Prowizja",
        description: "Prowizja za transakcję walutową",
        date: tx.date,
      }));
    return [...expenses, ...feeExpenses];
  }, [tripId, trip?.data?.countries]);

  const totalBudget = useMemo(() => (trip ? calculateTotalBudget(trip.data, trip.id) : 0), [trip]);

  // Pobierz unikalne waluty, kraje i kategorie
  const availableCurrencies = useMemo(() => {
    const currencies = new Set<string>();
    allExpenses.forEach((exp) => currencies.add(exp.currency));
    return Array.from(currencies).sort();
  }, [allExpenses]);

  const availableCountries = useMemo(() => {
    if (!trip) return [];
    return trip.data.countries.map((c) => ({
      id: c.id,
      name: c.name,
    }));
  }, [trip]);

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    allExpenses.forEach((exp) => categories.add(exp.category));
    return Array.from(categories).sort();
  }, [allExpenses]);

  // Filtruj wydatki
  const filteredExpenses = useMemo(() => {
    let filtered = [...allExpenses];

    if (selectedCurrencies.length > 0) {
      filtered = filtered.filter((exp) => selectedCurrencies.includes(exp.currency));
    }

    if (selectedCountries.length > 0) {
      filtered = filtered.filter((exp) => selectedCountries.includes(exp.countryId));
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((exp) => selectedCategories.includes(exp.category));
    }

    if (dateFrom) {
      filtered = filtered.filter((exp) => exp.date >= dateFrom);
    }

    if (dateTo) {
      filtered = filtered.filter((exp) => exp.date <= dateTo);
    }

    // Wyszukiwanie
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((exp) => {
        const description = (exp.description || "").toLowerCase();
        const category = exp.category.toLowerCase();
        const location = (exp.location || "").toLowerCase();
        const note = (exp.note || "").toLowerCase();
        const country = getCountryById(exp.countryId, tripId ?? undefined);
        const countryName = (country?.name || "").toLowerCase();
        
        return (
          description.includes(query) ||
          category.includes(query) ||
          location.includes(query) ||
          note.includes(query) ||
          countryName.includes(query)
        );
      });
    }

    return filtered;
  }, [allExpenses, selectedCurrencies, selectedCountries, selectedCategories, dateFrom, dateTo, searchQuery, tripId]);

  // Sortowanie wydatków
  const sortedExpenses = useMemo(() => {
    if (!sortField) return filteredExpenses;

    const sorted = [...filteredExpenses].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "description":
          comparison = (a.description ?? "").localeCompare(b.description ?? "");
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        case "country":
          const countryA = getCountryById(a.countryId, tripId ?? undefined);
          const countryB = getCountryById(b.countryId, tripId ?? undefined);
          comparison = (countryA?.name || "").localeCompare(countryB?.name || "");
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [filteredExpenses, sortField, sortDirection, tripId]);

  // Funkcja sortowania
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Oblicz statystyki dla wszystkich wydatków (zawsze pokazuj wszystkie waluty)
  const allStatistics = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    allExpenses.forEach((exp) => {
      byCurrency[exp.currency] = (byCurrency[exp.currency] || 0) + exp.amount;
    });
    return { byCurrency };
  }, [allExpenses]);

  // Oblicz statystyki dla przefiltrowanych wydatków
  const statistics = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    const byCountry: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    // Grupuj według kategorii i waluty
    const byCategoryAndCurrency: Record<string, Record<string, number>> = {};

    filteredExpenses.forEach((exp) => {
      byCurrency[exp.currency] = (byCurrency[exp.currency] || 0) + exp.amount;
      
      const country = getCountryById(exp.countryId, tripId ?? undefined);
      if (country) {
        byCountry[country.name] = (byCountry[country.name] || 0) + exp.amount;
      }
      
      // Grupuj według kategorii i waluty
      if (!byCategoryAndCurrency[exp.category]) {
        byCategoryAndCurrency[exp.category] = {};
      }
      byCategoryAndCurrency[exp.category][exp.currency] = 
        (byCategoryAndCurrency[exp.category][exp.currency] || 0) + exp.amount;
      
      // Dla backward compatibility - suma wszystkich walut dla kategorii (używane w innych miejscach)
      byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
    });

    return { byCurrency, byCountry, byCategory, byCategoryAndCurrency };
  }, [filteredExpenses, tripId]);

  const totalSpent = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  const totalSpentInPLN = useMemo(
    () =>
      tripId && filteredExpenses.length > 0
        ? calculateTotalActualCostByTripId(filteredExpenses, tripId)
        : filteredExpenses.reduce((sum, exp) => sum + convertToPLN(exp.amount, exp.currency), 0),
    [filteredExpenses, tripId]
  );

  const daysInTrip = useMemo(() => {
    if (trip?.startDate && trip?.endDate) {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      return Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    }
    return 0;
  }, [trip?.startDate, trip?.endDate]);

  const _averageExpense = useMemo(() => {
    if (filteredExpenses.length === 0) return 0;
    return totalSpent / filteredExpenses.length;
  }, [filteredExpenses.length, totalSpent]);

  // Porównania okresów dla wskaźników trendów
  const periodComparisons = useMemo(() => {
    const thisWeek = getExpensesThisWeek(allExpenses);
    const previousWeek = getExpensesPreviousWeek(allExpenses);
    const thisMonth = getExpensesThisMonth(allExpenses);
    const previousMonth = getExpensesPreviousMonth(allExpenses);

    const weekComparison = comparePeriods(thisWeek, previousWeek);
    const monthComparison = comparePeriods(thisMonth, previousMonth);

    // Dla całkowitych wydatków używamy porównania miesiąca
    const totalComparison = monthComparison;
    
    // Dla liczby wydatków używamy porównania tygodnia (bardziej aktualne)
    const countComparison = weekComparison;

    // Dla średniego wydatku używamy porównania miesiąca
    const avgComparison = monthComparison;

    return {
      total: totalComparison,
      count: countComparison,
      average: avgComparison,
    };
  }, [allExpenses]);

  // Obliczenia wartości w PLN dla porównań okresów
  const periodComparisonData = useMemo(() => {
    const thisWeek = getExpensesThisWeek(allExpenses);
    const previousWeek = getExpensesPreviousWeek(allExpenses);
    const thisMonth = getExpensesThisMonth(allExpenses);
    const previousMonth = getExpensesPreviousMonth(allExpenses);

    const calculateTotalInPLN = (expenses: Expense[]) => {
      return expenses.reduce((sum, exp) => sum + convertToPLN(exp.amount, exp.currency), 0);
    };

    return {
      week: {
        current: calculateTotalInPLN(thisWeek),
        previous: calculateTotalInPLN(previousWeek),
        currentCount: thisWeek.length,
        previousCount: previousWeek.length,
      },
      month: {
        current: calculateTotalInPLN(thisMonth),
        previous: calculateTotalInPLN(previousMonth),
        currentCount: thisMonth.length,
        previousCount: previousMonth.length,
      },
    };
  }, [allExpenses]);

  // Liczniki dla filtrów
  const filterCounts = useMemo(() => {
    const counts = {
      currencies: {} as Record<string, number>,
      countries: {} as Record<string, number>,
      categories: {} as Record<string, number>,
    };

    allExpenses.forEach((exp) => {
      counts.currencies[exp.currency] = (counts.currencies[exp.currency] || 0) + 1;
      counts.countries[exp.countryId] = (counts.countries[exp.countryId] || 0) + 1;
      counts.categories[exp.category] = (counts.categories[exp.category] || 0) + 1;
    });

    return counts;
  }, [allExpenses]);

  // Obliczenia średniego wydatku w PLN
  const averageExpenseStats = useMemo(() => {
    if (filteredExpenses.length === 0) {
      return {
        averagePerDay: 0,
        averagePerDayWithExpenses: 0,
        totalDays: 0,
        daysWithExpenses: 0,
        topCategories: [] as Array<{ category: string; count: number }>,
      };
    }

    // Oblicz całkowitą sumę w PLN
    const totalInPLN = filteredExpenses.reduce((sum, exp) => sum + convertToPLN(exp.amount, exp.currency), 0);

    // Liczba dni podróży (od daty rozpoczęcia do daty zakończenia)
    let totalDays = 0;
    if (trip?.startDate && trip?.endDate) {
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    } else {
      // Fallback: jeśli nie ma dat podróży, użyj dat wydatków
      const dates = filteredExpenses.map((exp) => new Date(exp.date)).sort((a, b) => a.getTime() - b.getTime());
      const firstDate = dates[0];
      const lastDate = dates[dates.length - 1];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = lastDate > today ? today : lastDate;
      totalDays = Math.max(1, Math.ceil((endDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    }

    // Liczba unikalnych dni z wydatkami
    const uniqueDates = new Set(filteredExpenses.map((exp) => exp.date));
    const daysWithExpenses = uniqueDates.size;

    // Średni wydatek na dzień (za całą podróż)
    const averagePerDay = totalDays > 0 ? totalInPLN / totalDays : 0;

    // Średni wydatek na dni z wydatkami
    const averagePerDayWithExpenses = daysWithExpenses > 0 ? totalInPLN / daysWithExpenses : 0;

    // Najczęstsze kategorie
    const categoryCounts: Record<string, number> = {};
    filteredExpenses.forEach((exp) => {
      categoryCounts[exp.category] = (categoryCounts[exp.category] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      averagePerDay,
      averagePerDayWithExpenses,
      totalDays,
      daysWithExpenses,
      topCategories,
    };
  }, [filteredExpenses, trip?.startDate, trip?.endDate]);

  // Analytics data – wielodniowe wydatki rozkładane równo na dni [date, endDate], PLN + byCurrency
  const dailyTotals = useMemo(() => {
    const byDate: Record<string, { total: number; count: number; byCurrency: Record<string, number> }> = {};
    const convertExpenseToPLN = (e: Expense) => convertToPLN(e.amount, e.currency);
    filteredExpenses.forEach((expense) => {
      const days = getExpenseDays(expense).map((d) => d.date);
      const portionPLN = days.length > 0 ? convertExpenseToPLN(expense) / days.length : 0;
      const portionAmount = days.length > 0 ? expense.amount / days.length : 0;
      days.forEach((date) => {
        if (!byDate[date]) byDate[date] = { total: 0, count: 0, byCurrency: {} };
        byDate[date].total += portionPLN;
        byDate[date].count += 1;
        byDate[date].byCurrency[expense.currency] = (byDate[date].byCurrency[expense.currency] || 0) + portionAmount;
      });
    });
    return Object.entries(byDate)
      .map(([date, { total, count, byCurrency }]) => ({ date, total, count, byCurrency }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredExpenses]);

  const weeklyTotals = useMemo(() => {
    const grouped = groupExpensesByWeek(filteredExpenses);
    return Object.entries(grouped)
      .map(([week, weekExpenses]) => {
        const byCurrency: Record<string, number> = {};
        weekExpenses.forEach((exp) => {
          byCurrency[exp.currency] = (byCurrency[exp.currency] || 0) + exp.amount;
        });
        const totalInPLN = weekExpenses.reduce((sum, exp) => sum + convertToPLN(exp.amount, exp.currency), 0);
        return {
          week,
          total: totalInPLN,
          count: weekExpenses.length,
          byCurrency,
        };
      })
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [filteredExpenses]);

  const monthlyTotals = useMemo(() => {
    const grouped = groupExpensesByMonth(filteredExpenses);
    return Object.entries(grouped)
      .map(([month, monthExpenses]) => {
        const byCurrency: Record<string, number> = {};
        monthExpenses.forEach((exp) => {
          byCurrency[exp.currency] = (byCurrency[exp.currency] || 0) + exp.amount;
        });
        const totalInPLN = monthExpenses.reduce((sum, exp) => sum + convertToPLN(exp.amount, exp.currency), 0);
        return {
          month,
          total: totalInPLN,
          count: monthExpenses.length,
          byCurrency,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredExpenses]);
  
  const timeChartData = useMemo(() => {
    if (timeView === "day") {
      return dailyTotals.map((d) => ({
        label: formatDate(d.date),
        value: d.total,
        count: d.count,
        date: d.date,
        byCurrency: d.byCurrency,
      }));
    } else if (timeView === "week") {
      return weeklyTotals.map((w) => ({
        label: `Tydzień ${formatDate(w.week)}`,
        value: w.total,
        count: w.count,
        byCurrency: w.byCurrency,
      }));
    } else {
      return monthlyTotals.map((m) => ({
        label: m.month,
        value: m.total,
        count: m.count,
        byCurrency: m.byCurrency,
      }));
    }
  }, [timeView, dailyTotals, weeklyTotals, monthlyTotals]);

  const categoryChartData = useMemo(() => {
    // Grupuj według kategorii i waluty - każda kombinacja to osobny element
    const data: Array<{ category: string; value: number; currency: string; valueInPLN: number }> = [];
    
    Object.entries(statistics.byCategoryAndCurrency || {}).forEach(([category, currencies]) => {
      Object.entries(currencies).forEach(([currency, value]) => {
        const valueInPLN = convertToPLN(value, currency);
        data.push({
          category: `${category} (${currency})`,
          value,
          currency,
          valueInPLN,
        });
      });
    });
    
    // Sortuj według wartości w PLN
    return data.sort((a, b) => b.valueInPLN - a.valueInPLN);
  }, [statistics.byCategoryAndCurrency]);

  const countryChartData = useMemo(() => {
    return Object.entries(statistics.byCountry)
      .map(([country, value]) => ({
        country,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [statistics.byCountry]);

  const spendingPatterns = useMemo(
    () => detectSpendingPatterns(filteredExpenses, (e) => convertToPLN(e.amount, e.currency)),
    [filteredExpenses]
  );
  const dayOfWeekStats = useMemo(() => getDayOfWeekStats(filteredExpenses), [filteredExpenses]);
  const trend = useMemo(() => calculateTrend(filteredExpenses), [filteredExpenses]);

  // Porównania okresów
  const _comparisonData = useMemo(() => {
    if (filteredExpenses.length === 0) return null;
    
    const last7Days = getExpensesLastNDays(allExpenses, 7);
    const previous7Days = getExpensesLastNDays(
      allExpenses.filter((e) => {
        const date = new Date(e.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 14);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);
        return date >= weekAgo && date < twoWeeksAgo;
      }),
      7
    );

    if (previous7Days.length === 0) return null;

    return comparePeriods(last7Days, previous7Days);
  }, [allExpenses, filteredExpenses]);

  if (!trip) {
    return (
      <PageLayout maxWidth="6xl">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Nie udało się załadować danych podróży.
          </p>
        </div>
      </PageLayout>
    );
  }

  const baseCurrency = trip.data?.wallet?.baseCurrency ?? "PLN";

  // Funkcje toggle dla multi-select
  const toggleCurrency = (currency: string) => {
    setSelectedCurrencies((prev) =>
      prev.includes(currency)
        ? prev.filter((c) => c !== currency)
        : [...prev, currency]
    );
  };

  const toggleCountry = (countryId: string) => {
    setSelectedCountries((prev) =>
      prev.includes(countryId)
        ? prev.filter((c) => c !== countryId)
        : [...prev, countryId]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedCurrencies([]);
    setSelectedCountries([]);
    setSelectedCategories([]);
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedCurrencies.length > 0 ||
    selectedCountries.length > 0 ||
    selectedCategories.length > 0 ||
    dateFrom ||
    dateTo;

  const handleQuickFilter = (preset: "last7" | "last30" | "thisWeek" | "thisMonth" | "all") => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (preset === "last7") {
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      setDateFrom(start.toISOString().split('T')[0]);
      setDateTo(today.toISOString().split('T')[0]);
    } else if (preset === "last30") {
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      setDateFrom(start.toISOString().split('T')[0]);
      setDateTo(today.toISOString().split('T')[0]);
    } else if (preset === "thisWeek") {
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      setDateFrom(monday.toISOString().split('T')[0]);
      setDateTo(today.toISOString().split('T')[0]);
    } else if (preset === "thisMonth") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setDateFrom(firstDay.toISOString().split('T')[0]);
      setDateTo(today.toISOString().split('T')[0]);
    } else {
      setDateFrom("");
      setDateTo("");
    }
  };



  // Funkcja do renderowania wskaźnika sortowania
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-400 opacity-30" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    ) : (
      <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    );
  };

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
        title="Statystyki wydatków"
        subtitle="Szczegółowy przegląd wszystkich wydatków"
      />

      {/* Statystyki */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden" style={{ animation: "fadeInUp 0.6s ease-out" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Łącznie wydano
              </p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {formatCurrency(totalSpentInPLN, baseCurrency)}
              </p>
              {filteredExpenses.length > 0 && Object.keys(statistics.byCurrency).length > 0 && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {Object.entries(statistics.byCurrency)
                    .sort((a, b) => b[1] - a[1])
                    .map(([currency, amount]) => formatCurrency(amount, currency))
                    .join(" · ")}
                </p>
              )}
              {filteredExpenses.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                  Śr. dzienna (z wydatków): {formatCurrency(averageExpenseStats.averagePerDayWithExpenses, baseCurrency)}
                </p>
              )}
              {totalBudget > 0 && daysInTrip > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Założona średnia dzienna: {formatCurrency(totalBudget / daysInTrip, baseCurrency)} (budżet {formatCurrency(totalBudget, baseCurrency)} ÷ {daysInTrip} dni podróży)
                </p>
              )}
              {periodComparisons.total.totalChangePercentage !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  periodComparisons.total.totalChangePercentage > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}>
                  {periodComparisons.total.totalChangePercentage > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>
                    {periodComparisons.total.totalChangePercentage > 0 ? "+" : ""}
                    {periodComparisons.total.totalChangePercentage.toFixed(1)}% vs poprzedni miesiąc
                  </span>
            </div>
              )}
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 flex-shrink-0 ml-4 group-hover:scale-110 transition-transform duration-300">
              <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden" style={{ animation: "fadeInUp 0.6s ease-out 0.1s both" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Liczba wydatków
              </p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {filteredExpenses.length}
              </p>
              {periodComparisons.count.countChangePercentage !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  periodComparisons.count.countChangePercentage > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}>
                  {periodComparisons.count.countChangePercentage > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>
                    {periodComparisons.count.countChangePercentage > 0 ? "+" : ""}
                    {periodComparisons.count.countChangePercentage.toFixed(1)}% vs poprzedni tydzień
                  </span>
            </div>
              )}
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 flex-shrink-0 ml-4 group-hover:scale-110 transition-transform duration-300">
              <Receipt className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden" style={{ animation: "fadeInUp 0.6s ease-out 0.2s both" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Średni wydatek
              </p>
              <div className="space-y-1 mb-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {formatCurrency(averageExpenseStats.averagePerDay, baseCurrency)} / dzień ({averageExpenseStats.totalDays} {averageExpenseStats.totalDays === 1 ? "dzień" : "dni"} podróży)
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {formatCurrency(averageExpenseStats.averagePerDayWithExpenses, baseCurrency)} / dzień z wydatkami ({averageExpenseStats.daysWithExpenses} {averageExpenseStats.daysWithExpenses === 1 ? "dzień" : "dni"})
                </p>
              </div>
              {averageExpenseStats.topCategories.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Najczęściej: {averageExpenseStats.topCategories.map((c) => c.category).join(", ")}
                </p>
              )}
              {periodComparisons.average.averageChangePercentage !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  periodComparisons.average.averageChangePercentage > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}>
                  {periodComparisons.average.averageChangePercentage > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>
                    {periodComparisons.average.averageChangePercentage > 0 ? "+" : ""}
                    {periodComparisons.average.averageChangePercentage.toFixed(1)}% vs poprzedni miesiąc
                  </span>
            </div>
              )}
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3 flex-shrink-0 ml-4 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Insights Cards */}
      {filteredExpenses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {spendingPatterns.highestDay && (
            <InsightsCard
              title="Najdroższy dzień"
              value={formatCurrency(spendingPatterns.highestDay.total, baseCurrency)}
              subtitle={formatDate(spendingPatterns.highestDay.date)}
              icon={<Calendar className="w-5 h-5" />}
              variant="highlight"
            />
          )}
          {spendingPatterns.highestCategory && (
            <InsightsCard
              title="Najczęstsza kategoria"
              value={spendingPatterns.highestCategory.category}
              subtitle={`${spendingPatterns.highestCategory.percentage.toFixed(1)}% wydatków`}
              icon={<Tag className="w-5 h-5" />}
              variant="info"
            />
          )}
          {countryChartData.length > 0 && (
            <InsightsCard
              title="Top kraj"
              value={countryChartData[0].country}
              subtitle={formatCurrency(countryChartData[0].value, Object.keys(statistics.byCurrency)[0] || "")}
              icon={<MapPin className="w-5 h-5" />}
              variant="success"
            />
          )}
          <InsightsCard
            title="Trend wydatków"
            value={trend.message}
            subtitle={filteredExpenses.length > 0 ? `${filteredExpenses.length} wydatków` : "Brak danych"}
            trend={{
              direction: trend.direction,
              percentage: trend.percentage,
            }}
            icon={<TrendingUp className="w-5 h-5" />}
            variant={trend.direction === "up" ? "warning" : trend.direction === "down" ? "success" : "default"}
          />
        </div>
      )}

      {/* Period Comparison Section */}
      {allExpenses.length > 0 && (
        <div className="mb-8 space-y-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Porównanie okresów
          </h3>
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

      {/* Prediction Card */}
      {trip && trip.startDate && trip.endDate && (allExpenses.length > 0 || totalBudget > 0) && (
        <div className="mb-8">
          <PredictionCard
            expenses={allExpenses}
            tripStartDate={trip.startDate}
            tripEndDate={trip.endDate}
            totalBudget={totalBudget}
            currency={Object.keys(allStatistics.byCurrency)[0] || baseCurrency}
          />
        </div>
      )}

      {/* Charts Section */}
      {showCharts && filteredExpenses.length > 0 && (
        <div className="mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Wizualizacje
            </h3>
            <button
              onClick={() => setShowCharts(false)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Ukryj wykresy
            </button>
          </div>

          {/* Line Chart */}
          {timeChartData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Wydatki w czasie
                </h4>
                <div className="flex gap-2">
                  {(["day", "week", "month"] as const).map((view) => (
                    <button
                      key={view}
                      onClick={() => setTimeView(view)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        timeView === view
                          ? "bg-blue-600 dark:bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {view === "day" ? "Dzień" : view === "week" ? "Tydzień" : "Miesiąc"}
                    </button>
                  ))}
                </div>
              </div>
              <LineChart
                data={timeChartData}
                height={250}
                currency={baseCurrency}
                onPointClick={(index, point) => {
                  if (point.date) {
                    setSelectedChartPoint({ date: point.date, index });
                    setDateFrom(point.date);
                    setDateTo(point.date);
                    // Scroll do tabeli wydatków
                    setTimeout(() => {
                      const tableElement = document.getElementById("expenses-table");
                      if (tableElement) {
                        tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }, 100);
                  }
                }}
                highlightPoint={selectedChartPoint?.index ?? null}
              />
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Pie Chart */}
            {categoryChartData.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Wydatki według kategorii
                </h4>
                <CategoryPieChart
                  data={categoryChartData}
                  size={200}
                  onCategoryClick={(category) => {
                    const categoryName = category.split(' (')[0];
                    const categoryExpenses = filteredExpenses.filter((exp) => exp.category === categoryName);
                    if (categoryExpenses.length > 0) {
                      setDrillDownData({ type: "category", name: categoryName, expenses: categoryExpenses });
                    } else {
                      toggleCategory(categoryName);
                    }
                  }}
                  selectedCategory={selectedCategories.length === 1 ? selectedCategories[0] : undefined}
                  currency={baseCurrency}
                />
              </div>
            )}

            {/* Country Bar Chart */}
            {countryChartData.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Wydatki według kraju
                </h4>
                <div className="space-y-3">
                  {countryChartData.slice(0, 5).map((item, index) => {
                    const maxValue = Math.max(...countryChartData.map((c) => c.value));
                    const percentage = (item.value / maxValue) * 100;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          const country = availableCountries.find((c) => c.name === item.country);
                          if (country) {
                            const countryExpenses = filteredExpenses.filter((exp) => exp.countryId === country.id);
                            if (countryExpenses.length > 0) {
                              setDrillDownData({ type: "country", name: country.name, expenses: countryExpenses });
                            } else {
                              toggleCountry(country.id);
                            }
                          }
                        }}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          selectedCountries.includes(availableCountries.find((c) => c.name === item.country)?.id || "")
                            ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-400"
                            : "bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {item.country}
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(item.value, Object.keys(statistics.byCurrency)[0] || "")}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!showCharts && filteredExpenses.length > 0 && (
        <div className="mb-8">
          <button
            onClick={() => setShowCharts(true)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Pokaż wykresy
          </button>
        </div>
      )}

      {/* Wydatki wg waluty - klikalne */}
      {Object.keys(allStatistics.byCurrency).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Wydatki według waluty
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(allStatistics.byCurrency)
              .sort((a, b) => b[1] - a[1])
              .map(([currency, amount]) => {
                const isSelected = selectedCurrencies.includes(currency);
                return (
                <button
                  key={currency}
                    onClick={() => toggleCurrency(currency)}
                  className={`p-4 rounded-lg text-left transition-all ${
                      isSelected
                      ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-400"
                      : "bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {getCurrencyName(currency)}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(amount, currency)}
                  </p>
                </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Wyszukiwarka */}
      <div className="mb-6 md:sticky md:top-4 md:z-10">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Szukaj po opisie, kategorii, lokalizacji..."
        />
      </div>

      {/* Sekcja filtrów - podobna do przykładu */}
      {/* Desktop: normalna sekcja, Mobile: bottom sheet */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Funnel className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Filtry wydatków
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddFilter(!showAddFilter)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <Funnel className="w-4 h-4" />
              <span className="hidden sm:inline">Filtry</span>
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Wyczyść</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Szybkie filtry:
          </span>
          {[
            { key: "last7" as const, label: "Ostatnie 7 dni" },
            { key: "last30" as const, label: "Ostatni miesiąc" },
            { key: "thisWeek" as const, label: "Ten tydzień" },
            { key: "thisMonth" as const, label: "Ten miesiąc" },
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

          {/* Aktywne filtry jako chipy */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            {selectedCurrencies.map((currency) => (
              <span
                key={currency}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium animate-fade-in"
              >
                Waluta: {currency}
              <button
                  onClick={() => toggleCurrency(currency)}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                aria-label="Usuń filtr"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
            ))}
            {selectedCountries.map((countryId) => {
              const country = availableCountries.find((c) => c.id === countryId);
              return (
                <span
                  key={countryId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium animate-fade-in"
                >
                  Kraj: {country?.name}
              <button
                    onClick={() => toggleCountry(countryId)}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                aria-label="Usuń filtr"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
              );
            })}
            {selectedCategories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium animate-fade-in"
              >
                Kategoria: {category}
              <button
                  onClick={() => toggleCategory(category)}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                aria-label="Usuń filtr"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
            ))}
          {dateFrom && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
              Od: {formatDate(dateFrom)}
              <button
                onClick={() => setDateFrom("")}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                aria-label="Usuń filtr"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {dateTo && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
              Do: {formatDate(dateTo)}
              <button
                onClick={() => setDateTo("")}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                aria-label="Usuń filtr"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
            )}
          </div>
        )}

            {/* Dropdown z filtrami */}
            {showAddFilter && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Waluty
                    </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                  {availableCurrencies.map((currency) => {
                    const isSelected = selectedCurrencies.includes(currency);
                    return (
                      <label
                        key={currency}
                        className="flex items-center justify-between gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCurrency(currency)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {currency}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                          {filterCounts.currencies[currency] || 0}
                        </span>
                      </label>
                    );
                  })}
                </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kraje
                    </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                  {availableCountries.map((country) => {
                    const isSelected = selectedCountries.includes(country.id);
                    return (
                      <label
                        key={country.id}
                        className="flex items-center justify-between gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCountry(country.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {country.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                          {filterCounts.countries[country.id] || 0}
                        </span>
                      </label>
                    );
                  })}
                </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kategorie
                    </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                  {availableCategories.map((category) => {
                    const isSelected = selectedCategories.includes(category);
                    return (
                      <label
                        key={category}
                        className="flex items-center justify-between gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCategory(category)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {category}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                          {filterCounts.categories[category] || 0}
                        </span>
                      </label>
                    );
                  })}
                </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data od
                    </label>
                    <DatePicker
                      value={dateFrom}
                      onChange={(value) => {
                        setDateFrom(value);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data do
                    </label>
                    <DatePicker
                      value={dateTo}
                      onChange={(value) => {
                        setDateTo(value);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

      {/* Time Analysis Section */}
      {showTimeAnalysis && filteredExpenses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Analiza czasowa
            </h3>
            <button
              onClick={() => setShowTimeAnalysis(false)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Ukryj
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Wydatki według dnia tygodnia
              </h4>
              <div className="space-y-2">
                {(["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"] as const)
                  .map((day) => ({ day, stats: dayOfWeekStats[day] ?? { total: 0, count: 0 } }))
                  .map(({ day, stats }) => {
                    const maxTotal = Math.max(...Object.values(dayOfWeekStats).map((s) => s.total));
                    const percentage = maxTotal > 0 ? (stats.total / maxTotal) * 100 : 0;
                    return (
                      <div key={day} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">{day}</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(stats.total, Object.keys(statistics.byCurrency)[0] || "")} ({stats.count})
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Wzorce wydatków
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Średnia dzienna</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(spendingPatterns.averageDaily, Object.keys(statistics.byCurrency)[0] || "")}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Weekendy</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(spendingPatterns.weekendSpending.total, Object.keys(statistics.byCurrency)[0] || "")}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {spendingPatterns.weekendSpending.percentage.toFixed(1)}% wszystkich wydatków
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Dni robocze</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(spendingPatterns.weekdaySpending.total, Object.keys(statistics.byCurrency)[0] || "")}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {spendingPatterns.weekdaySpending.percentage.toFixed(1)}% wszystkich wydatków
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!showTimeAnalysis && filteredExpenses.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowTimeAnalysis(true)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Pokaż analizę czasową
          </button>
        </div>
      )}

      {/* Calendar Heatmap */}
      {showCalendarHeatmap && filteredExpenses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Kalendarz wydatków
            </h3>
            <button
              onClick={() => setShowCalendarHeatmap(false)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Ukryj
            </button>
      </div>
          <CalendarHeatmap
            data={dailyTotals.map((d) => ({
              date: d.date,
              value: d.total,
              count: d.count,
            }))}
            currency={baseCurrency}
          />
        </div>
      )}

      {!showCalendarHeatmap && filteredExpenses.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowCalendarHeatmap(true)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Pokaż kalendarz wydatków
          </button>
        </div>
      )}

      {/* Tabela wydatków */}
      <div id="expenses-table" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Lista wydatków ({sortedExpenses.length})
          </h3>
            {selectedChartPoint && (
              <button
                onClick={() => {
                  setSelectedChartPoint(null);
                  setDateFrom("");
                  setDateTo("");
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
                Wyczyść filtr daty
              </button>
            )}
          </div>
        </div>

        {sortedExpenses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Brak wydatków spełniających kryteria filtrowania
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop: Tabela */}
            <table className="w-full hidden md:table">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-2">
                      Data
                      {renderSortIndicator("date")}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Opis
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center gap-2">
                      Kategoria
                      {renderSortIndicator("category")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("country")}
                  >
                    <div className="flex items-center gap-2">
                      Kraj
                      {renderSortIndicator("country")}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                    Miejsce
                  </th>
                  <th
                    className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Kwota
                      {renderSortIndicator("amount")}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Waluta
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedExpenses.map((expense) => {
                  const country = getCountryById(expense.countryId, tripId ?? undefined);
                  return (
                    <tr
                      key={expense.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatExpenseDateRange(expense)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        <div>
                          <div className="font-medium">
                            {searchQuery ? highlightText(expense.description || "", searchQuery) : expense.description}
                          </div>
                          {expense.note && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                              {searchQuery ? highlightText(expense.note, searchQuery) : expense.note}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {searchQuery ? highlightText(getExpenseCategoryDisplay(expense.category, expense.accommodationType), searchQuery) : getExpenseCategoryDisplay(expense.category, expense.accommodationType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {searchQuery && country?.name ? highlightText(country.name, searchQuery) : (country?.name || "-")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                        {expense.location || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(expense.amount, expense.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {expense.currency}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile: Karty */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {sortedExpenses.map((expense) => {
                const country = getCountryById(expense.countryId, tripId ?? undefined);
                return (
                  <div
                    key={expense.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {searchQuery ? highlightText(expense.description || "", searchQuery) : expense.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {formatExpenseDateRange(expense)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(expense.amount, expense.currency)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span>{searchQuery ? highlightText(getExpenseCategoryDisplay(expense.category, expense.accommodationType), searchQuery) : getExpenseCategoryDisplay(expense.category, expense.accommodationType)}</span>
                      {country && (
                        <>
                          <span>•</span>
                          <span>{searchQuery ? highlightText(country.name, searchQuery) : country.name}</span>
                        </>
                      )}
                      {expense.location && (
                        <>
                          <span>•</span>
                          <span>{searchQuery ? highlightText(expense.location, searchQuery) : expense.location}</span>
                        </>
                      )}
                    </div>
                    {expense.note && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                        {searchQuery ? highlightText(expense.note, searchQuery) : expense.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button - tylko na mobile */}
      <FloatingActionButton
        onClick={() => {
          router.push(`/portfel-podrozniczy/${slug}`);
        }}
        label="Dodaj wydatek"
      />

      {/* Drill Down Modal */}
      <DrillDownModal
        isOpen={drillDownData !== null}
        onClose={() => setDrillDownData(null)}
        type={drillDownData?.type || "category"}
        name={drillDownData?.name || ""}
        expenses={drillDownData?.expenses || []}
        tripId={tripId ?? ""}
      />
    </PageLayout>
  );
}
