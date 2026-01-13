"use client";

import { Plus, Share2, LogOut, Edit, Layout } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  getEffectiveDashboardMode,
} from "@/lib/travel-wallet/dashboard-mode";
import type { TravelWalletData } from "@/lib/travel-wallet/types";

interface TravelWalletHeaderProps {
  userName?: string;
  availableBalance: number;
  totalBudget: number;
  slug: string;
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
  onAddExpense,
  onEditTrip,
  onShare,
  onLogout,
  data,
}: TravelWalletHeaderProps) {
  const formattedBalance = new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 0,
  }).format(availableBalance);
  
  const formattedTotalBudget = new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 0,
  }).format(totalBudget);

  // Określ aktualny tryb dashboardu
  const currentMode = data ? getEffectiveDashboardMode(data) : "multi-country";
  const modeLabels: Record<string, string> = {
    "multi-country": "Wiele krajów",
    "single-country": "Jeden kraj",
    "single-location": "Jedna lokalizacja",
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
        {/* Left side - Title and welcome */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Portfel podróżniczy
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Witaj ponownie, {userName}
          </p>
        </div>

        {/* Right side - Available balance and logout */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
              Dostępny budżet
            </p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {formattedBalance}/{formattedTotalBudget} zł
            </p>
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
        {data && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-300">
            <Layout className="w-4 h-4" />
            <span>Tryb: {modeLabels[currentMode] || currentMode}</span>
          </div>
        )}
      </div>
    </div>
  );
}

