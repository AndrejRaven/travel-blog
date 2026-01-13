"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/shared/PageLayout";
import TravelWalletDashboard from "@/components/pages/TravelWalletDashboard";
import AddCountryModal from "@/components/pages/AddCountryModal";
import DeleteCountryModal from "@/components/pages/DeleteCountryModal";
import AddExpenseFromDashboardModal from "@/components/pages/AddExpenseFromDashboardModal";
import EditTripModal from "@/components/pages/EditTripModal";
import AddLocationModal from "@/components/pages/AddLocationModal";
import EditLocationModal from "@/components/pages/EditLocationModal";
import DeleteLocationModal from "@/components/pages/DeleteLocationModal";
import { getTripBySlug, setCurrentTrip, updateTrip } from "@/lib/travel-wallet/trips-storage";
import {
  addCountry,
  deleteCountry,
} from "@/lib/travel-wallet/countries-storage";
import {
  addExpense,
} from "@/lib/travel-wallet/expenses";
import {
  addLocationToCountry,
  updateLocationInCountry,
  removeLocationFromCountry,
  hasExpensesWithLocation,
} from "@/lib/travel-wallet/countries-storage";
import { updateExpenseLocation } from "@/lib/travel-wallet/expenses";
import type { TravelWalletData, Country, Trip } from "@/lib/travel-wallet/types";

interface TravelWalletClientProps {
  slug: string;
}

