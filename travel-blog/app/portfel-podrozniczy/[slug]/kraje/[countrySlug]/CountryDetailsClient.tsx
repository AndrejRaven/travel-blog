"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import type { Country, Expense } from "@/lib/travel-wallet/types";
import { useTripData } from "@/lib/travel-wallet/hooks/useTripData";
import { useModalState } from "@/lib/travel-wallet/hooks/useModalState";

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
  const { trip, isLoading: isTripLoading } = useTripData(slug);
  
  const [country, setCountry] = useState<Country | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isDeletingLocation, setIsDeletingLocation] = useState(false);
  
  // Use custom hooks for modal states
  const expenseModal = useModalState<{
    expense?: Expense;
    date?: string;
  }>();
  const deleteExpenseModal = useModalState<Expense>();
  const locationModal = useModalState<{
    type: "add" | "edit" | "delete";
    location?: string;
    date?: string;
  }>();

  // Obsługa URL params - jeśli jest ?date=, otwórz modal
  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      expenseModal.open({ date: dateParam });
    }
  }, [searchParams, expenseModal]);

  const loadExpenses = useCallback(() => {
    if (!country || !trip) return;
    const countryExpenses = getExpensesByCountryId(country.id, trip.id);
    setExpenses(countryExpenses);
  }, [country, trip]);

  const loadCountry = useCallback(() => {
    if (!trip) return;
    const foundCountry = getCountryBySlug(countrySlug, trip.id);
    setCountry(foundCountry);
  }, [trip, countrySlug]);

  useEffect(() => {
    if (isTripLoading) return; // Wait for trip to load
    if (!trip) {
      router.push("/portfel-podrozniczy");
      return;
    }
    const foundCountry = getCountryBySlug(countrySlug, trip.id);
    setCountry(foundCountry);
  }, [countrySlug, trip, router, isTripLoading]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);


  const handleOpenModal = useCallback((date?: string, expense?: Expense) => {
    if (expense) {
      expenseModal.open({ expense });
    } else {
      expenseModal.open({ date });
    }
  }, [expenseModal]);

  const handleSaveExpense = useCallback((expenseData: {
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
    expenseModal.close();
  }, [trip, loadExpenses, expenseModal]);

  const handleEditExpense = useCallback((expense: Expense) => {
    handleOpenModal(undefined, expense);
  }, [handleOpenModal]);

  const handleDeleteExpenseRequest = useCallback((expense: Expense) => {
    deleteExpenseModal.open(expense);
  }, [deleteExpenseModal]);

  const handleDeleteExpenseConfirm = useCallback(() => {
    if (!deleteExpenseModal.data || !trip) return;
    
    deleteExpense(deleteExpenseModal.data.id, trip.id);
    loadExpenses();
    deleteExpenseModal.close();
  }, [deleteExpenseModal, trip, loadExpenses]);

  const handleAddLocation = useCallback((date?: string) => {
    locationModal.open({ type: "add", date });
  }, [locationModal]);

  const handleSaveLocation = useCallback((location: string, startDate: string, endDate: string) => {
    if (!trip || !country) return;
    
    if (addLocationToCountry(trip.id, country.id, location, startDate, endDate)) {
      loadCountry();
      const wasFromExpense = !!locationModal.data?.date;
      locationModal.close();
      
      // Jeśli była otwarta z modala wydatku, wróć do modala wydatku
      if (wasFromExpense) {
        expenseModal.open({ date: locationModal.data?.date });
      }
    }
  }, [trip, country, loadCountry, locationModal, expenseModal]);

  const handleEditLocation = useCallback((location: string) => {
    locationModal.open({ type: "edit", location });
  }, [locationModal]);

  const handleSaveEditedLocation = useCallback((newLocation: string, startDate: string, endDate: string) => {
    if (!trip || !country || !locationModal.data?.location) return;
    
    if (updateLocationInCountry(trip.id, country.id, locationModal.data.location, newLocation, startDate, endDate)) {
      // Zaktualizuj lokalizację w wydatkach (tylko jeśli zmieniono nazwę)
      if (newLocation !== locationModal.data.location) {
        updateExpenseLocation(trip.id, country.id, locationModal.data.location, newLocation);
      }
      loadCountry();
      loadExpenses();
      locationModal.close();
    }
  }, [trip, country, locationModal, loadCountry, loadExpenses]);

  const handleDeleteLocation = useCallback((location: string) => {
    locationModal.open({ type: "delete", location });
  }, [locationModal]);

  const handleDeleteLocationConfirm = useCallback(() => {
    if (!trip || !country || !locationModal.data?.location) return;
    
    setIsDeletingLocation(true);
    try {
      if (removeLocationFromCountry(trip.id, country.id, locationModal.data.location)) {
        loadCountry();
        locationModal.close();
      }
    } finally {
      setIsDeletingLocation(false);
    }
  }, [trip, country, locationModal, loadCountry]);

  // Memoize location data for edit modal
  const editingLocationData = useMemo(() => {
    if (!locationModal.data?.location || !country) return null;
    const loc = country.locations?.find((loc) => {
      const name = typeof loc === "string" ? loc : loc.name;
      return name === locationModal.data.location;
    });
    return loc && typeof loc !== "string" ? loc : null;
  }, [locationModal.data?.location, country]);

  if (isTripLoading) {
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
              tripId={trip?.id}
            />
      </PageLayout>
      {country && (
        <>
          <AddExpenseModal
            isOpen={expenseModal.isOpen}
            onClose={() => expenseModal.close()}
            onSave={handleSaveExpense}
            country={country}
            initialDate={expenseModal.data?.date}
            tripId={trip?.id}
            expense={expenseModal.data?.expense}
            onAddLocation={(date) => handleAddLocation(date)}
          />
          <DeleteExpenseModal
            isOpen={deleteExpenseModal.isOpen}
            onClose={() => deleteExpenseModal.close()}
            onConfirm={handleDeleteExpenseConfirm}
            expense={deleteExpenseModal.data || undefined}
          />
          <AddLocationModal
            isOpen={locationModal.isOpen && locationModal.data?.type === "add"}
            onClose={() => locationModal.close()}
            onSave={handleSaveLocation}
            existingLocations={country.locations || []}
            countryStartDate={country.startDate}
            countryEndDate={country.endDate}
            initialDate={locationModal.data?.date}
          />
          <EditLocationModal
            isOpen={locationModal.isOpen && locationModal.data?.type === "edit"}
            onClose={() => locationModal.close()}
            onSave={handleSaveEditedLocation}
            currentLocation={locationModal.data?.location || ""}
            existingLocations={country.locations || []}
            countryStartDate={country.startDate}
            countryEndDate={country.endDate}
            currentStartDate={editingLocationData?.startDate}
            currentEndDate={editingLocationData?.endDate}
          />
          <DeleteLocationModal
            isOpen={locationModal.isOpen && locationModal.data?.type === "delete"}
            onClose={() => {
              if (!isDeletingLocation) {
                locationModal.close();
              }
            }}
            onConfirm={handleDeleteLocationConfirm}
            location={locationModal.data?.location || ""}
            hasExpenses={
              trip && country
                ? hasExpensesWithLocation(trip.id, country.id, locationModal.data?.location || "")
                : false
            }
            isDeleting={isDeletingLocation}
          />
        </>
      )}
    </>
  );
}

