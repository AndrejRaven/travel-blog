"use client";

import TravelWalletHeader from "./TravelWalletHeader";
import TravelWalletStats from "./TravelWalletStats";
import TravelWalletProgress from "./TravelWalletProgress";
import TravelWalletChartsSection from "./TravelWalletChartsSection";
import TravelWalletTables from "./TravelWalletTables";
import TravelWalletTimeline from "./TravelWalletTimeline";
import SingleCountryDashboard from "./SingleCountryDashboard";
import type { TravelWalletData } from "@/lib/travel-wallet/types";
import {
  calculateRemainingBudget,
  calculateTotalBudget,
} from "@/lib/travel-wallet/calculations";
import {
  getEffectiveDashboardMode,
} from "@/lib/travel-wallet/dashboard-mode";
import type { Country, Expense } from "@/lib/travel-wallet/types";

interface TravelWalletDashboardProps {
  data: TravelWalletData;
  slug: string;
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
}

export default function TravelWalletDashboard({
  data,
  slug,
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
}: TravelWalletDashboardProps) {
  const availableBalance = calculateRemainingBudget(data);
  const totalBudget = calculateTotalBudget(data);
  
  // Określ efektywny tryb dashboardu
  const effectiveMode = getEffectiveDashboardMode(data);
  
  // Jeśli tryb to single-country lub single-location, użyj SingleCountryDashboard
  const isSingleMode = effectiveMode === "single-country" || effectiveMode === "single-location";
  
  if (isSingleMode) {
    return (
      <SingleCountryDashboard
        data={data}
        slug={slug}
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
        onAddExpense={onAddExpense}
        onEditTrip={onEditTrip}
        data={data}
      />
      <TravelWalletStats 
        data={data} 
        tripStartDate={tripStartDate}
        tripEndDate={tripEndDate}
      />
      <TravelWalletProgress data={data} />
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

// Wydzielony komponent dla trybu multi-country, aby hooki były zawsze wywoływane w tej samej kolejności
function MultiCountryDashboardContent({
  data,
  slug,
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
        onAddExpense={onAddExpense}
        onEditTrip={onEditTrip}
        data={data}
      />
      <TravelWalletStats 
        data={data} 
        tripStartDate={tripStartDate}
        tripEndDate={tripEndDate}
      />
      <TravelWalletProgress data={data} />
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

