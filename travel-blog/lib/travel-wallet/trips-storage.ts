import type { Trip, TripsData, TravelWalletData } from "./types";
import { getTravelWalletData } from "./storage";
import { migrateCountriesSlugs } from "./countries-storage";

const STORAGE_KEY = "travel-wallet-trips";
const OLD_STORAGE_KEY = "travel-wallet-data";
const MIGRATION_FLAG_KEY = "travel-wallet-migration-done";

/**
 * Generuje unikalne ID dla podróży
 */
function generateTripId(): string {
  return `trip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generuje URL-friendly slug z nazwy podróży
 */
function generateSlug(name: string): string {
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

  // Jeśli slug jest pusty, użyj "podroz"
  if (!slug) {
    slug = "podroz";
  }

  return slug;
}

/**
 * Generuje unikalny slug (dodaje numer jeśli slug już istnieje)
 */
function generateUniqueSlug(name: string, existingSlugs: Set<string>): string {
  let baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Waliduje dane podróży
 */
function validateTrip(data: unknown): data is Trip {
  if (!data || typeof data !== "object") return false;
  const trip = data as Trip;
  return (
    typeof trip.id === "string" &&
    typeof trip.slug === "string" &&
    typeof trip.name === "string" &&
    typeof trip.createdAt === "string" &&
    typeof trip.updatedAt === "string" &&
    trip.data &&
    typeof trip.data === "object" &&
    Array.isArray(trip.data.countries)
  );
}

/**
 * Waliduje dane wszystkich podróży
 */
function validateTripsData(data: unknown): data is TripsData {
  if (!data || typeof data !== "object") return false;
  const tripsData = data as TripsData;
  if (!Array.isArray(tripsData.trips)) return false;
  return tripsData.trips.every(validateTrip);
}

/**
 * Pobiera wszystkie podróże z localStorage
 */
export function getTripsDataFromStorage(): TripsData {
  if (typeof window === "undefined") {
    return { trips: [] };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { trips: [] };
    }

    const parsed = JSON.parse(stored);
    if (validateTripsData(parsed)) {
      return parsed;
    }

    console.warn("Invalid trips data in localStorage");
    return { trips: [] };
  } catch (error) {
    console.error("Error reading trips data from localStorage:", error);
    return { trips: [] };
  }
}

/**
 * Zapisuje dane podróży do localStorage
 */
function saveTripsDataToStorage(data: TripsData): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    if (!validateTripsData(data)) {
      console.error("Invalid trips data structure");
      return false;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error saving trips data to localStorage:", error);
    return false;
  }
}

/**
 * Migruje stare dane do pierwszej podróży lub tworzy demo podróż
 */
export function migrateOldData(): Trip | null {
  if (typeof window === "undefined") {
    return null;
  }

  // Sprawdź czy migracja już została wykonana
  const migrationDone = localStorage.getItem(MIGRATION_FLAG_KEY);
  if (migrationDone === "true") {
    return null; // Migracja już wykonana
  }

  // Sprawdź czy już są podróże
  const existingTrips = getTripsDataFromStorage();
  if (existingTrips.trips.length > 0) {
    // Oznacz migrację jako wykonaną
    localStorage.setItem(MIGRATION_FLAG_KEY, "true");
    return null; // Migracja już wykonana
  }

  // Sprawdź czy istnieją stare dane
  try {
    const oldData = localStorage.getItem(OLD_STORAGE_KEY);
    let dataToUse: TravelWalletData | null = null;

    if (oldData) {
      const parsed = JSON.parse(oldData) as TravelWalletData;
      if (parsed && Array.isArray(parsed.countries) && parsed.countries.length > 0) {
        dataToUse = parsed;
      }
    }

    // Jeśli nie ma starych danych, użyj defaultData jako demo
    if (!dataToUse) {
      dataToUse = getTravelWalletData();
    }

    if (!dataToUse) {
      return null;
    }

    // Konwertuj location → locations dla każdego kraju
    dataToUse.countries.forEach((country) => {
      if (country.location && (!country.locations || country.locations.length === 0)) {
        // Sprawdź czy locations to string[] (stary format) czy Location[] (nowy format)
        const existingLocations = country.locations || [];
        if (existingLocations.length === 0 || typeof existingLocations[0] === "string") {
          // Konwertuj string[] na Location[]
          const locationStrings = country.location
            .split(",")
            .map((loc) => loc.trim())
            .filter((loc) => loc.length > 0);
          country.locations = locationStrings.map((name) => ({
            name,
            startDate: "",
            endDate: "",
          }));
        }
      }
    });

    // Znajdź daty z krajów
    const countriesWithDates = dataToUse.countries.filter(
      (c) => c.startDate && c.endDate
    );
    const startDate =
      countriesWithDates.length > 0
        ? countriesWithDates.reduce((earliest, country) => {
            return country.startDate! < earliest ? country.startDate! : earliest;
          }, countriesWithDates[0].startDate!)
        : undefined;
    const endDate =
      countriesWithDates.length > 0
        ? countriesWithDates.reduce((latest, country) => {
            return country.endDate! > latest ? country.endDate! : latest;
          }, countriesWithDates[0].endDate!)
        : undefined;

    // Utwórz nową podróż z danymi
    const now = new Date().toISOString();
    const tripName = oldData ? "Moja podróż" : "Podróż demo";
    const existingSlugs = new Set<string>();
    const slug = generateUniqueSlug(tripName, existingSlugs);
    
    const newTrip: Trip = {
      id: generateTripId(),
      slug,
      name: tripName,
      startDate,
      endDate,
      data: dataToUse,
      createdAt: now,
      updatedAt: now,
    };

    // Zapisz podróż
    const tripsData: TripsData = {
      trips: [newTrip],
      currentTripId: newTrip.id,
    };
    saveTripsDataToStorage(tripsData);
    
    // Oznacz migrację jako wykonaną
    localStorage.setItem(MIGRATION_FLAG_KEY, "true");

    return newTrip;
  } catch (error) {
    console.error("Error migrating old data:", error);
    return null;
  }
}

/**
 * Migruje istniejące podróże, które nie mają slug
 */
function migrateTripsSlugs(): void {
  if (typeof window === "undefined") return;

  const tripsData = getTripsDataFromStorage();
  let needsUpdate = false;

  tripsData.trips.forEach((trip) => {
    if (!trip.slug) {
      // Generuj slug dla podróży bez slug
      const existingSlugs = new Set(
        tripsData.trips.filter((t) => t.slug).map((t) => t.slug!)
      );
      trip.slug = generateUniqueSlug(trip.name, existingSlugs);
      needsUpdate = true;
    }
  });

  if (needsUpdate) {
    saveTripsDataToStorage(tripsData);
  }
}

/**
 * Aktualizuje daty podróży na podstawie dat krajów
 * NIE nadpisuje dat, jeśli użytkownik ręcznie ustawił szersze daty (co oznacza, że daty są celowo ustawione)
 */
function updateTripDatesFromCountries(trip: Trip): Trip {
  const countriesWithDates = trip.data.countries.filter(
    (c) => c.startDate && c.endDate
  );
  
  if (countriesWithDates.length === 0) {
    // Jeśli nie ma krajów z datami, nie zmieniaj dat podróży
    return trip;
  }
  
  const calculatedStartDate = countriesWithDates.reduce((earliest, country) => {
    return country.startDate! < earliest ? country.startDate! : earliest;
  }, countriesWithDates[0].startDate!);
  
  const calculatedEndDate = countriesWithDates.reduce((latest, country) => {
    return country.endDate! > latest ? country.endDate! : latest;
  }, countriesWithDates[0].endDate!);
  
  // Jeśli daty podróży nie są ustawione, użyj obliczonych z krajów
  if (!trip.startDate || !trip.endDate) {
    return {
      ...trip,
      startDate: calculatedStartDate,
      endDate: calculatedEndDate,
      updatedAt: new Date().toISOString(),
    };
  }
  
  // Jeśli daty podróży są szersze niż daty krajów, oznacza to że użytkownik je ręcznie ustawił
  // Nie nadpisuj ich - pozwól użytkownikowi mieć kontrolę nad datami podróży
  const tripStart = new Date(trip.startDate);
  const tripEnd = new Date(trip.endDate);
  const calculatedStart = new Date(calculatedStartDate);
  const calculatedEnd = new Date(calculatedEndDate);
  
  // Sprawdź czy daty podróży są szersze (wcześniejszy start lub późniejszy koniec)
  const isManuallySet = tripStart < calculatedStart || tripEnd > calculatedEnd;
  
  if (isManuallySet) {
    // Daty są ręcznie ustawione - nie nadpisuj
    return trip;
  }
  
  // Jeśli daty są takie same lub węższe, zaktualizuj je (może użytkownik usunął kraj)
  if (trip.startDate !== calculatedStartDate || trip.endDate !== calculatedEndDate) {
    return {
      ...trip,
      startDate: calculatedStartDate,
      endDate: calculatedEndDate,
      updatedAt: new Date().toISOString(),
    };
  }
  
  return trip;
}

/**
 * Pobiera wszystkie podróże
 */
export function getAllTrips(): Trip[] {
  // Wykonaj migrację jeśli potrzeba
  migrateOldData();
  // Migruj slug dla istniejących podróży
  migrateTripsSlugs();
  
  const tripsData = getTripsDataFromStorage();
  
  // Migracja dashboardMode dla istniejących podróży
  let needsDashboardModeUpdate = false;
  tripsData.trips.forEach((trip) => {
    if (!trip.data.dashboardMode) {
      trip.data.dashboardMode = "auto";
      needsDashboardModeUpdate = true;
    }
  });
  
  if (needsDashboardModeUpdate) {
    saveTripsDataToStorage(tripsData);
  }
  
  // Zaktualizuj daty podróży na podstawie dat krajów
  let needsUpdate = false;
  const updatedTrips = tripsData.trips.map((trip) => {
    const updatedTrip = updateTripDatesFromCountries(trip);
    if (updatedTrip.startDate !== trip.startDate || updatedTrip.endDate !== trip.endDate) {
      needsUpdate = true;
    }
    return updatedTrip;
  });
  
  if (needsUpdate) {
    tripsData.trips = updatedTrips;
    saveTripsDataToStorage(tripsData);
  }
  
  return updatedTrips;
}

/**
 * Pobiera podróż po ID
 */
export function getTripById(id: string): Trip | null {
  const trips = getAllTrips();
  const trip = trips.find((trip) => trip.id === id) || null;
  
  // Migruj slugi krajów jeśli potrzeba (tylko raz, sprawdzając czy są kraje bez slug)
  if (trip && typeof window !== "undefined") {
    const hasCountriesWithoutSlug = trip.data.countries.some((c) => !c.slug);
    if (hasCountriesWithoutSlug) {
      migrateCountriesSlugs(id);
      // Pobierz ponownie po migracji (bezpośrednio z storage, nie przez getAllTrips)
      const tripsData = getTripsDataFromStorage();
      return tripsData.trips.find((t) => t.id === id) || null;
    }
  }
  
  return trip;
}

/**
 * Pobiera podróż po slug
 */
export function getTripBySlug(slug: string): Trip | null {
  const trips = getAllTrips();
  return trips.find((trip) => trip.slug === slug) || null;
}

/**
 * Pobiera aktualnie wybraną podróż
 */
export function getCurrentTrip(): Trip | null {
  const tripsData = getTripsDataFromStorage();
  if (tripsData.currentTripId) {
    return getTripById(tripsData.currentTripId);
  }
  // Jeśli brak aktualnej, zwróć pierwszą dostępną
  const trips = getAllTrips();
  return trips.length > 0 ? trips[0] : null;
}

/**
 * Tworzy nową podróż
 */
export function createTrip(
  tripData: Omit<Trip, "id" | "slug" | "createdAt" | "updatedAt">
): Trip {
  const now = new Date().toISOString();
  
  // Upewnij się, że migracja została wykonana przed dodaniem nowej podróży
  // Pobierz wszystkie podróże (to wywoła migrację jeśli potrzeba)
  const allTrips = getAllTrips();
  
  // Pobierz aktualne dane z storage (po migracji)
  const tripsData = getTripsDataFromStorage();
  
  // Generuj unikalny slug
  const existingSlugs = new Set(tripsData.trips.map((t) => t.slug));
  const slug = generateUniqueSlug(tripData.name, existingSlugs);
  
  const newTrip: Trip = {
    ...tripData,
    id: generateTripId(),
    slug,
    createdAt: now,
    updatedAt: now,
  };

  tripsData.trips.push(newTrip);
  saveTripsDataToStorage(tripsData);

  return newTrip;
}

/**
 * Aktualizuje podróż
 */
export function updateTrip(id: string, updates: Partial<Trip>): boolean {
  const tripsData = getTripsDataFromStorage();
  const index = tripsData.trips.findIndex((trip) => trip.id === id);

  if (index === -1) {
    return false;
  }

  // Utwórz głęboką kopię danych aby uniknąć problemów z referencjami
  const updatedTrip = {
    ...tripsData.trips[index],
    ...updates,
    id, // Nie pozwól zmienić ID
    updatedAt: new Date().toISOString(),
  };
  
  // Jeśli aktualizujemy data, upewnij się że tworzymy nową referencję
  if (updates.data) {
    updatedTrip.data = {
      ...updates.data,
      countries: updates.data.countries ? updates.data.countries.map(c => ({ ...c })) : [],
    };
  }
  
  tripsData.trips[index] = updatedTrip;

  return saveTripsDataToStorage(tripsData);
}

/**
 * Usuwa podróż
 */
export function deleteTrip(id: string): boolean {
  const tripsData = getTripsDataFromStorage();
  const filtered = tripsData.trips.filter((trip) => trip.id !== id);

  if (filtered.length === tripsData.trips.length) {
    return false; // Nie znaleziono podróży
  }

  // Jeśli usuwana była aktualna podróż, ustaw pierwszą dostępną lub null
  if (tripsData.currentTripId === id) {
    tripsData.currentTripId =
      filtered.length > 0 ? filtered[0].id : undefined;
  }

  tripsData.trips = filtered;
  return saveTripsDataToStorage(tripsData);
}

/**
 * Ustawia aktualną podróż
 */
export function setCurrentTrip(id: string): boolean {
  const trip = getTripById(id);
  if (!trip) {
    return false;
  }

  const tripsData = getTripsDataFromStorage();
  tripsData.currentTripId = id;
  return saveTripsDataToStorage(tripsData);
}

