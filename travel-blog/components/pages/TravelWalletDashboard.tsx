"use client";

import { useMemo, useState } from "react";
import TravelWalletHeader from "./TravelWalletHeader";
import TravelWalletStats from "./TravelWalletStats";
import TravelWalletProgress from "./TravelWalletProgress";
import TravelWalletChartsSection from "./TravelWalletChartsSection";
import TravelWalletTables from "./TravelWalletTables";
import TravelWalletTimeline from "./TravelWalletTimeline";
import SingleCountryDashboard from "./SingleCountryDashboard";
import CurrencyBalancesCard from "./CurrencyBalancesCard";
import CurrencyTransactionsHistory from "./CurrencyTransactionsHistory";
import TransactionDetailsModal from "./TransactionDetailsModal";
import CountryExpensesSection from "./CountryExpensesSection";
import type { TravelWalletData, Trip, CurrencyTransaction } from "@/lib/travel-wallet/types";
import {
  calculateRemainingBudget,
  calculateTotalBudget,
  calculateTotalTripDays,
} from "@/lib/travel-wallet/calculations";
import {
  getEffectiveDashboardMode,
} from "@/lib/travel-wallet/dashboard-mode";
import { getCurrencyTransactions } from "@/lib/travel-wallet/currency-transactions";
import { getAllExpenses } from "@/lib/travel-wallet/expenses";
import type { Country, Expense } from "@/lib/travel-wallet/types";

interface TravelWalletDashboardProps {
  data: TravelWalletData;
  slug: string;
  tripId?: string;
  tripName?: string;
  tripStartDate?: string;
  tripEndDate?: string;
  expandedCountries?: Set<string>;
  onToggleCountry?: (countryId: string) => void;
  onAddCountry?: (startDate?: string, endDate?: string) => void;
  onEditCountry?: (country: Country) => void;
  onDeleteCountry?: (country: Country) => void;
  onAddBudget?: (country: Country) => void;
  onReduceBudget?: (country: Country) => void;
  onAddExpense?: () => void;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expense: Expense) => void;
  onAddLocation?: () => void;
  onEditLocation?: (location: string) => void;
  onDeleteLocation?: (location: string) => void;
  onEditTrip?: () => void;
  onAddCurrencyTransaction?: () => void;
  onDeleteCurrencyTransaction?: (transactionId: string) => void;
  onEditCurrencyTransaction?: (transaction: CurrencyTransaction) => void;
}

