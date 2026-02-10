"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/shared/PageLayout";
import Button from "@/components/ui/Button";
import TripsList from "@/components/pages/TripsList";
import AddTripModal from "@/components/pages/AddTripModal";
import AddCountryModal from "@/components/pages/AddCountryModal";
import AddMultipleCountriesModal from "@/components/pages/AddMultipleCountriesModal";
import DeleteTripModal from "@/components/pages/DeleteTripModal";
import { useToast } from "@/components/ui/Toast";
import { Globe, ChevronDown, Check } from "lucide-react";
import { getAllTrips, deleteTrip, createTrip, getTripBySlug, updateTrip } from "@/lib/travel-wallet/trips-storage";
import { addCountry } from "@/lib/travel-wallet/countries-storage";
import type { Trip } from "@/lib/travel-wallet/types";
import { useModalState } from "@/lib/travel-wallet/hooks/useModalState";

export default function TripsListClient() {
  const router = useRouter();
  const { addToast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "start-date-asc" | "start-date-desc">("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [savedTripFormData, setSavedTripFormData] = useState<{
    name: string;
    startDate?: string;
    endDate?: string;
    totalBudget?: string;
    userName?: string;
    dashboardMode?: "multi-country" | "single-country" | "single-location" | "auto";
  } | null>(null);

  // Use custom hooks for modal states
  const newTripModal = useModalState<Trip>();
  const addCountryModalType = useModalState<"single" | "multiple">();
  const deleteModal = useModalState<Trip>();
  const [isDeleting, setIsDeleting] = useState(false);

  const calculateTotalUniqueCountries = useCallback((trips: Trip[]): number => {
    const allCountries = new Set<string>();
    trips.forEach((trip) => {
      trip.data.countries.forEach((country) => {
        allCountries.add(country.name);
      });
    });
    return allCountries.size;
  }, []);

  const sortTrips = useCallback((tripsToSort: Trip[], sortOption: typeof sortBy): Trip[] => {
    const sorted = [...tripsToSort];
    switch (sortOption) {
      case "newest":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
      case "oldest":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateA - dateB;
        });
      case "start-date-asc":
        return sorted.sort((a, b) => {
          if (!a.startDate && !b.startDate) return 0;
          if (!a.startDate) return 1;
          if (!b.startDate) return -1;
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });
      case "start-date-desc":
        return sorted.sort((a, b) => {
          if (!a.startDate && !b.startDate) return 0;
          if (!a.startDate) return 1;
          if (!b.startDate) return -1;
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        });
      default:
        return sorted;
    }
  }, []);

  const loadTrips = useCallback(() => {
    const allTrips = getAllTrips();
    setTrips(allTrips);
    setIsLoading(false);
  }, []);

  // Memoized sorted trips
  const sortedTrips = useMemo(() => sortTrips(trips, sortBy), [trips, sortBy, sortTrips]);

  // Memoized total unique countries
  const totalCountries = useMemo(() => calculateTotalUniqueCountries(trips), [trips, calculateTotalUniqueCountries]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sortOptions = [
    { value: "newest" as const, label: "Najnowsze" },
    { value: "oldest" as const, label: "Najstarsze" },
    { value: "start-date-asc" as const, label: "Data rozpoczęcia (najbliższe)" },
    { value: "start-date-desc" as const, label: "Data rozpoczęcia (najdalsze)" },
  ];

  const selectedSortOption = sortOptions.find((option) => option.value === sortBy);

  const handleSortSelect = (value: typeof sortBy) => {
    setSortBy(value);
    setIsSortDropdownOpen(false);
  };

  const handleDeleteRequest = useCallback((trip: Trip) => {
    deleteModal.open(trip);
  }, [deleteModal]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModal.data) return;

    setIsDeleting(true);
    try {
      const deleteResult = deleteTrip(deleteModal.data.id);
      
      if (deleteResult) {
        const tripName = deleteModal.data.name;
        loadTrips();
        deleteModal.close();
        addToast({
          type: "success",
          title: "Podróż usunięta",
          message: `Podróż "${tripName}" została usunięta.`,
        });
      } else {
        addToast({
          type: "error",
          title: "Błąd",
          message: "Nie udało się usunąć podróży.",
        });
      }
    } finally {
      setIsDeleting(false);
    }
  }, [deleteModal, loadTrips, addToast]);

  const handleDeleteCancel = useCallback(() => {
    if (!isDeleting) {
      deleteModal.close();
    }
  }, [isDeleting, deleteModal]);

  const handleCancelNewTrip = useCallback(() => {
    if (!newTripModal.data) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("newTripAdded");
      }
      return;
    }

    const trip = getTripBySlug(newTripModal.data.slug);
    if (trip && trip.data.countries.length === 0) {
      deleteTrip(trip.id);
      loadTrips();
      addToast({
        type: "info",
        title: "Anulowano",
        message: "Tworzenie podróży zostało anulowane.",
        duration: 2000,
      });
    }

    newTripModal.close();
    setSavedTripFormData(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("newTripAdded");
    }
  }, [newTripModal, loadTrips, addToast]);

  const handleCreateTrip = useCallback((tripData: {
    name: string;
    startDate?: string;
    endDate?: string;
    totalBudget?: number;
    userName?: string;
    dashboardMode?: "multi-country" | "single-country" | "single-location" | "auto";
  }) => {
    // Zapisz stan formularza przed zamknięciem modala
    setSavedTripFormData({
      name: tripData.name,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      totalBudget: tripData.totalBudget?.toString() || "",
      userName: tripData.userName,
      dashboardMode: "auto",
    });

    const createdTrip = createTrip({
      name: tripData.name,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      data: {
        countries: [],
        totalBudget: tripData.totalBudget,
        userName: tripData.userName,
        dashboardMode: "auto",
      },
    });
    
    // Zapisz cały obiekt podróży w stanie
    newTripModal.open(createdTrip);
    
    loadTrips();
    setIsAddModalOpen(false);
    // Zapisz informację o nowo dodanej podróży w sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.setItem("newTripAdded", JSON.stringify({
        slug: createdTrip.slug,
        toast: {
          type: "success",
          title: "Podróż dodana",
          message: `Podróż "${tripData.name}" została dodana.`,
          duration: 1500,
        }
      }));
    }
    // Zawsze otwórz modal wielu krajów (użytkownik może dodać jeden lub więcej krajów)
    addCountryModalType.open("multiple");
  }, [newTripModal, addCountryModalType, loadTrips]);

  const saveCountryToTrip = useCallback((countryData: {
    name: string;
    location?: string;
    days: number;
    startDate?: string;
    endDate?: string;
    status: "visited" | "current" | "upcoming";
    budgets: { currency: string; amount: number }[];
    locations?: Array<{ name: string; startDate: string; endDate: string }>;
  }) => {
    if (!newTripModal.data) {
      addToast({
        type: "error",
        title: "Błąd",
        message: "Nie udało się zapisać kraju. Spróbuj ponownie.",
        duration: 3000,
      });
      return false;
    }

    const result = addCountry(newTripModal.data.id, {
      ...countryData,
      location: countryData.location || "",
    });
    
    if (result) {
      const slug = newTripModal.data.slug;
      addCountryModalType.close();
      newTripModal.close();
      setSavedTripFormData(null);
      // Verify trip exists before navigation
      const verifyTrip = getTripBySlug(slug);
      if (verifyTrip) {
        router.push(`/portfel-podrozniczy/${slug}`);
      } else {
        // If trip not found, reload trips and try again
        loadTrips();
        setTimeout(() => {
          const tripRetry = getTripBySlug(slug);
          if (tripRetry) {
            router.push(`/portfel-podrozniczy/${slug}`);
          } else {
            addToast({
              type: "error",
              title: "Błąd",
              message: "Nie udało się przejść do podróży. Spróbuj ponownie.",
              duration: 3000,
            });
          }
        }, 100);
      }
    } else {
      addToast({
        type: "error",
        title: "Błąd",
        message: "Nie udało się zapisać kraju. Spróbuj ponownie.",
        duration: 3000,
      });
    }
    
    return result;
  }, [newTripModal, addCountryModalType, router, addToast]);

  const handleSaveCountry = useCallback((countryData: {
    name: string;
    location?: string;
    days: number;
    startDate?: string;
    endDate?: string;
    status: "visited" | "current" | "upcoming";
    budgets: { currency: string; amount: number }[];
    locations?: Array<{ name: string; startDate: string; endDate: string }>;
  }) => {
    saveCountryToTrip(countryData);
  }, [saveCountryToTrip]);

  const handleSaveMultipleCountries = useCallback((countriesData: Array<{
    name: string;
    location?: string;
    days: number;
    startDate?: string;
    endDate?: string;
    status: "visited" | "current" | "upcoming";
    budgets: { currency: string; amount: number }[];
    locations?: Array<{ name: string; startDate: string; endDate: string }>;
  }>) => {
    if (!newTripModal.data) {
      addToast({
        type: "error",
        title: "Błąd",
        message: "Nie znaleziono podróży. Spróbuj ponownie.",
        duration: 3000,
      });
      return;
    }

    // Dodaj wszystkie kraje
    let allSuccess = true;
    countriesData.forEach((countryData) => {
      const result = addCountry(newTripModal.data.id, {
        ...countryData,
        location: countryData.location || "",
      });
      if (!result) {
        allSuccess = false;
        addToast({
          type: "error",
          title: "Błąd",
          message: `Nie udało się zapisać kraju "${countryData.name}".`,
          duration: 3000,
        });
      }
    });

    if (allSuccess) {
      const slug = newTripModal.data.slug;
      addCountryModalType.close();
      newTripModal.close();
      setSavedTripFormData(null);
      // Verify trip exists before navigation
      const verifyTrip = getTripBySlug(slug);
      if (verifyTrip) {
        router.push(`/portfel-podrozniczy/${slug}`);
      } else {
        // If trip not found, reload trips and try again
        loadTrips();
        setTimeout(() => {
          const tripRetry = getTripBySlug(slug);
          if (tripRetry) {
            router.push(`/portfel-podrozniczy/${slug}`);
          } else {
            addToast({
              type: "error",
              title: "Błąd",
              message: "Nie udało się przejść do podróży. Spróbuj ponownie.",
              duration: 3000,
            });
          }
        }, 100);
      }
    }
  }, [newTripModal, addCountryModalType, router, addToast]);

  const handleSwitchToSingleCountry = useCallback((countryData?: {
    name: string;
    location?: string;
    days: number;
    startDate?: string;
    endDate?: string;
    status: "visited" | "current" | "upcoming";
    budgets: { currency: string; amount: number }[];
    locations?: Array<{ name: string; startDate: string; endDate: string }>;
  }) => {
    if (!newTripModal.data) return;

    // Zmień tryb podróży na single-country
    const updatedData = {
      ...newTripModal.data.data,
      dashboardMode: "single-country" as const,
    };

    if (updateTrip(newTripModal.data.id, { data: updatedData })) {
      // Jeśli przekazano dane kraju, zapisz go
      if (countryData) {
        if (addCountry(newTripModal.data.id, {
          ...countryData,
          location: countryData.location || "",
        })) {
          const slug = newTripModal.data.slug;
          addCountryModalType.close();
          newTripModal.close();
          // Verify trip exists before navigation
          const verifyTrip = getTripBySlug(slug);
          if (verifyTrip) {
            router.push(`/portfel-podrozniczy/${slug}`);
          } else {
            // If trip not found, reload trips and try again
            loadTrips();
            setTimeout(() => {
              const tripRetry = getTripBySlug(slug);
              if (tripRetry) {
                router.push(`/portfel-podrozniczy/${slug}`);
              } else {
                addToast({
                  type: "error",
                  title: "Błąd",
                  message: "Nie udało się przejść do podróży. Spróbuj ponownie.",
                  duration: 3000,
                });
              }
            }, 100);
          }
        }
      } else {
        // Zamknij modal wielu krajów, otwórz modal pojedynczego kraju
        addCountryModalType.open("single");
      }
    }
  }, [newTripModal, addCountryModalType, router]);

  if (isLoading) {
    return (
      <PageLayout maxWidth="6xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-4">
            Portfel podróżniczy
          </h1>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Ładowanie podróży...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout maxWidth="6xl">
        {/* Nagłówek */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-4">
            Portfel podróżniczy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-2xl">
            Planuj i kontroluj budżet podróży. Zarządzaj wieloma podróżami i śledź wydatki w różnych walutach.
          </p>
          <Button onClick={() => setIsAddModalOpen(true)} variant="primary">
            Dodaj podróż
          </Button>
        </div>

        {trips.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 inline-flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {totalCountries}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Odwiedzonych krajów
                </p>
              </div>
            </div>
            
            <div className="relative" ref={sortDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className={`px-4 py-2.5 pr-10 rounded-md border text-left transition-colors ${
                  isSortDropdownOpen
                    ? "border-gray-500 dark:border-gray-400 ring-2 ring-gray-500 dark:ring-gray-400"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent text-sm font-medium`}
                aria-label="Sortuj podróże"
              >
                {selectedSortOption ? selectedSortOption.label : "Sortuj"}
              </button>

              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${
                    isSortDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {isSortDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSortSelect(option.value)}
                      className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        sortBy === option.value
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100"
                          : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{option.label}</span>
                        {sortBy === option.value && (
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <TripsList trips={sortedTrips} onDeleteRequest={handleDeleteRequest} />
      </PageLayout>

      <AddTripModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSavedTripFormData(null);
          addToast({
            type: "info",
            title: "Anulowano",
            message: "Tworzenie podróży zostało anulowane.",
            duration: 2000,
          });
        }}
        onSave={handleCreateTrip}
        initialValues={savedTripFormData || undefined}
      />

      {newTripModal.data && (
        <>
          {addCountryModalType.data === "single" && (
            <AddCountryModal
              isOpen={addCountryModalType.isOpen}
              onClose={() => {
                addCountryModalType.close();
                handleCancelNewTrip();
              }}
              onSave={handleSaveCountry}
              tripStartDate={newTripModal.data.startDate}
              tripEndDate={newTripModal.data.endDate}
              existingCountries={[]}
              tripData={newTripModal.data.data}
              totalBudget={newTripModal.data.data.totalBudget}
              onBack={() => {
                addCountryModalType.close();
                setIsAddModalOpen(true);
              }}
            />
          )}
          {addCountryModalType.data === "multiple" && (
            <AddMultipleCountriesModal
              isOpen={addCountryModalType.isOpen}
              onClose={() => {
                addCountryModalType.close();
                handleCancelNewTrip();
              }}
              onSave={handleSaveMultipleCountries}
              onSwitchToSingleCountry={handleSwitchToSingleCountry}
              tripStartDate={newTripModal.data.startDate}
              tripEndDate={newTripModal.data.endDate}
              tripData={newTripModal.data.data}
              totalBudget={newTripModal.data.data.totalBudget}
              onBack={() => {
                addCountryModalType.close();
                setIsAddModalOpen(true);
              }}
            />
          )}
        </>
      )}

      <DeleteTripModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        trip={deleteModal.data}
        isDeleting={isDeleting}
      />
    </>
  );
}

