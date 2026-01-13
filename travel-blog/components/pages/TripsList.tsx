"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import type { Trip } from "@/lib/travel-wallet/types";

interface TripsListProps {
  trips: Trip[];
  onDeleteRequest: (trip: Trip) => void;
}

export default function TripsList({ trips, onDeleteRequest }: TripsListProps) {
  const router = useRouter();

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleTripClick = (trip: Trip) => {
    router.push(`/portfel-podrozniczy/${trip.slug}`);
  };

  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Nie masz jeszcze żadnych podróży.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Kliknij "Dodaj podróż", aby rozpocząć.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trips.map((trip) => (
        <div
          key={trip.id}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => handleTripClick(trip)}
        >
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex-1">
              {trip.name}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRequest(trip);
              }}
              className="ml-2 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              aria-label="Usuń podróż"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center justify-between">
              <span>Data rozpoczęcia:</span>
              <span className="font-medium">{formatDate(trip.startDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Data zakończenia:</span>
              <span className="font-medium">{formatDate(trip.endDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Liczba krajów:</span>
              <span className="font-medium">{trip.data.countries.length}</span>
            </div>
            {trip.data.totalBudget && (
              <div className="flex items-center justify-between">
                <span>Budżet:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("pl-PL", {
                    maximumFractionDigits: 0,
                  }).format(trip.data.totalBudget)}{" "}
                  zł
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleTripClick(trip);
              }}
              variant="primary"
              className="w-full"
            >
              Otwórz podróż
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

