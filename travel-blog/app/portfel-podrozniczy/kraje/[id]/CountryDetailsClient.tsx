"use client";

import { useState, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import CountryDetails from "@/components/pages/CountryDetails";
import AddExpenseModal from "@/components/pages/AddExpenseModal";
import { getCountryById } from "@/lib/travel-wallet/countries";
import {
  getExpensesByCountryId,
  addExpense,
} from "@/lib/travel-wallet/expenses";
import type { Country, Expense } from "@/lib/travel-wallet/types";

interface CountryDetailsClientProps {
  countryId: string;
  tripId?: string;
}

export default function CountryDetailsClient({
  countryId,
  tripId,
}: CountryDetailsClientProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [country, setCountry] = useState<Country | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined
  );

  // Wyciągnij tripId z pathname jeśli nie jest przekazane
  const finalTripId =
    tripId ||
    (() => {
      if (typeof window !== "undefined" && pathname) {
        const match = pathname.match(/\/portfel-podrozniczy\/([^/]+)\/kraje/);
        return match ? match[1] : undefined;
      }
      return undefined;
    })();

  // Obsługa URL params - jeśli jest ?date=, otwórz modal
  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      setSelectedDate(dateParam);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const loadExpenses = () => {
    const countryExpenses = getExpensesByCountryId(countryId, finalTripId);
    setExpenses(countryExpenses);
  };

  useEffect(() => {
    const foundCountry = getCountryById(countryId);
    loadExpenses();
    setCountry(foundCountry);
    setIsLoading(false);
  }, [countryId]);

  const handleOpenModal = (date?: string) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(undefined);
    // Usuń parametr date z URL
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("date");
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleSaveExpense = (expenseData: {
    countryId: string;
    description: string;
    category: string;
    amount: number;
    currency: string;
    date: string;
    note?: string;
  }) => {
    addExpense(expenseData, finalTripId);
    loadExpenses(); // Odśwież listę wydatków
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
            Kraj o ID "{countryId}" nie został znaleziony.
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
        />
      </PageLayout>
      {country && (
        <AddExpenseModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveExpense}
          country={country}
          initialDate={selectedDate}
        />
      )}
    </>
  );
}