export default function TravelWalletClient({
  slug,
}: TravelWalletClientProps) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [data, setData] = useState<TravelWalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddCountryModalOpen, setIsAddCountryModalOpen] = useState(false);
  const [isDeleteCountryModalOpen, setIsDeleteCountryModalOpen] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState<Country | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [isEditLocationModalOpen, setIsEditLocationModalOpen] = useState(false);
  const [isDeleteLocationModalOpen, setIsDeleteLocationModalOpen] = useState(false);
  const [pendingLocationCountryId, setPendingLocationCountryId] = useState<string | undefined>(undefined);
  const [pendingLocationDate, setPendingLocationDate] = useState<string | undefined>(undefined);
  const [locationToEdit, setLocationToEdit] = useState<string>("");
  const [locationToDelete, setLocationToDelete] = useState<string>("");
  const [isDeletingLocation, setIsDeletingLocation] = useState(false);
  const [countryInitialStartDate, setCountryInitialStartDate] = useState<string | undefined>(undefined);
  const [countryInitialEndDate, setCountryInitialEndDate] = useState<string | undefined>(undefined);

  const loadTripData = () => {
    const foundTrip = getTripBySlug(slug);
    if (!foundTrip) {
      router.push("/portfel-podrozniczy");
      return;
    }
    
    console.log('[TravelWalletClient] loadTripData - foundTrip.data:', foundTrip.data);
    console.log('[TravelWalletClient] loadTripData - foundTrip.data.countries:', foundTrip.data.countries);
    
    if (foundTrip.data.countries.length > 0) {
      const firstCountry = foundTrip.data.countries[0];
      console.log('[TravelWalletClient] loadTripData - firstCountry:', firstCountry);
      console.log('[TravelWalletClient] loadTripData - firstCountry.locations:', firstCountry.locations);
      console.log('[TravelWalletClient] loadTripData - firstCountry.locations type:', typeof firstCountry.locations);
      console.log('[TravelWalletClient] loadTripData - firstCountry.locations isArray:', Array.isArray(firstCountry.locations));
    }
    
    setCurrentTrip(foundTrip.id);
    setTrip(foundTrip);
    // Utwórz głęboką kopię danych aby React wykrył zmianę
    // Kopiuj również lokalizacje dla każdego kraju
    const newData = {
      ...foundTrip.data,
      countries: foundTrip.data.countries.map(country => ({
        ...country,
        locations: country.locations ? country.locations.map(loc => 
          typeof loc === 'string' ? loc : { ...loc }
        ) : [],
      })),
    };
    
    console.log('[TravelWalletClient] loadTripData - newData:', newData);
    if (newData.countries.length > 0) {
      console.log('[TravelWalletClient] loadTripData - newData.countries[0].locations:', newData.countries[0].locations);
    }
    
    setData(newData);
    setIsLoading(false);
  };

  useEffect(() => {
    loadTripData();
  }, [slug, router]);

  const handleAddCountry = (countryData: {
    name: string;
    location?: string;
    days: number;
    startDate?: string;
    endDate?: string;
    status: "visited" | "current" | "upcoming";
    budgets: { currency: string; amount: number }[];
    locations?: Array<{ name: string; startDate: string; endDate: string }>;
  }) => {
    console.log('[TravelWalletClient] handleAddCountry - countryData:', countryData);
    console.log('[TravelWalletClient] handleAddCountry - locations:', countryData.locations);
    
    const trip = getTripBySlug(slug);
    if (!trip) {
      console.error('[TravelWalletClient] handleAddCountry - trip not found');
      return;
    }

    const countryDataToSave = {
      ...countryData,
      location: countryData.location || "",
      locations: countryData.locations || [],
    };
    
    console.log('[TravelWalletClient] handleAddCountry - countryDataToSave:', countryDataToSave);
    console.log('[TravelWalletClient] handleAddCountry - locations w countryDataToSave:', countryDataToSave.locations);

    const success = addCountry(trip.id, countryDataToSave);
    
    console.log('[TravelWalletClient] handleAddCountry - addCountry success:', success);
    
    if (success) {
      // Użyj setTimeout aby upewnić się, że dane są zapisane do localStorage
      setTimeout(() => {
        console.log('[TravelWalletClient] handleAddCountry - wywołuję loadTripData');
        loadTripData();
      }, 0);
      setIsAddCountryModalOpen(false);
    } else {
      console.error('[TravelWalletClient] handleAddCountry - addCountry failed');
    }
  };

  const handleEditCountry = (country: Country) => {
    router.push(`/portfel-podrozniczy/${slug}/kraje/${country.slug}`);
  };

  const handleDeleteCountryRequest = (country: Country) => {
    setCountryToDelete(country);
    setIsDeleteCountryModalOpen(true);
  };

  const handleDeleteCountryConfirm = async () => {
    if (!countryToDelete) return;

    const trip = getTripBySlug(slug);
    if (!trip) return;

    setIsDeleting(true);
    try {
      if (deleteCountry(trip.id, countryToDelete.id)) {
        loadTripData();
        setIsDeleteCountryModalOpen(false);
        setCountryToDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddBudget = (country: Country) => {
    // TODO: Implement AddBudgetModal
    console.log("Add budget to country:", country);
  };

  const handleReduceBudget = (country: Country) => {
    // TODO: Implement EditBudgetModal
    console.log("Reduce budget for country:", country);
  };

  const handleAddExpense = () => {
    setIsAddExpenseModalOpen(true);
  };

  const handleSaveExpense = (expenseData: {
    id?: string;
    countryId: string;
    description: string;
    category: string;
    amount: number;
    currency: string;
    date: string;
    note?: string;
    location?: string;
    tripId?: string;
  }) => {
    const foundTrip = getTripBySlug(slug);
    if (!foundTrip) return;

    addExpense(expenseData, foundTrip.id);
    loadTripData();
    setIsAddExpenseModalOpen(false);
  };

  const handleEditTrip = () => {
    setIsEditTripModalOpen(true);
  };

  const handleSaveTrip = (tripData: {
    name: string;
    startDate?: string;
    endDate?: string;
    totalBudget?: number;
    userName?: string;
    dashboardMode?: "multi-country" | "single-country" | "single-location" | "auto";
  }) => {
    const foundTrip = getTripBySlug(slug);
    if (!foundTrip) return;

    // Aktualizuj dane podróży
    const updatedData: TravelWalletData = {
      ...foundTrip.data,
      totalBudget: tripData.totalBudget,
      userName: tripData.userName,
      dashboardMode: tripData.dashboardMode,
    };

    // Przygotuj aktualizacje - upewnij się, że daty są przekazane (nawet jeśli undefined)
    const updates: Partial<Trip> = {
      name: tripData.name,
      data: updatedData,
    };
    
    // Zawsze przekazuj daty (nawet jeśli undefined, aby je wyczyścić)
    if (tripData.startDate !== undefined) {
      updates.startDate = tripData.startDate || undefined;
    }
    if (tripData.endDate !== undefined) {
      updates.endDate = tripData.endDate || undefined;
    }

    if (updateTrip(foundTrip.id, updates)) {
      loadTripData();
      setIsEditTripModalOpen(false);
    }
  };

  const handleDeleteCountryFromTrip = (countryId: string) => {
    const foundTrip = getTripBySlug(slug);
    if (!foundTrip) return;

    if (deleteCountry(foundTrip.id, countryId)) {
      loadTripData();
    }
  };

  const handleAddLocationFromExpense = (countryId: string, date: string) => {
    setPendingLocationCountryId(countryId);
    setPendingLocationDate(date);
    setIsAddLocationModalOpen(true);
    setIsAddExpenseModalOpen(false);
  };

  const handleAddLocation = () => {
    // Jeśli jest tylko jeden kraj, użyj jego ID
    if (data && data.countries.length === 1) {
      setPendingLocationCountryId(data.countries[0].id);
      setIsAddLocationModalOpen(true);
    }
  };

  const handleSaveLocation = (location: string, startDate: string, endDate: string) => {
    const foundTrip = getTripBySlug(slug);
    if (!foundTrip || !pendingLocationCountryId) return;

    if (addLocationToCountry(foundTrip.id, pendingLocationCountryId, location, startDate, endDate)) {
      loadTripData();
      setIsAddLocationModalOpen(false);
      setPendingLocationCountryId(undefined);
      setPendingLocationDate(undefined);
      
      // Wróć do modala wydatku z wybraną lokalizacją (jeśli był otwarty)
      if (isAddExpenseModalOpen) {
        setIsAddExpenseModalOpen(true);
      }
    }
  };

  const handleEditLocation = (location: string) => {
    // Jeśli jest tylko jeden kraj, użyj jego ID
    if (data && data.countries.length === 1) {
      setPendingLocationCountryId(data.countries[0].id);
      setLocationToEdit(location);
      setIsEditLocationModalOpen(true);
    }
  };

  const handleSaveEditedLocation = (newLocation: string, startDate: string, endDate: string) => {
    const foundTrip = getTripBySlug(slug);
    if (!foundTrip || !pendingLocationCountryId) return;
    
    if (updateLocationInCountry(foundTrip.id, pendingLocationCountryId, locationToEdit, newLocation, startDate, endDate)) {
      // Zaktualizuj lokalizację w wydatkach (tylko jeśli zmieniono nazwę)
      if (newLocation !== locationToEdit) {
        updateExpenseLocation(foundTrip.id, pendingLocationCountryId, locationToEdit, newLocation);
      }
      loadTripData();
      setIsEditLocationModalOpen(false);
      setLocationToEdit("");
      setPendingLocationCountryId(undefined);
    }
  };

  const handleDeleteLocation = (location: string) => {
    // Jeśli jest tylko jeden kraj, użyj jego ID
    if (data && data.countries.length === 1) {
      setPendingLocationCountryId(data.countries[0].id);
      setLocationToDelete(location);
      setIsDeleteLocationModalOpen(true);
    }
  };

  const handleDeleteLocationConfirm = () => {
    const foundTrip = getTripBySlug(slug);
    if (!foundTrip || !pendingLocationCountryId) return;
    
    setIsDeletingLocation(true);
    try {
      if (removeLocationFromCountry(foundTrip.id, pendingLocationCountryId, locationToDelete)) {
        loadTripData();
        setIsDeleteLocationModalOpen(false);
        setLocationToDelete("");
        setPendingLocationCountryId(undefined);
      }
    } finally {
      setIsDeletingLocation(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout maxWidth="6xl">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Ładowanie danych...</p>
        </div>
      </PageLayout>
    );
  }

  if (!data) {
    return (
      <PageLayout maxWidth="6xl">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Nie udało się załadować danych podróży.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout maxWidth="6xl">
        <TravelWalletDashboard
          data={data}
          slug={slug}
          tripStartDate={trip?.startDate}
          tripEndDate={trip?.endDate}
          onAddCountry={(startDate, endDate) => {
            setCountryInitialStartDate(startDate);
            setCountryInitialEndDate(endDate);
            setIsAddCountryModalOpen(true);
          }}
          onEditCountry={handleEditCountry}
          onDeleteCountry={handleDeleteCountryRequest}
          onAddBudget={handleAddBudget}
          onReduceBudget={handleReduceBudget}
          onAddExpense={handleAddExpense}
          onAddLocation={handleAddLocation}
          onEditLocation={handleEditLocation}
          onDeleteLocation={handleDeleteLocation}
          onEditTrip={handleEditTrip}
        />
      </PageLayout>

      <AddCountryModal
        isOpen={isAddCountryModalOpen}
        onClose={() => {
          setIsAddCountryModalOpen(false);
          setCountryInitialStartDate(undefined);
          setCountryInitialEndDate(undefined);
        }}
        onSave={(countryData) => {
          handleAddCountry(countryData);
          setCountryInitialStartDate(undefined);
          setCountryInitialEndDate(undefined);
        }}
        initialStartDate={countryInitialStartDate}
        initialEndDate={countryInitialEndDate}
        tripStartDate={trip?.startDate}
        tripEndDate={trip?.endDate}
        existingCountries={data?.countries || []}
        tripData={data || undefined}
        totalBudget={trip?.data.totalBudget}
      />

      <DeleteCountryModal
        isOpen={isDeleteCountryModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteCountryModalOpen(false);
            setCountryToDelete(null);
          }
        }}
        onConfirm={handleDeleteCountryConfirm}
        country={countryToDelete}
        isDeleting={isDeleting}
      />

      {data && (
        <>
          <AddExpenseFromDashboardModal
            isOpen={isAddExpenseModalOpen}
            onClose={() => {
              setIsAddExpenseModalOpen(false);
              setPendingLocationCountryId(undefined);
              setPendingLocationDate(undefined);
            }}
            onSave={handleSaveExpense}
            data={data}
            tripId={trip?.id || ""}
            onAddLocation={handleAddLocationFromExpense}
            onAddCountry={() => {
              setIsAddExpenseModalOpen(false);
              setIsAddCountryModalOpen(true);
            }}
          />

          <EditTripModal
            isOpen={isEditTripModalOpen}
            onClose={() => setIsEditTripModalOpen(false)}
            onSave={handleSaveTrip}
            trip={trip}
            onDeleteCountry={handleDeleteCountryFromTrip}
            onAddCountry={(startDate, endDate) => {
              setIsEditTripModalOpen(false);
              setCountryInitialStartDate(startDate);
              setCountryInitialEndDate(endDate);
              setIsAddCountryModalOpen(true);
            }}
          />

          {pendingLocationCountryId && data && (
            <>
              <AddLocationModal
                isOpen={isAddLocationModalOpen}
                onClose={() => {
                  setIsAddLocationModalOpen(false);
                  setPendingLocationCountryId(undefined);
                  setPendingLocationDate(undefined);
                }}
                onSave={handleSaveLocation}
                existingLocations={(() => {
                  const country = data.countries.find((c) => c.id === pendingLocationCountryId);
                  return country?.locations || [];
                })()}
                countryStartDate={(() => {
                  const country = data.countries.find((c) => c.id === pendingLocationCountryId);
                  return country?.startDate;
                })()}
                countryEndDate={(() => {
                  const country = data.countries.find((c) => c.id === pendingLocationCountryId);
                  return country?.endDate;
                })()}
                initialDate={pendingLocationDate}
              />
              <EditLocationModal
                isOpen={isEditLocationModalOpen}
                onClose={() => {
                  setIsEditLocationModalOpen(false);
                  setLocationToEdit("");
                  setPendingLocationCountryId(undefined);
                }}
                onSave={handleSaveEditedLocation}
                existingLocations={(() => {
                  const country = data.countries.find((c) => c.id === pendingLocationCountryId);
                  return country?.locations || [];
                })()}
                currentLocation={locationToEdit}
                currentStartDate={(() => {
                  const country = data.countries.find((c) => c.id === pendingLocationCountryId);
                  if (!country) return undefined;
                  const location = country.locations?.find((loc) => {
                    const name = typeof loc === "string" ? loc : loc.name;
                    return name === locationToEdit;
                  });
                  return location && typeof location !== "string" ? location.startDate : undefined;
                })()}
                currentEndDate={(() => {
                  const country = data.countries.find((c) => c.id === pendingLocationCountryId);
                  if (!country) return undefined;
                  const location = country.locations?.find((loc) => {
                    const name = typeof loc === "string" ? loc : loc.name;
                    return name === locationToEdit;
                  });
                  return location && typeof location !== "string" ? location.endDate : undefined;
                })()}
                countryStartDate={(() => {
                  const country = data.countries.find((c) => c.id === pendingLocationCountryId);
                  return country?.startDate;
                })()}
                countryEndDate={(() => {
                  const country = data.countries.find((c) => c.id === pendingLocationCountryId);
                  return country?.endDate;
                })()}
              />
              <DeleteLocationModal
                isOpen={isDeleteLocationModalOpen}
                onClose={() => {
                  if (!isDeletingLocation) {
                    setIsDeleteLocationModalOpen(false);
                    setLocationToDelete("");
                    setPendingLocationCountryId(undefined);
                  }
                }}
                onConfirm={handleDeleteLocationConfirm}
                location={locationToDelete}
                hasExpenses={(() => {
                  const foundTrip = getTripBySlug(slug);
                  if (!foundTrip || !pendingLocationCountryId) return false;
                  return hasExpensesWithLocation(foundTrip.id, pendingLocationCountryId, locationToDelete);
                })()}
                isDeleting={isDeletingLocation}
              />
            </>
          )}
        </>
      )}
    </>
  );
}

