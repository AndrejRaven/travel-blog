"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";

interface AddTripModalProps {
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
}

export default function AddTripModal({
  isOpen,
  onClose,
  onSave,
}: AddTripModalProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [userName, setUserName] = useState("");
  const [dashboardMode, setDashboardMode] = useState<"multi-country" | "single-country" | "auto">("multi-country");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset formularza gdy modal się otwiera/zamyka
  useEffect(() => {
    if (isOpen) {
      setName("");
      setStartDate("");
      setEndDate("");
      setTotalBudget("");
      setUserName("");
      setDashboardMode("auto");
      setErrors({});
    }
  }, [isOpen]);

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

    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = "Data zakończenia musi być późniejsza niż data rozpoczęcia";
    }

    if (totalBudget && parseFloat(totalBudget) < 0) {
      newErrors.totalBudget = "Budżet nie może być ujemny";
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
      dashboardMode: dashboardMode || "auto",
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100">
            Dodaj podróż
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

          {/* Daty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Data rozpoczęcia
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Data zakończenia
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                  errors.endDate ? "border-red-500 dark:border-red-400" : ""
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.endDate}
                </p>
              )}
            </div>
          </div>

          {/* Budżet całkowity */}
          <div>
            <label
              htmlFor="totalBudget"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Budżet całkowity (PLN)
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

          {/* Liczba krajów */}
          <div>
            <label
              htmlFor="dashboardMode"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Liczba krajów
            </label>
            <select
              id="dashboardMode"
              value={dashboardMode}
              onChange={(e) => setDashboardMode(e.target.value as "multi-country" | "single-country" | "auto")}
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="multi-country">Wiele krajów</option>
              <option value="single-country">Jeden kraj</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Wybierz czy podróż obejmuje jeden czy wiele krajów. Po utworzeniu podróży będziesz musiał dodać co najmniej jeden kraj.
            </p>
          </div>

          {/* Przyciski */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Utwórz
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

