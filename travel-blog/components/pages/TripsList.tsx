"use client";

import { useRouter } from "next/navigation";
import { Trash2, Calendar, Globe, DollarSign, Clock, CheckCircle, TrendingUp, ChevronRight, Plus, Smartphone } from "lucide-react";
import type { Trip } from "@/lib/travel-wallet/types";
import Button from "@/components/ui/Button";

interface TripsListProps {
  trips: Trip[];
  tripStats: Map<string, { totalExpenses: number; budgetProgress: number }>;
  onDeleteRequest: (trip: Trip) => void;
  isGuest?: boolean;
  onAddFirstTrip?: () => void;
}

export default function TripsList({ trips, tripStats, onDeleteRequest, isGuest, onAddFirstTrip }: TripsListProps) {
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
    const showGuestCta = isGuest && onAddFirstTrip;
    return (
      <div className="text-center py-16">
        <div className="max-w-lg mx-auto">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
              <Globe className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Nie masz jeszcze żadnych podróży
          </h3>
          <p className="text-base text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {showGuestCta
              ? "Stwórz pierwszą podróż i zaplanuj budżet. Zarządzaj wydatkami, walutami i odkrywaj świat!"
              : "Rozpocznij planowanie swojej przygody, dodając pierwszą podróż. Zarządzaj budżetem, śledź wydatki i odkrywaj świat!"}
          </p>
          {showGuestCta ? (
            <Button
              variant="primary"
              onClick={onAddFirstTrip}
              className="inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Dodaj pierwszą podróż
            </Button>
          ) : (
            <div className="space-y-3 text-left max-w-sm mx-auto mb-8">
              <div className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span>Planuj budżet i śledź wydatki w czasie rzeczywistym</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span>Zarządzaj wieloma walutami i śledź kursy wymiany</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span>Analizuj statystyki wydatków i optymalizuj budżet</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {trips.map((trip, index) => {
        const status = getTripStatus(trip);
        const statusConfig = {
          upcoming: {
            label: "Nadchodząca",
            icon: Calendar,
            gradient: "from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900",
            borderColor: "border-gray-200 dark:border-gray-700",
            badgeColor: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
          },
          current: {
            label: "W trakcie",
            icon: Clock,
            gradient: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
            borderColor: "border-blue-200 dark:border-blue-800",
            badgeColor: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
          },
          completed: {
            label: "Zakończona",
            icon: CheckCircle,
            gradient: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
            borderColor: "border-green-200 dark:border-green-800",
            badgeColor: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
          },
        };
        const config = statusConfig[status];
        const Icon = config.icon;
        
        return (
          <div
            key={trip.id}
            className={`bg-gradient-to-br ${config.gradient} rounded-xl border ${config.borderColor} p-6 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group animate-fade-in-up`}
            onClick={() => handleTripClick(trip)}
            style={{ 
              animationDelay: `${index * 0.05}s`,
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${config.badgeColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-medium ${config.badgeColor.includes('text-gray') ? 'text-gray-700 dark:text-gray-300' : config.badgeColor.includes('text-blue') ? 'text-blue-700 dark:text-blue-300' : 'text-green-700 dark:text-green-300'}`}>
                    {config.label}
                  </span>
                  {(trip.syncStatus === "pending" || trip.syncStatus === "error" || (isGuest === true && !trip.lastSyncedAt)) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-medium" title="Tylko na tym urządzeniu – nie zsynchronizowano z chmurą">
                      <Smartphone className="w-3.5 h-3.5" />
                      Tylko na tym urządzeniu
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 truncate">
                  {trip.name}
                </h3>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRequest(trip);
                }}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                aria-label="Usuń podróż"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {status === "current" && trip.startDate && trip.endDate && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                  <span>Postęp podróży</span>
                  <span>{calculateTripProgress(trip).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-500"
                    style={{ width: `${calculateTripProgress(trip)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 mb-4">
              {(trip.startDate || trip.endDate) && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{formatDateRange(trip.startDate, trip.endDate)}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Globe className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  {trip.data.countries.length}{" "}
                  {trip.data.countries.length === 1 ? "kraj" : trip.data.countries.length < 5 ? "kraje" : "krajów"}
                </span>
              </div>

              {(() => {
                const stats = tripStats.get(trip.id);
                if (!stats) return null;
                
                return (
                  <>
                    {stats.totalExpenses > 0 && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <TrendingUp className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {new Intl.NumberFormat("pl-PL", {
                            maximumFractionDigits: 0,
                          }).format(stats.totalExpenses)}{" "}
                          zł wydano
                        </span>
                      </div>
                    )}
                    
                    {(trip.data.totalBudget || stats.budgetProgress > 0) && (
                      <div className="space-y-1.5 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Budżet</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.budgetProgress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              stats.budgetProgress > 90
                                ? "bg-red-500 dark:bg-red-400"
                                : stats.budgetProgress > 70
                                ? "bg-yellow-500 dark:bg-yellow-400"
                                : "bg-green-500 dark:bg-green-400"
                            }`}
                            style={{ width: `${Math.min(100, stats.budgetProgress)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTripClick(trip);
              }}
              className="w-full mt-4 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              aria-label="Otwórz podróż"
            >
              <span>Otwórz podróż</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

