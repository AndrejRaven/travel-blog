"use client";

import { DollarSign, Wallet, MapPin, Calendar, TrendingUp, Clock } from "lucide-react";
import TravelWalletStatCard from "./TravelWalletStatCard";
import type { TravelWalletData } from "@/lib/travel-wallet/types";
import {
  calculateTotalSpent,
  calculateRemainingBudget,
  calculateCountriesVisited,
  calculateTotalCountries,
  calculateTravelDays,
  calculateAverageDailySpend,
  calculateDaysInTravel,
  calculateDaysRemaining,
  calculateDaysUntilStart,
  calculateTotalTripDays,
} from "@/lib/travel-wallet/calculations";

interface TravelWalletStatsProps {
  data: TravelWalletData;
  tripStartDate?: string;
  tripEndDate?: string;
}

export default function TravelWalletStats({ 
  data, 
  tripStartDate, 
  tripEndDate 
}: TravelWalletStatsProps) {
  const totalSpent = calculateTotalSpent(data);
  const remaining = calculateRemainingBudget(data);
  const countriesVisited = calculateCountriesVisited(data);
  const totalCountries = calculateTotalCountries(data);
  const travelDays = calculateTravelDays(data);
  const avgDailySpend = calculateAverageDailySpend(data);
  
  // Oblicz dni na podstawie dat podróży
  const totalTripDays = calculateTotalTripDays(tripStartDate, tripEndDate);
  let daysInTravel = calculateDaysInTravel(tripStartDate, tripEndDate);
  const daysRemaining = calculateDaysRemaining(tripEndDate);
  const daysUntilStart = calculateDaysUntilStart(tripStartDate);
  
  // Sprawdź czy podróż już się odbyła
  const isTripCompleted = tripEndDate ? new Date(tripEndDate) < new Date() : false;
  
  // Sprawdź czy podróż już się zaczęła
  const isTripStarted = tripStartDate ? new Date(tripStartDate) <= new Date() : true;
  
  // Upewnij się, że daysInTravel nie przekracza totalTripDays
  if (totalTripDays > 0 && daysInTravel > totalTripDays) {
    daysInTravel = totalTripDays;
  }
  
  // Format dla dni podróży: "dni w podróży/pozostało = 84/101"
  const travelDaysDisplay = tripStartDate && tripEndDate && totalTripDays > 0
    ? `${daysInTravel}/${totalTripDays}`
    : travelDays.toString();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pl-PL", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
      <TravelWalletStatCard
        label="Łącznie wydano"
        value={`${formatCurrency(totalSpent)} zł`}
        icon={DollarSign}
      />
      <TravelWalletStatCard
        label="Pozostały budżet"
        value={`${formatCurrency(remaining)} zł`}
        icon={Wallet}
      />
      <TravelWalletStatCard
        label="Odwiedzone kraje"
        value={`${countriesVisited}/${totalCountries}`}
        icon={MapPin}
      />
      <TravelWalletStatCard
        label="Wszystkie dni podróży"
        value={travelDaysDisplay}
        icon={Calendar}
      />
      <TravelWalletStatCard
        label="Średnie dzienne wydatki"
        value={`${formatCurrency(avgDailySpend)} zł`}
        icon={TrendingUp}
      />
      <TravelWalletStatCard
        label={
          !isTripStarted 
            ? "Zostało do początku podróży"
            : "Zostało do końca podróży"
        }
        value={
          !isTripStarted
            ? tripStartDate
              ? `${daysUntilStart} dni`
              : "—"
            : tripEndDate 
              ? isTripCompleted 
                ? "Podróż zakończona" 
                : `${daysRemaining} dni`
              : "—"
        }
        icon={Clock}
      />
    </div>
  );
}

