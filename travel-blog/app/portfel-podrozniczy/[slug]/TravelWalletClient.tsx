"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/shared/PageLayout";
import TravelWalletDashboard from "@/components/pages/TravelWalletDashboard";
import AddCountryModal from "@/components/pages/AddCountryModal";
import EditCountryModal from "@/components/pages/EditCountryModal";
import DeleteCountryModal from "@/components/pages/DeleteCountryModal";
import AddExpenseFromDashboardModal from "@/components/pages/AddExpenseFromDashboardModal";
import EditTripModal from "@/components/pages/EditTripModal";
import AddLocationModal from "@/components/pages/AddLocationModal";
import EditLocationModal from "@/components/pages/EditLocationModal";
import DeleteLocationModal from "@/components/pages/DeleteLocationModal";
import AddCurrencyTransactionModal from "@/components/pages/AddCurrencyTransactionModal";
import ExchangeRateVerificationModal from "@/components/pages/ExchangeRateVerificationModal";
import { useToast } from "@/components/ui/Toast";
import { setCurrentTrip, updateTrip } from "@/lib/travel-wallet/trips-storage";
import {
  addCountry,
  updateCountry,
  deleteCountry,
} from "@/lib/travel-wallet/countries-storage";
import {
  addExpense,
  saveExpense,
  deleteExpense,
  getExpenseById,
} from "@/lib/travel-wallet/expenses";
import {
  logExpenseAdded,
  logExpenseEdited,
  logExpenseDeleted,
  logCountryAdded,
  logCountryEdited,
  logCountryDeleted,
  logLocationAdded,
  logLocationEdited,
  logLocationDeleted,
  logTripEdited,
  logCurrencyTransactionAdded,
  logCurrencyTransactionDeleted,
} from "@/lib/travel-wallet/activity-log";
import {
  addLocationToCountry,
  updateLocationInCountry,
  removeLocationFromCountry,
  hasExpensesWithLocation,
} from "@/lib/travel-wallet/countries-storage";
import { updateExpenseLocation } from "@/lib/travel-wallet/expenses";
import { addCurrencyTransaction, deleteCurrencyTransaction, updateCurrencyTransaction } from "@/lib/travel-wallet/currency-transactions";
import { autoMigrateExpenses } from "@/lib/travel-wallet/migrate-expenses";
import { autoMigrateToV2 } from "@/lib/travel-wallet/migrations/v2-wallet-migration";
import { getBalancesWithBaseCurrency } from "@/lib/travel-wallet/wallet-operations";
import { getTripBySlug } from "@/lib/travel-wallet/trips-storage";
import { getEffectiveDashboardMode } from "@/lib/travel-wallet/dashboard-mode";
import { getWalletCurrencies } from "@/lib/travel-wallet/wallet-helpers";
import type { TravelWalletData, Country, CurrencyTransaction, Expense } from "@/lib/travel-wallet/types";
import { useTripData } from "@/lib/travel-wallet/hooks/useTripData";
import { useModalState } from "@/lib/travel-wallet/hooks/useModalState";
import { useSessionNotification } from "@/lib/travel-wallet/hooks/useSessionNotification";

interface TravelWalletClientProps {
  slug: string;
}

