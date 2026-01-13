"use client";

import { useState } from "react";
import { Wallet, MapPin, Calendar, TrendingUp } from "lucide-react";
import type { TravelWalletData } from "@/lib/travel-wallet/types";
import { ProgressBar, BudgetBreakdown } from "./TravelWalletCharts";

interface TravelWalletSummaryProps {
  data: TravelWalletData;
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number | React.ReactNode;
  color: "blue" | "green" | "purple";
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  // Neutralne style dla wszystkich kart
  const cardStyle = "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600";
  
  const iconBgStyle = "bg-gray-100 dark:bg-gray-700";
  
  const iconColor = "text-gray-700 dark:text-gray-300";

  return (
    <div className={`rounded-2xl p-6 ${cardStyle}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">
            {label}
          </p>
          <div className="mt-2">
            {typeof value === "string" || typeof value === "number" ? (
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {value}
              </p>
            ) : (
              <div className="text-gray-900 dark:text-gray-100">{value}</div>
            )}
          </div>
        </div>
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ml-4 shadow-md ${iconBgStyle}`}
        >
          <Icon className={`w-7 h-7 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

export default function TravelWalletSummary({
  data,
}: TravelWalletSummaryProps) {
  const [showAllCurrencies, setShowAllCurrencies] = useState(false);
  const [showAllCountries, setShowAllCountries] = useState(false);

  // Kursy walut do PLN (przykładowe, później można pobrać z API)
  const exchangeRates: Record<string, number> = {
    PLN: 1,
    USD: 4.0,
    EUR: 4.3,
    JPY: 0.027,
    THB: 0.11,
    GBP: 5.1,
  };

  // Oblicz całkowitą liczbę dni
  const totalDays = data.countries.reduce((sum, country) => sum + country.days, 0);

  // Oblicz aktualny dzień podróży i lokalizację
  // Na razie używamy dzisiejszej daty jako punktu odniesienia
  // Później można dodać datę startową do danych
  const today = new Date();
  const startDate = new Date(today); // Domyślnie dzisiaj, później można dodać do danych
  const currentDay = 3; // Przykładowy dzień podróży, później można obliczyć na podstawie daty

  // Znajdź kraj dla aktualnego dnia podróży
  let dayCounter = 0;
  let currentCountry = null;
  let currentLocation = "";

  for (const country of data.countries) {
    if (currentDay > dayCounter && currentDay <= dayCounter + country.days) {
      currentCountry = country;
      // Użyj pierwszej lokalizacji lub połącz wszystkie
      if (country.locations && country.locations.length > 0) {
        currentLocation = country.locations
          .map((loc) => (typeof loc === "string" ? loc : loc.name))
          .join(", ");
      } else {
        currentLocation = "";
      }
      break;
    }
    dayCounter += country.days;
  }

  // Formatuj datę dla aktualnego dnia
  const currentDate = new Date(startDate);
  currentDate.setDate(startDate.getDate() + currentDay - 1);
  const formattedDate = currentDate.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Lista krajów do wyświetlenia
  const displayedCountries = showAllCountries
    ? data.countries
    : data.countries.slice(0, 3);
  const hasMoreCountries = data.countries.length > 3;

  const countriesDisplay = (
    <div>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        {data.countries.length}
      </p>
      <ul className="space-y-2.5">
        {displayedCountries.map((country) => (
          <li
            key={country.id}
            className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400" />
            {country.name}
          </li>
        ))}
      </ul>
      {hasMoreCountries && !showAllCountries && (
        <button
          onClick={() => setShowAllCountries(true)}
          className="mt-4 text-sm font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors underline decoration-2 underline-offset-2"
        >
          Zobacz więcej
        </button>
      )}
      {hasMoreCountries && showAllCountries && (
        <button
          onClick={() => setShowAllCountries(false)}
          className="mt-4 text-sm font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors underline decoration-2 underline-offset-2"
        >
          Zobacz mniej
        </button>
      )}
    </div>
  );

  // Wyświetlanie dni podróży z paskiem postępu
  const daysDisplay = (
    <div>
      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {currentDay}/{totalDays} dni
        </p>
        <ProgressBar
          value={currentDay}
          max={totalDays}
          color="blue"
          height="lg"
          showLabel={false}
        />
      </div>
      {currentLocation && (
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p className="font-semibold text-gray-700 dark:text-gray-300">{formattedDate}</p>
          <p className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {currentLocation}
          </p>
        </div>
      )}
    </div>
  );

  // Oblicz całkowity budżet (suma wszystkich walut)
  const budgetMap = new Map<string, number>();
  data.countries.forEach((country) => {
    country.budgets.forEach((budget) => {
      const current = budgetMap.get(budget.currency) || 0;
      budgetMap.set(budget.currency, current + budget.amount);
    });
  });

  // Konwertuj wszystkie waluty do PLN
  let totalInPLN = 0;
  budgetMap.forEach((amount, currency) => {
    const rate = exchangeRates[currency.toUpperCase()] || 1;
    totalInPLN += amount * rate;
  });

  // Formatuj budżet jako lista walut
  const budgetList = Array.from(budgetMap.entries())
    .map(([currency, amount]) => {
      // Formatuj liczby z separatorami tysięcy
      const formattedAmount = new Intl.NumberFormat("pl-PL", {
        maximumFractionDigits: 0,
      }).format(amount);
      return { currency, amount: formattedAmount };
    })
    .sort((a, b) => a.currency.localeCompare(b.currency));

  const displayedCurrencies = showAllCurrencies
    ? budgetList
    : budgetList.slice(0, 4);
  const hasMoreCurrencies = budgetList.length > 4;

  const formatCurrency = (currency: string, amount: string) => {
    const currencyLower = currency.toLowerCase();
    if (currencyLower === "pln") {
      return `${amount} zł`;
    } else if (currencyLower === "jpy" || currencyLower === "yen") {
      return `${amount} ¥`;
    } else if (currencyLower === "usd") {
      return `${amount} USD`;
    } else if (currencyLower === "eur") {
      return `${amount} EUR`;
    } else {
      return `${amount} ${currency.toUpperCase()}`;
    }
  };

  // Przygotuj dane dla wykresu budżetu - neutralne odcienie szarości
  const defaultColors = [
    "rgb(107, 114, 128)", // gray-500
    "rgb(75, 85, 99)", // gray-600
    "rgb(55, 65, 81)", // gray-700
    "rgb(31, 41, 55)", // gray-800
    "rgb(156, 163, 175)", // gray-400
    "rgb(209, 213, 219)", // gray-300
    "rgb(229, 231, 235)", // gray-200
    "rgb(243, 244, 246)", // gray-100
  ];

  const allBudgetChartData = Array.from(budgetMap.entries()).map(([currency, amount], index) => ({
    currency,
    amount,
    color: defaultColors[index % defaultColors.length],
  }));

  const displayedBudgetChartData = showAllCurrencies
    ? allBudgetChartData
    : allBudgetChartData.slice(0, 4);

  const budgetDisplay =
    budgetList.length > 0 ? (
      <div>
        <BudgetBreakdown
          budgets={displayedBudgetChartData}
          exchangeRates={exchangeRates}
          showChart={true}
        />
        {hasMoreCurrencies && !showAllCurrencies && (
          <button
            onClick={() => setShowAllCurrencies(true)}
            className="mt-4 w-full text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors underline decoration-2 underline-offset-2"
          >
            Zobacz więcej
          </button>
        )}
        {hasMoreCurrencies && showAllCurrencies && (
          <button
            onClick={() => setShowAllCurrencies(false)}
            className="mt-4 w-full text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors underline decoration-2 underline-offset-2"
          >
            Zobacz mniej
          </button>
        )}
      </div>
    ) : (
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        0 PLN
      </p>
    );

  const formattedTotalPLN = new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 0,
  }).format(totalInPLN);

  return (
    <div className="space-y-8">
      {/* Sekcja Łącznie - neutralna, z ramką */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-md p-8 md:p-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <p className="text-sm md:text-base font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">
              Całkowity budżet
            </p>
            <p className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {formattedTotalPLN} zł
            </p>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              w przeliczeniu na PLN
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-4 md:p-5 flex-shrink-0 ml-6">
            <Wallet className="w-12 h-12 md:w-16 md:h-16 text-gray-700 dark:text-gray-300" />
          </div>
        </div>
        {allBudgetChartData.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Podział budżetu
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {allBudgetChartData.slice(0, 4).map((item, index) => {
                const rate = exchangeRates[item.currency.toUpperCase()] || 1;
                const valueInPLN = item.amount * rate;
                const percentage = totalInPLN > 0 ? (valueInPLN / totalInPLN) * 100 : 0;
                const formattedAmount = new Intl.NumberFormat("pl-PL", {
                  maximumFractionDigits: 0,
                }).format(item.amount);
                return (
                  <div
                    key={item.currency}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                        {item.currency}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(item.currency, formattedAmount)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {percentage.toFixed(1)}%
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Karty statystyk */}
      <div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-6 md:mb-8">
          Podsumowanie
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={Wallet}
            label="Budżet per waluta"
            value={budgetDisplay}
            color="blue"
          />
          <StatCard
            icon={MapPin}
            label="Liczba krajów"
            value={countriesDisplay}
            color="blue"
          />
          <StatCard
            icon={Calendar}
            label="Dni podróży"
            value={daysDisplay}
            color="blue"
          />
        </div>
      </div>
    </div>
  );
}

