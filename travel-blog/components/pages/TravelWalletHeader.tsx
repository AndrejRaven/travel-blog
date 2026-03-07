"use client";

import { Plus, Share2, LogOut, Edit, FileText, TrendingUp, Home, Clock } from "lucide-react";
import Button from "@/components/ui/Button";
import Link from "@/components/ui/Link";
import type { TravelWalletData } from "@/lib/travel-wallet/types";
import { getBalancesWithBaseCurrency, getBalancesForCountry, calculateMainBudget } from "@/lib/travel-wallet/wallet-operations";
import { formatCurrency } from "@/lib/travel-wallet/formatters";
import { CURRENCY_SYMBOLS } from "@/lib/travel-wallet/constants";
import { calculateRemainingBudget, calculateTotalBudget, calculateUnplannedBudget, calculateTotalSpent, calculateTotalPlannedCountryBudgets } from "@/lib/travel-wallet/calculations";
import { getCurrencyName } from "@/lib/travel-wallet/currency-names";
import { getTripBySlug } from "@/lib/travel-wallet/trips-storage";

interface TravelWalletHeaderProps {
  userName?: string;
  availableBalance: number;
  totalBudget: number;
  slug: string;
  tripName?: string; // Nazwa podróży
  onAddExpense?: () => void;
  onEditTrip?: () => void;
  onShare?: () => void;
  onLogout?: () => void;
  data?: TravelWalletData;
  countryId?: string; // Optional country ID for single-country mode
  isOffline?: boolean;
}

