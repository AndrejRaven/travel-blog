"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import CountriesList from "@/components/pages/CountriesList";
import AddCountryModal from "@/components/pages/AddCountryModal";
import EditCountryModal from "@/components/pages/EditCountryModal";
import Button from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { getAllCountries } from "@/lib/travel-wallet/countries";
import { getTripBySlug } from "@/lib/travel-wallet/trips-storage";
import { addCountry, updateCountry } from "@/lib/travel-wallet/countries-storage";
import { formatDateRange } from "@/lib/travel-wallet/countries";
import { calculateTotalBudget, calculateTotalPlannedCountryBudgets } from "@/lib/travel-wallet/calculations";
import { formatCurrency } from "@/lib/travel-wallet/formatters";
import { getCurrencyName } from "@/lib/travel-wallet/currency-names";
import type { Country, Trip } from "@/lib/travel-wallet/types";
import { useModalState } from "@/lib/travel-wallet/hooks/useModalState";
import { useToast } from "@/components/ui/Toast";

interface CountriesListClientProps {
  slug: string;
}

export default function CountriesListClient({
  slug,
}: CountriesListClientProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const addCountryModal = useModalState<{ startDate?: string; endDate?: string }>();
  const editCountryModal = useModalState<Country>();

  const refresh = useCallback(() => {
    const currentTrip = getTripBySlug(slug);
    if (currentTrip) {
      setTrip(currentTrip);
      setCountries(getAllCountries(currentTrip.id));
    }
  }, [slug]);

  useEffect(() => {
    const currentTrip = getTripBySlug(slug);
    if (!currentTrip) {
      router.push("/portfel-podrozniczy");
      return;
    }

    setTrip(currentTrip);
    setCountries(getAllCountries(currentTrip.id));
    setIsLoading(false);
  }, [slug, router]);

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

    const success = addCountry(trip.id, {
      ...countryData,
      location: countryData.location || "",
      locations: countryData.locations || [],
    });

    if (success) {
      addToast({
        type: "success",
        title: "Dodano kraj",
        message: `${countryData.name} został dodany do podróży`,
      });
      refresh();
      addCountryModal.close();
    }
  }, [trip, refresh, addCountryModal, addToast]);

  const handleSaveEditedCountry = useCallback((countryId: string, updates: Partial<Country>) => {
    if (!trip) return;
    const country = trip.data.countries.find((c) => c.id === countryId);
    if (updateCountry(trip.id, countryId, updates)) {
      addToast({
        type: "success",
        title: "Zapisano",
        message: "Dane kraju zostały zaktualizowane",
      });
      refresh();
      editCountryModal.close();
    }
  }, [trip, refresh, editCountryModal, addToast]);

  if (isLoading) {
    return (
      <PageLayout maxWidth="6xl">
        <PageHeader
          title="Kraje"
          subtitle="Lista wszystkich krajów w portfelu podróżniczym"
        />
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Ładowanie danych...
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth="6xl">
      <Breadcrumbs
        items={[
          { label: "Portfel podróżniczy", href: "/portfel-podrozniczy" },
          { label: "Dashboard", href: `/portfel-podrozniczy/${slug}` },
          { label: "Kraje" },
        ]}
        className="mb-6"
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader
          title="Kraje"
          subtitle="Lista wszystkich krajów w portfelu podróżniczym"
        />
        <Button
          variant="primary"
          onClick={() => addCountryModal.open({})}
          className="flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Dodaj kraj
        </Button>
      </div>

      {trip && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {trip.name}
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
            <span>
              <span className="font-medium text-gray-700 dark:text-gray-300">Daty:</span>{" "}
              {trip.startDate && trip.endDate
                ? formatDateRange(trip.startDate, trip.endDate)
                : "—"}
            </span>
            <span>
              <span className="font-medium text-gray-700 dark:text-gray-300">Waluta:</span>{" "}
              {trip.data?.wallet?.baseCurrency ?? "PLN"} ({getCurrencyName(trip.data?.wallet?.baseCurrency ?? "PLN")})
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              Kwoty na tej stronie w {trip.data?.wallet?.baseCurrency ?? "PLN"}
            </span>
          </div>
          {trip.data && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
              <span>
                <span className="font-medium text-gray-700 dark:text-gray-300">Budżet podróży:</span>{" "}
                {formatCurrency(calculateTotalBudget(trip.data, trip.id), trip.data.wallet?.baseCurrency ?? "PLN", 2)}
              </span>
              <span>
                <span className="font-medium text-gray-700 dark:text-gray-300">Zaplanowane na kraje:</span>{" "}
                {formatCurrency(calculateTotalPlannedCountryBudgets(trip.data), trip.data.wallet?.baseCurrency ?? "PLN", 2)}
              </span>
            </div>
          )}
        </div>
      )}

      <CountriesList
        countries={countries}
        slug={slug}
        tripId={trip?.id}
        data={trip?.data}
        baseCurrency={trip?.data?.wallet?.baseCurrency ?? "PLN"}
        onEditCountry={(country) => editCountryModal.open(country)}
      />

      {trip && (
        <>
          <AddCountryModal
            isOpen={addCountryModal.isOpen}
            onClose={() => addCountryModal.close()}
            onSave={handleAddCountry}
            initialStartDate={addCountryModal.data?.startDate}
            initialEndDate={addCountryModal.data?.endDate}
            tripStartDate={trip.startDate}
            tripEndDate={trip.endDate}
            existingCountries={trip.data?.countries || []}
            tripData={trip.data || undefined}
            totalBudget={trip.data?.totalBudget}
            baseCurrency={trip.data?.wallet?.baseCurrency ?? "PLN"}
          />
          <EditCountryModal
            isOpen={editCountryModal.isOpen}
            onClose={() => editCountryModal.close()}
            onSave={handleSaveEditedCountry}
            country={editCountryModal.data || null}
            tripStartDate={trip.startDate}
            tripEndDate={trip.endDate}
            tripData={trip.data || undefined}
            totalBudget={trip.data?.totalBudget ?? (trip.data ? calculateTotalBudget(trip.data, trip.id) : undefined)}
          />
        </>
      )}
    </PageLayout>
  );
}
