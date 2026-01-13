"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import CountryDetails from "@/components/pages/CountryDetails";
import AddExpenseModal from "@/components/pages/AddExpenseModal";
import DeleteExpenseModal from "@/components/pages/DeleteExpenseModal";
import AddLocationModal from "@/components/pages/AddLocationModal";
import EditLocationModal from "@/components/pages/EditLocationModal";
import DeleteLocationModal from "@/components/pages/DeleteLocationModal";
import { getCountryBySlug } from "@/lib/travel-wallet/countries";
import {
  getExpensesByCountryId,
  addExpense,
  saveExpense,
  deleteExpense,
} from "@/lib/travel-wallet/expenses";
import {
  addLocationToCountry,
  updateLocationInCountry,
  removeLocationFromCountry,
  hasExpensesWithLocation,
} from "@/lib/travel-wallet/countries-storage";
import { updateExpenseLocation } from "@/lib/travel-wallet/expenses";
import { getTripBySlug } from "@/lib/travel-wallet/trips-storage";
import type { Country, Expense } from "@/lib/travel-wallet/types";

interface CountryDetailsClientProps {
  countrySlug: string;
  slug: string;
}

export default function CountryDetailsClient({
  countrySlug,
  slug,
}: CountryDetailsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [country, setCountry] = useState<Country | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined
  );
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [isEditLocationModalOpen, setIsEditLocationModalOpen] = useState(false);
  const [isDeleteLocationModalOpen, setIsDeleteLocationModalOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<string>("");
  const [locationToDelete, setLocationToDelete] = useState<string>("");
  const [isDeletingLocation, setIsDeletingLocation] = useState(false);
  const [pendingExpenseDate, setPendingExpenseDate] = useState<string | undefined>(undefined);

  // Obsługa URL params - jeśli jest ?date=, otwórz modal
  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      setSelectedDate(dateParam);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const loadExpenses = () => {
    if (!country) return;
    const trip = getTripBySlug(slug);
    if (!trip) return;
    const countryExpenses = getExpensesByCountryId(country.id, trip.id);
    setExpenses(countryExpenses);
  };

  useEffect(() => {
    const trip = getTripBySlug(slug);
    if (!trip) {
      router.push("/portfel-podrozniczy");
      return;
    }
    const foundCountry = getCountryBySlug(countrySlug, trip.id);
    setCountry(foundCountry);
    setIsLoading(false);
  }, [countrySlug, slug, router]);

  useEffect(() => {
    if (country) {
      loadExpenses();
    }
  }, [country, slug]);


  const handleOpenModal = (date?: string, expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setSelectedDate(undefined);
    } else {
      setEditingExpense(null);
      setSelectedDate(date);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(undefined);
    setEditingExpense(null);
    // Usuń parametr date z URL
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("date");
      window.history.replaceState({}, "", url.toString());
    }
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
    const trip = getTripBySlug(slug);
    if (!trip) return;
    
    if (expenseData.id) {
      // Edycja istniejącego wydatku
      const expense: Expense = {
        id: expenseData.id,
        countryId: expenseData.countryId,
        tripId: trip.id,
        amount: expenseData.amount,
        currency: expenseData.currency,
        category: expenseData.category,
        description: expenseData.description,
        note: expenseData.note,
        date: expenseData.date,
        location: expenseData.location,
      };
      saveExpense(expense, trip.id);
    } else {
      // Dodawanie nowego wydatku
      addExpense(expenseData, trip.id);
    }
    loadExpenses();
  };

  const handleEditExpense = (expense: Expense) => {
    handleOpenModal(undefined, expense);
  };

  const handleDeleteExpenseRequest = (expense: Expense) => {
    setExpenseToDelete(expense);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteExpenseConfirm = () => {
    if (!expenseToDelete) return;
    const trip = getTripBySlug(slug);
    if (!trip) return;
    
    deleteExpense(expenseToDelete.id, trip.id);
    loadExpenses();
    setIsDeleteModalOpen(false);
    setExpenseToDelete(null);
  };

  const loadCountry = () => {
    const trip = getTripBySlug(slug);
    if (!trip) return;
    const foundCountry = getCountryBySlug(countrySlug, trip.id);
    setCountry(foundCountry);
  };

  const handleAddLocation = (date?: string) => {
    setPendingExpenseDate(date);
    setIsAddLocationModalOpen(true);
  };

  const handleSaveLocation = (location: string, startDate: string, endDate: string) => {
    const trip = getTripBySlug(slug);
    if (!trip || !country) return;
    
    if (addLocationToCountry(trip.id, country.id, location, startDate, endDate)) {
      loadCountry();
      setIsAddLocationModalOpen(false);
      
      // Jeśli była otwarta z modala wydatku, wróć do modala wydatku z wybraną lokalizacją
      if (pendingExpenseDate) {
        setSelectedDate(pendingExpenseDate);
        setIsModalOpen(true);
        setPendingExpenseDate(undefined);
      }
    }
  };

  const handleEditLocation = (location: string) => {
    setLocationToEdit(location);
    setIsEditLocationModalOpen(true);
  };

  const handleSaveEditedLocation = (newLocation: string, startDate: string, endDate: string) => {
    const trip = getTripBySlug(slug);
    if (!trip || !country) return;
    
    if (updateLocationInCountry(trip.id, country.id, locationToEdit, newLocation, startDate, endDate)) {
      // Zaktualizuj lokalizację w wydatkach (tylko jeśli zmieniono nazwę)
      if (newLocation !== locationToEdit) {
        updateExpenseLocation(trip.id, country.id, locationToEdit, newLocation);
      }
      loadCountry();
      loadExpenses();
      setIsEditLocationModalOpen(false);
      setLocationToEdit("");
    }
  };

  const handleDeleteLocation = (location: string) => {
    setLocationToDelete(location);
    setIsDeleteLocationModalOpen(true);
  };

  const handleDeleteLocationConfirm = () => {
    const trip = getTripBySlug(slug);
    if (!trip || !country) return;
    
    setIsDeletingLocation(true);
    try {
      if (removeLocationFromCountry(trip.id, country.id, locationToDelete)) {
        loadCountry();
        setIsDeleteLocationModalOpen(false);
        setLocationToDelete("");
      }
    } finally {
      setIsDeletingLocation(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout maxWidth="4xl">
        <PageHeader title="Kraj" subtitle="Szczegóły kraju" />
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Ładowanie danych...
          </p>
        </div>
      </PageLayout>
    );
  }

  if (!country) {
    return (
      <PageLayout maxWidth="4xl">
        <PageHeader
          title="Kraj nie znaleziony"
          subtitle="Nie udało się znaleźć kraju o podanym ID"
        />
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Kraj o slug "{countrySlug}" nie został znaleziony.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout maxWidth="4xl">
        <PageHeader title={country.name} subtitle="Szczegóły kraju" />
            <CountryDetails
              country={country}
              expenses={expenses}
              onAddExpense={handleOpenModal}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpenseRequest}
              onAddLocation={handleAddLocation}
              onEditLocation={handleEditLocation}
              onDeleteLocation={handleDeleteLocation}
              slug={slug}
              tripId={getTripBySlug(slug)?.id}
            />
      </PageLayout>
      {country && (
        <>
          <AddExpenseModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSaveExpense}
            country={country}
            initialDate={selectedDate}
            tripId={getTripBySlug(slug)?.id}
            expense={editingExpense || undefined}
            onAddLocation={(date) => handleAddLocation(date)}
          />
          {expenseToDelete && (
            <DeleteExpenseModal
              isOpen={isDeleteModalOpen}
              onClose={() => {
                setIsDeleteModalOpen(false);
                setExpenseToDelete(null);
              }}
              onConfirm={handleDeleteExpenseConfirm}
              expense={expenseToDelete}
            />
          )}
          <AddLocationModal
            isOpen={isAddLocationModalOpen}
            onClose={() => {
              setIsAddLocationModalOpen(false);
              setPendingExpenseDate(undefined);
            }}
            onSave={handleSaveLocation}
            existingLocations={country.locations || []}
            countryStartDate={country.startDate}
            countryEndDate={country.endDate}
            initialDate={pendingExpenseDate}
          />
          <EditLocationModal
            isOpen={isEditLocationModalOpen}
            onClose={() => {
              setIsEditLocationModalOpen(false);
              setLocationToEdit("");
            }}
            onSave={handleSaveEditedLocation}
            currentLocation={locationToEdit}
            existingLocations={country.locations || []}
            countryStartDate={country.startDate}
            countryEndDate={country.endDate}
            currentStartDate={(() => {
              const loc = country.locations?.find((loc) => {
                const name = typeof loc === "string" ? loc : loc.name;
                return name === locationToEdit;
              });
              return loc && typeof loc !== "string" ? loc.startDate : undefined;
            })()}
            currentEndDate={(() => {
              const loc = country.locations?.find((loc) => {
                const name = typeof loc === "string" ? loc : loc.name;
                return name === locationToEdit;
              });
              return loc && typeof loc !== "string" ? loc.endDate : undefined;
            })()}
          />
          <DeleteLocationModal
            isOpen={isDeleteLocationModalOpen}
            onClose={() => {
              if (!isDeletingLocation) {
                setIsDeleteLocationModalOpen(false);
                setLocationToDelete("");
              }
            }}
            onConfirm={handleDeleteLocationConfirm}
            location={locationToDelete}
            hasExpenses={
              country && getTripBySlug(slug)
                ? hasExpensesWithLocation(
                    getTripBySlug(slug)!.id,
                    country.id,
                    locationToDelete
                  )
                : false
            }
            isDeleting={isDeletingLocation}
          />
        </>
      )}
    </>
  );
}

