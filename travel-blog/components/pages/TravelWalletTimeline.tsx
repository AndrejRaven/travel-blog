"use client";

import { useMemo } from "react";
import Link from "@/components/ui/Link";
import CountryActionsMenu from "./CountryActionsMenu";
import type { TravelWalletData, Country } from "@/lib/travel-wallet/types";
import { calculateActualSpending } from "@/lib/travel-wallet/calculations";

interface TravelWalletTimelineProps {
  data: TravelWalletData;
  slug: string;
  tripStartDate?: string;
  tripEndDate?: string;
  onEditCountry?: (country: Country) => void;
  onAddBudget?: (country: Country) => void;
  onReduceBudget?: (country: Country) => void;
  onDeleteCountry?: (country: Country) => void;
  onAddCountry?: (startDate?: string, endDate?: string) => void;
}

export default function TravelWalletTimeline({
  data,
  slug,
  tripStartDate,
  tripEndDate,
  onEditCountry,
  onAddBudget,
  onReduceBudget,
  onDeleteCountry,
  onAddCountry,
}: TravelWalletTimelineProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
    });
  };

  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return "—";
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    if (start === "—" || end === "—") return "—";
    return `${start} - ${end}.`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pl-PL", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Funkcja pomocnicza do formatowania daty na YYYY-MM-DD
  function formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Oblicz daty bez krajów (niezaplanowane daty)
  const unassignedDateRanges = useMemo(() => {
    if (!tripStartDate || !tripEndDate) return [];
    
    const tripStart = new Date(tripStartDate);
    const tripEnd = new Date(tripEndDate);
    
    // Zbierz wszystkie zakresy dat krajów (tylko te z datami)
    const countryRanges: Array<{ start: Date; end: Date }> = [];
    
    data.countries.forEach((country) => {
      if (country.startDate && country.endDate) {
        countryRanges.push({
          start: new Date(country.startDate),
          end: new Date(country.endDate),
        });
      }
    });
    
    // Sortuj zakresy według daty rozpoczęcia
    countryRanges.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Znajdź przerwy między zakresami
    const unassignedRanges: Array<{ startDate: string; endDate: string }> = [];
    
    let currentDate = new Date(tripStart);
    
    for (const range of countryRanges) {
      // Jeśli jest przerwa przed tym zakresem
      if (currentDate < range.start) {
        // Odejmij 1 dzień od start, bo chcemy datę przed zakresem kraju
        const gapEnd = new Date(range.start);
        gapEnd.setDate(gapEnd.getDate() - 1);
        
        if (currentDate <= gapEnd) {
          unassignedRanges.push({
            startDate: formatDateToYYYYMMDD(currentDate),
            endDate: formatDateToYYYYMMDD(gapEnd),
          });
        }
      }
      
      // Przesuń currentDate na koniec tego zakresu + 1 dzień
      currentDate = new Date(range.end);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Jeśli jest przerwa po ostatnim zakresie
    if (currentDate <= tripEnd) {
      unassignedRanges.push({
        startDate: formatDateToYYYYMMDD(currentDate),
        endDate: formatDateToYYYYMMDD(tripEnd),
      });
    }
    
    return unassignedRanges;
  }, [tripStartDate, tripEndDate, data.countries]);

  // Funkcja formatująca zakres dat dla niezaplanowanych dat
  const formatCountryDateRange = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "";
    
    const startFormatted = start.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
    });
    
    const endFormatted = end.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
    });
    
    return `${startFormatted} - ${endFormatted}`;
  };

  // Sortuj kraje według daty rozpoczęcia
  const sortedCountries = [...data.countries].sort((a, b) => {
    if (!a.startDate || !b.startDate) return 0;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  // Połącz kraje i niezaplanowane daty w jedną listę, sortując po dacie rozpoczęcia
  const timelineItems = useMemo(() => {
    const items: Array<{ type: "country" | "unassigned"; country?: Country; startDate: string; endDate: string }> = [];
    
    // Dodaj kraje
    sortedCountries.forEach((country) => {
      if (country.startDate && country.endDate) {
        items.push({
          type: "country",
          country,
          startDate: country.startDate,
          endDate: country.endDate,
        });
      }
    });
    
    // Dodaj niezaplanowane daty
    unassignedDateRanges.forEach((range) => {
      items.push({
        type: "unassigned",
        startDate: range.startDate,
        endDate: range.endDate,
      });
    });
    
    // Sortuj wszystkie elementy po dacie rozpoczęcia
    return items.sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [sortedCountries, unassignedDateRanges]);

  return (
    <div className="mb-8">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
        Harmonogram podróży
      </h2>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />

        <div className="space-y-8">
          {timelineItems.map((item, index) => {
            if (item.type === "unassigned") {
              // Niezaplanowane daty
              return (
                <div key={`unassigned-${index}`} className="relative pl-16">
                  {/* Marker - przerywana linia dla niezaplanowanych dat */}
                  <div className="absolute left-0 top-1">
                    <div className="w-3 h-3 rounded-full border-2 border-dashed border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 transform translate-x-[4.5px]" />
                  </div>

                  {/* Content */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded border border-amber-300 dark:border-amber-700">
                          —
                        </span>
                        <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                          Brak kraju
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          {formatCountryDateRange(item.startDate, item.endDate)}
                        </p>
                        {onAddCountry && (
                          <button
                            type="button"
                            onClick={() => onAddCountry(item.startDate, item.endDate)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                          >
                            Dodaj kraj
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Kraj
            const country = item.country!;
            const actualSpending = calculateActualSpending(country);
            const isCurrent = country.status === "current";
            const isVisited = country.status === "visited";
            const isUpcoming = country.status === "upcoming";

            // Marker based on status
            let marker;
            if (isCurrent) {
              // Triangle for current
              marker = (
                <div className="absolute left-0 top-0 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-gray-900 dark:border-b-gray-100 transform translate-x-[3px]" />
              );
            } else if (isVisited) {
              // Solid circle for visited
              marker = (
                <div className="absolute left-0 top-0 w-3 h-3 rounded-full bg-gray-900 dark:bg-gray-100 transform translate-x-[4.5px]" />
              );
            } else {
              // Hollow circle for upcoming
              marker = (
                <div className="absolute left-0 top-0 w-3 h-3 rounded-full border-2 border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 transform translate-x-[4.5px]" />
              );
            }

            return (
              <div key={country.id} className="relative pl-16">
                {/* Marker */}
                <div className="absolute left-0 top-1">{marker}</div>

                {/* Content */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        {country.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                      <Link
                            href={`/portfel-podrozniczy/${slug}/kraje/${country.slug}`}
                        variant="default"
                        className="text-lg font-bold text-gray-900 dark:text-gray-100 hover:underline"
                      >
                        {country.name}
                      </Link>
                      <CountryActionsMenu
                        country={country}
                        slug={slug}
                        onEdit={onEditCountry}
                        onAddBudget={onAddBudget}
                        onReduceBudget={onReduceBudget}
                        onDelete={onDeleteCountry}
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {formatDateRange(country.startDate, country.endDate)}
                    </p>
                    {isCurrent && (
                      <div className="inline-block px-2 py-1 text-xs font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded mb-2">
                        OBECNIE
                      </div>
                    )}
                  </div>
                  {isVisited && actualSpending > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        Wydano
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(actualSpending)} zł
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

