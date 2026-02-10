"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Trash2, Plus, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import type { Trip, Country } from "@/lib/travel-wallet/types";
import { hasExpensesForCountry } from "@/lib/travel-wallet/expenses";
import {
  calculateTotalSpent,
  calculateUnspentPlannedSpending,
} from "@/lib/travel-wallet/calculations";

// Funkcja do formatowania zakresu dat w formacie "21.02 - 25.02"
const formatCountryDateRange = (startDate?: string, endDate?: string): string => {
  if (!startDate || !endDate) return "";
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "";
  
  const startFormatted = start.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
  });
  
  const endFormatted = end.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
  });
  
  return `${startFormatted} - ${endFormatted}`;
};

interface EditTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tripData: {
    name: string;
    startDate?: string;
    endDate?: string;
    totalBudget?: number;
    userName?: string;
    dashboardMode?: "multi-country" | "single-country" | "single-location" | "auto";
  }) => void;
  trip: Trip | null;
  onDeleteCountry?: (countryId: string) => void;
  onAddCountry?: (startDate?: string, endDate?: string) => void;
}

export default function EditTripModal({
  isOpen,
  onClose,
  onSave,
  trip,
  onDeleteCountry,
  onAddCountry,
}: EditTripModalProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [userName, setUserName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countryToDelete, setCountryToDelete] = useState<string | null>(null);

  // Wypełnij formularz danymi z podróży
  useEffect(() => {
    if (isOpen && trip) {
      setName(trip.name);
      setStartDate(trip.startDate || "");
      setEndDate(trip.endDate || "");
      setTotalBudget(trip.data.totalBudget?.toString() || "");
      setUserName(trip.data.userName || "");
      setErrors({});
      setCountryToDelete(null);
    }
  }, [isOpen, trip]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Nazwa podróży jest wymagana";
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.endDate = "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia";
    }

    if (totalBudget && parseFloat(totalBudget) < 0) {
      newErrors.totalBudget = "Budżet nie może być ujemny";
    }

    // Walidacja: niewydane planowane wydatki nie mogą przekroczyć pozostałego budżetu
    if (totalBudget && trip) {
      const budgetValue = parseFloat(totalBudget);
      const totalSpent = calculateTotalSpent(trip.data);
      const remainingBudget = budgetValue - totalSpent;
      const unspentPlanned = calculateUnspentPlannedSpending(trip.data);

      if (unspentPlanned > remainingBudget) {
        const canPlanMore = Math.max(0, remainingBudget);
        newErrors.totalBudget = `Niewydane planowane wydatki (${Math.round(unspentPlanned)} zł) nie mogą przekroczyć pozostałego budżetu (${Math.round(remainingBudget)} zł). Możesz jeszcze zaplanować maksymalnie ${Math.round(canPlanMore)} zł. Aby zaplanować więcej, zwiększ całkowity budżet.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onSave({
      name: name.trim(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      totalBudget: totalBudget ? parseFloat(totalBudget) : undefined,
      userName: userName.trim() || undefined,
      dashboardMode: "auto",
    });

    onClose();
  };

  const handleDeleteCountryClick = (countryId: string) => {
    if (trip && hasExpensesForCountry(trip.id, countryId)) {
      // Nie można usunąć kraju z wydatkami
      return;
    }
    setCountryToDelete(countryId);
  };

  const handleDeleteCountryConfirm = () => {
    if (countryToDelete && onDeleteCountry) {
      onDeleteCountry(countryToDelete);
      setCountryToDelete(null);
    }
  };

  // Funkcja pomocnicza do formatowania daty na YYYY-MM-DD
  function formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const countries = trip?.data.countries || [];

  // Oblicz daty bez krajów (podobnie jak unassignedDateRanges dla lokalizacji)
  const unassignedDateRanges = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return [];
    
    const tripStart = new Date(trip.startDate);
    const tripEnd = new Date(trip.endDate);
    
    // Zbierz wszystkie zakresy dat krajów (tylko te z datami)
    const countryRanges: Array<{ start: Date; end: Date }> = [];
    
    countries.forEach((country) => {
      if (country.startDate && country.endDate) {
        countryRanges.push({
          start: new Date(country.startDate),
          end: new Date(country.endDate),
        });
      }
    });
    
    // Sortuj zakresy według daty rozpoczęcia
    countryRanges.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Znajdź przerwy między zakresami
    const unassignedRanges: Array<{ startDate: string; endDate: string }> = [];
    
    let currentDate = new Date(tripStart);
    
    for (const range of countryRanges) {
      // Jeśli jest przerwa przed tym zakresem
      if (currentDate < range.start) {
        // Odejmij 1 dzień od start, bo chcemy datę przed zakresem kraju
        const gapEnd = new Date(range.start);
        gapEnd.setDate(gapEnd.getDate() - 1);
        
        if (currentDate <= gapEnd) {
          unassignedRanges.push({
            startDate: formatDateToYYYYMMDD(currentDate),
            endDate: formatDateToYYYYMMDD(gapEnd),
          });
        }
      }
      
      // Przesuń currentDate na koniec tego zakresu + 1 dzień
      currentDate = new Date(range.end);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Jeśli jest przerwa po ostatnim zakresie
    if (currentDate <= tripEnd) {
      unassignedRanges.push({
        startDate: formatDateToYYYYMMDD(currentDate),
        endDate: formatDateToYYYYMMDD(tripEnd),
      });
    }
    
    return unassignedRanges;
  }, [trip?.startDate, trip?.endDate, countries]);

  if (!isOpen || !trip) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100">
            Edytuj podróż
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Formularz */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nazwa podróży */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Nazwa podróży *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                errors.name ? "border-red-500 dark:border-red-400" : ""
              }`}
              placeholder="np. Podróż po Azji 2025"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          {/* Daty podróży */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <DatePicker
                id="startDate"
                label="Data rozpoczęcia"
                value={startDate}
                onChange={(newDate) => setStartDate(newDate)}
                error={errors.startDate}
              />
            </div>
            <div>
              <DatePicker
                id="endDate"
                label="Data zakończenia"
                value={endDate}
                onChange={(newDate) => setEndDate(newDate)}
                min={startDate || undefined}
                error={errors.endDate}
              />
            </div>
          </div>

          {/* Budżet całkowity */}
          <div>
            <label
              htmlFor="totalBudget"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Całkowity budżet (PLN)
            </label>
            <input
              id="totalBudget"
              type="number"
              step="0.01"
              min="0"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                errors.totalBudget ? "border-red-500 dark:border-red-400" : ""
              }`}
              placeholder="0.00"
            />
            {errors.totalBudget && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.totalBudget}
              </p>
            )}
          </div>

          {/* Imię użytkownika */}
          <div>
            <label
              htmlFor="userName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Imię użytkownika
            </label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="np. Sarah"
            />
          </div>

          {/* Lista krajów */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Kraje
              </label>
              {onAddCountry && (
                <button
                  type="button"
                  onClick={() => {
                    onAddCountry();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj kraj
                </button>
              )}
            </div>
            {countries.length > 0 ? (
              <div className="space-y-2 border border-gray-200 dark:border-gray-700 rounded-md p-4">
                {countries.map((country) => {
                  const hasExpenses = trip ? hasExpensesForCountry(trip.id, country.id) : false;
                  const dateRange = formatCountryDateRange(country.startDate, country.endDate);
                  return (
                    <div
                      key={country.id}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-md"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {country.name}
                        </span>
                        {dateRange && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {dateRange}
                          </span>
                        )}
                      </div>
                      {onDeleteCountry && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCountryClick(country.id)}
                          disabled={hasExpenses}
                          className={`p-1.5 rounded-md transition-colors ${
                            hasExpenses
                              ? "opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600"
                              : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          }`}
                          title={
                            hasExpenses
                              ? "Nie można usunąć kraju z wydatkami"
                              : "Usuń kraj"
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-md">
                Brak krajów. Dodaj pierwszy kraj.
              </div>
            )}

            {/* Niewybrane daty */}
            {unassignedDateRanges.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                  Niewybrane daty
                </h3>
                <div className="space-y-2">
                  {unassignedDateRanges.map((range, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                          {formatCountryDateRange(range.startDate, range.endDate)}
                        </span>
                        <span className="text-xs text-amber-600 dark:text-amber-400 italic">
                          (brak kraju)
                        </span>
                      </div>
                      {onAddCountry && (
                        <button
                          type="button"
                          onClick={() => {
                            onAddCountry(range.startDate, range.endDate);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-700 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Plus className="w-3 h-3" />
                          Dodaj
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal potwierdzenia usunięcia kraju */}
          {countryToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                      Usuń kraj
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Czy na pewno chcesz usunąć ten kraj? Ta operacja jest nieodwracalna.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCountryToDelete(null)}
                  >
                    Anuluj
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleDeleteCountryConfirm}
                    className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white"
                  >
                    Usuń
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Przyciski */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Zapisz zmiany
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

