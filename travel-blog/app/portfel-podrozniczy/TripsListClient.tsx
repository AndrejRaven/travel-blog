"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import Button from "@/components/ui/Button";
import TripsList from "@/components/pages/TripsList";
import AddTripModal from "@/components/pages/AddTripModal";
import AddCountryModal from "@/components/pages/AddCountryModal";
import AddMultipleCountriesModal from "@/components/pages/AddMultipleCountriesModal";
import DeleteTripModal from "@/components/pages/DeleteTripModal";
import { getAllTrips, deleteTrip, createTrip, getTripBySlug, updateTrip } from "@/lib/travel-wallet/trips-storage";
import { addCountry } from "@/lib/travel-wallet/countries-storage";
import type { Trip } from "@/lib/travel-wallet/types";

export default function TripsListClient() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddCountryModalOpen, setIsAddCountryModalOpen] = useState(false);
  const [isAddMultipleCountriesModalOpen, setIsAddMultipleCountriesModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newTripSlug, setNewTripSlug] = useState<string | null>(null);

  const loadTrips = () => {
    const allTrips = getAllTrips();
    setTrips(allTrips);
    setIsLoading(false);
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const handleDeleteRequest = (trip: Trip) => {
    setTripToDelete(trip);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tripToDelete) return;

    setIsDeleting(true);
    try {
      if (deleteTrip(tripToDelete.id)) {
        loadTrips();
        setIsDeleteModalOpen(false);
        setTripToDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false);
      setTripToDelete(null);
    }
  };

  const handleCreateTrip = (tripData: {
    name: string;
    startDate?: string;
    endDate?: string;
    totalBudget?: number;
    userName?: string;
    dashboardMode?: "multi-country" | "single-country" | "single-location" | "auto";
  }) => {
    const newTrip = createTrip({
      name: tripData.name,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      data: {
        countries: [],
        totalBudget: tripData.totalBudget,
        userName: tripData.userName,
        dashboardMode: tripData.dashboardMode || "multi-country",
      },
    });
    loadTrips();
    setIsAddModalOpen(false);
    // Ustaw slug nowej podróży i otwórz odpowiedni modal
    // Jeśli tryb to single-country lub single-location, użyj pojedynczego modala
    // W przeciwnym razie użyj modala do dodawania wielu krajów
    setNewTripSlug(newTrip.slug);
    const dashboardMode = tripData.dashboardMode || "multi-country";
    if (dashboardMode === "single-country" || dashboardMode === "single-location") {
      setIsAddCountryModalOpen(true);
    } else {
      setIsAddMultipleCountriesModalOpen(true);
    }
  };

  const handleSaveCountry = (countryData: {
    name: string;
    location?: string;
    days: number;
    startDate?: string;
    endDate?: string;
    status: "visited" | "current" | "upcoming";
    budgets: { currency: string; amount: number }[];
    locations?: Array<{ name: string; startDate: string; endDate: string }>;
  }) => {
    if (!newTripSlug) return;
    
    const trip = getTripBySlug(newTripSlug);
    if (!trip) return;

    if (addCountry(trip.id, {
      ...countryData,
      location: countryData.location || "",
    })) {
      setIsAddCountryModalOpen(false);
      setNewTripSlug(null);
      // Przekieruj do nowej podróży
      router.push(`/portfel-podrozniczy/${newTripSlug}`);
    }
  };

  const handleSaveMultipleCountries = (countriesData: Array<{
    name: string;
    location?: string;
    days: number;
    startDate?: string;
    endDate?: string;
    status: "visited" | "current" | "upcoming";
    budgets: { currency: string; amount: number }[];
    locations?: Array<{ name: string; startDate: string; endDate: string }>;
  }>) => {
    if (!newTripSlug) return;
    
    const trip = getTripBySlug(newTripSlug);
    if (!trip) return;

    // Dodaj wszystkie kraje
    let allSuccess = true;
    countriesData.forEach((countryData) => {
      if (!addCountry(trip.id, {
        ...countryData,
        location: countryData.location || "",
      })) {
        allSuccess = false;
      }
    });

    if (allSuccess) {
      setIsAddMultipleCountriesModalOpen(false);
      setNewTripSlug(null);
      // Przekieruj do nowej podróży
      router.push(`/portfel-podrozniczy/${newTripSlug}`);
    }
  };

  const handleSwitchToSingleCountry = (countryData?: {
    name: string;
    location?: string;
    days: number;
    startDate?: string;
    endDate?: string;
    status: "visited" | "current" | "upcoming";
    budgets: { currency: string; amount: number }[];
    locations?: Array<{ name: string; startDate: string; endDate: string }>;
  }) => {
    if (!newTripSlug) return;
    
    const trip = getTripBySlug(newTripSlug);
    if (!trip) return;

    // Zmień tryb podróży na single-country
    const updatedData = {
      ...trip.data,
      dashboardMode: "single-country" as const,
    };

    if (updateTrip(trip.id, { data: updatedData })) {
      // Jeśli przekazano dane kraju, zapisz go
      if (countryData) {
        if (addCountry(trip.id, {
          ...countryData,
          location: countryData.location || "",
        })) {
          // Zamknij modal wielu krajów
          setIsAddMultipleCountriesModalOpen(false);
          setNewTripSlug(null);
          // Przekieruj do nowej podróży
          router.push(`/portfel-podrozniczy/${newTripSlug}`);
        }
      } else {
        // Zamknij modal wielu krajów
        setIsAddMultipleCountriesModalOpen(false);
        // Otwórz modal pojedynczego kraju
        setIsAddCountryModalOpen(true);
      }
    }
  };

  if (isLoading) {
    return (
      <PageLayout maxWidth="6xl">
        <PageHeader title="Portfel podróżniczy" subtitle="Twoje podróże" />
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Ładowanie podróży...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout maxWidth="6xl">
        <div className="flex items-center justify-between mb-8">
          <PageHeader title="Portfel podróżniczy" subtitle="Twoje podróże" />
          <Button onClick={() => setIsAddModalOpen(true)} variant="primary">
            Dodaj podróż
          </Button>
        </div>

        <TripsList trips={trips} onDeleteRequest={handleDeleteRequest} />
      </PageLayout>

      <AddTripModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleCreateTrip}
      />

      {newTripSlug && (() => {
        const trip = getTripBySlug(newTripSlug);
        const dashboardMode = trip?.data.dashboardMode || "multi-country";
        const isSingleMode = dashboardMode === "single-country" || dashboardMode === "single-location";
        
        return (
          <>
            {isSingleMode && (
              <AddCountryModal
                isOpen={isAddCountryModalOpen}
                onClose={() => {
                  setIsAddCountryModalOpen(false);
                  if (newTripSlug) {
                    router.push(`/portfel-podrozniczy/${newTripSlug}`);
                  }
                  setNewTripSlug(null);
                }}
                onSave={handleSaveCountry}
                tripStartDate={trip?.startDate}
                tripEndDate={trip?.endDate}
                existingCountries={[]}
                tripData={trip?.data}
                totalBudget={trip?.data.totalBudget}
              />
            )}
            {!isSingleMode && (
              <AddMultipleCountriesModal
                isOpen={isAddMultipleCountriesModalOpen}
                onClose={() => {
                  setIsAddMultipleCountriesModalOpen(false);
                  if (newTripSlug) {
                    router.push(`/portfel-podrozniczy/${newTripSlug}`);
                  }
                  setNewTripSlug(null);
                }}
                onSave={handleSaveMultipleCountries}
                onSwitchToSingleCountry={handleSwitchToSingleCountry}
                tripStartDate={trip?.startDate}
                tripEndDate={trip?.endDate}
                tripData={trip?.data}
                totalBudget={trip?.data.totalBudget}
              />
            )}
          </>
        );
      })()}

      <DeleteTripModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        trip={tripToDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}

