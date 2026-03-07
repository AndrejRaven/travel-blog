"use client";

import { useMemo } from "react";
import { ArrowLeft, Target, AlertTriangle, CheckCircle } from "lucide-react";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import Link from "@/components/ui/Link";
import InsightsCard from "@/components/ui/InsightsCard";
import { getAllExpenses, getExpensesByCountryId } from "@/lib/travel-wallet/expenses";
import { formatCurrency } from "@/lib/travel-wallet/formatters";
import { getTripBySlug } from "@/lib/travel-wallet/trips-storage";
import {
  calculateTotalBudget,
  calculateTotalSpent,
  calculatePlannedSpending,
} from "@/lib/travel-wallet/calculations";
import { calculateTotalActualCostByTripId } from "@/lib/travel-wallet/country-calculations";

interface BudgetVsActualClientProps {
  slug: string;
  embedded?: boolean;
}

export default function BudgetVsActualClient({ slug, embedded }: BudgetVsActualClientProps) {
  const trip = getTripBySlug(slug);

  const { totalBudget, totalSpent, totalDiff, totalUsagePct, countryRows, statusVariant, statusMessage } = useMemo(() => {
    if (!trip) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        totalDiff: 0,
        totalUsagePct: 0,
        countryRows: [] as Array<{
          countryId: string;
          name: string;
          budget: number;
          spent: number;
          diff: number;
          usagePct: number;
        }>,
        statusVariant: "default" as const,
        statusMessage: "",
      };
    }
    const budget = calculateTotalBudget(trip.data, trip.id);
    const spent = calculateTotalSpent(trip.data, trip.id);
    const diff = budget - spent;
    const usagePct = budget > 0 ? (spent / budget) * 100 : 0;

    const rows = trip.data.countries.map((country) => {
      const planned = calculatePlannedSpending(country, trip.data);
      const expenses = getExpensesByCountryId(country.id, trip.id);
      const countrySpent = calculateTotalActualCostByTripId(expenses, trip.id);
      const countryDiff = planned - countrySpent;
      const countryUsagePct = planned > 0 ? (countrySpent / planned) * 100 : 0;
      return {
        countryId: country.id,
        name: country.name,
        budget: planned,
        spent: countrySpent,
        diff: countryDiff,
        usagePct: countryUsagePct,
      };
    });

    let variant: "default" | "success" | "warning" = "default";
    let message = "";
    if (budget > 0) {
      if (usagePct <= 100) {
        variant = usagePct >= 90 ? "warning" : "success";
        message = usagePct >= 90 ? "Blisko limitu budżetu" : "W normie";
      } else {
        variant = "warning";
        message = "Przekroczono budżet";
      }
    }

    return {
      totalBudget: budget,
      totalSpent: spent,
      totalDiff: diff,
      totalUsagePct: usagePct,
      countryRows: rows,
      statusVariant: variant,
      statusMessage: message,
    };
  }, [trip]);

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
      {/* Cała podróż – karta + pasek */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Cała podróż</h3>
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Plan (budżet)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalBudget, baseCurrency)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Wydane</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalSpent, baseCurrency)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Wykorzystanie budżetu</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {totalBudget > 0 ? `${totalUsagePct.toFixed(1)}%` : "—"}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                totalUsagePct > 100
                  ? "bg-red-500"
                  : totalUsagePct >= 90
                    ? "bg-amber-500"
                    : "bg-green-500"
              }`}
              style={{ width: `${Math.min(totalUsagePct, 100)}%` }}
            />
          </div>
          {totalBudget > 0 && totalSpent > totalBudget && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              Przekroczono o {formatCurrency(totalSpent - totalBudget, baseCurrency)}
            </p>
          )}
        </div>
        <InsightsCard
          title="Status"
          value={statusMessage || "Brak budżetu"}
          variant={statusVariant === "success" ? "success" : statusVariant === "warning" ? "warning" : "default"}
          icon={statusVariant === "success" ? <CheckCircle className="w-5 h-5" /> : statusVariant === "warning" ? <AlertTriangle className="w-5 h-5" /> : <Target className="w-5 h-5" />}
        />
      </div>

      {/* Wykres plan vs fakt per kraj */}
      {countryRows.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Plan vs fakt per kraj</h3>
          <div className="space-y-4">
            {countryRows.map((row) => {
              const maxVal = Math.max(row.budget, row.spent, 1);
              const budgetPct = (row.budget / maxVal) * 100;
              const spentPct = (row.spent / maxVal) * 100;
              return (
                <div key={row.countryId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{row.name}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Plan: {formatCurrency(row.budget, baseCurrency)} · Fakt: {formatCurrency(row.spent, baseCurrency)}
                    </span>
                  </div>
                  <div className="flex gap-1 h-2 rounded overflow-hidden">
                    <div
                      className="bg-blue-200 dark:bg-blue-800 rounded-l"
                      style={{ width: `${budgetPct}%` }}
                    />
                    <div
                      className="bg-green-500 dark:bg-green-600"
                      style={{ width: `${spentPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabela per kraj */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 p-6 pb-0">Szczegóły per kraj</h3>
        {countryRows.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Brak krajów w podróży.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Kraj</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Budżet ({baseCurrency})</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Wydane ({baseCurrency})</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Różnica</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">% wykorzystania</th>
                </tr>
              </thead>
              <tbody>
                {countryRows.map((row) => (
                  <tr key={row.countryId} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{formatCurrency(row.budget, baseCurrency)}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-gray-100">{formatCurrency(row.spent, baseCurrency)}</td>
                    <td className={`py-3 px-4 text-right ${row.diff >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {row.diff >= 0 ? "+" : ""}{formatCurrency(row.diff, baseCurrency)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={row.usagePct > 100 ? "text-red-600 dark:text-red-400" : row.usagePct >= 90 ? "text-amber-600 dark:text-amber-400" : "text-gray-700 dark:text-gray-300"}>
                        {row.budget > 0 ? `${row.usagePct.toFixed(1)}%` : "—"}
                      </span>
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
        title="Budżet vs wykonanie"
        subtitle="Plan a faktyczne wydatki w podróży i per kraj"
      />

      {content}
    </PageLayout>
  );
}
