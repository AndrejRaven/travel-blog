"use client";

import Link from "@/components/ui/Link";
import { Edit } from "lucide-react";
import type { Country, TravelWalletData } from "@/lib/travel-wallet/types";
import {
  formatDateRange,
  calculatePlannedTotal,
  calculateActualTotal,
  groupCountriesByStatus,
  getCountryStatusLabel,
} from "@/lib/travel-wallet/countries";
import { formatCurrency } from "@/lib/travel-wallet/formatters";

interface CountriesListProps {
  countries: Country[];
  slug: string;
  tripId?: string;
  data?: TravelWalletData;
  baseCurrency?: string;
  onEditCountry?: (country: Country) => void;
}

export default function CountriesList({
  countries,
  slug,
  tripId,
  data,
  baseCurrency = "PLN",
  onEditCountry,
}: CountriesListProps) {
  // Grupowanie krajów według statusu
  const grouped = groupCountriesByStatus(countries);

  const renderTable = (countryList: Country[], title: string) => {
    if (countryList.length === 0) return null;

    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {title}
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Nazwa
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Daty
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Planowany budżet
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Faktyczne wydatki
                </th>
                {onEditCountry && (
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-24">
                    Akcje
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {countryList.map((country) => {
                const planned = calculatePlannedTotal(country, data);
                const actual = calculateActualTotal(country);

                return (
                  <tr
                    key={country.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/portfel-podrozniczy/${slug}/kraje/${country.slug}`}
                        variant="default"
                        className="font-semibold text-gray-900 dark:text-gray-100"
                      >
                        {country.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDateRange(country.startDate, country.endDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {getCountryStatusLabel(country.status)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">
                      {formatCurrency(planned, baseCurrency, 2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">
                      {actual > 0 ? formatCurrency(actual, baseCurrency, 2) : "—"}
                    </td>
                    {onEditCountry && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onEditCountry(country);
                          }}
                          className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Edit className="w-4 h-4" />
                          Edytuj
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {renderTable(grouped.visited, "Odwiedzone kraje")}
      {renderTable(grouped.current, "Obecny kraj")}
      {renderTable(grouped.upcoming, "Nadchodzące kraje")}

      {countries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Brak dodanych krajów
          </p>
        </div>
      )}
    </div>
  );
}

