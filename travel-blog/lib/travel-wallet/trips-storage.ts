import type { Trip, TripsData, TravelWalletData, TripIndexItem } from "./types";
import { getTravelWalletData } from "./storage";
import { migrateCountriesSlugs } from "./countries-storage";
import { tripEvents } from "./events";
import { createWallet } from "./wallet-operations";
import { migrateToV4 } from "./migrations/v4-wallet-required";
import { DataAccess } from "./data-access";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";
import { getTripsFromSupabase, getTripSlugsFromSupabase, createTripInSupabase, updateTripInSupabase } from "@/lib/supabase/trips";
import { mergeTripWithRemote } from "./sync/trip-merge";
import type { SyncConflict } from "./sync/types";
import { safeSetLocalStorageItem } from "./utils/safe-local-storage";

// Legacy klucz z pełnymi danymi wszystkich podróży (Trip z pełnym `data`).
// Używany głównie do migracji i jako fallback.
const STORAGE_KEY = "travel-wallet-trips";

// Nowy model: lekki indeks wszystkich podróży (TripIndexItem[]).
const INDEX_STORAGE_KEY = "travel-wallet-trips-index";

// Nowy model: pojedyncza aktywna podróż z pełnymi danymi (Trip).
const ACTIVE_TRIP_STORAGE_KEY = "travel-wallet-active-trip";
const OLD_STORAGE_KEY = "travel-wallet-data";
const MIGRATION_FLAG_KEY = "travel-wallet-migration-done";
const FAILED_DELETE_SLUGS_KEY = "travel-wallet-failed-delete-slugs";

