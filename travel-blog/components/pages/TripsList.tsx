"use client";

import { useRouter } from "next/navigation";
import { Trash2, Calendar, Globe, DollarSign, Clock, CheckCircle } from "lucide-react";
import type { Trip } from "@/lib/travel-wallet/types";

interface TripsListProps {
  trips: Trip[];
  onDeleteRequest: (trip: Trip) => void;
}

export default function TripsList({ trips, onDeleteRequest }: TripsListProps) {
  const router = useRouter();

  const getTripStatus = (trip: Trip): "upcoming" | "current" | "completed" => {
    const now = new Date();
    const start = trip.startDate ? new Date(trip.startDate) : null;
    const end = trip.endDate ? new Date(trip.endDate) : null;

    if (end && end < now) return "completed";
    if (start && start <= now && (!end || end >= now)) return "current";
    return "upcoming";
  };

  const calculateTripProgress = (trip: Trip): number => {
    if (!trip.startDate || !trip.endDate) return 0;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const now = new Date();
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate && !endDate) return "—";
    
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    const start = startDate ? formatDate(startDate) : null;
    const end = endDate ? formatDate(endDate) : null;

    if (!start && !end) return "—";
    if (start && !end) return `od ${start}`;
    if (!start && end) return `do ${end}`;
    return `${start} - ${end}`;
  };

  const handleTripClick = (trip: Trip) => {
    router.push(`/portfel-podrozniczy/${trip.slug}`);
  };

  if (trips.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <Globe className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-2 font-medium">
            Nie masz jeszcze żadnych podróży
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Kliknij "Dodaj podróż", aby rozpocząć planowanie swojej przygody.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trips.map((trip) => (
        <div
          key={trip.id}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all cursor-pointer group"
          onClick={() => handleTripClick(trip)}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-2">
              {(() => {
                const status = getTripStatus(trip);
                const statusConfig = {
                  upcoming: {
                    label: "Nadchodząca",
                    icon: Calendar,
                    className: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
                  },
                  current: {
                    label: "W trakcie",
                    icon: Clock,
                    className: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                  },
                  completed: {
                    label: "Zakończona",
                    icon: CheckCircle,
                    className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
                  },
                };
                const config = statusConfig[status];
                const Icon = config.icon;
                return (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-2 ${config.className}`}
                    aria-label={`Status: ${config.label}`}
                  >
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                );
              })()}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {trip.name}
              </h3>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRequest(trip);
              }}
              className="ml-2 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Usuń podróż"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {getTripStatus(trip) === "current" && trip.startDate && trip.endDate && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${calculateTripProgress(trip)}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-3">
            {(trip.startDate || trip.endDate) && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{formatDateRange(trip.startDate, trip.endDate)}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Globe className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">
                {trip.data.countries.length}{" "}
                {trip.data.countries.length === 1 ? "kraj" : trip.data.countries.length < 5 ? "kraje" : "krajów"}
              </span>
            </div>

            {trip.data.totalBudget && (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500">
                <DollarSign className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  {new Intl.NumberFormat("pl-PL", {
                    maximumFractionDigits: 0,
                  }).format(trip.data.totalBudget)}{" "}
                  zł
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

