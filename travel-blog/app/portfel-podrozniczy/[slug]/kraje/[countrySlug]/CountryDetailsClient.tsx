"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import CountryDetails from "@/components/pages/CountryDetails";
import EditCountryModal from "@/components/pages/EditCountryModal";
import AddExpenseModal from "@/components/pages/AddExpenseModal";
import DeleteExpenseModal from "@/components/pages/DeleteExpenseModal";
import AddLocationModal from "@/components/pages/AddLocationModal";
import EditLocationModal from "@/components/pages/EditLocationModal";
import DeleteLocationModal from "@/components/pages/DeleteLocationModal";
import AddCurrencyTransactionModal from "@/components/pages/AddCurrencyTransactionModal";
import TransactionDetailsModal from "@/components/pages/TransactionDetailsModal";
import { getCountryBySlug } from "@/lib/travel-wallet/countries";
import {
  getExpensesByCountryId,
  addExpense,
  saveExpense,
  deleteExpense,
} from "@/lib/travel-wallet/expenses";
import { getCurrencyTransactionsByCountry, addCurrencyTransaction, updateCurrencyTransaction, deleteCurrencyTransaction, getCurrencyTransactions } from "@/lib/travel-wallet/currency-transactions";
import { logCurrencyTransactionAdded } from "@/lib/travel-wallet/activity-log";
import {
  addLocationToCountry,
  updateLocationInCountry,
  removeLocationFromCountry,
  hasExpensesWithLocation,
  updateCountry,
} from "@/lib/travel-wallet/countries-storage";
import { updateExpenseLocation } from "@/lib/travel-wallet/expenses";
import type { Country, Expense, TravelWalletData, CurrencyTransaction } from "@/lib/travel-wallet/types";
import { useTripData } from "@/lib/travel-wallet/hooks/useTripData";
import { useModalState } from "@/lib/travel-wallet/hooks/useModalState";
import { useToast } from "@/components/ui/Toast";
import { calculateTotalBudget } from "@/lib/travel-wallet/calculations";

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
  const { trip, isLoading: isTripLoading, status } = useTripData(slug);
  const { addToast } = useToast();
  
  const [country, setCountry] = useState<Country | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isDeletingLocation, setIsDeletingLocation] = useState(false);
  
  // Pełne dane podróży
  const data = useMemo(() => {
    if (!trip) return null;
    return trip.data;
  }, [trip]);
  
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
  const currencyTransactionModal = useModalState<CurrencyTransaction | void>();
  const editCountryModal = useModalState<void>();
  const [selectedTransaction, setSelectedTransaction] = useState<CurrencyTransaction | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Obsługa URL params - jeśli jest ?date=, otwórz modal
  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      expenseModal.open({ date: dateParam });
    }
  }, [searchParams, expenseModal]);

  // Funkcje pomocnicze do odświeżania danych (używane w callbackach)
  const loadCountry = useCallback(() => {
    if (!trip) return;
    const foundCountry = getCountryBySlug(countrySlug, trip.id);
    setCountry(foundCountry);
  }, [trip, countrySlug]);

  const loadExpenses = useCallback(() => {
    if (!country || !trip) return;
    const countryExpenses = getExpensesByCountryId(country.id, trip.id);
    setExpenses(countryExpenses);
  }, [country, trip]);

  // Odśwież dane po zmianach (dla transakcji walutowych)
  const refreshData = useCallback(() => {
    if (!trip) return;
    const foundCountry = getCountryBySlug(countrySlug, trip.id);
    setCountry(foundCountry);
    
    // Ładuj wydatki gdy kraj jest dostępny
    if (foundCountry) {
      const countryExpenses = getExpensesByCountryId(foundCountry.id, trip.id);
      setExpenses(countryExpenses);
    }
  }, [trip, countrySlug]);

  // Zoptymalizowane ładowanie: jeden useEffect dla kraju i wydatków
  useEffect(() => {
    if (isTripLoading) return; // Wait for trip to load

    // Jeśli mamy tylko wpis w indeksie i brak pełnych danych offline – nie przekierowuj, pokaż komunikat niżej.
    if (!trip && status === "offlineIndexOnly") {
      return;
    }

    if (!trip) {
      router.push("/portfel-podrozniczy");
      return;
    }
    
    const foundCountry = getCountryBySlug(countrySlug, trip.id);
    setCountry(foundCountry);
    
    // Ładuj wydatki gdy kraj jest dostępny
    if (foundCountry) {
      const countryExpenses = getExpensesByCountryId(foundCountry.id, trip.id);
      setExpenses(countryExpenses);
    }
  }, [countrySlug, trip, router, isTripLoading, status]);

  // Transakcje walutowe dla kraju
  const transactions = useMemo(() => {
    if (!trip?.id || !country) return [];
    return getCurrencyTransactionsByCountry(trip.id, country.id);
  }, [trip?.id, country?.id, data]); // Dodaj data do zależności aby odświeżać po zmianach


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
    endDate?: string;
    note?: string;
    location?: string;
    tripId?: string;
    accommodationType?: string;
    paymentMethod?: { type: "card" | "cash" | "bank-withdrawal"; sourceCurrency?: string };
  }) => {
    if (!trip) return;

    if (expenseData.id) {
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
        ...(expenseData.endDate ? { endDate: expenseData.endDate } : {}),
        ...(expenseData.category === "Noclegi" && expenseData.accommodationType
          ? { accommodationType: expenseData.accommodationType }
          : {}),
        ...(expenseData.paymentMethod ? { paymentMethod: expenseData.paymentMethod } : {}),
      };
      saveExpense(expense, trip.id);
    } else {
      addExpense(
        {
          ...expenseData,
          tripId: trip.id,
          ...(expenseData.paymentMethod ? { paymentMethod: expenseData.paymentMethod } : {}),
        },
        trip.id
      );
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
    
    const expense = deleteExpenseModal.data;
    deleteExpense(expense.id, trip.id);
    loadExpenses();
    deleteExpenseModal.close();
    addToast({
      type: "success",
      title: "Usunięto wydatek",
      message: `Wydatek ${expense.amount} ${expense.currency} został usunięty`,
    });
  }, [deleteExpenseModal, trip, loadExpenses, addToast]);

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
    const data = locationModal.data;
    if (!data?.location || !country) return null;
    const loc = country.locations?.find((loc) => {
      const name = typeof loc === "string" ? loc : loc.name;
      return name === data.location;
    });
    return loc && typeof loc !== "string" ? loc : null;
  }, [locationModal.data?.location, country]);

  // Handlery dla transakcji walutowych
  const handleTransactionClick = useCallback((transaction: CurrencyTransaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsModalOpen(true);
  }, []);

  const handleAddCurrencyTransaction = useCallback(() => {
    currencyTransactionModal.open();
  }, [currencyTransactionModal]);

  const handleSaveCurrencyTransaction = useCallback((transactionData: Omit<CurrencyTransaction, "id" | "tripId" | "rate">) => {
    if (!trip || !country) return;

    
    // Ustaw countryId na aktualny kraj
    const transactionWithCountry = {
      ...transactionData,
      countryId: country.id,
    };

    if (currencyTransactionModal.data && typeof currencyTransactionModal.data === "object" && "id" in currencyTransactionModal.data) {
      // Edycja
      const success = updateCurrencyTransaction(trip.id, currencyTransactionModal.data.id, transactionWithCountry);
      if (success) {
        refreshData(); // Odśwież dane (mogły się zmienić salda)
        currencyTransactionModal.close();
        addToast({
          type: "success",
          title: "Sukces",
          message: "Transakcja walutowa została zaktualizowana",
        });
      }
    } else {
      // Dodawanie
      const success = addCurrencyTransaction(trip.id, transactionWithCountry);
      if (success) {
        // Pobierz dodaną transakcję (najnowsza) i zaloguj
        const transactions = getCurrencyTransactions(trip.id);
        const newTransaction = transactions[transactions.length - 1];
        
        if (newTransaction) {
          logCurrencyTransactionAdded(
            trip.id,
            newTransaction.id,
            {
              fromCurrency: transactionWithCountry.fromCurrency,
              fromAmount: transactionWithCountry.fromAmount,
              toCurrency: transactionWithCountry.toCurrency,
              toAmount: transactionWithCountry.toAmount,
              date: transactionWithCountry.date,
              countryId: transactionWithCountry.countryId,
              location: transactionWithCountry.location,
              fee: transactionWithCountry.fee,
              feeCurrency: transactionWithCountry.feeCurrency,
              type: transactionWithCountry.type,
            }
          );
        }
        
        refreshData(); // Odśwież dane (mogły się zmienić salda)
        currencyTransactionModal.close();
        addToast({
          type: "success",
          title: "Sukces",
          message: "Transakcja walutowa została dodana",
        });
      }
    }
  }, [trip, country, currencyTransactionModal, refreshData, addToast]);

  const handleDeleteCurrencyTransaction = useCallback((transactionId: string) => {
    if (!trip) return;

    const success = deleteCurrencyTransaction(trip.id, transactionId);
    if (success) {
      refreshData(); // Odśwież dane (mogły się zmienić salda)
      addToast({
        type: "success",
        title: "Usunięto",
        message: "Transakcja walutowa została usunięta",
      });
    }
  }, [trip, refreshData, addToast]);

  const handleEditCurrencyTransaction = useCallback((transaction: CurrencyTransaction) => {
    currencyTransactionModal.open(transaction);
  }, [currencyTransactionModal]);

  const handleSaveEditedCountry = useCallback((countryId: string, updates: Partial<Country>) => {
    if (!trip) return;
    if (updateCountry(trip.id, countryId, updates)) {
      loadCountry();
      editCountryModal.close();
      addToast({
        type: "success",
        title: "Zapisano",
        message: "Dane kraju zostały zaktualizowane",
      });
    }
  }, [trip, loadCountry, editCountryModal, addToast]);

  const handleDisplayCurrencyChange = useCallback((displayCurrency: string) => {
    if (!trip || !country) return;
    if (updateCountry(trip.id, country.id, { displayCurrency })) {
      loadCountry();
      addToast({
        type: "success",
        title: "Zapisano",
        message: "Waluta wyświetlania została zmieniona",
      });
    }
  }, [trip, country, loadCountry, addToast]);

  if (isTripLoading) {
    return (
      <PageLayout maxWidth="4xl">
        <Breadcrumbs
          items={[
            { label: "Portfel podróżniczy", href: "/portfel-podrozniczy" },
            { label: "Dashboard", href: `/portfel-podrozniczy/${slug}` },
            { label: "Kraje", href: `/portfel-podrozniczy/${slug}/kraje` },
            { label: "Ładowanie..." },
          ]}
          className="mb-6"
        />
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
    // Specjalny przypadek: podróż/kraj są tylko w indeksie, ale brak pełnych danych offline.
    if (status === "offlineIndexOnly") {
      return (
        <PageLayout maxWidth="4xl">
          <Breadcrumbs
            items={[
              { label: "Portfel podróżniczy", href: "/portfel-podrozniczy" },
              { label: "Dashboard", href: `/portfel-podrozniczy/${slug}` },
              { label: "Kraje", href: `/portfel-podrozniczy/${slug}/kraje` },
              { label: "Offline" },
            ]}
            className="mb-6"
          />
          <PageHeader
            title="Dane kraju niedostępne offline"
            subtitle="Ta część podróży wymaga połączenia z internetem."
          />
          <div className="text-center py-12">
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Szczegóły kraju są dostępne tylko online.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Połącz się z internetem, aby załadować dane i kontynuować pracę.
            </p>
          </div>
        </PageLayout>
      );
    }

    return (
      <PageLayout maxWidth="4xl">
        <Breadcrumbs
          items={[
            { label: "Portfel podróżniczy", href: "/portfel-podrozniczy" },
            { label: "Dashboard", href: `/portfel-podrozniczy/${slug}` },
            { label: "Kraje", href: `/portfel-podrozniczy/${slug}/kraje` },
            { label: "Nie znaleziono" },
          ]}
          className="mb-6"
        />
        <PageHeader
          title="Kraj nie znaleziony"
          subtitle="Nie udało się znaleźć kraju o podanym ID"
        />
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Kraj o slug &quot;{countrySlug}&quot; nie został znaleziony.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout maxWidth="4xl">
        {/* Breadcrumbs */}
        {country && (
          <Breadcrumbs
            items={[
              { label: "Portfel podróżniczy", href: "/portfel-podrozniczy" },
              { label: "Dashboard", href: `/portfel-podrozniczy/${slug}` },
              { label: "Kraje", href: `/portfel-podrozniczy/${slug}/kraje` },
              { label: country.name },
            ]}
            className="mb-6"
          />
        )}

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
              data={data || undefined}
              tripName={trip?.name}
              tripStartDate={trip?.startDate}
              tripEndDate={trip?.endDate}
              transactions={transactions}
              onAddCurrencyTransaction={handleAddCurrencyTransaction}
              onDeleteCurrencyTransaction={handleDeleteCurrencyTransaction}
              onEditCurrencyTransaction={handleEditCurrencyTransaction}
              onTransactionClick={handleTransactionClick}
              onEditCountry={data?.countries && data.countries.length > 1 ? () => editCountryModal.open() : undefined}
              onDisplayCurrencyChange={data?.countries && data.countries.length > 1 ? handleDisplayCurrencyChange : undefined}
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
            tripId={trip?.id}
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
          <AddCurrencyTransactionModal
            isOpen={currencyTransactionModal.isOpen}
            onClose={() => currencyTransactionModal.close()}
            onSave={handleSaveCurrencyTransaction}
            countryId={country?.id}
            slug={slug}
            tripId={trip?.id}
            transaction={currencyTransactionModal.data && typeof currencyTransactionModal.data === "object" && "id" in currencyTransactionModal.data ? currencyTransactionModal.data : undefined}
          />
          <TransactionDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedTransaction(null);
            }}
            transaction={selectedTransaction}
          />
          <EditCountryModal
            isOpen={editCountryModal.isOpen}
            onClose={() => editCountryModal.close()}
            onSave={handleSaveEditedCountry}
            country={country}
            tripStartDate={trip?.startDate}
            tripEndDate={trip?.endDate}
            tripData={data || undefined}
            totalBudget={data && trip ? (data.totalBudget ?? calculateTotalBudget(data, trip.id)) : undefined}
          />
        </>
      )}
    </>
  );
}

