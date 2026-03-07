import type { Trip, Country, Budget, Expense, Location, TravelWalletData } from "./types";
import { getTripById, updateTrip, getTripsDataFromStorage } from "./trips-storage";
import { addLocationToExpensesInDateRange } from "./expenses";
import { syncWalletWithBudgets } from "./wallet-sync";
import { tripEvents } from "./events";

/**
 * Migruje slugi dla krajów w podróży (dla krajów bez slug)
 * Używa bezpośredniego dostępu do storage aby uniknąć nieskończonej pętli
 */
export function migrateCountriesSlugs(tripId: string): void {
  if (typeof window === "undefined") return;

  // Pobierz dane bezpośrednio z storage, bez wywoływania getTripById
  const tripsData = getTripsDataFromStorage();
  const trip = tripsData.trips.find((t) => t.id === tripId);
  if (!trip) return;

  let needsUpdate = false;
  const existingSlugs = new Set<string>();

  // Najpierw zbierz wszystkie istniejące slugi
  trip.data.countries.forEach((country) => {
    if (country.slug) {
      existingSlugs.add(country.slug);
    }
  });

  // Wygeneruj slugi dla krajów bez slug i skonwertuj location → locations
  trip.data.countries.forEach((country) => {
    if (!country.slug) {
      country.slug = generateUniqueCountrySlug(country.name, existingSlugs);
      existingSlugs.add(country.slug);
      needsUpdate = true;
    }
    // Konwertuj location → locations jeśli brakuje
    if (country.location && (!country.locations || country.locations.length === 0)) {
      // Sprawdź czy locations to string[] (stary format) czy Location[] (nowy format)
      const existingLocations = country.locations || [];
      if (existingLocations.length === 0 || typeof existingLocations[0] === "string") {
        // Konwertuj string[] na Location[]
        const locationStrings = country.location
          .split(",")
          .map((loc) => loc.trim())
          .filter((loc) => loc.length > 0);
        country.locations = locationStrings.map((name) => ({ name, startDate: "", endDate: "" }));
        needsUpdate = true;
      }
    }
  });

  // Zapisz jeśli były zmiany (używając bezpośredniego zapisu)
  if (needsUpdate) {
    const index = tripsData.trips.findIndex((t) => t.id === tripId);
    if (index >= 0) {
      tripsData.trips[index] = trip;
      // Zapis bezpośrednio do storage
      try {
        localStorage.setItem("travel-wallet-trips", JSON.stringify(tripsData));
      } catch (error) {
        console.error("Error saving trips data:", error);
      }
    }
  }
}

/**
 * Generuje URL-friendly slug z nazwy kraju
 */
function generateCountrySlug(name: string): string {
  // Mapowanie polskich znaków na ASCII
  const polishToAscii: Record<string, string> = {
    ą: "a",
    ć: "c",
    ę: "e",
    ł: "l",
    ń: "n",
    ó: "o",
    ś: "s",
    ź: "z",
    ż: "z",
    Ą: "A",
    Ć: "C",
    Ę: "E",
    Ł: "L",
    Ń: "N",
    Ó: "O",
    Ś: "S",
    Ź: "Z",
    Ż: "Z",
  };

  // Konwertuj na małe litery i zamień polskie znaki
  let slug = name
    .toLowerCase()
    .split("")
    .map((char) => polishToAscii[char] || char)
    .join("");

  // Zamień spacje i znaki specjalne na myślniki
  slug = slug.replace(/[^a-z0-9]+/g, "-");

  // Usuń myślniki na początku i końcu
  slug = slug.replace(/^-+|-+$/g, "");

  // Jeśli slug jest pusty, użyj "kraj"
  if (!slug) {
    slug = "kraj";
  }

  return slug;
}

/**
 * Generuje unikalny slug dla kraju (dodaje numer jeśli slug już istnieje)
 */
