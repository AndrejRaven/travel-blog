"use client";

import { Plus, Share2, LogOut, Edit, FileText, TrendingUp } from "lucide-react";
import Button from "@/components/ui/Button";
import Link from "@/components/ui/Link";
import type { TravelWalletData } from "@/lib/travel-wallet/types";
import { getBalancesWithBaseCurrency, calculateMainBudget } from "@/lib/travel-wallet/wallet-operations";
import { formatCurrency } from "@/lib/travel-wallet/formatters";
import { CURRENCY_SYMBOLS } from "@/lib/travel-wallet/constants";

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
}: TravelWalletHeaderProps) {
  // Check if new wallet system is available
  const hasWallet = data?.wallet !== undefined;
  let balanceCurrencies: Array<{ currency: string; amount: number; isBase: boolean }> = [];
  let remainingBudgetDisplay: string;
  let plannedBudgetDisplay: string;
  let baseCurrency = "PLN";

  // Get planned budget (original total budget)
  const plannedBudget = data?.totalBudget ?? totalBudget;

  if (hasWallet && data.wallet) {
    // New wallet system: show all currencies
    const balances = getBalancesWithBaseCurrency(data.wallet);
    console.log("[TravelWalletHeader] Wallet balances:", balances);
    console.log("[TravelWalletHeader] Wallet balances count:", balances.length);
    const nonZeroBalances = balances.filter((b) => b.amount > 0.01);
    console.log("[TravelWalletHeader] Non-zero balances:", nonZeroBalances);
    console.log("[TravelWalletHeader] Non-zero balances count:", nonZeroBalances.length);
    baseCurrency = data.wallet.baseCurrency;
    
    if (nonZeroBalances.length === 0) {
      balanceCurrencies = [{ currency: baseCurrency, amount: 0, isBase: true }];
      const currentBalance = calculateMainBudget(data.wallet);
      remainingBudgetDisplay = formatCurrency(currentBalance, baseCurrency);
    } else {
      // Separate base currency from others
      balanceCurrencies = nonZeroBalances.map((b) => ({
        currency: b.currency,
        amount: b.amount,
        isBase: b.currency === baseCurrency,
      }));
      
      // Remaining budget: current balances in base currency (sum of all currencies converted to base)
      const currentBalance = calculateMainBudget(data.wallet);
      remainingBudgetDisplay = formatCurrency(currentBalance, baseCurrency);
    }
    plannedBudgetDisplay = formatCurrency(plannedBudget, baseCurrency);
  } else {
    // Old system: show only PLN
    const formattedBalance = new Intl.NumberFormat("pl-PL", {
      maximumFractionDigits: 0,
    }).format(availableBalance);
    
    const formattedRemainingBudget = new Intl.NumberFormat("pl-PL", {
      maximumFractionDigits: 0,
    }).format(totalBudget);
    
    const formattedPlannedBudget = new Intl.NumberFormat("pl-PL", {
      maximumFractionDigits: 0,
    }).format(plannedBudget);
    
    balanceCurrencies = [{ currency: "PLN", amount: availableBalance, isBase: true }];
    remainingBudgetDisplay = `${formattedRemainingBudget} zł`;
    plannedBudgetDisplay = `${formattedPlannedBudget} zł`;
  }

  return (
    <div className="mb-8">
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
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
              Dostępny budżet
            </p>
            <div className="flex flex-col items-end gap-1">
              {balanceCurrencies.map((balance, index) => (
                <p
                  key={balance.currency}
                  className={
                    balance.isBase
                      ? "text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100"
                      : "text-lg md:text-xl font-semibold text-gray-700 dark:text-gray-300"
                  }
                >
                  {formatCurrency(balance.amount, balance.currency)}
                </p>
              ))}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-0.5">
              <p>Zaplanowany budżet: {plannedBudgetDisplay}</p>
              <p>Pozostały: ≈ {remainingBudgetDisplay}</p>
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
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Udostępnij
            </Button>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-4 items-center">
        {onAddExpense && (
          <Button
            variant="primary"
            onClick={onAddExpense}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Dodaj wydatek
          </Button>
        )}
        {onEditTrip && (
          <Button
            variant="outline"
            onClick={onEditTrip}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edytuj podróż
          </Button>
        )}
        <Link
          href={`/portfel-podrozniczy/${slug}/logi`}
          variant="outline"
          className="inline-flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Logi zmian
        </Link>
        <Link
          href={`/portfel-podrozniczy/${slug}/kursy`}
          variant="outline"
          className="inline-flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          Kursy walut
        </Link>
      </div>
    </div>
  );
}

