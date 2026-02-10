"use client";

import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Plus, MapPin } from "lucide-react";
import Link from "@/components/ui/Link";
import Button from "@/components/ui/Button";
import CountryActionsMenu from "./CountryActionsMenu";
import type { TravelWalletData, Country } from "@/lib/travel-wallet/types";
import {
  calculatePlannedSpending,
  calculateActualSpending,
  calculateCountryVariance,
  calculateAverageDailyCost,
} from "@/lib/travel-wallet/calculations";
import { formatCurrency } from "@/lib/travel-wallet/formatters";

interface TravelWalletTablesProps {
  data: TravelWalletData;
  slug: string;
  onEditCountry?: (country: Country) => void;
  onAddBudget?: (country: Country) => void;
  onReduceBudget?: (country: Country) => void;
  onDeleteCountry?: (country: Country) => void;
  onAddCountry?: () => void;
}

export default function TravelWalletTables({
  data,
  slug,
  onEditCountry,
  onAddBudget,
  onReduceBudget,
  onDeleteCountry,
  onAddCountry,
}: TravelWalletTablesProps) {
  const router = useRouter();

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return "—";
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "—";
    const startFormatted = start.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
    });
    const endFormatted = end.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${startFormatted} - ${endFormatted}`;
  };

  const visitedCountries = data.countries.filter(
    (country) => country.status === "visited" || country.status === "current"
  );

  const upcomingCountries = data.countries.filter(
    (country) => country.status === "upcoming"
  );

  return (
    <div className="space-y-8 mb-8">
      {/* Visited Countries Table */}
      {visitedCountries.length > 0 && (
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Odwiedzone kraje
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Kraj
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Daty
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Planowane
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Rzeczywiste
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Różnica
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-16">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {visitedCountries.map((country) => {
                    const planned = calculatePlannedSpending(country);
                    const actual = calculateActualSpending(country);
                    const variance = calculateCountryVariance(country);
                    const isOver = variance > 0;

                    return (
                      <tr
                        key={country.id}
                        onClick={() => router.push(`/portfel-podrozniczy/${slug}/kraje/${country.slug}`)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                              {country.name
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {country.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {formatDateRange(country.startDate, country.endDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">
                          {formatCurrency(planned)} zł
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">
                          {formatCurrency(actual)} zł
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div
                            className={`inline-flex items-center gap-1 text-sm font-semibold ${
                              isOver
                                ? "text-red-600 dark:text-red-400"
                                : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            {isOver ? (
                              <ArrowUp className="w-4 h-4" />
                            ) : (
                              <ArrowDown className="w-4 h-4" />
                            )}
                            {formatCurrency(Math.abs(variance))} zł
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <CountryActionsMenu
                            country={country}
                            slug={slug}
                            onEdit={onEditCountry}
                            onAddBudget={onAddBudget}
                            onReduceBudget={onReduceBudget}
                            onDelete={onDeleteCountry}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Countries Table */}
      {upcomingCountries.length > 0 && (
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Nadchodzące kraje
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Kraj
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Daty
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Całkowity budżet
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Średni dzienny koszt
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-16">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {upcomingCountries.map((country) => {
                    const totalBudget = calculatePlannedSpending(country);
                    const avgDailyCost = calculateAverageDailyCost(country);

                    return (
                      <tr
                        key={country.id}
                        onClick={() => router.push(`/portfel-podrozniczy/${slug}/kraje/${country.slug}`)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                              {country.name
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {country.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {formatDateRange(country.startDate, country.endDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">
                          {formatCurrency(totalBudget)} zł
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">
                        {formatCurrency(avgDailyCost)} zł/dzień
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <CountryActionsMenu
                          country={country}
                          slug={slug}
                          onEdit={onEditCountry}
                          onAddBudget={onAddBudget}
                          onReduceBudget={onReduceBudget}
                          onDelete={onDeleteCountry}
                        />
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {visitedCountries.length === 0 && upcomingCountries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Brak danych o krajach
          </p>
        </div>
      )}

      {/* Action buttons section */}
      <div className="flex flex-wrap gap-4 justify-center pt-6">
        {onAddCountry && (
          <Button
            variant="outline"
            onClick={onAddCountry}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Dodaj kraj
          </Button>
        )}
        <Link
          href={`/portfel-podrozniczy/${slug}/kraje`}
          variant="default"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <MapPin className="w-4 h-4" />
          Zobacz wszystkie kraje
        </Link>
      </div>
    </div>
  );
}