export default function TravelWalletHeader({
  userName = "Sarah",
  availableBalance,
  totalBudget,
  slug,
  tripName,
  onAddExpense,
  onEditTrip,
  onShare,
  onLogout,
  data,
  countryId,
  isOffline = false,
}: TravelWalletHeaderProps) {
  // Get tripId from slug if available
  let tripId: string | undefined;
  try {
    const trip = getTripBySlug(slug);
    tripId = trip?.id;
  } catch (error) {
    console.warn("[TravelWalletHeader] Could not get tripId:", error);
  }

  // Calculate budgets
  // Use data.totalBudget if available, otherwise use calculated value or prop totalBudget
  const calculatedTotalBudget = data?.totalBudget ?? calculateTotalBudget(data || {} as TravelWalletData, tripId) ?? totalBudget;
  const plannedCountryBudgets = data ? calculateTotalPlannedCountryBudgets(data) : 0;
  const unplannedBudget = data ? calculateUnplannedBudget(data, tripId) : 0;
  const totalSpent = data ? calculateTotalSpent(data, tripId) : 0;
  const remainingBudget = data ? calculateRemainingBudget(data, tripId) : availableBalance;
  
  // Check if new wallet system is available
  const hasWallet = data?.wallet !== undefined;
  let balanceCurrencies: Array<{ currency: string; amount: number; isBase: boolean }> = [];
  let baseCurrency = "PLN";

  if (hasWallet && data.wallet) {
    baseCurrency = data.wallet.baseCurrency;
    
    // If countryId is provided, get balances for that country only
    // Otherwise, get all balances (multi-country mode)
    const balancesWithBase = countryId && tripId
      ? getBalancesForCountry(data.wallet, tripId, countryId)
      : getBalancesWithBaseCurrency(data.wallet, tripId);
    
    balanceCurrencies = balancesWithBase
      .filter(balance => balance.amount > 0.01) // Show only non-zero balances
      .map(balance => ({
        currency: balance.currency,
        amount: balance.amount,
        isBase: balance.currency === baseCurrency,
      }))
      .sort((a, b) => {
        // Base currency first, then others alphabetically
        if (a.isBase) return -1;
        if (b.isBase) return 1;
        return a.currency.localeCompare(b.currency);
      });
    
    // If no balances found, show at least base currency with remaining budget
    if (balanceCurrencies.length === 0) {
      balanceCurrencies = [{ currency: baseCurrency, amount: remainingBudget, isBase: true }];
    }
  } else {
    // Old system: show only PLN
    balanceCurrencies = [{ currency: "PLN", amount: remainingBudget, isBase: true }];
  }

  return (
    <div className="mb-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
        {/* Left side - Title and welcome */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {tripName || "Portfel podróżniczy"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Witaj ponownie, {userName}
          </p>
        </div>

        {/* Right side - Available balance and logout */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="text-right w-full md:w-auto">
            {/* Available funds – całość w jednym bloku */}
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
              Dostępne środki
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-3">
              <div className="flex justify-between gap-4 items-center">
                <span>Całkowity:</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {formatCurrency(remainingBudget, baseCurrency, 2)}
                </span>
              </div>
              {balanceCurrencies.map((balance) => (
                <div key={balance.currency} className="flex justify-between gap-4 items-center">
                  <span>{balance.currency === baseCurrency ? balance.currency : getCurrencyName(balance.currency)}:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatCurrency(balance.amount, balance.currency, 2)}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Budget breakdown section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                Budżet podróży
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div className="flex justify-between gap-4 items-center">
                  <span>Waluta główna:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    {baseCurrency} ({getCurrencyName(baseCurrency)})
                    {onEditTrip && (
                      <button
                        type="button"
                        onClick={onEditTrip}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Zmień
                      </button>
                    )}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Całkowity:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(calculatedTotalBudget, baseCurrency, 2)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Zaplanowane na kraje:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(plannedCountryBudgets, baseCurrency, 2)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className={unplannedBudget > 0.01 ? "text-amber-600 dark:text-amber-400" : ""}>Niezaplanowane:</span>
                  <span className={`font-medium ${unplannedBudget > 0.01 ? "text-amber-600 dark:text-amber-400" : "text-gray-700 dark:text-gray-300"}`}>
                    {formatCurrency(unplannedBudget, baseCurrency, 2)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Wydane:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(totalSpent, baseCurrency, 2)}</span>
                </div>
                <div className="flex justify-between gap-4 pt-1 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-semibold">Pozostały:</span>
                  <span className={`font-semibold ${remainingBudget >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ≈ {formatCurrency(remainingBudget, baseCurrency, 2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {onLogout && (
            <Button
              variant="outline"
              onClick={onLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Wyloguj
            </Button>
          )}
          {onShare && (
            <Button
              variant="outline"
              onClick={onShare}
              disabled={isOffline}
              title={isOffline ? "Dostępne po powrocie online" : undefined}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Udostępnij
            </Button>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 md:gap-4 items-stretch md:items-center">
        {onAddExpense && (
          <Button
            variant="primary"
            onClick={onAddExpense}
            className="flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 w-full md:w-auto"
          >
            <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
            <span className="hidden sm:inline">Dodaj wydatek</span>
            <span className="sm:hidden">Dodaj</span>
          </Button>
        )}
        {onEditTrip && (
          <Button
            variant="outline"
            onClick={onEditTrip}
            className="flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 w-full md:w-auto"
          >
            <Edit className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
            <span className="hidden sm:inline">Edytuj podróż</span>
            <span className="sm:hidden">Edytuj</span>
          </Button>
        )}
        <Link
          href={`/portfel-podrozniczy/${slug}/logi`}
          variant="default"
          className="inline-flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 w-full md:w-auto"
        >
          <FileText className="w-4 h-4 transition-transform duration-200 group-hover:rotate-3" />
          <span className="hidden sm:inline">Logi zmian</span>
          <span className="sm:hidden">Logi</span>
        </Link>
        <Link
          href={`/portfel-podrozniczy/${slug}/analityka`}
          variant="default"
          className="inline-flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 w-full md:w-auto"
        >
          <Home className="w-4 h-4 transition-transform duration-200 group-hover:rotate-3" />
          <span className="hidden sm:inline">Analityka</span>
          <span className="sm:hidden">Analityka</span>
        </Link>
        <Link
          href={`/portfel-podrozniczy/${slug}/kursy`}
          variant="default"
          className="inline-flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 w-full md:w-auto"
        >
          <TrendingUp className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
          <span className="hidden sm:inline">Kursy</span>
          <span className="sm:hidden">Kursy</span>
        </Link>
        <Link
          href={`/portfel-podrozniczy/${slug}/os-czasu`}
          variant="default"
          className="inline-flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 w-full md:w-auto"
        >
          <Clock className="w-4 h-4 transition-transform duration-200 group-hover:rotate-3" />
          <span className="hidden sm:inline">Oś czasu</span>
          <span className="sm:hidden">Oś czasu</span>
        </Link>
      </div>
    </div>
  );
}