function generateUniqueCountrySlug(
  name: string,
  existingSlugs: Set<string>
): string {
  const baseSlug = generateCountrySlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Tworzy obiekt Country z danymi z formularza (do użycia przy tworzeniu podróży z krajami).
 */
export function buildCountryFromData(
  countryData: Omit<Country, "id" | "slug">,
  existingSlugs: Set<string> = new Set()
): Country {
  const slug = generateUniqueCountrySlug(countryData.name, existingSlugs);
  return {
    ...countryData,
    id: `country-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    slug,
    locations: countryData.locations ? countryData.locations.map((loc) => ({ ...loc })) : [],
  };
}

/**
 * Dodaje kraj do podróży
 */
export function addCountry(tripId: string, countryData: Omit<Country, "id" | "slug">): boolean {
  const trip = getTripById(tripId);
  if (!trip) {
    console.error('[countries-storage] addCountry - trip not found');
    return false;
  }

  // Generuj unikalny slug
  const existingSlugs = new Set(trip.data.countries.map((c) => c.slug));
  const slug = generateUniqueCountrySlug(countryData.name, existingSlugs);

  const newCountry: Country = {
    ...countryData,
    id: `country-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    slug,
    // Upewnij się, że locations jest zawsze tablicą (nawet jeśli pusta)
    // Utwórz głęboką kopię lokalizacji aby uniknąć problemów z referencjami
    locations: countryData.locations ? countryData.locations.map(loc => ({ ...loc })) : [],
  };

  // Stwórz nową kopię countries array z dodanym krajem zamiast mutować
  const updatedCountries = [...trip.data.countries, newCountry];

  // Stwórz nową kopię data z zaktualizowanymi krajami
  const updatedData: TravelWalletData = {
    ...trip.data,
    countries: updatedCountries,
  };

  const result = updateTrip(tripId, { data: updatedData });

  if (result) {
    tripEvents.emit("country:added", tripId, newCountry);

    // Synchronizuj portfel z budżetami krajów (jeśli portfel istnieje lub dodajemy kraj z budżetem)
    if (updatedData.wallet) {
      syncWalletWithBudgets(tripId);
    } else if (newCountry.budgets && newCountry.budgets.length > 0) {
      // Jeśli portfel nie istnieje, ale dodajemy kraj z budżetem, stwórz portfel
      syncWalletWithBudgets(tripId);
    }
  }

  return result;
}

/**
 * Aktualizuje kraj w podróży
 */
export function updateCountry(
  tripId: string,
  countryId: string,
  updates: Partial<Country>
): boolean {
  const trip = getTripById(tripId);
  if (!trip) return false;

  const countryIndex = trip.data.countries.findIndex((c) => c.id === countryId);
  if (countryIndex === -1) return false;

  const currentCountry = trip.data.countries[countryIndex];
  const updatedCountry = {
    ...currentCountry,
    ...updates,
    id: countryId, // Nie pozwól zmienić ID
  };

  // Jeśli zmieniana jest nazwa kraju, zregeneruj slug
  if (updates.name && updates.name !== currentCountry.name) {
    const existingSlugs = new Set(
      trip.data.countries
        .filter((c) => c.id !== countryId)
        .map((c) => c.slug)
    );
    updatedCountry.slug = generateUniqueCountrySlug(updates.name, existingSlugs);
  }

  trip.data.countries[countryIndex] = updatedCountry;
  const success = updateTrip(tripId, { data: trip.data });

  if (success) {
    tripEvents.emit("country:updated", tripId, updatedCountry);
  }

  return success;
}

/**
 * Usuwa kraj z podróży
 */
export function deleteCountry(tripId: string, countryId: string): boolean {
  const trip = getTripById(tripId);
  if (!trip) return false;

  const countryToDelete = trip.data.countries.find((c) => c.id === countryId);
  const filtered = trip.data.countries.filter((c) => c.id !== countryId);
  if (filtered.length === trip.data.countries.length) return false;

  trip.data.countries = filtered;
  const success = updateTrip(tripId, { data: trip.data });

  if (success && countryToDelete) {
    tripEvents.emit("country:deleted", tripId, countryToDelete);
  }

  return success;
}

/**
 * Dodaje budżet do kraju
 */
export function addBudgetToCountry(
  tripId: string,
  countryId: string,
  budget: Budget
): boolean {
  const trip = getTripById(tripId);
  if (!trip) return false;

  const country = trip.data.countries.find((c) => c.id === countryId);
  if (!country) return false;

  country.budgets.push(budget);
  const result = updateTrip(tripId, { data: trip.data });

  // Synchronizuj portfel z budżetami krajów
  if (result && trip.data.wallet) {
    syncWalletWithBudgets(tripId);
  } else if (result && budget.amount > 0) {
    // Jeśli portfel nie istnieje, ale dodajemy budżet, stwórz portfel
    syncWalletWithBudgets(tripId);
  }

  return result;
}

/**
 * Aktualizuje budżet w kraju
 */
export function updateBudgetInCountry(
  tripId: string,
  countryId: string,
  budgetIndex: number,
  budget: Budget
): boolean {
  const trip = getTripById(tripId);
  if (!trip) return false;

  const country = trip.data.countries.find((c) => c.id === countryId);
  if (!country || budgetIndex < 0 || budgetIndex >= country.budgets.length)
    return false;

  country.budgets[budgetIndex] = budget;
  const result = updateTrip(tripId, { data: trip.data });

  // Synchronizuj portfel z budżetami krajów
  if (result && trip.data.wallet) {
    syncWalletWithBudgets(tripId);
  } else if (result && budget.amount > 0) {
    // Jeśli portfel nie istnieje, ale aktualizujemy budżet, stwórz portfel
    syncWalletWithBudgets(tripId);
  }

  return result;
}

/**
 * Usuwa budżet z kraju
 */
export function removeBudgetFromCountry(
  tripId: string,
  countryId: string,
  budgetIndex: number
): boolean {
  const trip = getTripById(tripId);
  if (!trip) return false;

  const country = trip.data.countries.find((c) => c.id === countryId);
  if (!country || budgetIndex < 0 || budgetIndex >= country.budgets.length)
    return false;

  country.budgets.splice(budgetIndex, 1);
  const result = updateTrip(tripId, { data: trip.data });

  // Synchronizuj portfel z budżetami krajów
  if (result && trip.data.wallet) {
    syncWalletWithBudgets(tripId);
  }

  return result;
}

/**
 * Dodaje lokalizację do kraju
 */
export function addLocationToCountry(
  tripId: string,
  countryId: string,
  location: string,
  startDate: string,
  endDate: string
): boolean {
  const trip = getTripById(tripId);
  if (!trip) return false;

  const country = trip.data.countries.find((c) => c.id === countryId);
  if (!country) return false;

  const trimmedLocation = location.trim();
  if (!trimmedLocation) return false;

  if (!startDate || !endDate) return false;

  // Sprawdź czy lokalizacja już istnieje
  const existingLocations = country.locations || [];
  const locationNames = existingLocations.map((loc) =>
    typeof loc === "string" ? loc : loc.name
  );
  if (locationNames.includes(trimmedLocation)) {
    return false; // Lokalizacja już istnieje
  }

  // Dodaj lokalizację - stwórz nową kopię struktury danych zamiast mutować
  const newLocation: Location = {
    name: trimmedLocation,
    startDate,
    endDate,
  };

  // Stwórz nową kopię kraju z zaktualizowanymi lokalizacjami
  const updatedCountry: Country = {
    ...country,
    locations: [...existingLocations, newLocation],
  };

  // Stwórz nową kopię countries array z zaktualizowanym krajem
  const updatedCountries = trip.data.countries.map((c) =>
    c.id === countryId ? updatedCountry : c
  );

  // Stwórz nową kopię data z zaktualizowanymi krajami
  const updatedData: TravelWalletData = {
    ...trip.data,
    countries: updatedCountries,
  };

  // Zaktualizuj trip z nową lokalizacją
  const tripUpdated = updateTrip(tripId, { data: updatedData });

  if (tripUpdated) {
    tripEvents.emit("location:added", tripId, { countryId, location: newLocation });

    // Automatycznie dodaj lokalizację do wydatków bez lokalizacji w zakresie dat
    addLocationToExpensesInDateRange(
      tripId,
      countryId,
      trimmedLocation,
      startDate,
      endDate
    );
  }

  return tripUpdated;
}

/**
 * Aktualizuje lokalizację w kraju (nazwę i/lub daty)
 */
export function updateLocationInCountry(
  tripId: string,
  countryId: string,
  oldLocationName: string,
  newLocationName?: string,
  startDate?: string,
  endDate?: string
): boolean {
  const trip = getTripById(tripId);
  if (!trip) return false;

  const country = trip.data.countries.find((c) => c.id === countryId);
  if (!country) return false;

  const existingLocations = country.locations || [];
  const index = existingLocations.findIndex((loc) => {
    const name = typeof loc === "string" ? loc : loc.name;
    return name === oldLocationName;
  });
  if (index === -1) return false; // Stara lokalizacja nie istnieje

  // Sprawdź czy nowa lokalizacja już istnieje (jeśli zmieniamy nazwę)
  if (newLocationName && newLocationName.trim() !== oldLocationName) {
    const trimmedNewLocation = newLocationName.trim();
    if (!trimmedNewLocation) return false;
    const locationNames = existingLocations.map((loc) =>
      typeof loc === "string" ? loc : loc.name
    );
    if (locationNames.includes(trimmedNewLocation)) {
      return false; // Nowa lokalizacja już istnieje
    }
  }

  // Zaktualizuj lokalizację
  const currentLocation = existingLocations[index];
  const updatedLocation: Location = {
    name: newLocationName?.trim() || (typeof currentLocation === "string" ? currentLocation : currentLocation.name),
    startDate: startDate || (typeof currentLocation === "string" ? "" : currentLocation.startDate),
    endDate: endDate || (typeof currentLocation === "string" ? "" : currentLocation.endDate),
  };
  if (!country.locations) country.locations = [];
  country.locations[index] = updatedLocation;
  const success = updateTrip(tripId, { data: trip.data });

  if (success) {
    tripEvents.emit("location:updated", tripId, { countryId, location: updatedLocation });
  }

  return success;
}

/**
 * Usuwa lokalizację z kraju
 */
export function removeLocationFromCountry(
  tripId: string,
  countryId: string,
  locationName: string
): boolean {
  const trip = getTripById(tripId);
  if (!trip) return false;

  const country = trip.data.countries.find((c) => c.id === countryId);
  if (!country) return false;

  const existingLocations = country.locations || [];
  const index = existingLocations.findIndex((loc) => {
    const name = typeof loc === "string" ? loc : loc.name;
    return name === locationName;
  });
  if (index === -1) return false; // Lokalizacja nie istnieje

  // Usuń lokalizację
  const locationToDelete = existingLocations[index];
  country.locations = existingLocations.filter((loc) => {
    const name = typeof loc === "string" ? loc : loc.name;
    return name !== locationName;
  });
  const success = updateTrip(tripId, { data: trip.data });

  if (success && locationToDelete) {
    tripEvents.emit("location:deleted", tripId, { countryId, location: locationToDelete });
  }

  return success;
}

/**
 * Sprawdza czy są wydatki z daną lokalizacją dla kraju
 */
export function hasExpensesWithLocation(
  tripId: string,
  countryId: string,
  locationName: string
): boolean {
  if (typeof window === "undefined") return false;

  try {
    const stored = localStorage.getItem("travel-wallet-expenses");
    if (!stored) return false;

    const expenses: Expense[] = JSON.parse(stored);
    return expenses.some(
      (expense) =>
        expense.countryId === countryId &&
        expense.tripId === tripId &&
        expense.location === locationName
    );
  } catch (error) {
    console.error("Error checking expenses with location:", error);
    return false;
  }
}