export default function TravelWalletClient({
  slug,
}: TravelWalletClientProps) {
  const router = useRouter();
  const { addToast } = useToast();
  
  // Use custom hooks
  const { trip, isLoading, refreshTrip } = useTripData(slug);
  useSessionNotification("newTripAdded", slug);
  
  const countryModal = useModalState<{
    type: "add" | "delete";
    country?: Country;
    startDate?: string;
    endDate?: string;
  }>();
  const editCountryModal = useModalState<Country>();
  const locationModal = useModalState<{
    type: "add" | "edit" | "delete";
    location?: string;
    countryId?: string;
    date?: string;
  }>();
  const expenseModal = useModalState<{ date?: string; expense?: Expense }>();
  const editTripModal = useModalState<void>();
  const currencyTransactionModal = useModalState<CurrencyTransaction | void>();
  const rateVerificationModal = useModalState<{
    transactionData: Omit<CurrencyTransaction, "id" | "tripId" | "rate">;
    verification: RateVerificationResult;
  }>();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingLocation, setIsDeletingLocation] = useState(false);
  
  // Memoized data
  const data = useMemo<TravelWalletData | null>(() => {
    if (!trip) return null;
    return {
      ...trip.data,
      countries: trip.data.countries.map(country => ({
        ...country,
        locations: country.locations ? country.locations.map(loc => 
          typeof loc === 'string' ? loc : { ...loc }
        ) : [],
      })),
    };
  }, [trip]);

  // Pobierz waluty dostępne w portfelu (z saldem > 0)
  // Uwzględnia tryb dashboardu i opcjonalne countryId z modalu transakcji
  const walletCurrencies = useMemo(() => {
    if (!data) return [];
    
    const effectiveMode = getEffectiveDashboardMode(data);
    const isMultiMode = effectiveMode === "multi-country";
    
    // W multi-country:
    // - Jeśli edytujemy transakcję z countryId, użyj go do filtrowania
    // - Jeśli dodajemy nową transakcję (brak countryId), użyj globalnych sald z portfela
    //   (suma wszystkich walut z wszystkich krajów, które mają saldo > 0)
    const countryIdForFilter = isMultiMode && currencyTransactionModal.data?.countryId
      ? currencyTransactionModal.data.countryId
      : undefined;
    
    const currencies = getWalletCurrencies(data, trip, countryIdForFilter);
    
    console.log('[TravelWalletClient] walletCurrencies calculated:', {
      effectiveMode,
      isMultiMode,
      countryIdForFilter,
      currencies,
      hasWallet: !!data.wallet,
      modalIsOpen: currencyTransactionModal.isOpen,
      modalData: currencyTransactionModal.data,
    });
    
    return currencies;
  }, [data, trip, currencyTransactionModal.data?.countryId, currencyTransactionModal.isOpen]);

  // Set current trip when trip changes and run migration
  useEffect(() => {
    if (isLoading) return; // Wait for loading to complete
    if (!trip) {
      router.push("/portfel-podrozniczy");
      return;
    }
    setCurrentTrip(trip.id);
    
    // Run auto-migrations on first load
    if (typeof window !== "undefined") {
      autoMigrateExpenses();
      autoMigrateToV2(); // Migrate to new wallet system
    }
  }, [trip, isLoading, router]);


  const handleAddCountry = useCallback((countryData: {
    name: string;
    location?: string;
    days: number;
    startDate?: string;
    endDate?: string;
    status: "visited" | "current" | "upcoming";
    budgets: { currency: string; amount: number }[];
    locations?: Array<{ name: string; startDate: string; endDate: string }>;
  }) => {
    if (!trip) return;

    const countryDataToSave = {
      ...countryData,
      location: countryData.location || "",
      locations: countryData.locations || [],
    };

    const success = addCountry(trip.id, countryDataToSave);
    
    if (success) {
      // Znajdź dodany kraj (najnowszy)
      const updatedTrip = trip.data.countries.length > 0 
        ? trip.data.countries[trip.data.countries.length - 1]
        : null;
      const newCountry = updatedTrip || { id: "", name: countryData.name };
      
      logCountryAdded(
        trip.id,
        newCountry.id || "unknown",
        countryData.name,
        countryData.startDate,
        countryData.endDate
      );
      addToast({
        type: "success",
        title: "Dodano kraj",
        message: `${countryData.name} został dodany do podróży`,
      });
      refreshTrip();
      countryModal.close();
    }
  }, [trip, refreshTrip, countryModal, addToast]);

  const handleEditCountry = useCallback((country: Country) => {
    editCountryModal.open(country);
  }, [editCountryModal]);

  const handleSaveEditedCountry = useCallback((countryId: string, updates: Partial<Country>) => {
    if (!trip) return;

    const country = data?.countries.find((c) => c.id === countryId);
    if (!country) return;

    // Przygotuj zmiany do logowania
    const changes: Record<string, unknown> = {};
    if (updates.name && updates.name !== country.name) changes.name = updates.name;
    if (updates.startDate !== undefined && updates.startDate !== country.startDate) changes.startDate = updates.startDate;
    if (updates.endDate !== undefined && updates.endDate !== country.endDate) changes.endDate = updates.endDate;
    if (updates.budgets && JSON.stringify(updates.budgets) !== JSON.stringify(country.budgets)) {
      changes.budgets = updates.budgets;
    }

    if (updateCountry(trip.id, countryId, updates)) {
      if (Object.keys(changes).length > 0) {
        logCountryEdited(trip.id, countryId, updates.name || country.name, changes);
      }
      addToast({
        type: "success",
        title: "Zaktualizowano kraj",
        message: `${updates.name || country.name} został zaktualizowany`,
      });
      refreshTrip();
      editCountryModal.close();
    }
  }, [trip, data, refreshTrip, editCountryModal, addToast]);

  const handleDeleteCountryRequest = useCallback((country: Country) => {
    countryModal.open({ type: "delete", country });
  }, [countryModal]);

  const handleDeleteCountryConfirm = useCallback(async () => {
    if (!countryModal.data?.country || !trip) return;

    setIsDeleting(true);
    try {
      const countryName = countryModal.data.country.name;
      if (deleteCountry(trip.id, countryModal.data.country.id)) {
        logCountryDeleted(trip.id, countryModal.data.country.id, countryName);
        addToast({
          type: "success",
          title: "Usunięto kraj",
          message: `${countryName} został usunięty z podróży`,
        });
        refreshTrip();
        countryModal.close();
      }
    } finally {
      setIsDeleting(false);
    }
  }, [countryModal, trip, refreshTrip, addToast]);

  const handleAddBudget = useCallback((country: Country) => {
    // TODO: Implement AddBudgetModal
  }, []);

  const handleReduceBudget = useCallback((country: Country) => {
    // TODO: Implement EditBudgetModal
  }, []);

  const handleAddExpense = useCallback((date?: string) => {
    expenseModal.open({ date });
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

    const country = data?.countries.find((c) => c.id === expenseData.countryId);
    const countryName = country?.name || "Nieznany kraj";

    if (expenseData.id) {
      // Edycja wydatku
      const existingExpense = getExpenseById(expenseData.id, trip.id);
      if (existingExpense) {
        const changes: Record<string, unknown> = {};
        if (existingExpense.amount !== expenseData.amount) changes.amount = expenseData.amount;
        if (existingExpense.currency !== expenseData.currency) changes.currency = expenseData.currency;
        if (existingExpense.category !== expenseData.category) changes.category = expenseData.category;
        if (existingExpense.description !== expenseData.description) changes.description = expenseData.description;
        if (existingExpense.date !== expenseData.date) changes.date = expenseData.date;
        if (existingExpense.location !== expenseData.location) changes.location = expenseData.location;

        saveExpense({ ...expenseData, id: expenseData.id } as any, trip.id);
        logExpenseEdited(trip.id, expenseData.id, countryName, changes);
        addToast({
          type: "success",
          title: "Zaktualizowano",
          message: `Wydatek został zaktualizowany`,
        });
      }
    } else {
      // Dodanie wydatku
      const newExpense = addExpense(expenseData, trip.id);
      logExpenseAdded(
        trip.id,
        newExpense.id,
        countryName,
        expenseData.amount,
        expenseData.currency,
        expenseData.description
      );
      addToast({
        type: "success",
        title: "Dodano wydatek",
        message: `${expenseData.amount} ${expenseData.currency} - ${expenseData.description || expenseData.category}`,
      });
    }

    refreshTrip();
    expenseModal.close();
  }, [trip, data, refreshTrip, expenseModal, addToast]);

  const handleEditTrip = useCallback(() => {
    editTripModal.open();
  }, [editTripModal]);

  const handleAddCurrencyTransaction = useCallback(() => {
    currencyTransactionModal.open();
  }, [currencyTransactionModal]);

  const handleSaveCurrencyTransaction = useCallback((
    transactionData: Omit<CurrencyTransaction, "id" | "tripId" | "rate">,
    transactionId?: string
  ) => {
    if (!trip) return;

    // Jeśli jest transactionId, to edycja
    if (transactionId) {
      const success = updateCurrencyTransaction(trip.id, transactionId, transactionData);
      if (success) {
        refreshTrip();
        currencyTransactionModal.close();
        addToast({
          type: "success",
          title: "Sukces",
          message: "Transakcja walutowa została zaktualizowana",
        });
      }
      return;
    }

    // Weryfikacja kursów jest teraz w AddCurrencyTransactionModal
    // Tutaj tylko zapisujemy transakcję
    const success = addCurrencyTransaction(trip.id, transactionData);
    if (success) {
      // Pobierz dodaną transakcję (najnowsza)
      const transactions = require("@/lib/travel-wallet/currency-transactions").getCurrencyTransactions(trip.id);
      const newTransaction = transactions[transactions.length - 1];
      
      if (newTransaction) {
        logCurrencyTransactionAdded(
          trip.id,
          newTransaction.id,
          transactionData.fromCurrency,
          transactionData.fromAmount,
          transactionData.toCurrency,
          transactionData.toAmount
        );
      }
      
      refreshTrip();
      currencyTransactionModal.close();
      addToast({
        type: "success",
        title: "Sukces",
        message: "Transakcja walutowa została dodana",
      });
    }
  }, [trip, refreshTrip, currencyTransactionModal, addToast]);

  const handleEditCurrencyTransaction = useCallback((transaction: CurrencyTransaction) => {
    currencyTransactionModal.open(transaction);
  }, [currencyTransactionModal]);

  // Handler dla potwierdzenia weryfikacji - zapisz transakcję mimo ostrzeżenia
  const handleConfirmRateVerification = useCallback(() => {
    if (!rateVerificationModal.data) return;
    if (!trip) return;

    const { transactionData } = rateVerificationModal.data;
    const success = addCurrencyTransaction(trip.id, transactionData);
    
    if (success) {
      const transactions = require("@/lib/travel-wallet/currency-transactions").getCurrencyTransactions(trip.id);
      const newTransaction = transactions[transactions.length - 1];
      
      if (newTransaction) {
        logCurrencyTransactionAdded(
          trip.id,
          newTransaction.id,
          transactionData.fromCurrency,
          transactionData.fromAmount,
          transactionData.toCurrency,
          transactionData.toAmount
        );
      }
      
      refreshTrip();
      currencyTransactionModal.close();
      rateVerificationModal.close();
      addToast({
        type: "success",
        title: "Sukces",
        message: "Transakcja walutowa została dodana",
      });
    }
  }, [trip, refreshTrip, currencyTransactionModal, rateVerificationModal, addToast]);

  const handleDeleteCurrencyTransaction = useCallback((transactionId: string) => {
    if (!trip) return;

    // Pobierz transakcję przed usunięciem
    const { getCurrencyTransactionById } = require("@/lib/travel-wallet/currency-transactions");
    const transaction = getCurrencyTransactionById(trip.id, transactionId);
    
    const success = deleteCurrencyTransaction(trip.id, transactionId);
    if (success) {
      if (transaction) {
        logCurrencyTransactionDeleted(
          trip.id,
          transactionId,
          transaction.fromCurrency,
          transaction.fromAmount,
          transaction.toCurrency,
          transaction.toAmount
        );
      }
      
      refreshTrip();
      addToast({
        type: "success",
        title: "Usunięto",
        message: "Transakcja walutowa została usunięta",
      });
    }
  }, [trip, refreshTrip, addToast]);

  const handleEditExpense = useCallback((expense: Expense) => {
    expenseModal.open({ date: expense.date });
    // TODO: Przekaż expense do modala (wymaga modyfikacji AddExpenseFromDashboardModal)
  }, [expenseModal]);

  const handleDeleteExpense = useCallback((expense: Expense) => {
    if (!trip) return;

    const country = data?.countries.find((c) => c.id === expense.countryId);
    const countryName = country?.name || "Nieznany kraj";

    if (deleteExpense(expense.id, trip.id)) {
      logExpenseDeleted(trip.id, expense.id, countryName, expense.amount, expense.currency);
      addToast({
        type: "success",
        title: "Usunięto wydatek",
        message: `Wydatek ${expense.amount} ${expense.currency} został usunięty`,
      });
      refreshTrip();
    }
  }, [trip, data, refreshTrip, addToast]);

  const handleSaveTrip = useCallback((tripData: {
    name: string;
    startDate?: string;
    endDate?: string;
    totalBudget?: number;
    userName?: string;
    dashboardMode?: "multi-country" | "single-country" | "single-location" | "auto";
  }) => {
    if (!trip) return;

    // Aktualizuj dane podróży
    const updatedData: TravelWalletData = {
      ...trip.data,
      totalBudget: tripData.totalBudget,
      userName: tripData.userName,
      dashboardMode: tripData.dashboardMode,
    };

    // Przygotuj aktualizacje
    const updates: Partial<typeof trip> = {
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

    // Sprawdź zmiany
    const changes: Record<string, unknown> = {};
    if (trip.name !== tripData.name) changes.name = tripData.name;
    if (trip.startDate !== tripData.startDate) changes.startDate = tripData.startDate;
    if (trip.endDate !== tripData.endDate) changes.endDate = tripData.endDate;
    if (trip.data.totalBudget !== tripData.totalBudget) changes.totalBudget = tripData.totalBudget;
    if (trip.data.userName !== tripData.userName) changes.userName = tripData.userName;

    if (updateTrip(trip.id, updates)) {
      if (Object.keys(changes).length > 0) {
        logTripEdited(trip.id, tripData.name, changes);
      }
      
      // Sprawdź czy daty zostały rozszerzone i czy są niewybrane daty
      const hasDateExtension = (tripData.startDate && trip.startDate && new Date(tripData.startDate) < new Date(trip.startDate)) ||
        (tripData.endDate && trip.endDate && new Date(tripData.endDate) > new Date(trip.endDate));
      
      addToast({
        type: "success",
        title: "Zapisano zmiany",
        message: hasDateExtension 
          ? "Podróż została zaktualizowana. Możesz teraz dodać kraj w nowe dni."
          : "Zmiany w podróży zostały zapisane",
      });
      
      refreshTrip();
      editTripModal.close();
    }
  }, [trip, refreshTrip, editTripModal, addToast]);

  const handleDeleteCountryFromTrip = useCallback((countryId: string) => {
    if (!trip) return;

    if (deleteCountry(trip.id, countryId)) {
      refreshTrip();
    }
  }, [trip, refreshTrip]);

  const handleAddLocationFromExpense = useCallback((countryId: string, date: string) => {
    locationModal.open({ type: "add", countryId, date });
    expenseModal.close();
  }, [locationModal, expenseModal]);

  const handleAddLocation = useCallback(() => {
    // Jeśli jest tylko jeden kraj, użyj jego ID
    if (data && data.countries.length === 1) {
      locationModal.open({ type: "add", countryId: data.countries[0].id });
    }
  }, [data, locationModal]);

  const handleSaveLocation = useCallback((location: string, startDate: string, endDate: string) => {
    if (!trip || !locationModal.data?.countryId) return;

    const country = data?.countries.find((c) => c.id === locationModal.data?.countryId);
    const countryName = country?.name || "Nieznany kraj";

    if (addLocationToCountry(trip.id, locationModal.data.countryId, location, startDate, endDate)) {
      logLocationAdded(trip.id, locationModal.data.countryId, countryName, location, startDate, endDate);
      addToast({
        type: "success",
        title: "Dodano miejsce",
        message: `${location} został dodany do ${countryName}`,
      });
      refreshTrip();
      const wasFromExpense = !!locationModal.data.date;
      locationModal.close();
      
      // Wróć do modala wydatku (jeśli był otwarty)
      if (wasFromExpense) {
        expenseModal.open({ date: locationModal.data.date });
      }
    }
  }, [trip, data, locationModal, refreshTrip, expenseModal, addToast]);

  const handleEditLocation = useCallback((location: string) => {
    // Jeśli jest tylko jeden kraj, użyj jego ID
    if (data && data.countries.length === 1) {
      locationModal.open({ type: "edit", location, countryId: data.countries[0].id });
    }
  }, [data, locationModal]);

  const handleSaveEditedLocation = useCallback((newLocation: string, startDate: string, endDate: string) => {
    if (!trip || !locationModal.data?.countryId || !locationModal.data?.location) return;
    
    const country = data?.countries.find((c) => c.id === locationModal.data?.countryId);
    const countryName = country?.name || "Nieznany kraj";
    const oldLocationName = locationModal.data.location;
    
    if (updateLocationInCountry(trip.id, locationModal.data.countryId, locationModal.data.location, newLocation, startDate, endDate)) {
      // Zaktualizuj lokalizację w wydatkach (tylko jeśli zmieniono nazwę)
      if (newLocation !== locationModal.data.location) {
        updateExpenseLocation(trip.id, locationModal.data.countryId, locationModal.data.location, newLocation);
      }
      
      const changes: Record<string, unknown> = {};
      if (newLocation !== oldLocationName) changes.name = newLocation;
      if (startDate) changes.startDate = startDate;
      if (endDate) changes.endDate = endDate;
      
      logLocationEdited(trip.id, locationModal.data.countryId, countryName, oldLocationName, newLocation, changes);
      addToast({
        type: "success",
        title: "Zaktualizowano miejsce",
        message: `${oldLocationName} został zaktualizowany`,
      });
      refreshTrip();
      locationModal.close();
    }
  }, [trip, data, locationModal, refreshTrip, addToast]);

  const handleDeleteLocation = useCallback((location: string) => {
    // Jeśli jest tylko jeden kraj, użyj jego ID
    if (data && data.countries.length === 1) {
      locationModal.open({ type: "delete", location, countryId: data.countries[0].id });
    }
  }, [data, locationModal]);

  const handleDeleteLocationConfirm = useCallback(() => {
    if (!trip || !locationModal.data?.countryId || !locationModal.data?.location) return;
    
    const country = data?.countries.find((c) => c.id === locationModal.data?.countryId);
    const countryName = country?.name || "Nieznany kraj";
    const locationName = locationModal.data.location;
    
    setIsDeletingLocation(true);
    try {
      if (removeLocationFromCountry(trip.id, locationModal.data.countryId, locationModal.data.location)) {
        logLocationDeleted(trip.id, locationModal.data.countryId, countryName, locationName);
        addToast({
          type: "success",
          title: "Usunięto miejsce",
          message: `${locationName} został usunięty z ${countryName}`,
        });
        refreshTrip();
        locationModal.close();
      }
    } finally {
      setIsDeletingLocation(false);
    }
  }, [trip, data, locationModal, refreshTrip, addToast]);

  // Memoize pending country for location modals
  const pendingCountry = useMemo(
    () => data?.countries.find((c) => c.id === locationModal.data?.countryId),
    [data, locationModal.data?.countryId]
  );

  // Memoize location data for edit modal
  const editingLocationData = useMemo(() => {
    if (!locationModal.data?.location || !pendingCountry) return null;
    const loc = pendingCountry.locations?.find((loc) => {
      const name = typeof loc === "string" ? loc : loc.name;
      return name === locationModal.data.location;
    });
    return loc && typeof loc !== "string" ? loc : null;
  }, [locationModal.data?.location, pendingCountry]);

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
          tripId={trip?.id}
          tripName={trip?.name}
          tripStartDate={trip?.startDate}
          tripEndDate={trip?.endDate}
          onAddCountry={(startDate, endDate) => {
            countryModal.open({ type: "add", startDate, endDate });
          }}
          onEditCountry={handleEditCountry}
          onDeleteCountry={handleDeleteCountryRequest}
          onAddBudget={handleAddBudget}
          onReduceBudget={handleReduceBudget}
          onAddExpense={handleAddExpense}
          onEditExpense={handleEditExpense}
          onDeleteExpense={handleDeleteExpense}
          onAddLocation={handleAddLocation}
          onEditLocation={handleEditLocation}
          onDeleteLocation={handleDeleteLocation}
          onEditTrip={handleEditTrip}
          onAddCurrencyTransaction={handleAddCurrencyTransaction}
          onDeleteCurrencyTransaction={handleDeleteCurrencyTransaction}
          onEditCurrencyTransaction={handleEditCurrencyTransaction}
        />
      </PageLayout>

      <AddCountryModal
        isOpen={countryModal.isOpen && countryModal.data?.type === "add"}
        onClose={() => countryModal.close()}
        onSave={handleAddCountry}
        initialStartDate={countryModal.data?.startDate}
        initialEndDate={countryModal.data?.endDate}
        tripStartDate={trip?.startDate}
        tripEndDate={trip?.endDate}
        existingCountries={data?.countries || []}
        tripData={data || undefined}
        totalBudget={trip?.data.totalBudget}
      />

      <DeleteCountryModal
        isOpen={countryModal.isOpen && countryModal.data?.type === "delete"}
        onClose={() => {
          if (!isDeleting) {
            countryModal.close();
          }
        }}
        onConfirm={handleDeleteCountryConfirm}
        country={countryModal.data?.country || null}
        isDeleting={isDeleting}
      />

      <EditCountryModal
        isOpen={editCountryModal.isOpen}
        onClose={() => editCountryModal.close()}
        onSave={handleSaveEditedCountry}
        country={editCountryModal.data || null}
        tripStartDate={trip?.startDate}
        tripEndDate={trip?.endDate}
        tripData={data || undefined}
        totalBudget={trip?.data.totalBudget}
      />

      {data && (
        <>
          <AddExpenseFromDashboardModal
            isOpen={expenseModal.isOpen}
            onClose={() => expenseModal.close()}
            onSave={handleSaveExpense}
            data={data}
            tripId={trip?.id || ""}
            initialDate={expenseModal.data?.date}
            tripStartDate={trip?.startDate}
            tripEndDate={trip?.endDate}
            onAddLocation={handleAddLocationFromExpense}
            onAddCountry={() => {
              expenseModal.close();
              countryModal.open({ type: "add" });
            }}
          />

          <EditTripModal
            isOpen={editTripModal.isOpen}
            onClose={() => editTripModal.close()}
            onSave={handleSaveTrip}
            trip={trip}
            onDeleteCountry={handleDeleteCountryFromTrip}
            onAddCountry={(startDate, endDate) => {
              editTripModal.close();
              countryModal.open({ type: "add", startDate, endDate });
            }}
          />

          {locationModal.data?.countryId && pendingCountry && (
            <>
              <AddLocationModal
                isOpen={locationModal.isOpen && locationModal.data.type === "add"}
                onClose={() => locationModal.close()}
                onSave={handleSaveLocation}
                existingLocations={pendingCountry.locations || []}
                countryStartDate={pendingCountry.startDate}
                countryEndDate={pendingCountry.endDate}
                initialDate={locationModal.data.date}
              />
              <EditLocationModal
                isOpen={locationModal.isOpen && locationModal.data.type === "edit"}
                onClose={() => locationModal.close()}
                onSave={handleSaveEditedLocation}
                existingLocations={pendingCountry.locations || []}
                currentLocation={locationModal.data.location || ""}
                currentStartDate={editingLocationData?.startDate}
                currentEndDate={editingLocationData?.endDate}
                countryStartDate={pendingCountry.startDate}
                countryEndDate={pendingCountry.endDate}
              />
              <DeleteLocationModal
                isOpen={locationModal.isOpen && locationModal.data.type === "delete"}
                onClose={() => {
                  if (!isDeletingLocation) {
                    locationModal.close();
                  }
                }}
                onConfirm={handleDeleteLocationConfirm}
                location={locationModal.data.location || ""}
                hasExpenses={
                  trip
                    ? hasExpensesWithLocation(trip.id, locationModal.data.countryId, locationModal.data.location || "")
                    : false
                }
                isDeleting={isDeletingLocation}
              />
            </>
          )}

          <AddCurrencyTransactionModal
            isOpen={currencyTransactionModal.isOpen}
            onClose={() => currencyTransactionModal.close()}
            onSave={handleSaveCurrencyTransaction}
            slug={slug}
            transaction={currencyTransactionModal.data}
            walletCurrencies={walletCurrencies}
            tripId={trip?.id}
            countryId={(() => {
              // W trybie single-country, użyj ID pierwszego (i jedynego) kraju
              const effectiveMode = getEffectiveDashboardMode(data);
              if (effectiveMode === "single-country" && data.countries.length === 1) {
                return data.countries[0].id;
              }
              // W trybie multi-country, użyj countryId z transakcji (jeśli edytujemy) lub undefined
              return currencyTransactionModal.data?.countryId;
            })()}
          />

          <ExchangeRateVerificationModal
            isOpen={rateVerificationModal.isOpen}
            onClose={() => rateVerificationModal.close()}
            onConfirm={handleConfirmRateVerification}
            verification={rateVerificationModal.data?.verification || {
              isValid: true,
              transactionRate: 0,
              referenceRate: null,
              differencePercent: null,
              isAboveLimit: false,
              isBelowLimit: false,
            }}
            fromCurrency={rateVerificationModal.data?.transactionData.fromCurrency || ""}
            toCurrency={rateVerificationModal.data?.transactionData.toCurrency || ""}
            fromAmount={rateVerificationModal.data?.transactionData.fromAmount || 0}
            toAmount={rateVerificationModal.data?.transactionData.toAmount || 0}
          />
        </>
      )}
    </>
  );
}