export default function TravelWalletDashboard({
  data,
  slug,
  tripId,
  tripName,
  tripStartDate,
  tripEndDate,
  onAddCountry,
  onEditCountry,
  onDeleteCountry,
  onAddBudget,
  onReduceBudget,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
  onEditTrip,
  onAddCurrencyTransaction,
  onDeleteCurrencyTransaction,
  onEditCurrencyTransaction,
}: TravelWalletDashboardProps) {
  const availableBalance = calculateRemainingBudget(data, tripId);
  const totalBudget = calculateTotalBudget(data, tripId);
  
  // Określ efektywny tryb dashboardu
  const effectiveMode = getEffectiveDashboardMode(data);

  // Pobierz transakcje walutowe (jeśli tripId dostępne)
  const transactions = useMemo(() => {
    if (!tripId) {
      return [];
    }
    return getCurrencyTransactions(tripId);
  }, [tripId, data]);

  // Pobierz wszystkie wydatki dla podróży (wszystkie kraje)
  const allExpenses = useMemo(() => {
    if (!tripId) {
      return [];
    }
    return getAllExpenses(tripId);
  }, [tripId, data]);

  // Stwórz "wirtualny kraj" dla wszystkich wydatków (dla CountryExpensesSection)
  const allCountriesCountry: Country = useMemo(() => ({
    id: "all-countries",
    slug: "all-countries",
    name: "Wszystkie kraje",
    days: calculateTotalTripDays(tripStartDate, tripEndDate),
    startDate: tripStartDate,
    endDate: tripEndDate,
    budgets: [],
    status: "current" as const,
    locations: [],
  }), [tripStartDate, tripEndDate]);

  // Stan modala ze szczegółami transakcji
  const [selectedTransaction, setSelectedTransaction] = useState<CurrencyTransaction | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleTransactionClick = (transaction: CurrencyTransaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsModalOpen(true);
  };
  
  // Jeśli tryb to single-country lub single-location, użyj SingleCountryDashboard
  const isSingleMode = effectiveMode === "single-country" || effectiveMode === "single-location";
  
  if (isSingleMode) {
    return (
      <SingleCountryDashboard
        data={data}
        slug={slug}
        tripId={tripId}
        tripName={tripName}
        tripStartDate={tripStartDate}
        tripEndDate={tripEndDate}
        onAddExpense={onAddExpense}
        onEditExpense={onEditExpense}
        onDeleteExpense={onDeleteExpense}
        onAddLocation={onAddLocation}
        onEditLocation={onEditLocation}
        onDeleteLocation={onDeleteLocation}
        onAddCountry={onAddCountry}
        onEditTrip={onEditTrip}
        onEditCountry={onEditCountry}
        onAddCurrencyTransaction={onAddCurrencyTransaction}
        onDeleteCurrencyTransaction={onDeleteCurrencyTransaction}
        onEditCurrencyTransaction={onEditCurrencyTransaction}
      />
    );
  }

  // Domyślny tryb multi-country
  return (
    <div className="space-y-8">
      <TravelWalletHeader
        userName={data.userName}
        availableBalance={availableBalance}
        totalBudget={totalBudget}
        slug={slug}
        tripName={tripName}
        onAddExpense={onAddExpense}
        onEditTrip={onEditTrip}
        data={data}
      />
      <TravelWalletStats 
        data={data}
        tripId={tripId}
        tripStartDate={tripStartDate}
        tripEndDate={tripEndDate}
        slug={slug}
      />

      {/* Currency Transactions Section - zawsze pokazywać */}
      {tripId && (
        <CurrencyBalancesCard
          transactions={transactions}
          onAddTransaction={onAddCurrencyTransaction}
          onTransactionClick={handleTransactionClick}
        />
      )}

      {/* Kalendarz wydatków */}
      {tripId && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <CountryExpensesSection
            country={allCountriesCountry}
            expenses={allExpenses}
            onAddExpense={onAddExpense}
            onEditExpense={onEditExpense}
            onDeleteExpense={onDeleteExpense}
          />
        </div>
      )}

      <TravelWalletProgress data={data} tripId={tripId} />
      <TravelWalletChartsSection data={data} />
      <TravelWalletTables
        data={data}
        slug={slug}
        onEditCountry={onEditCountry}
        onAddBudget={onAddBudget}
        onReduceBudget={onReduceBudget}
        onDeleteCountry={onDeleteCountry}
        onAddCountry={onAddCountry}
      />
      <TravelWalletTimeline
        data={data}
        slug={slug}
        tripStartDate={tripStartDate}
        tripEndDate={tripEndDate}
        onEditCountry={onEditCountry}
        onAddBudget={onAddBudget}
        onReduceBudget={onReduceBudget}
        onDeleteCountry={onDeleteCountry}
        onAddCountry={onAddCountry}
      />

      {/* Currency Transactions History - zawsze pokazywać */}
      {tripId && (
        <CurrencyTransactionsHistory
          transactions={transactions}
          onDelete={onDeleteCurrencyTransaction}
          onEdit={onEditCurrencyTransaction}
          onTransactionClick={handleTransactionClick}
        />
      )}

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
      />
    </div>
  );
}

// Wydzielony komponent dla trybu multi-country, aby hooki były zawsze wywoływane w tej samej kolejności
function MultiCountryDashboardContent({
  data,
  slug,
  tripName,
  tripStartDate,
  tripEndDate,
  availableBalance,
  totalBudget,
  onAddCountry,
  onEditCountry,
  onDeleteCountry,
  onAddBudget,
  onReduceBudget,
  onAddExpense,
  onEditTrip,
}: {
  data: TravelWalletData;
  slug: string;
  tripName?: string;
  tripStartDate?: string;
  tripEndDate?: string;
  availableBalance: number;
  totalBudget: number;
  onAddCountry?: (startDate?: string, endDate?: string) => void;
  onEditCountry?: (country: Country) => void;
  onDeleteCountry?: (country: Country) => void;
  onAddBudget?: (country: Country) => void;
  onReduceBudget?: (country: Country) => void;
  onAddExpense?: () => void;
  onEditTrip?: () => void;
}) {
  return (
    <div className="space-y-8">
      <TravelWalletHeader
        userName={data.userName}
        availableBalance={availableBalance}
        totalBudget={totalBudget}
        slug={slug}
        tripName={tripName}
        onAddExpense={onAddExpense}
        onEditTrip={onEditTrip}
        data={data}
      />
      <TravelWalletStats 
        data={data}
        tripId={tripId}
        tripStartDate={tripStartDate}
        tripEndDate={tripEndDate}
        slug={slug}
      />
      <TravelWalletProgress data={data} tripId={tripId} />
      <TravelWalletChartsSection data={data} />
      <TravelWalletTables
        data={data}
        slug={slug}
        onEditCountry={onEditCountry}
        onAddBudget={onAddBudget}
        onReduceBudget={onReduceBudget}
        onDeleteCountry={onDeleteCountry}
        onAddCountry={onAddCountry}
      />
      <TravelWalletTimeline
        data={data}
        slug={slug}
        tripStartDate={tripStartDate}
        tripEndDate={tripEndDate}
        onEditCountry={onEditCountry}
        onAddBudget={onAddBudget}
        onReduceBudget={onReduceBudget}
        onDeleteCountry={onDeleteCountry}
        onAddCountry={onAddCountry}
      />
    </div>
  );
}