/** Record<userId, string[]> – slugi podróży, których usunięcie z Supabase się nie udało (sync ich nie przywraca) */
function getFailedDeleteSlugsStorage(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(FAILED_DELETE_SLUGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveFailedDeleteSlugsStorage(data: Record<string, string[]>): void {
  if (typeof window === "undefined") return;
  try {
    safeSetLocalStorageItem(FAILED_DELETE_SLUGS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * Zwraca zestaw slugów oznaczonych jako „błąd usunięcia z Supabase” dla userId (sync ich nie przywraca).
 * Eksportowane dla sync-helpers.
 */
export function getFailedDeleteSlugs(userId: string): Set<string> {
  const data = getFailedDeleteSlugsStorage();
  const slugs = data[userId];
  return new Set(Array.isArray(slugs) ? slugs : []);
}

function addFailedDeleteSlug(userId: string, slug: string): void {
  const data = getFailedDeleteSlugsStorage();
  const list = data[userId] ?? [];
  if (!list.includes(slug)) {
    data[userId] = [...list, slug];
    saveFailedDeleteSlugsStorage(data);
  }
}

function removeFailedDeleteSlug(userId: string, slug: string): void {
  const data = getFailedDeleteSlugsStorage();
  const list = data[userId];
  if (!list) return;
  const next = list.filter((s) => s !== slug);
  if (next.length === 0) {
    delete data[userId];
  } else {
    data[userId] = next;
  }
  saveFailedDeleteSlugsStorage(data);
}

/**
 * Generuje unikalne ID dla podróży
 */
function generateTripId(): string {
  return `trip-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
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
 * Eksportowane do użycia w sync-helpers przy migracji.
 */
export function generateUniqueSlug(name: string, existingSlugs: Set<string>): string {
  const baseSlug = generateSlug(name);
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
    const isValid = validateTripsData(parsed);
    if (isValid && Array.isArray(parsed.trips)) {
      const len = parsed.trips.length;
      if (Number.isSafeInteger(len) && len >= 0 && len <= 500) {
        return parsed;
      }
      if (len > 500) {
        return { trips: parsed.trips.slice(0, 500) };
      }
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
export function saveTripsDataToStorage(data: TripsData): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const isValid = validateTripsData(data);
    if (!isValid) {
      console.error("Invalid trips data structure");
      return false;
    }

    const dataToSave = JSON.stringify(data);
    return safeSetLocalStorageItem(STORAGE_KEY, dataToSave);
  } catch (error) {
    console.error("Error saving trips data to localStorage:", error);
    return false;
  }
}

/**
 * Helper do zapisu TripsData wraz z odświeżeniem struktur pochodnych:
 * - tripsIndex (lekki indeks podróży)
 * - ACTIVE_TRIP_STORAGE_KEY (pełne dane aktywnej podróży, jeśli ustawiona)
 */
export function saveTripsDataAndSyncDerived(tripsData: TripsData): boolean {
  const saved = saveTripsDataToStorage(tripsData);
  if (!saved) {
    return false;
  }

  // Przebuduj indeks na podstawie aktualnych trips.
  const index = buildTripsIndex(tripsData);
  saveTripsIndexToStorage(index);

  // Zaktualizuj ACTIVE_TRIP_STORAGE_KEY na podstawie activeTripId (jeśli istnieje).
  if (tripsData.activeTripId) {
    const activeTrip = tripsData.trips.find(
      (t) => t.id === tripsData.activeTripId
    );
    saveActiveTripToStorage(activeTrip ?? null);
  }

  return true;
}

/**
 * Publiczna funkcja pomocnicza zwracająca lekki indeks podróży.
 * Używana przez wyższe warstwy zamiast bezpośredniego odczytu z localStorage.
 */
export function getTripsIndex(): TripIndexItem[] {
  return getTripsIndexFromStorage();
}

/**
 * Buduje lekki indeks podróży z pełnych danych TripsData.
 */
function buildTripsIndex(tripsData: TripsData): TripIndexItem[] {
  if (!Array.isArray(tripsData.trips)) {
    return [];
  }
  return tripsData.trips.map<TripIndexItem>((trip) => ({
    id: trip.id,
    slug: trip.slug,
    name: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    lastSyncedAt: trip.lastSyncedAt,
    syncStatus: trip.syncStatus,
    localVersion: trip.localVersion,
    isLocalOnly: !trip.lastSyncedAt,
  }));
}

/**
 * Waliduje strukturę indeksu podróży.
 */
function validateTripsIndex(data: unknown): data is TripIndexItem[] {
  if (!Array.isArray(data)) return false;
  return data.every((item) => {
    if (!item || typeof item !== "object") return false;
    const t = item as TripIndexItem;
    return typeof t.id === "string" && typeof t.slug === "string" && typeof t.name === "string";
  });
}

/**
 * Zwraca indeks podróży z nowego klucza lub tworzy go na podstawie legacy STORAGE_KEY.
 */
export function getTripsIndexFromStorage(): TripIndexItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedIndex = localStorage.getItem(INDEX_STORAGE_KEY);
    if (storedIndex) {
      const parsed = JSON.parse(storedIndex) as unknown;
      if (validateTripsIndex(parsed)) {
        return parsed;
      }
      console.warn("Invalid trips index data in localStorage");
    }
  } catch (error) {
    console.error("Error reading trips index from localStorage:", error);
  }

  // Fallback: zbuduj indeks z legacy trips-data i zapisz.
  const legacy = getTripsDataFromStorage();
  const index = buildTripsIndex(legacy);
  if (index.length > 0) {
    const ok = saveTripsIndexToStorage(index);
    if (!ok) {
      // Jeśli nie udało się zapisać, przynajmniej zwróć zbudowany indeks.
      return index;
    }
  }
  return index;
}

/**
 * Zapisuje indeks podróży do localStorage.
 */
export function saveTripsIndexToStorage(index: TripIndexItem[]): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    if (!validateTripsIndex(index)) {
      console.error("Invalid trips index structure");
      return false;
    }
    const dataToSave = JSON.stringify(index);
    return safeSetLocalStorageItem(INDEX_STORAGE_KEY, dataToSave);
  } catch (error) {
    console.error("Error saving trips index to localStorage:", error);
    return false;
  }
}

/**
 * Zwraca aktualnie aktywną podróż z nowego klucza.
 */
export function getActiveTripFromStorage(): Trip | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const stored = localStorage.getItem(ACTIVE_TRIP_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as unknown;
    if (validateTrip(parsed)) {
      return parsed;
    }
    console.warn("Invalid active trip data in localStorage");
    return null;
  } catch (error) {
    console.error("Error reading active trip from localStorage:", error);
    return null;
  }
}

/**
 * Zapisuje aktywną podróż do localStorage.
 */
export function saveActiveTripToStorage(trip: Trip | null): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    if (trip === null) {
      localStorage.removeItem(ACTIVE_TRIP_STORAGE_KEY);
      return true;
    }
    if (!validateTrip(trip)) {
      console.error("Invalid active trip structure");
      return false;
    }
    const dataToSave = JSON.stringify(trip);
    return safeSetLocalStorageItem(ACTIVE_TRIP_STORAGE_KEY, dataToSave);
  } catch (error) {
    console.error("Error saving active trip to localStorage:", error);
    return false;
  }
}

/**
 * Publiczne API: pobiera aktualnie aktywną podróż (z podstawową walidacją dat).
 */
export function getActiveTrip(): Trip | null {
  const active = getActiveTripFromStorage();
  if (!active) return null;
  return updateTripDatesFromCountries(active);
}

/**
 * Ustawia aktywną podróż i aktualizuje powiązane metadane w TripsData / indeksie.
 * Zwraca true, jeśli wszystkie zapisy się powiodły lub były zbędne.
 */
export function setActiveTrip(trip: Trip | null): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const savedActive = saveActiveTripToStorage(trip);
  if (!savedActive) {
    return false;
  }

  // Zaktualizuj TripsData (activeTripId) oraz indeks (tripsIndex).
  const tripsData = getTripsDataFromStorage();
  const currentIndex = getTripsIndexFromStorage();

  let nextIndex = currentIndex;
  if (trip) {
    tripsData.activeTripId = trip.id;

    const meta: TripIndexItem = {
      id: trip.id,
      slug: trip.slug,
      name: trip.name,
      startDate: trip.startDate,
      endDate: trip.endDate,
      lastSyncedAt: trip.lastSyncedAt,
      syncStatus: trip.syncStatus,
      localVersion: trip.localVersion,
      isLocalOnly: !trip.lastSyncedAt,
    };

    const idx = currentIndex.findIndex((i) => i.id === trip.id);
    if (idx === -1) {
      nextIndex = [...currentIndex, meta];
    } else {
      nextIndex = currentIndex.slice();
      nextIndex[idx] = { ...currentIndex[idx], ...meta };
    }
  } else {
    // Brak aktywnej podróży – wyczyść activeTripId, indeks pozostaw bez zmian.
    delete tripsData.activeTripId;
  }

  // Zapisz zmodyfikowane struktury; błędy nie powinny powodować crasha.
  saveTripsIndexToStorage(nextIndex);
  saveTripsDataToStorage({ ...tripsData, tripsIndex: nextIndex });

  return true;
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

  // Jeśli nie ma podróży i migracja nie została wykonana, sprawdź czy są stare dane
  // Jeśli nie ma starych danych, oznacza to że użytkownik celowo usunął wszystkie podróże
  // W takim przypadku nie tworzymy demo podróży - tylko oznaczamy migrację jako wykonaną
  const oldData = localStorage.getItem(OLD_STORAGE_KEY);
  if (!oldData) {
    // Brak starych danych - użytkownik celowo usunął wszystko, nie tworzymy demo
    localStorage.setItem(MIGRATION_FLAG_KEY, "true");
    return null;
  }

  // Sprawdź czy istnieją stare dane
  try {
    // oldData już został pobrany wcześniej, użyj tej samej zmiennej
    let dataToUse: TravelWalletData | null = null;

    if (oldData) {
      const parsed = JSON.parse(oldData) as TravelWalletData;
      if (parsed && Array.isArray(parsed.countries) && parsed.countries.length > 0) {
        dataToUse = parsed;
      }
    }

    // Jeśli nie ma starych danych z krajami, NIE używaj demo danych
    // Użytkownik celowo usunął wszystkie podróże - nie przywracaj ich
    if (!dataToUse) {
      // Oznacz migrację jako wykonaną, aby nie próbować ponownie
      localStorage.setItem(MIGRATION_FLAG_KEY, "true");
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
    
    // Zawsze inicjalizuj wallet jeśli nie istnieje
    const defaultWallet = createWallet("PLN");
    if (!dataToUse.wallet) {
      defaultWallet.balances = [{ currency: "PLN", amount: 0 }];
    }

    const newTrip: Trip = {
      id: generateTripId(),
      slug,
      name: tripName,
      startDate,
      endDate,
      data: {
        ...dataToUse,
        wallet: dataToUse.wallet || defaultWallet, // Zawsze ustaw wallet
        expenses: dataToUse.expenses || [],
        activityLogs: dataToUse.activityLogs || [],
        exchanges: dataToUse.exchanges || [],
        budgetAdjustments: dataToUse.budgetAdjustments || [],
      },
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
  
  // Sprawdź czy wszystkie podróże mają slug - jeśli tak, nie rób nic
  const allHaveSlugs = tripsData.trips.every(trip => trip.slug);
  if (allHaveSlugs) {
    return;
  }
  
  // Utwórz głęboką kopię danych przed mutacją, aby uniknąć problemów z referencjami
  const tripsDataCopy: TripsData = {
    trips: tripsData.trips.map(trip => ({
      ...trip,
      data: {
        ...trip.data,
        countries: trip.data.countries.map(country => ({ ...country }))
      }
    })),
    currentTripId: tripsData.currentTripId
  };
  
  let needsUpdate = false;

  tripsDataCopy.trips.forEach((trip) => {
    if (!trip.slug) {
      // Generuj slug dla podróży bez slug
      const existingSlugs = new Set(
        tripsDataCopy.trips.filter((t) => t.slug).map((t) => t.slug!)
      );
      trip.slug = generateUniqueSlug(trip.name, existingSlugs);
      needsUpdate = true;
    }
  });

  if (needsUpdate) {
    saveTripsDataToStorage(tripsDataCopy);
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
 * Pobiera wszystkie podróże.
 *
 * Legacy ścieżka – nadal opiera się na pełnym TripsData, ale preferuje aktywną podróż
 * jako źródło prawdy dla tej jednej podróży i aktualizuje daty z krajów.
 */
export function getAllTrips(): Trip[] {
  migrateOldData();
  migrateTripsSlugs();
  migrateToV4();

  const activeTrip = getActiveTrip();
  const tripsData = getTripsDataFromStorage();
  const updatedTrips = tripsData.trips.map((trip) => {
    const base = updateTripDatesFromCountries(trip);
    if (activeTrip && activeTrip.id === base.id) {
      // Preferuj aktywną podróż jako najświeższe źródło, ale zachowaj ewentualne pola,
      // których może brakować w activeTrip (np. przyszłe rozszerzenia).
      return {
        ...base,
        ...activeTrip,
        data: activeTrip.data,
      };
    }
    return base;
  });

  // Jeśli z jakiegoś powodu aktywna podróż nie istnieje w legacy tripsData,
  // dodaj ją do listy, aby nie „zniknęła” z UI.
  if (activeTrip && !updatedTrips.some((t) => t.id === activeTrip.id)) {
    updatedTrips.push(activeTrip);
  }

  return updatedTrips;
}

const USER_CACHE_KEY = 'travel-wallet-user-cache';
const USER_CACHE_TTL = 60000; // 1 minuta

/**
 * Pobiera cache'owanego użytkownika
 */
function getCachedUser(): { id: string; timestamp: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = sessionStorage.getItem(USER_CACHE_KEY);
    if (!cached) return null;
    const { id, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > USER_CACHE_TTL) {
      sessionStorage.removeItem(USER_CACHE_KEY);
      return null;
    }
    return { id, timestamp };
  } catch {
    return null;
  }
}

/**
 * Cache'uje użytkownika
 */
function setCachedUser(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify({
      id: userId,
      timestamp: Date.now(),
    }));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Async wersja getAllTrips - localStorage jest zawsze source of truth
 * W tle synchronizuje z Supabase i aktualizuje localStorage
 * Zoptymalizowana: zwraca dane natychmiast, synchronizacja w tle z opóźnieniem
 */
export async function getAllTripsAsync(): Promise<Trip[]> {
  // ZAWSZE zwracaj z localStorage natychmiast (source of truth) – z preferencją dla activeTrip.
  const localTrips = getAllTrips();
  
  // Sprawdź cache użytkownika (szybkie)
  const cachedUser = getCachedUser();
  
  // Synchronizuj w tle z opóźnieniem (nie blokuje zwracania danych)
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      (async () => {
        try {
          let userId: string | null = null;
          
          // Użyj cache jeśli dostępny
          if (cachedUser) {
            userId = cachedUser.id;
          } else {
            // Sprawdź użytkownika i cache'uj wynik
            const user = await getCurrentUser();
            if (user) {
              userId = user.id;
              setCachedUser(userId);
            }
          }
          
          if (userId) {
            // Sprawdź czy powinna być synchronizacja (min 1 minuta od ostatniej)
            const { shouldSync: shouldSyncCheck, isPageVisible } = await import('./sync/sync-cache');
            
            // Sprawdź czy strona jest widoczna
            if (!isPageVisible()) {
              return;
            }
            
            // Sprawdź czy minęło wystarczająco czasu od ostatniej synchronizacji
            const minInterval = 60 * 1000; // Minimum 1 minuta
            if (!shouldSyncCheck(userId, minInterval)) {
              return;
            }
            
            // Uruchom synchronizację w tle (nie czekaj na wynik)
            syncFromSupabaseInBackground(userId).catch(error => {
              // Ignoruj AbortError (przerwane żądania podczas unmount)
              if (error instanceof Error && error.name === 'AbortError') {
                return; // Ciche ignorowanie
              }
              console.error("[getAllTripsAsync] Background sync error:", error);
            });
          }
        } catch (error) {
          // Ignoruj AbortError (przerwane żądania podczas unmount)
          if (error instanceof Error && error.name === 'AbortError') {
            return; // Ciche ignorowanie
          }
          // Loguj tylko inne błędy
          if (error instanceof Error && !error.message.includes('signal is aborted')) {
            console.error("[getAllTripsAsync] Error checking auth for background sync:", error);
          }
        }
      })();
    }, 0); // Opóźnienie 0ms - wykonaj w następnym tick event loop
  }
  
  return localTrips;
}

/**
 * Synchronizuje podróże z Supabase w tle i aktualizuje localStorage.
 * Konflikty rozwiązywane automatycznie: local wins, lokalna wersja wypychana do Supabase.
 */
async function syncFromSupabaseInBackground(userId: string): Promise<void> {
  try {
    const { getTripsFromSupabase } = await import('@/lib/supabase/trips');
    const supabaseTrips = await getTripsFromSupabase(userId);
    const localTrips = getAllTrips();
    const localTripsBySlug = new Map(localTrips.map(t => [t.slug, t]));
    const failedSlugs = getFailedDeleteSlugs(userId);
    const tripsData = getTripsDataFromStorage();
    let changed = false;

    for (const supabaseTrip of supabaseTrips) {
      if (failedSlugs.has(supabaseTrip.slug)) continue;
      const localTrip = localTripsBySlug.get(supabaseTrip.slug) ?? null;
      const result = mergeTripWithRemote(supabaseTrip, localTrip, { reportConflictWhenDiffer: true });

      if (result.outcome === "conflict" && result.conflict) {
        const conflict = result.conflict;
        const local = conflict.localData as Trip;
        const remote = conflict.remoteData as Trip;
        console.warn("[syncFromSupabaseInBackground] Konflikt, auto-resolve local:", local.slug, "localUpdatedAt:", local.updatedAt, "remoteUpdatedAt:", remote.updatedAt);
        try {
          const updated = await updateTripInSupabase(remote.id, {
            name: local.name,
            slug: local.slug,
            startDate: local.startDate,
            endDate: local.endDate,
            data: local.data,
          }, userId);
          applyTripConflictResolution(conflict, "local");
          updateTrip(local.id, { updatedAt: updated.updatedAt });
          const idx = tripsData.trips.findIndex((t) => t.id === local.id);
          if (idx !== -1) {
            tripsData.trips[idx] = { ...tripsData.trips[idx], updatedAt: updated.updatedAt, lastSyncedAt: updated.updatedAt, syncStatus: "synced" as const };
          }
          changed = true;
        } catch (err) {
          console.error("[syncFromSupabaseInBackground] Failed to auto-resolve conflict for trip:", local.name, err);
        }
        continue;
      }

      const { outcome, trip } = result;
      if (outcome === "add") {
        tripsData.trips.push(trip);
        changed = true;
      } else if (outcome === "use_local" && localTrip) {
        const index = tripsData.trips.findIndex(t => t.id === localTrip.id);
        if (index !== -1) {
          try {
            const updated = await updateTripInSupabase(supabaseTrip.id, {
              name: localTrip.name,
              slug: localTrip.slug,
              startDate: localTrip.startDate,
              endDate: localTrip.endDate,
              data: localTrip.data,
            }, userId);
            tripsData.trips[index] = {
              ...localTrip,
              updatedAt: updated.updatedAt,
              lastSyncedAt: updated.updatedAt,
              syncStatus: "synced",
            };
            changed = true;
          } catch (err) {
            console.error("[syncFromSupabaseInBackground] Failed to push use_local for trip:", localTrip.name, err);
            tripsData.trips[index] = trip;
            changed = true;
          }
        }
      } else if (localTrip) {
        const index = tripsData.trips.findIndex(t => t.id === localTrip.id);
        if (index !== -1) {
          tripsData.trips[index] = trip;
          changed = true;
        }
      }
    }

    if (changed) {
      saveTripsDataAndSyncDerived(tripsData);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("portfel-trips-updated"));
      }
    }

    const { setLastSyncTime } = await import('./sync/sync-cache');
    setLastSyncTime(userId, Date.now());
  } catch (error) {
    console.error("[syncFromSupabaseInBackground] Error syncing from Supabase:", error);
  }
}

/**
 * Stosuje wybór użytkownika w konflikcie podróży: zapisuje wybraną wersję do localStorage.
 * Dla "remote" zachowuje lokalne id, żeby referencje (np. wydatki) dalej działały.
 */
export function applyTripConflictResolution(
  conflict: SyncConflict,
  resolution: "local" | "remote"
): void {
  if (conflict.entityType !== "trip") return;
  const localTrip = conflict.localData as Trip;
  const remoteTrip = conflict.remoteData as Trip;
  const tripsData = getTripsDataFromStorage();
  const index = tripsData.trips.findIndex((t) => t.id === conflict.entityId);
  if (index === -1) return;

  if (resolution === "local") {
    tripsData.trips[index] = {
      ...localTrip,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: "synced",
    };
  } else {
    tripsData.trips[index] = {
      ...remoteTrip,
      id: localTrip.id,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: "pending",
    };
  }
  saveTripsDataAndSyncDerived(tripsData);
}

/**
 * Pobiera podróż po ID
 */
export function getTripById(id: string): Trip | null {
  const trips = getAllTrips();
  let trip = trips.find((t) => t.id === id) || null;

  // Migruj slugi krajów jeśli potrzeba (tylko raz, sprawdzając czy są kraje bez slug)
  if (trip && typeof window !== "undefined") {
    const hasCountriesWithoutSlug = trip.data.countries.some((c) => !c.slug);
    if (hasCountriesWithoutSlug) {
      migrateCountriesSlugs(id);
      // Pobierz ponownie po migracji (bezpośrednio z storage, nie przez getAllTrips)
      const tripsData = getTripsDataFromStorage();
      const migrated = tripsData.trips.find((t) => t.id === id) || null;
      if (migrated) {
        trip = migrated;
      }
    }
  }

  return trip;
}

/**
 * Pobiera podróż po slug (tylko localStorage - backward compatibility)
 */
export function getTripBySlug(slug: string): Trip | null {
  const active = getActiveTrip();
  if (active && active.slug === slug) {
    return active;
  }

  const trips = getAllTrips();
  return trips.find((trip) => trip.slug === slug) || null;
}

/**
 * Pobiera podróż po slug (z obsługą Supabase dla zalogowanych użytkowników)
 */
export async function getTripBySlugAsync(slug: string): Promise<Trip | null> {
  // ZAWSZE zwróć z localStorage natychmiast (source of truth)
  const localTrip = getTripBySlug(slug);
  
  // Synchronizuj w tle z opóźnieniem (nie blokuje zwracania danych)
  if (typeof window !== "undefined") {
    setTimeout(() => {
      (async () => {
        try {
          // Sprawdź cache użytkownika (szybkie)
          const cachedUser = getCachedUser();
          let userId: string | null = null;
          
          // Użyj cache jeśli dostępny
          if (cachedUser) {
            userId = cachedUser.id;
          } else {
            // Sprawdź użytkownika i cache'uj wynik
            const user = await getCurrentUser();
            if (user) {
              userId = user.id;
              setCachedUser(userId);
            }
          }
          
          if (userId && localTrip) {
            // Uruchom synchronizację w tle dla tego konkretnego tripu
            // (getAllTripsAsync już ma wbudowaną synchronizację, więc możemy ją wykorzystać)
            getAllTripsAsync().catch(error => {
              // Ignoruj AbortError (przerwane żądania podczas unmount)
              if (error instanceof Error && error.name === 'AbortError') {
                return;
              }
              console.error("[getTripBySlugAsync] Background sync error:", error);
            });
          }
        } catch (error) {
          // Ignoruj AbortError (przerwane żądania podczas unmount)
          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }
          // Loguj tylko inne błędy
          if (error instanceof Error && !error.message.includes('signal is aborted')) {
            console.error("[getTripBySlugAsync] Error checking auth for background sync:", error);
          }
        }
      })();
    }, 0); // Opóźnienie 0ms - wykonaj w następnym tick event loop
  }
  
  return localTrip;
}

/**
 * Pobiera aktualnie wybraną podróż
 */
export function getCurrentTrip(): Trip | null {
  // Preferuj aktywną podróż jako aktualnie wybraną.
  const active = getActiveTrip();
  if (active) {
    return active;
  }

  const tripsData = getTripsDataFromStorage();
  if (tripsData.currentTripId) {
    const byId = getTripById(tripsData.currentTripId);
    if (byId) {
      return byId;
    }
  }

  // Jeśli brak aktualnej, zwróć pierwszą dostępną z listy.
  const trips = getAllTrips();
  return trips.length > 0 ? trips[0] : null;
}

/**
 * Tworzy nową podróż (z obsługą autentykacji)
 */
/**
 * Helper function do dodawania timeoutu do Promise
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

export async function createTripWithAuth(
  tripData: Omit<Trip, "id" | "slug" | "createdAt" | "updatedAt">
): Promise<Trip> {
  // Sprawdź czy użytkownik jest zalogowany (tylko po stronie klienta)
  if (typeof window !== "undefined") {
    try {
      const user = await withTimeout(
        getCurrentUser(),
        5000,
        "Timeout: Sprawdzanie użytkownika trwa zbyt długo"
      );
      
      if (user) {
        // Użytkownik zalogowany - zapisz w Supabase
        const now = new Date().toISOString();
        
        // Generuj unikalny slug (sprawdź w Supabase + localStorage) z timeoutem
        const localTrips = await withTimeout(
          getAllTripsAsync(),
          10000, // 10 sekund timeout dla getAllTripsAsync
          "Timeout: Pobieranie podróży trwa zbyt długo"
        );
        const supabaseSlugs = await getTripSlugsFromSupabase(user.id).catch(() => [] as string[]);
        const existingSlugs = new Set([
          ...localTrips.map((t) => t.slug),
          ...supabaseSlugs,
        ]);
        const slug = generateUniqueSlug(tripData.name, existingSlugs);
        
        // Zawsze inicjalizuj wallet jeśli nie istnieje
        const defaultWallet = createWallet("PLN");
        if (!tripData.data.wallet) {
          defaultWallet.balances = [{ currency: "PLN", amount: 0 }];
        }

        let currentSlug = slug;
        let tripToCreate: typeof tripData & { slug: string; data: TravelWalletData } = {
          ...tripData,
          slug: currentSlug,
          data: {
            ...tripData.data,
            wallet: tripData.data.wallet || defaultWallet,
            expenses: tripData.data.expenses || [],
            activityLogs: tripData.data.activityLogs || [],
            exchanges: tripData.data.exchanges || [],
            budgetAdjustments: tripData.data.budgetAdjustments || [],
          },
        };

        const is409Conflict = (err: unknown) =>
          (err as { code?: string; status?: number })?.code === '23505' ||
          (err as { status?: number })?.status === 409 ||
          String((err as Error)?.message ?? '').includes('Conflict') ||
          String((err as Error)?.message ?? '').toLowerCase().includes('duplicate key');

        let newTrip: Trip | null = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            newTrip = await withTimeout(
              createTripInSupabase(tripToCreate, user.id),
              15000,
              "Timeout: Tworzenie podróży w Supabase trwa zbyt długo"
            );
            break;
          } catch (insertError) {
            if (attempt === 0 && is409Conflict(insertError)) {
              existingSlugs.add(currentSlug);
              currentSlug = generateUniqueSlug(tripData.name, existingSlugs);
              tripToCreate = { ...tripToCreate, slug: currentSlug };
              continue;
            }
            throw insertError;
          }
        }

        if (!newTrip) throw new Error('Failed to create trip in Supabase');

        // Zawsze zapisz też lokalnie (localStorage jest source of truth).
        // Ustaw ownerUserId, aby oznaczyć właściciela na tym urządzeniu.
        const localTrip = createTrip({
          ...tripData,
          ownerUserId: user.id,
        });

        // Zaktualizuj lokalną podróż z sync metadata i ustaw jako aktywną
        const syncedAt = new Date().toISOString();
        updateTrip(localTrip.id, {
          lastSyncedAt: syncedAt,
          syncStatus: 'synced' as const,
          updatedAt: syncedAt,
        });
        const finalLocal = getTripById(localTrip.id) ?? localTrip;
        setActiveTrip(finalLocal);

        // Emituj event
        tripEvents.emit("trip:updated", localTrip.id);

        return finalLocal; // Zwróć lokalną podróż (source of truth)
      }
    } catch (error) {
      console.error("[createTripWithAuth] Error creating trip in Supabase, falling back to localStorage:", error);
      // Fallback do localStorage jeśli błąd (w tym timeout)
    }
  }
  
  // Fallback: zapisz w localStorage (użytkownik nie zalogowany lub błąd)
  return createTrip(tripData);
}

/**
 * Tworzy nową podróż (tylko localStorage - backward compatibility)
 */
export function createTrip(
  tripData: Omit<Trip, "id" | "slug" | "createdAt" | "updatedAt">
): Trip {
  const now = new Date().toISOString();
  
  // Pobierz aktualne dane z storage bezpośrednio (bez wywoływania getAllTrips, które może wywołać migracje)
  // Migracje będą wykonane przy następnym odczycie przez getAllTrips
  const tripsData = getTripsDataFromStorage();
  
  // Generuj unikalny slug
  const existingSlugs = new Set(tripsData.trips.map((t) => t.slug));
  const slug = generateUniqueSlug(tripData.name, existingSlugs);
  
  // Zawsze inicjalizuj wallet jeśli nie istnieje
  const defaultWallet = createWallet("PLN");
  if (!tripData.data.wallet) {
    // Jeśli nie ma wallet, utwórz domyślny z PLN balance = 0
    defaultWallet.balances = [{ currency: "PLN", amount: 0 }];
  }

  const newTrip: Trip = {
    ...tripData,
    id: generateTripId(),
    slug,
    createdAt: now,
    updatedAt: now,
    data: {
      ...tripData.data,
      wallet: tripData.data.wallet || defaultWallet, // Zawsze ustaw wallet
      expenses: tripData.data.expenses || [],
      activityLogs: tripData.data.activityLogs || [],
      exchanges: tripData.data.exchanges || [],
      budgetAdjustments: tripData.data.budgetAdjustments || [],
    },
  };

  tripsData.trips.push(newTrip);
  const success = saveTripsDataToStorage(tripsData);

  if (success) {
    // Ustaw nowo utworzoną podróż jako aktywną i zaktualizuj indeks.
    setActiveTrip(newTrip);
    tripEvents.emit("trip:updated", newTrip.id);
  }

  return newTrip;
}

/**
 * Aktualizuje podróż (z obsługą autentykacji)
 */
export async function updateTripWithAuth(id: string, updates: Partial<Trip>): Promise<boolean> {
  // Sprawdź czy użytkownik jest zalogowany (tylko po stronie klienta)
  if (typeof window !== "undefined") {
    try {
      const user = await getCurrentUser();
      
      if (user) {
        // Sprawdź czy podróż jest w Supabase
        const allTrips = await getAllTripsAsync();
        const trip = allTrips.find(t => t.id === id);
        
        if (trip) {
          // Sprawdź czy podróż jest w Supabase (ma createdAt z bazy)
          // Możemy to sprawdzić próbując zaktualizować w Supabase
          try {
            const updatedRemote = await updateTripInSupabase(id, updates, user.id);

            // Po udanym zapisie w Supabase, zaktualizuj lokalną wersję wraz z metadanymi sync.
            const syncedAt = updatedRemote.updatedAt ?? new Date().toISOString();
            const ok = updateTrip(id, {
              ...updates,
              lastSyncedAt: syncedAt,
              syncStatus: "synced" as const,
              updatedAt: syncedAt,
            });
            if (ok) {
              tripEvents.emit("trip:updated", id);
            }
            return ok;
          } catch (error) {
            // Jeśli błąd (np. trip nie istnieje w Supabase), fallback do localStorage
            console.warn("[updateTripWithAuth] Trip not in Supabase, updating localStorage:", error);
          }
        }
      }
    } catch (error) {
      console.error("[updateTripWithAuth] Error updating trip in Supabase, falling back to localStorage:", error);
      // Fallback do localStorage jeśli błąd
    }
  }
  
  // Fallback: aktualizuj w localStorage
  return updateTrip(id, updates);
}

/**
 * Aktualizuje podróż (tylko localStorage - backward compatibility)
 */
export function updateTrip(id: string, updates: Partial<Trip>): boolean {
  const tripsData = getTripsDataFromStorage();
  const index = tripsData.trips.findIndex((trip) => trip.id === id);

  if (index === -1) {
    return false;
  }

  // Utwórz głęboką kopię danych aby uniknąć problemów z referencjami
  const previousTrip = tripsData.trips[index];
  const updatedTrip: Trip = {
    ...previousTrip,
    ...updates,
    id, // Nie pozwól zmienić ID
    updatedAt: updates.updatedAt ?? new Date().toISOString(),
  };
  
  // Jeśli aktualizujemy data, upewnij się że tworzymy nową referencję
  if (updates.data) {
    updatedTrip.data = {
      ...updates.data,
      countries: updates.data.countries ? updates.data.countries.map(c => ({ ...c })) : [],
    };
  }

  // Walidacja przed zapisem
  const validation = DataAccess.validateTrip(updatedTrip);
  if (!validation.valid) {
    console.error("[updateTrip] Validation failed:", validation.errors);
    return false;
  }
  
  tripsData.trips[index] = updatedTrip;

  const success = saveTripsDataToStorage(tripsData);

  if (success) {
    // Jeśli zaktualizowana podróż jest aktywna, zaktualizuj również ACTIVE_TRIP_STORAGE_KEY.
    const active = getActiveTripFromStorage();
    if (active && active.id === id) {
      saveActiveTripToStorage(updatedTrip);
    }

    // Zaktualizuj indeks podróży dla tej jednej pozycji.
    const indexList = getTripsIndexFromStorage();
    const meta: TripIndexItem = {
      id: updatedTrip.id,
      slug: updatedTrip.slug,
      name: updatedTrip.name,
      startDate: updatedTrip.startDate,
      endDate: updatedTrip.endDate,
      lastSyncedAt: updatedTrip.lastSyncedAt,
      syncStatus: updatedTrip.syncStatus,
      localVersion: updatedTrip.localVersion,
      isLocalOnly: !updatedTrip.lastSyncedAt,
    };
    const idx = indexList.findIndex((i) => i.id === updatedTrip.id);
    let nextIndex = indexList;
    if (idx === -1) {
      nextIndex = [...indexList, meta];
    } else {
      nextIndex = indexList.slice();
      nextIndex[idx] = { ...indexList[idx], ...meta };
    }
    saveTripsIndexToStorage(nextIndex);

    tripEvents.emit("trip:updated", id);
  }

  return success;
}

const DELETE_TRIP_BACKGROUND_TIMEOUT_MS = 15_000;
const DELETE_TRIP_RETRY_DELAY_MS = 2_000;

export type DeleteTripWithAuthOptions = {
  onServerResult?: (success: boolean, error?: Error) => void;
  /** userId do optymistycznego dodania slug do failed-deletes (zapobiega przywróceniu przez sync). Jeśli brak, używany jest cache. */
  userId?: string;
};

/**
 * Usuwa podróż (z obsługą autentykacji).
 * Optimistic: od razu usuwa z localStorage i zwraca true; w tle usuwa z Supabase.
 * Wynik usunięcia z Supabase: onServerResult(success, error). Przy błędzie slug trafia na listę failed-deletes (sync nie przywróci podróży).
 */
export function deleteTripWithAuth(id: string, options?: DeleteTripWithAuthOptions): boolean {
  if (typeof window === "undefined") {
    return deleteTrip(id);
  }

  const tripsData = getTripsDataFromStorage();
  const trip = tripsData.trips.find((t) => t.id === id);
  if (!trip) {
    return false;
  }

  const slug = trip.slug;

  // Optimistic: usuń z localStorage i zwróć true od razu
  const filtered = tripsData.trips.filter((t) => t.id !== id);
  if (tripsData.currentTripId === id) {
    tripsData.currentTripId = filtered.length > 0 ? filtered[0].id : undefined;
  }
  tripsData.trips = filtered;
  saveTripsDataToStorage(tripsData);
  tripEvents.emit("trip:deleted", id);

  if (filtered.length === 0) {
    localStorage.setItem(MIGRATION_FLAG_KEY, "true");
  }

  // Zaktualizuj indeks i activeTrip po usunięciu.
  const currentIndex = getTripsIndexFromStorage();
  const nextIndex = currentIndex.filter((item) => item.id !== id);
  saveTripsIndexToStorage(nextIndex);

  const active = getActiveTripFromStorage();
  if (active && active.id === id) {
    const nextActive = filtered.length > 0 ? filtered[0] : null;
    setActiveTrip(nextActive ?? null);
  }

  // Optymistycznie oznacz slug jako „nie przywracaj” – sync nie doda podróży z powrotem zanim delete w Supabase się wykona
  const userIdForFailed = options?.userId ?? getCachedUser()?.id;
  if (userIdForFailed) {
    addFailedDeleteSlug(userIdForFailed, slug);
  }

  const onResult = options?.onServerResult;

  // W tle: usuń z Supabase przez API (sesja z cookies – działa poprawnie)
  (async () => {
    let user: { id: string } | null = null;
    try {
      user = await getCurrentUser();
    } catch (e) {
      onResult?.(false, e instanceof Error ? e : new Error(String(e)));
      return;
    }
    if (!user) {
      onResult?.(false, new Error("Użytkownik niezalogowany"));
      return;
    }

    const attempt = (): Promise<void> =>
      new Promise((resolve, reject) => {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), DELETE_TRIP_BACKGROUND_TIMEOUT_MS);
        fetch("/api/travel-wallet/delete-trip", {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
          signal: controller.signal,
        })
          .then((res) => {
            clearTimeout(t);
            if (res.ok) {
              removeFailedDeleteSlug(user!.id, slug);
              onResult?.(true);
              resolve();
            } else {
              const err = new Error(res.status === 401 ? "Unauthorized" : `HTTP ${res.status}`);
              reject(err);
            }
          })
          .catch((err) => {
            clearTimeout(t);
            reject(err);
          });
      });

    try {
      await attempt();
    } catch (firstError) {
      try {
        await new Promise((r) => setTimeout(r, DELETE_TRIP_RETRY_DELAY_MS));
        await attempt();
      } catch (retryError) {
        const err = retryError instanceof Error ? retryError : new Error(String(retryError));
        console.warn("[deleteTripWithAuth] Błąd usunięcia z Supabase (po retry):", err);
        addFailedDeleteSlug(user.id, slug);
        onResult?.(false, err);
      }
    }
  })();

  return true;
}

/**
 * Usuwa podróż (tylko localStorage - backward compatibility)
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
  const success = saveTripsDataToStorage(tripsData);

  if (success) {
    // Zaktualizuj indeks i activeTrip po usunięciu.
    const currentIndex = getTripsIndexFromStorage();
    const nextIndex = currentIndex.filter((item) => item.id !== id);
    saveTripsIndexToStorage(nextIndex);

    const active = getActiveTripFromStorage();
    if (active && active.id === id) {
      const nextActive = filtered.length > 0 ? filtered[0] : null;
      setActiveTrip(nextActive ?? null);
    }

    tripEvents.emit("trip:deleted", id);
  }

  // Jeśli wszystkie podróże zostały usunięte, upewnij się że flaga migracji jest ustawiona
  // aby zapobiec automatycznemu tworzeniu demo podróży
  if (success && filtered.length === 0 && typeof window !== "undefined") {
    localStorage.setItem(MIGRATION_FLAG_KEY, "true");
  }

  return success;
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
  // Sprawdź czy aktualna podróż się nie zmieniła - unikaj niepotrzebnych zapisów
  if (tripsData.currentTripId === id && getActiveTripFromStorage()?.id === id) {
    return true; // Już jest ustawiona i aktywna, nie trzeba zapisywać
  }

  tripsData.currentTripId = id;
  const success = saveTripsDataToStorage(tripsData);
  if (!success) {
    return false;
  }

  // Ustaw jako aktywną podróż i zaktualizuj indeks.
  setActiveTrip(trip);
  return true;
}

