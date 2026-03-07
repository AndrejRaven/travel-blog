"use client";

import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import Link from "@/components/ui/Link";
import { getAllExpenses } from "@/lib/travel-wallet/expenses";
import { formatCurrency, formatDate } from "@/lib/travel-wallet/formatters";
import { getTripBySlug } from "@/lib/travel-wallet/trips-storage";
import { groupExpensesByDay } from "@/lib/travel-wallet/expense-analytics";
import { calculateTotalActualCostByTripId } from "@/lib/travel-wallet/country-calculations";

interface TripTimelineClientProps {
  slug: string;
}

function getDaysInRange(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = end.getTime() > today.getTime() ? today : end;
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const lastTime = last.getTime();
  while (cur.getTime() <= lastTime) {
    days.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function isCountryOnDate(country: { startDate?: string; endDate?: string }, date: string): boolean {
  if (!country.startDate || !country.endDate) return false;
  return date >= country.startDate && date <= country.endDate;
}

export default function TripTimelineClient({ slug }: TripTimelineClientProps) {
  const trip = getTripBySlug(slug);

  const { dayRows } = useMemo(() => {
    if (!trip || !trip.startDate || !trip.endDate) {
      return { dayRows: [] as Array<{ date: string; countryNames: string[]; spentPLN: number }> };
    }
    const days = getDaysInRange(trip.startDate, trip.endDate);
    const allExpenses = getAllExpenses(trip.id);
    const byDay = groupExpensesByDay(allExpenses);

    const dayRows = days.map((date) => {
      const dayExpenses = byDay[date] ?? [];
      const spentPLN = dayExpenses.length > 0 ? calculateTotalActualCostByTripId(dayExpenses, trip.id) : 0;
      const countryNames = trip.data.countries
        .filter((c) => isCountryOnDate(c, date))
        .map((c) => c.name);
      return { date, countryNames, spentPLN };
    });

    return { dayRows };
  }, [trip]);

  if (!trip) {
    return (
      <PageLayout maxWidth="6xl">
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          Nie udało się załadować danych podróży.
        </div>
      </PageLayout>
    );
  }

  const baseCurrency = trip.data?.wallet?.baseCurrency ?? "PLN";

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
        title="Oś czasu podróży"
        subtitle="Dni podróży z przypisanymi krajami i wydatkami"
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        {dayRows.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Brak danych o dniach podróży (ustaw daty rozpoczęcia i zakończenia podróży).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Data</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Kraje</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Wydatki ({baseCurrency})</th>
                </tr>
              </thead>
              <tbody>
                {dayRows.map((row) => (
                  <tr key={row.date} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatDate(row.date)}</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {row.countryNames.length > 0 ? row.countryNames.join(", ") : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-gray-100">
                      {row.spentPLN > 0 ? formatCurrency(row.spentPLN, baseCurrency) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
