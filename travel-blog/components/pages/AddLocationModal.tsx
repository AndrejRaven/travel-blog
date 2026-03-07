"use client";

import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: string, startDate: string, endDate: string) => void;
  existingLocations?: Array<{ name: string; startDate: string; endDate: string }>;
  countryStartDate?: string;
  countryEndDate?: string;
  initialDate?: string; // Data z modala wydatku (YYYY-MM-DD)
}

export default function AddLocationModal({
  isOpen,
  onClose,
  onSave,
  existingLocations = [],
  countryStartDate,
  countryEndDate,
  initialDate,
}: AddLocationModalProps) {
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset formularza gdy modal się otwiera/zamyka
  useEffect(() => {
    if (isOpen) {
      setLocation("");
      // Jeśli jest initialDate, ustaw ją jako domyślną datę rozpoczęcia i zakończenia
      if (initialDate) {
        setStartDate(initialDate);
        setEndDate(initialDate);
      } else {
        setStartDate("");
        setEndDate("");
      }
      setErrors({});
    }
  }, [isOpen, initialDate]);

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

  // Funkcja sprawdzająca czy zakres dat nakłada się na inne zakresy
  const hasDateOverlap = (
    newStartDate: string,
    newEndDate: string,
    existingLocations: Array<{ name: string; startDate: string; endDate: string }>,
    excludeLocation?: string
  ): boolean => {
    const newStart = new Date(newStartDate);
    const newEnd = new Date(newEndDate);

    return existingLocations.some((loc) => {
      // Pomiń aktualnie edytowaną lokalizację
      if (excludeLocation && loc.name === excludeLocation) {
        return false;
      }
      
      // Pomiń lokacje w starym formacie (string)
      if (typeof loc === "string") {
        return false;
      }
      
      const locStart = new Date(loc.startDate);
      const locEnd = new Date(loc.endDate);
      
      // Sprawdź czy zakresy się nakładają
      // Nakładanie występuje gdy: newStart <= locEnd && newEnd >= locStart
      return newStart <= locEnd && newEnd >= locStart;
    });
  };

  // Generuj listę wszystkich zajętych dat
  const occupiedDates = useMemo(() => {
    if (!existingLocations) return [];
    
    const dates: string[] = [];
    const locationsArray = existingLocations.filter((loc) => typeof loc !== "string") as Array<{ name: string; startDate: string; endDate: string }>;
    
    locationsArray.forEach((loc) => {
      const start = new Date(loc.startDate);
      const end = new Date(loc.endDate);
      const current = new Date(start);
      
      while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, "0");
        const day = String(current.getDate()).padStart(2, "0");
        dates.push(`${year}-${month}-${day}`);
        current.setDate(current.getDate() + 1);
      }
    });
    
    return dates;
  }, [existingLocations]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const trimmedLocation = location.trim();
    if (!trimmedLocation) {
      newErrors.location = "Nazwa miejsca jest wymagana";
    } else {
      const existingNames = (existingLocations || []).map((loc) =>
        typeof loc === "string" ? loc : loc.name
      );
      if (existingNames.includes(trimmedLocation)) {
        newErrors.location = "Miejsce o tej nazwie już istnieje";
      }
    }

    if (!startDate) {
      newErrors.startDate = "Data rozpoczęcia jest wymagana";
    } else if (countryStartDate && startDate < countryStartDate) {
      newErrors.startDate = "Data rozpoczęcia nie może być wcześniejsza niż data rozpoczęcia podróży";
    }

    if (!endDate) {
      newErrors.endDate = "Data zakończenia jest wymagana";
    } else if (countryEndDate && endDate > countryEndDate) {
      newErrors.endDate = "Data zakończenia nie może być późniejsza niż data zakończenia podróży";
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.endDate = "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia";
    }

    // Sprawdź czy zakres dat nakłada się na inne miejsca
    if (startDate && endDate && existingLocations) {
      const locationsArray = existingLocations.filter((loc) => typeof loc !== "string") as Array<{ name: string; startDate: string; endDate: string }>;
      if (hasDateOverlap(startDate, endDate, locationsArray)) {
        newErrors.startDate = "Zakres dat nakłada się na daty innego miejsca";
        newErrors.endDate = "Zakres dat nakłada się na daty innego miejsca";
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

    onSave(location.trim(), startDate, endDate);
    setLocation("");
    setStartDate("");
    setEndDate("");
    setErrors({});
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
            Dodaj miejsce
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
          {/* Nazwa miejsca */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Nazwa miejsca *
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                errors.location ? "border-red-500 dark:border-red-400" : ""
              }`}
              placeholder="np. Bangkok"
              autoFocus
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.location}
              </p>
            )}
          </div>

          {/* Daty pobytu */}
          {countryStartDate && countryEndDate && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <DatePicker
                  id="startDate"
                  label="Data rozpoczęcia"
                  value={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    if (errors.startDate) {
                      setErrors({ ...errors, startDate: "" });
                    }
                  }}
                  min={countryStartDate}
                  max={countryEndDate}
                  disabledDates={occupiedDates}
                  required
                  error={errors.startDate}
                />
              </div>
              <div>
                <DatePicker
                  id="endDate"
                  label="Data zakończenia"
                  value={endDate}
                  onChange={(date) => {
                    setEndDate(date);
                    if (errors.endDate) {
                      setErrors({ ...errors, endDate: "" });
                    }
                  }}
                  min={countryStartDate}
                  max={countryEndDate}
                  relatedDate={startDate ? { type: 'end', value: startDate } : undefined}
                  disabledDates={occupiedDates}
                  required
                  error={errors.endDate}
                />
              </div>
            </div>
          )}
          {(!countryStartDate || !countryEndDate) && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aby dodać lokalizację, najpierw ustaw daty rozpoczęcia i zakończenia podróży w kraju.
            </p>
          )}

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
              Dodaj
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

