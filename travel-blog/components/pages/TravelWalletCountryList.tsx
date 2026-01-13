"use client";

import { useState } from "react";
import { ChevronDown, MapPin, Calendar, DollarSign, TrendingUp } from "lucide-react";
import type { Country } from "@/lib/travel-wallet/types";
import { ProgressBar, BudgetBreakdown } from "./TravelWalletCharts";

interface TravelWalletCountryListProps {
  countries: Country[];
  expandedCountries: Set<string>;
  onToggleCountry: (countryId: string) => void;
}

function CountryCard({
  country,
  isExpanded,
  onToggle,
}: {
  country: Country;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  // Znajdź główną walutę (pierwsza w liście lub największa kwota)
  const mainBudget =
    country.budgets.length > 0
      ? country.budgets.reduce((prev, current) =>
          current.amount > prev.amount ? current : prev
        )
      : null;

  const formattedMainBudget = mainBudget
    ? `${new Intl.NumberFormat("pl-PL", {
        maximumFractionDigits: 0,
      }).format(mainBudget.amount)} ${mainBudget.currency.toUpperCase()}`
    : "Brak budżetu";

  // Oblicz całkowity budżet dla tego kraju (dla paska postępu)
  const totalBudget = country.budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const maxBudget = 100000; // Przykładowa maksymalna wartość dla wizualizacji

  // Przygotuj dane dla wykresu budżetu - neutralne odcienie szarości
  const defaultColors = [
    "rgb(107, 114, 128)", // gray-500
    "rgb(75, 85, 99)", // gray-600
    "rgb(55, 65, 81)", // gray-700
    "rgb(31, 41, 55)", // gray-800
    "rgb(156, 163, 175)", // gray-400
  ];

  const budgetChartData = country.budgets.map((budget, index) => ({
    currency: budget.currency,
    amount: budget.amount,
    color: defaultColors[index % defaultColors.length],
  }));

  // Neutralny kolor akcentu dla karty
  const accentColor = "from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-600";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300">
      {/* Nagłówek kraju z gradientem */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative overflow-hidden"
      >
        <div className={`absolute top-0 left-0 w-1 h-full bg-gray-300 dark:bg-gray-600`} />
        <div className="flex items-center justify-between p-6 pl-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl md:text-2xl font-serif font-bold text-gray-900 dark:text-gray-100">
                {country.name}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <MapPin className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {country.locations && country.locations.length > 0
                    ? country.locations
                        .map((loc) => (typeof loc === "string" ? loc : loc.name))
                        .join(", ")
                    : "Brak lokalizacji"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <Calendar className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{country.days}</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    {country.days === 1 ? "dzień" : "dni"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <DollarSign className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </div>
                <span className="font-bold text-gray-900 dark:text-gray-100">{formattedMainBudget}</span>
              </div>
            </div>
            {/* Pasek postępu dla dni */}
            <div className="mt-3">
              <ProgressBar
                value={country.days}
                max={30}
                color="blue"
                height="sm"
                showLabel={false}
                className="opacity-60"
              />
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3 flex-shrink-0 ml-4 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <ChevronDown
              className={`w-5 h-5 text-gray-600 dark:text-gray-300 transition-transform duration-300 ${
                isExpanded ? "rotate-180" : "rotate-0"
              }`}
              aria-hidden
            />
          </div>
        </div>
      </button>

      {/* Rozwinięta zawartość */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 pb-6 pt-4 border-t-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50/50 to-white dark:from-gray-900/30 dark:to-gray-800">
          <div className="mt-2 space-y-6">
            {/* Wizualizacja budżetu */}
            {country.budgets.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                    Szczegóły budżetu
                  </h4>
                </div>
                <BudgetBreakdown
                  budgets={budgetChartData}
                  exchangeRates={{}}
                  showChart={country.budgets.length > 1}
                />
              </div>
            )}
            {country.budgets.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Brak danych budżetowych
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TravelWalletCountryList({
  countries,
  expandedCountries,
  onToggleCountry,
}: TravelWalletCountryListProps) {
  if (countries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          Brak dodanych krajów. Dodaj pierwszy kraj, aby rozpocząć planowanie budżetu.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-8">
        Kraje
      </h2>
      <div className="space-y-5">
        {countries.map((country) => (
          <CountryCard
            key={country.id}
            country={country}
            isExpanded={expandedCountries.has(country.id)}
            onToggle={() => onToggleCountry(country.id)}
          />
        ))}
      </div>
    </div>
  );
}

