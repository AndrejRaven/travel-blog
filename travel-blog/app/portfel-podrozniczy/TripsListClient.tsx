"use client";

import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense, useDeferredValue } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import Button from "@/components/ui/Button";
import Link from "@/components/ui/Link";
import TripsList from "@/components/pages/TripsList";
import { useToast } from "@/components/ui/Toast";
import { Globe, ChevronDown, Check, DollarSign, TrendingUp, MapPin, Filter, Plus, Trash2 } from "lucide-react";
import { getAllTrips, getAllTripsAsync, deleteTrip, deleteTripWithAuth, createTrip, getTripBySlug, updateTrip } from "@/lib/travel-wallet/trips-storage";
import { createWallet, initializeWallet, balancesFromBudgets, calculateMainBudget } from "@/lib/travel-wallet/wallet-operations";
import { useAuth } from "@/lib/auth/AuthContext";
import { getDaysUntilNextTrip, calculateTotalSpentFromTransactions } from "@/lib/travel-wallet/calculations";
import UpgradePrompt from "@/components/subscription/UpgradePrompt";
import { addCountry, buildCountryFromData } from "@/lib/travel-wallet/countries-storage";
import type { Trip, TravelWalletData } from "@/lib/travel-wallet/types";
import { useModalState } from "@/lib/travel-wallet/hooks/useModalState";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { getAllExpenses, convertExpenseToPLN, convertExpenseToBaseByTripId } from "@/lib/travel-wallet/expenses";
import type { Expense } from "@/lib/travel-wallet/types";
import { getPendingTrip, clearPendingTrip } from "@/lib/travel-wallet/pending-trip-storage";
import { getErrorMessage, errorMessageIncludes } from "@/lib/utils/error-handling";
import { pushChangesToSupabase } from "@/lib/travel-wallet/sync/trip-sync-manager";
import { useOnlineStatus } from "@/lib/travel-wallet/hooks/useOnlineStatus";
import WalletStatusBanner from "@/components/ui/WalletStatusBanner";
import { getOnboardingSeen, setOnboardingSeen } from "@/lib/onboarding-storage";
import { clearTravelWalletStorage } from "@/lib/travel-wallet/clear-on-user-switch";

// Lazy loading dla modals i ciężkich komponentów
const AddTripModal = lazy(() => import("@/components/pages/AddTripModal"));
const AddCountryModal = lazy(() => import("@/components/pages/AddCountryModal"));
const AddMultipleCountriesModal = lazy(() => import("@/components/pages/AddMultipleCountriesModal"));
const DeleteTripModal = lazy(() => import("@/components/pages/DeleteTripModal"));
const UpgradeToPremiumModal = lazy(() => import("@/components/subscription/UpgradeToPremiumModal"));
const BarChart = lazy(() => import("@/components/ui/BarChart"));
const StatusPieChart = lazy(() => import("@/components/pages/TravelWalletCharts").then(module => ({ default: module.StatusPieChart })));
const OnboardingFirstTripModal = lazy(() => import("@/components/ui/OnboardingFirstTripModal").then(m => ({ default: m.default })));
const CHECK_LIMIT_TIMEOUT_MS = 8000;

async function fetchTripLimitFromApi(): Promise<{
  canCreate: boolean;
  currentCount: number;
  limit: number;
  tier: string;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CHECK_LIMIT_TIMEOUT_MS);
  try {
    const res = await fetch("/api/travel-wallet/check-trip-limit", {
      credentials: "include",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.status === 401) {
      throw new Error("Użytkownik nie jest zalogowany");
    }
    if (res.status === 504) {
      const data = await res.json().catch(() => ({}));
      throw new Error(
        (data as { message?: string }).message ||
          "Timeout: Sprawdzanie limitu podróży trwa zbyt długo. Sprawdź połączenie z internetem."
      );
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { message?: string }).message || "Błąd sprawdzania limitu.");
    }
    return res.json();
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(
        "Timeout: Sprawdzanie limitu podróży trwa zbyt długo. Sprawdź połączenie z internetem."
      );
    }
    throw e;
  }
}

export default function TripsListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const { user, profile, loading: _authLoading } = useAuth();
  const { isOnline } = useOnlineStatus();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "start-date-asc" | "start-date-desc">("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTripSubmitPhase, setAddTripSubmitPhase] = useState<"limit" | "creating" | null>(null);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedStatus, setSelectedStatus] = useState<Set<"upcoming" | "current" | "completed">>(new Set());
  const [savedTripFormData, setSavedTripFormData] = useState<{
    name: string;
    startDate?: string;
    endDate?: string;
    totalBudget?: string;
    baseCurrency?: string;
    initialBudgets?: Array<{ currency: string; amount: number }>;
    userName?: string;
    dashboardMode?: "multi-country" | "single-country" | "single-location" | "auto";
  } | null>(null);
  const [isUpgradePromptOpen, setIsUpgradePromptOpen] = useState(false);
  const [isUpgradeToPremiumModalOpen, setIsUpgradeToPremiumModalOpen] = useState(false);
  const [tripLimitInfo, setTripLimitInfo] = useState<{ currentCount: number; limit: number } | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Use custom hooks for modal states
  const newTripModal = useModalState<Trip>();
  /** Draft podróży (dane formularza) – podróż nie jest zapisana w localStorage aż użytkownik doda kraj/kraje */
  const [draftNewTrip, setDraftNewTrip] = useState<Omit<Trip, "id" | "slug" | "createdAt" | "updatedAt"> | null>(null);
  const addCountryModalType = useModalState<"single" | "multiple">();
  const deleteModal = useModalState<Trip>();
  const [isDeleting, _setIsDeleting] = useState(false);

  const calculateTotalUniqueCountries = useCallback((trips: Trip[]): number => {
    const allCountries = new Set<string>();
    trips.forEach((trip) => {
      trip.data.countries.forEach((country) => {
        allCountries.add(country.name);
      });
    });
    return allCountries.size;
  }, []);

  const sortTrips = useCallback((tripsToSort: Trip[], sortOption: typeof sortBy): Trip[] => {
    const sorted = [...tripsToSort];
    switch (sortOption) {
      case "newest":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
      case "oldest":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateA - dateB;
        });
      case "start-date-asc":
        return sorted.sort((a, b) => {
          if (!a.startDate && !b.startDate) return 0;
          if (!a.startDate) return 1;
          if (!b.startDate) return -1;
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });
      case "start-date-desc":
        return sorted.sort((a, b) => {
          if (!a.startDate && !b.startDate) return 0;
          if (!a.startDate) return 1;
          if (!b.startDate) return -1;
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        });
      default:
        return sorted;
    }
  }, []);

  /** Tablica o bezpiecznej długości – unika RangeError: Invalid array length przy uszkodzonych danych. */
  const toSafeTrips = useCallback((value: unknown): Trip[] => {
    if (!Array.isArray(value)) return [];
    const len = value.length;
    if (!Number.isSafeInteger(len) || len < 0 || len > 500) return [];
    return value as Trip[];
  }, []);

  const loadTrips = useCallback(async () => {
    setIsLoading(true);
    try {
      const raw = await getAllTripsAsync();
      setTrips(toSafeTrips(raw));
    } catch (error) {
      console.error("Error loading trips:", error);
      try {
        const raw = getAllTrips();
        setTrips(toSafeTrips(raw));
      } catch {
        setTrips([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [toSafeTrips]);

  // Get trip status helper
  const getTripStatus = useCallback((trip: Trip): "upcoming" | "current" | "completed" => {
    const now = new Date();
    const start = trip.startDate ? new Date(trip.startDate) : null;
    const end = trip.endDate ? new Date(trip.endDate) : null;

    if (end && end < now) return "completed";
    if (start && start <= now && (!end || end >= now)) return "current";
    return "upcoming";
  }, []);

  // Memoized filtered and sorted trips (używa deferredSearchQuery dla lepszej wydajności)
  const filteredAndSortedTrips = useMemo(() => {
    let filtered = trips;

    // Filter by search query
    if (deferredSearchQuery.trim()) {
      const query = deferredSearchQuery.toLowerCase();
      filtered = filtered.filter((trip) =>
        trip.name.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (selectedStatus.size > 0) {
      filtered = filtered.filter((trip) => {
        const status = getTripStatus(trip);
        return selectedStatus.has(status);
      });
    }

    return sortTrips(filtered, sortBy);
  }, [trips, deferredSearchQuery, selectedStatus, sortBy, sortTrips, getTripStatus]);

  // Memoized sorted trips (for backward compatibility)
  const _sortedTrips = useMemo(() => sortTrips(trips, sortBy), [trips, sortBy, sortTrips]);

  // Memoized total unique countries
  const totalCountries = useMemo(() => calculateTotalUniqueCountries(trips), [trips, calculateTotalUniqueCountries]);

  // Cache dla wydatków - jedno wywołanie getAllExpenses dla wszystkich podróży
  const expensesCache = useMemo(() => {
    const cache = new Map<string, Expense[]>();
    trips.forEach((trip) => {
      try {
        cache.set(trip.id, getAllExpenses(trip.id));
      } catch (_error) {
        cache.set(trip.id, []);
      }
    });
    return cache;
  }, [trips]);

  // Helper do obliczania budżetu dla podróży
  const calculateTripBudget = useCallback((trip: Trip): number => {
    if (trip.data.wallet) {
      try {
        const walletBudget = calculateMainBudget(trip.data.wallet, trip.id);
        if (walletBudget > 0) {
          return walletBudget;
        }
      } catch (_error) {
        // Fallback below
      }
    }
    if (trip.data.totalBudget != null && trip.data.totalBudget > 0) {
      return trip.data.totalBudget;
    }
    const baseCurrency = trip.data.wallet?.baseCurrency ?? "PLN";
    const rates: Record<string, number> = {
      PLN: 1,
      EUR: 4.3,
      USD: 4.0,
      GBP: 5.1,
      NOK: 0.36,
      THB: 0.11,
      JPY: 0.027,
      KRW: 0.003,
      TWD: 0.13,
    };
    let totalBudget = 0;
    trip.data.countries.forEach((country) => {
      country.budgets.forEach((budget) => {
        const rate = budget.currency === baseCurrency ? 1 : (rates[budget.currency] ?? 1);
        totalBudget += budget.amount * rate;
      });
    });
    return totalBudget;
  }, []);

  // Zoptymalizowane obliczenia: chartData, tripsStatistics i tripStats w jednym przejściu
  const { chartData, tripsStatistics, tripStats } = useMemo(() => {
    const now = new Date();
    const statusCounts = {
      upcoming: 0,
      current: 0,
      completed: 0,
    };
    const monthlyExpenses: Record<string, number> = {};
    let totalBudget = 0;
    let totalExpenses = 0;
    let activeTrips = 0;
    let completedTrips = 0;
    let upcomingTrips = 0;
    const tripStatsMap = new Map<string, { totalExpenses: number; budgetProgress: number }>();

    // Jedno przejście przez wszystkie podróże
    trips.forEach((trip) => {
      // Pobierz wydatki z cache
      const expenses = expensesCache.get(trip.id) || [];
      
      // Oblicz wydatki dla tej podróży w walucie bazowej
      const expensesTotal = trip.data.wallet
        ? expenses.reduce((sum, exp) => sum + convertExpenseToBaseByTripId(exp, trip.id), 0)
        : expenses.reduce((sum, exp) => sum + convertExpenseToPLN(exp), 0);
      const transactionsTotal = calculateTotalSpentFromTransactions(trip.id, trip.data);
      const tripExpenses = expensesTotal + transactionsTotal;
      
      // Oblicz budżet dla tej podróży
      const tripBudget = calculateTripBudget(trip);
      
      // Oblicz postęp budżetu
      const budgetProgress = tripBudget > 0 ? Math.min(100, (tripExpenses / tripBudget) * 100) : 0;
      
      // Zapisz statystyki dla tej podróży
      tripStatsMap.set(trip.id, { totalExpenses: tripExpenses, budgetProgress });
      
      // Agreguj do statystyk globalnych
      totalBudget += tripBudget;
      totalExpenses += tripExpenses;
      
      // Status podróży
      const start = trip.startDate ? new Date(trip.startDate) : null;
      const end = trip.endDate ? new Date(trip.endDate) : null;
      
      if (end && end < now) {
        statusCounts.completed++;
        completedTrips++;
      } else if (start && start <= now && (!end || end >= now)) {
        statusCounts.current++;
        activeTrips++;
      } else {
        statusCounts.upcoming++;
        upcomingTrips++;
      }

      // Agreguj wydatki według miesiąca (w walucie bazowej podróży)
      const convertExp = trip.data.wallet
        ? (e: Expense) => convertExpenseToBaseByTripId(e, trip.id)
        : convertExpenseToPLN;
      expenses.forEach((expense) => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (!monthlyExpenses[monthKey]) {
          monthlyExpenses[monthKey] = 0;
        }
        monthlyExpenses[monthKey] += convertExp(expense);
      });
    });

    // Prepare status pie chart data (zawsze 3 statusy, także z 0)
    const statusChartData = [
      {
        category: "Nadchodzące",
        value: statusCounts.upcoming,
        color: "rgb(156, 163, 175)",
      },
      {
        category: "W trakcie",
        value: statusCounts.current,
        color: "rgb(59, 130, 246)",
      },
      {
        category: "Zakończone",
        value: statusCounts.completed,
        color: "rgb(34, 197, 94)",
      },
    ];

    // Prepare monthly expenses line chart data
    const sortedMonths = Object.keys(monthlyExpenses).sort();
    const expensesChartData = sortedMonths.map((month) => {
      const [year, monthNum] = month.split("-");
      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString("pl-PL", {
        month: "short",
        year: "numeric",
      });
      return {
        value: monthlyExpenses[month],
        label: monthName,
        date: month,
      };
    });

    return {
      chartData: {
        statusChart: statusChartData,
        expensesChart: expensesChartData,
      },
      tripsStatistics: {
        totalBudget,
        totalExpenses,
        activeTrips,
        completedTrips,
        upcomingTrips,
        totalTrips: trips.length,
      },
      tripStats: tripStatsMap,
    };
  }, [trips, expensesCache, calculateTripBudget]);

  // Ładowanie listy przy mount oraz przy zmianie użytkownika (po zalogowaniu odśwież, żeby pobrać podróże z chmury).
  useEffect(() => {
    loadTrips();
  }, [loadTrips, user?.id]);

  // Reaguj na event gdy dane podróży się zmieniły (sync z chmury, clear po wylogowaniu).
  useEffect(() => {
    const handler = () => loadTrips();
    window.addEventListener("portfel-trips-updated", handler);
    return () => window.removeEventListener("portfel-trips-updated", handler);
  }, [loadTrips]);

  useEffect(() => {
    if (searchParams.get("wylogowany") !== "1") return;
    addToast({ type: "success", title: "Jesteś wylogowany." });
    router.replace("/portfel-podrozniczy", { scroll: false });
  }, [searchParams, router, addToast]);

  // Onboarding przy pierwszej wizycie (0 podróży)
  useEffect(() => {
    if (isLoading || trips.length > 0) return;
    if (getOnboardingSeen()) return;
    setShowOnboardingModal(true);
  }, [isLoading, trips.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sortOptions = [
    { value: "newest" as const, label: "Najnowsze" },
    { value: "oldest" as const, label: "Najstarsze" },
    { value: "start-date-asc" as const, label: "Data rozpoczęcia (najbliższe)" },
    { value: "start-date-desc" as const, label: "Data rozpoczęcia (najdalsze)" },
  ];

  const selectedSortOption = sortOptions.find((option) => option.value === sortBy);

  const handleSortSelect = (value: typeof sortBy) => {
    setSortBy(value);
    setIsSortDropdownOpen(false);
  };

  const handleDeleteRequest = useCallback((trip: Trip) => {
    deleteModal.open(trip);
  }, [deleteModal]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteModal.data) return;

    const tripName = deleteModal.data.name;

    if (user) {
      // Optimistic: usuń lokalnie, zamknij modal, w tle Supabase; wynik w onServerResult
      const deleted = deleteTripWithAuth(deleteModal.data.id, {
        userId: user.id,
        onServerResult(serverOk) {
          if (serverOk) {
            addToast({
              type: "success",
              title: "Podróż usunięta z chmury",
              message: `Podróż "${tripName}" została usunięta.`,
            });
          } else {
            addToast({
              type: "error",
              title: "Błąd usunięcia z chmury",
              message: "Nie udało się usunąć podróży z serwera. Możesz spróbować usunąć ponownie później.",
              duration: 5000,
            });
          }
        },
      });
      if (deleted) {
        loadTrips();
        deleteModal.close();
      } else {
        addToast({
          type: "error",
          title: "Błąd",
          message: "Nie udało się usunąć podróży.",
        });
      }
    } else {
      const deleteResult = deleteTrip(deleteModal.data.id);
      if (deleteResult) {
        loadTrips();
        deleteModal.close();
        addToast({
          type: "success",
          title: "Podróż usunięta",
          message: `Podróż "${tripName}" została usunięta.`,
        });
      } else {
        addToast({
          type: "error",
          title: "Błąd",
          message: "Nie udało się usunąć podróży.",
        });
      }
    }
  }, [deleteModal, user, loadTrips, addToast]);

  const handleDeleteCancel = useCallback(() => {
    if (!isDeleting) {
      deleteModal.close();
    }
  }, [isDeleting, deleteModal]);

  const handleClearDeviceData = useCallback(() => {
    const confirmed = typeof window !== "undefined" && window.confirm(
      "Czy na pewno chcesz usunąć wszystkie dane z tego urządzenia? Wszystkie podróże i wydatki zostaną trwale usunięte z tej przeglądarki."
    );
    if (!confirmed) return;
    clearTravelWalletStorage();
    loadTrips();
    addToast({
      type: "success",
      title: "Dane usunięte",
      message: "Dane zostały usunięte z tego urządzenia.",
    });
  }, [loadTrips, addToast]);

  const handleCancelNewTrip = useCallback(() => {
    if (draftNewTrip) {
      setDraftNewTrip(null);
      addCountryModalType.close();
      clearPendingTrip();
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("newTripAdded");
      }
      addToast({
        type: "info",
        title: "Anulowano",
        message: "Tworzenie podróży zostało anulowane.",
        duration: 2000,
      });
      return;
    }
    if (!newTripModal.data) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("newTripAdded");
      }
      return;
    }

    const trip = getTripBySlug(newTripModal.data.slug);
    if (trip && trip.data.countries.length === 0) {
      deleteTrip(trip.id);
      loadTrips();
      addToast({
        type: "info",
        title: "Anulowano",
        message: "Tworzenie podróży zostało anulowane.",
        duration: 2000,
      });
    }

    newTripModal.close();
    setSavedTripFormData(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("newTripAdded");
    }
  }, [draftNewTrip, newTripModal, addCountryModalType, loadTrips, addToast]);

  const handleCreateTrip = useCallback(async (tripData: {
    name: string;
    startDate?: string;
    endDate?: string;
    totalBudget?: number;
    userName?: string;
    dashboardMode?: "multi-country" | "single-country" | "single-location" | "auto";
  }) => {
    // Sprawdź limit tylko dla zalogowanych użytkowników
    if (user) {
      try {
        setAddTripSubmitPhase("limit");
        const limitCheck = await fetchTripLimitFromApi();
        setAddTripSubmitPhase("creating");
        
        if (!limitCheck.canCreate) {
          // Limit przekroczony - ustaw informacje dla upgrade prompt PRZED rzuceniem błędu
          const limitInfo = {
            currentCount: limitCheck.currentCount,
            limit: limitCheck.limit,
          };
          setTripLimitInfo(limitInfo);
          
          // Rzuć błąd z dodatkowymi informacjami, żeby AddTripModal mógł pokazać komunikat
          const error = new Error(
            `Masz już ${limitCheck.currentCount} ${limitCheck.currentCount === 1 ? 'podróż' : 'podróże'}. ` +
            `Darmowy plan pozwala na utworzenie tylko ${limitCheck.limit} ${limitCheck.limit === 1 ? 'podróży' : 'podróży'}. ` +
            `Przejdź na Premium, aby tworzyć nieograniczoną liczbę podróży.`
          ) as Error & { limitInfo?: { currentCount: number; limit: number }; isLimitError?: boolean };
          error.limitInfo = limitInfo;
          (error as Error & { isLimitError?: boolean }).isLimitError = true;
          setAddTripSubmitPhase(null);
          throw error;
        }
      } catch (error: unknown) {
        console.error("Error checking trip limit:", error);
        const { getErrorMessage, errorMessageIncludes } = await import("@/lib/utils/error-handling");
        const errorMessage = getErrorMessage(error);
        const isLimitError = (error as { isLimitError?: boolean })?.isLimitError || false;
        const limitInfo = (error as { limitInfo?: { currentCount: number; limit: number } })?.limitInfo;
        
        // Jeśli to timeout, kontynuuj tworzenie podróży (offline-first approach)
        if (errorMessageIncludes(error, "Timeout")) {
          addToast({
            type: "warning",
            title: "Ostrzeżenie",
            message: "Nie udało się sprawdzić limitu podróży. Podróż zostanie utworzona lokalnie.",
            duration: 4000,
          });
          setAddTripSubmitPhase("creating");
          // Kontynuuj tworzenie podróży bez sprawdzania limitu
        }
        // Jeśli to prawdziwy błąd limitu (LIMIT_EXCEEDED, "Darmowy plan", "Przejdź na Premium"), obsłuż go tutaj
        else if (isLimitError || errorMessageIncludes(error, "LIMIT_EXCEEDED") || errorMessageIncludes(error, "Darmowy plan") || errorMessageIncludes(error, "Przejdź na Premium")) {
          // Użyj limitInfo z błędu jeśli dostępne, w przeciwnym razie wyciągnij z komunikatu
          const finalLimitInfo = limitInfo || {
            currentCount: errorMessage.match(/\d+/)?.[0] ? parseInt(errorMessage.match(/\d+/)?.[0] || "1") : 1,
            limit: 1,
          };
          
          // Upewnij się że tripLimitInfo jest ustawione
          setTripLimitInfo(finalLimitInfo);
          
          // Pokaż upgrade prompt natychmiast
          setIsUpgradePromptOpen(true);
          
          setAddTripSubmitPhase(null);
          // Rzuć błąd dalej, żeby AddTripModal mógł go obsłużyć (pokazać toast i zamknąć modal)
          throw error;
        }
        // Inne błędy - kontynuuj tworzenie podróży (offline-first approach)
        else {
          addToast({
            type: "warning",
            title: "Ostrzeżenie",
            message: "Nie udało się sprawdzić limitu podróży. Podróż zostanie utworzona lokalnie.",
            duration: 4000,
          });
          setAddTripSubmitPhase("creating");
          // Kontynuuj tworzenie podróży bez sprawdzania limitu
        }
      }
    }

    // Zapisz stan formularza (na wypadek powrotu do formularza lub limitu)
    setSavedTripFormData({
      name: tripData.name,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      baseCurrency: tripData.baseCurrency,
      initialBudgets: tripData.initialBudgets,
      userName: tripData.userName,
      dashboardMode: "auto",
    });

    const initialBalances = balancesFromBudgets(tripData.initialBudgets);
    const wallet =
      initialBalances.length > 0
        ? initializeWallet(tripData.baseCurrency, initialBalances)
        : createWallet(tripData.baseCurrency);

    const draftData: TravelWalletData = {
      countries: [],
      userName: tripData.userName,
      dashboardMode: "auto",
      wallet,
      initialBudgets: tripData.initialBudgets,
      expenses: [],
      activityLogs: [],
      exchanges: [],
      budgetAdjustments: [],
    };

    // Nie zapisuj podróży w localStorage – tylko draft; podróż powstanie po dodaniu kraju/krajów
    setDraftNewTrip({
      name: tripData.name,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      data: draftData,
    });
    addCountryModalType.open("multiple");
    setIsAddModalOpen(false);
    setAddTripSubmitPhase(null);
    return undefined as unknown as Promise<Trip>;
  }, [user, addCountryModalType, addToast]);

  const saveCountryToTrip = useCallback((countryData: {
    name: string;
    location?: string;
    days: number;
    startDate?: string;
    endDate?: string;
    status: "visited" | "current" | "upcoming";
    budgets: { currency: string; amount: number }[];
    locations?: Array<{ name: string; startDate: string; endDate: string }>;
  }) => {
    if (!newTripModal.data) {
      addToast({
        type: "error",
        title: "Błąd",
        message: "Nie udało się zapisać kraju. Spróbuj ponownie.",
        duration: 3000,
      });
      return false;
    }

    const result = addCountry(newTripModal.data.id, {
      ...countryData,
      location: countryData.location || "",
    });
    
    if (result) {
      const slug = newTripModal.data.slug;
      addCountryModalType.close();
      newTripModal.close();
      setSavedTripFormData(null);
      // Verify trip exists before navigation
      const verifyTrip = getTripBySlug(slug);
      if (verifyTrip) {
        router.push(`/portfel-podrozniczy/${slug}?onboarding=1`);
      } else {
        // If trip not found, reload trips and try again
        loadTrips();
        setTimeout(() => {
          const tripRetry = getTripBySlug(slug);
          if (tripRetry) {
            router.push(`/portfel-podrozniczy/${slug}?onboarding=1`);
          } else {
            addToast({
              type: "error",
              title: "Błąd",
              message: "Nie udało się przejść do podróży. Spróbuj ponownie.",
              duration: 3000,
            });
          }
        }, 100);
      }
    } else {
      addToast({
        type: "error",
        title: "Błąd",
        message: "Nie udało się zapisać kraju. Spróbuj ponownie.",
        duration: 3000,
      });
    }
    
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- loadTrips stable, avoid refetch loop
  }, [newTripModal, addCountryModalType, router, addToast]);

  const handleSaveCountry = useCallback((countryData: {
    name: string;
    location?: string;
    days: number;
    startDate?: string;
    endDate?: string;
    status: "visited" | "current" | "upcoming";
    budgets: { currency: string; amount: number }[];
    locations?: Array<{ name: string; startDate: string; endDate: string }>;
  }) => {
    if (draftNewTrip) {
      const country = buildCountryFromData(
        { ...countryData, location: countryData.location || "" },
        new Set()
      );
      const createdTrip = createTrip({
        ...draftNewTrip,
        data: { ...draftNewTrip.data, countries: [country] },
      });
      updateTrip(createdTrip.id, { syncStatus: "pending" });
      if (user) {
        updateTrip(createdTrip.id, { ownerUserId: user.id });
      }
      if (user) {
        (async () => {
          try {
            const pushResult = await pushChangesToSupabase(user.id);
            if (pushResult.success) {
              addToast({
                type: "success",
                title: "Podróż zapisana w chmurze",
                message: "Podróż została zapisana w chmurze.",
              });
            } else if (pushResult.errors?.length) {
              updateTrip(createdTrip.id, { syncStatus: "error" });
              addToast({
                type: "error",
                title: "Błąd zapisu w chmurze",
                message: "Nie udało się zapisać podróży w chmurze. Spróbuj ponownie później.",
                duration: 5000,
              });
            }
          } catch {
            updateTrip(createdTrip.id, { syncStatus: "error" });
            addToast({
              type: "error",
              title: "Błąd zapisu w chmurze",
              message: "Nie udało się zapisać podróży w chmurze. Spróbuj ponownie później.",
              duration: 5000,
            });
          }
        })();
      }
      setDraftNewTrip(null);
      addCountryModalType.close();
      loadTrips();
      if (typeof window !== "undefined") {
        sessionStorage.setItem("newTripAdded", JSON.stringify({
          slug: createdTrip.slug,
          toast: {
            type: "success",
            title: "Podróż dodana",
            message: `Podróż "${draftNewTrip.name}" została dodana.`,
            duration: 1500,
          },
        }));
      }
      router.push(`/portfel-podrozniczy/${createdTrip.slug}?onboarding=1`);
      return;
    }
    saveCountryToTrip(countryData);
  }, [draftNewTrip, user, addCountryModalType, loadTrips, addToast, router, saveCountryToTrip]);

  const handleSaveMultipleCountries = useCallback((countriesData: Array<{
    name: string;
    location?: string;
    days: number;
    startDate?: string;
    endDate?: string;
    status: "visited" | "current" | "upcoming";
    budgets: { currency: string; amount: number }[];
    locations?: Array<{ name: string; startDate: string; endDate: string }>;
  }>) => {
    if (draftNewTrip) {
      const existingSlugs = new Set<string>();
      const countries = countriesData.map((c) => {
        const country = buildCountryFromData(
          { ...c, location: c.location || "" },
          existingSlugs
        );
        existingSlugs.add(country.slug);
        return country;
      });
      const createdTrip = createTrip({
        ...draftNewTrip,
        data: { ...draftNewTrip.data, countries },
      });
      updateTrip(createdTrip.id, { syncStatus: "pending" });
      if (user) {
        updateTrip(createdTrip.id, { ownerUserId: user.id });
      }
      if (user) {
        (async () => {
          try {
            const pushResult = await pushChangesToSupabase(user.id);
            if (pushResult.success) {
              addToast({
                type: "success",
                title: "Podróż zapisana w chmurze",
                message: "Podróż została zapisana w chmurze.",
              });
            } else if (pushResult.errors?.length) {
              updateTrip(createdTrip.id, { syncStatus: "error" });
              addToast({
                type: "error",
                title: "Błąd zapisu w chmurze",
                message: "Nie udało się zapisać podróży w chmurze. Spróbuj ponownie później.",
                duration: 5000,
              });
            }
          } catch {
            updateTrip(createdTrip.id, { syncStatus: "error" });
            addToast({
              type: "error",
              title: "Błąd zapisu w chmurze",
              message: "Nie udało się zapisać podróży w chmurze. Spróbuj ponownie później.",
              duration: 5000,
            });
          }
        })();
      }
      setDraftNewTrip(null);
      addCountryModalType.close();
      loadTrips();
      if (typeof window !== "undefined") {
        sessionStorage.setItem("newTripAdded", JSON.stringify({
          slug: createdTrip.slug,
          toast: {
            type: "success",
            title: "Podróż dodana",
            message: `Podróż "${draftNewTrip.name}" została dodana.`,
            duration: 1500,
          },
        }));
      }
      router.push(`/portfel-podrozniczy/${createdTrip.slug}?onboarding=1`);
      return;
    }

    if (!newTripModal.data) {
      addToast({
        type: "error",
        title: "Błąd",
        message: "Nie znaleziono podróży. Spróbuj ponownie.",
        duration: 3000,
      });
      return;
    }

    const tripData = newTripModal.data;
    // Dodaj wszystkie kraje
    let allSuccess = true;
    countriesData.forEach((countryData) => {
      const result = addCountry(tripData.id, {
        ...countryData,
        location: countryData.location || "",
      });
      if (!result) {
        allSuccess = false;
        addToast({
          type: "error",
          title: "Błąd",
          message: `Nie udało się zapisać kraju "${countryData.name}".`,
          duration: 3000,
        });
      }
    });

    if (allSuccess) {
      const slug = tripData.slug;
      addCountryModalType.close();
      newTripModal.close();
      setSavedTripFormData(null);
      // Verify trip exists before navigation
      const verifyTrip = getTripBySlug(slug);
      if (verifyTrip) {
        router.push(`/portfel-podrozniczy/${slug}?onboarding=1`);
      } else {
        // If trip not found, reload trips and try again
        loadTrips();
        setTimeout(() => {
          const tripRetry = getTripBySlug(slug);
          if (tripRetry) {
            router.push(`/portfel-podrozniczy/${slug}?onboarding=1`);
          } else {
            addToast({
              type: "error",
              title: "Błąd",
              message: "Nie udało się przejść do podróży. Spróbuj ponownie.",
              duration: 3000,
            });
          }
        }, 100);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- loadTrips stable
  }, [draftNewTrip, newTripModal, user, addCountryModalType, router, addToast]);

  const handleSwitchToSingleCountry = useCallback((countryData?: {
    name: string;
    location?: string;
    days: number;
    startDate?: string;
    endDate?: string;
    status: "visited" | "current" | "upcoming";
    budgets: { currency: string; amount: number }[];
    locations?: Array<{ name: string; startDate: string; endDate: string }>;
  }) => {
    if (draftNewTrip) {
      if (countryData) {
        handleSaveCountry(countryData);
      } else {
        addCountryModalType.open("single");
      }
      return;
    }
    if (!newTripModal.data) return;

    // Zmień tryb podróży na single-country
    const updatedData = {
      ...newTripModal.data.data,
      dashboardMode: "single-country" as const,
    };

    if (updateTrip(newTripModal.data.id, { data: updatedData })) {
      // Jeśli przekazano dane kraju, zapisz go
      if (countryData) {
        if (addCountry(newTripModal.data.id, {
          ...countryData,
          location: countryData.location || "",
        })) {
          const slug = newTripModal.data.slug;
          addCountryModalType.close();
          newTripModal.close();
          // Verify trip exists before navigation
          const verifyTrip = getTripBySlug(slug);
          if (verifyTrip) {
            router.push(`/portfel-podrozniczy/${slug}?onboarding=1`);
          } else {
            // If trip not found, reload trips and try again
            loadTrips();
            setTimeout(() => {
              const tripRetry = getTripBySlug(slug);
              if (tripRetry) {
                router.push(`/portfel-podrozniczy/${slug}?onboarding=1`);
              } else {
                addToast({
                  type: "error",
                  title: "Błąd",
                  message: "Nie udało się przejść do podróży. Spróbuj ponownie.",
                  duration: 3000,
                });
              }
            }, 100);
          }
        }
      } else {
        // Zamknij modal wielu krajów, otwórz modal pojedynczego kraju
        addCountryModalType.open("single");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- addToast, loadTrips stable
  }, [draftNewTrip, newTripModal, addCountryModalType, router, handleSaveCountry]);

  if (isLoading) {
    return (
      <PageLayout maxWidth="4xl" className="py-8">
        <PageHeader title="Portfel podróżniczy" subtitle="Planuj i kontroluj budżet podróży" />
        <div className="space-y-8">
          {/* Statistics skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <SkeletonLoader width="60%" height="1rem" className="mb-3" />
                <SkeletonLoader width="40%" height="2rem" />
              </div>
            ))}
          </div>
          {/* Trips skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <SkeletonLoader width="50%" height="1.25rem" className="mb-3" />
                <SkeletonLoader width="80%" height="1.5rem" className="mb-4" />
                <SkeletonLoader width="100%" height="1rem" className="mb-2" />
                <SkeletonLoader width="70%" height="1rem" />
              </div>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout maxWidth="4xl" className="py-8">
        {/* Nagłówek */}
        <div className="mb-8 flex items-center justify-between">
          <PageHeader
            title="Portfel podróżniczy"
            subtitle="Planuj i kontroluj budżet podróży"
          />
          <Button
            onClick={() => setIsAddModalOpen(true)}
            variant="primary"
            className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Dodaj podróż</span>
          </Button>
        </div>

        {/* Offline banner tylko w treści; wylogowany z danymi = sticky w layoutcie portfela; pierwsza wizyta (0 podróży) = bez bannera */}
        {!isOnline && (
          <div className="mb-6">
            <WalletStatusBanner variant="offline" />
          </div>
        )}

        {/* Karta: dane na urządzeniu + przycisk usunięcia – tylko dla gościa z danymi podróży */}
        {trips.length > 0 && !user && (
          <div className={`mb-6 rounded-lg border p-4 ${!user ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Dane podróży są przechowywane na tym urządzeniu. Możesz je usunąć w dowolnym momencie.
              </p>
              <Button
                variant="outline"
                onClick={handleClearDeviceData}
                className="flex items-center gap-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                Usuń dane z tego urządzenia
              </Button>
            </div>
          </div>
        )}

        {trips.length > 0 && (
          <>
            {/* Powitanie dla zalogowanego użytkownika */}
            {user && (
              <div className="mb-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Cześć, {profile?.full_name?.trim() || profile?.email?.split("@")[0] || "użytkowniku"}!
                </p>
                {(() => {
                  const days = getDaysUntilNextTrip(trips);
                  if (days !== null) {
                    return (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Następna podróż za {days} {days === 1 ? "dzień" : days < 5 ? "dni" : "dni"}.
                      </p>
                    );
                  }
                  return null;
                })()}
                {trips.some((t) => {
                  const now = new Date();
                  const start = t.startDate ? new Date(t.startDate) : null;
                  const end = t.endDate ? new Date(t.endDate) : null;
                  if (end && end < now) return false;
                  return start !== null && start <= now && (!end || end >= now);
                }) && (
                  <p className="text-sm mt-2">
                    <Link
                      href="/profil?tab=feedback"
                      variant="underline"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Oceń trwającą podróż
                    </Link>
                  </p>
                )}
              </div>
            )}

            {/* Statistics - Karty w gridzie */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Odwiedzonych krajów</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalCountries}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Łączny budżet</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(tripsStatistics.totalBudget)} zł
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Łączne wydatki</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(tripsStatistics.totalExpenses)} zł
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktywne podróże</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tripsStatistics.activeTrips}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {tripsStatistics.completedTrips} zakończonych, {tripsStatistics.upcomingTrips} nadchodzących
                </p>
              </div>
            </div>

            {/* Search and Filters – pasek nad listą */}
            <div className="mb-6 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Szukaj podróży..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                  />
                </div>
                <div className="relative" ref={sortDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className={`px-4 py-2.5 pr-10 text-sm border rounded-lg text-left transition-all duration-200 ${
                      isSortDropdownOpen
                        ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-500 dark:ring-blue-400"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none hover:shadow-sm`}
                    aria-label="Sortuj podróże"
                  >
                    {selectedSortOption ? selectedSortOption.label : "Sortuj"}
                  </button>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                        isSortDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {isSortDropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleSortSelect(option.value)}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            sortBy === option.value
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100"
                              : "text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option.label}</span>
                            {sortBy === option.value && (
                              <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                {(["upcoming", "current", "completed"] as const).map((status) => {
                  const isSelected = selectedStatus.has(status);
                  const labels = {
                    upcoming: "Nadchodzące",
                    current: "W trakcie",
                    completed: "Zakończone",
                  };
                  return (
                    <button
                      key={status}
                      onClick={() => {
                        const newSet = new Set(selectedStatus);
                        if (isSelected) {
                          newSet.delete(status);
                        } else {
                          newSet.add(status);
                        }
                        setSelectedStatus(newSet);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isSelected
                          ? "bg-blue-600 dark:bg-blue-500 text-white shadow-sm"
                          : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm"
                      }`}
                    >
                      {labels[status]}
                    </button>
                  );
                })}
                {selectedStatus.size > 0 && (
                  <button
                    onClick={() => setSelectedStatus(new Set())}
                    className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-medium"
                  >
                    Wyczyść wszystkie
                  </button>
                )}
              </div>
            </div>

            {/* Lista podróży – główna treść (IA: po statystykach, przed wizualizacjami) */}
            <TripsList
              trips={filteredAndSortedTrips}
              tripStats={tripStats}
              onDeleteRequest={handleDeleteRequest}
              isGuest={!user}
              onAddFirstTrip={() => setIsAddModalOpen(true)}
            />

            {/* Wizualizacje – na końcu sekcji */}
            {(chartData.statusChart.length > 0 || chartData.expensesChart.length > 0) && (
              <div className="mb-6 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {chartData.statusChart.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Podróże według statusu
                    </h3>
                    <Suspense fallback={<div className="w-[150px] h-[180px] flex items-center justify-center mx-auto"><SkeletonLoader width="150px" height="180px" /></div>}>
                      <StatusPieChart
                        data={chartData.statusChart}
                        size={150}
                      />
                    </Suspense>
                  </div>
                )}

                {chartData.expensesChart.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Wydatki w czasie
                    </h3>
                    <Suspense fallback={<div className="w-full h-[170px] flex items-center justify-center"><SkeletonLoader width="100%" height="170px" /></div>}>
                      <BarChart
                        data={chartData.expensesChart}
                        height={170}
                        currency="PLN"
                      />
                    </Suspense>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Empty state – gdy brak podróży */}
        {trips.length === 0 && (
          <TripsList
            trips={[]}
            tripStats={new Map()}
            onDeleteRequest={handleDeleteRequest}
            isGuest={!user}
            onAddFirstTrip={() => setIsAddModalOpen(true)}
          />
        )}
      </PageLayout>

      {/* Floating Action Button for Mobile */}
      <FloatingActionButton
        onClick={() => setIsAddModalOpen(true)}
        label="Dodaj podróż"
      />

      <Suspense fallback={null}>
        <AddTripModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setAddTripSubmitPhase(null);
            setSavedTripFormData(null);
            // Nie pokazuj toast "Anulowano" jeśli modal został zamknięty z powodu błędu limitu
            // (toast o błędzie już został pokazany w AddTripModal)
          }}
          onSave={async (tripData) => { await handleCreateTrip(tripData); }}
          initialValues={savedTripFormData || undefined}
          submitPhase={addTripSubmitPhase}
        />
      </Suspense>

      {(draftNewTrip || newTripModal.data) && (() => {
        const tripOrDraft = draftNewTrip ?? newTripModal.data!;
        const tripId = newTripModal.data?.id;
        return (
        <Suspense fallback={null}>
          {addCountryModalType.data === "single" && (
            <AddCountryModal
              isOpen={addCountryModalType.isOpen}
              onClose={() => {
                addCountryModalType.close();
                handleCancelNewTrip();
              }}
              onSave={handleSaveCountry}
              tripStartDate={tripOrDraft.startDate}
              tripEndDate={tripOrDraft.endDate}
              existingCountries={[]}
              tripData={tripOrDraft.data}
              totalBudget={tripOrDraft.data.wallet ? calculateMainBudget(tripOrDraft.data.wallet, tripId) : tripOrDraft.data.totalBudget}
              baseCurrency={tripOrDraft.data.wallet?.baseCurrency ?? "PLN"}
              onBack={() => {
                addCountryModalType.close();
                setIsAddModalOpen(true);
              }}
            />
          )}
          {addCountryModalType.data === "multiple" && (
            <AddMultipleCountriesModal
              isOpen={addCountryModalType.isOpen}
              onClose={() => {
                addCountryModalType.close();
                handleCancelNewTrip();
              }}
              onSave={handleSaveMultipleCountries}
              onSwitchToSingleCountry={handleSwitchToSingleCountry}
              tripStartDate={tripOrDraft.startDate}
              tripEndDate={tripOrDraft.endDate}
              tripData={tripOrDraft.data}
              totalBudget={tripOrDraft.data.wallet ? calculateMainBudget(tripOrDraft.data.wallet, tripId) : tripOrDraft.data.totalBudget}
              baseCurrency={tripOrDraft.data.wallet?.baseCurrency ?? "PLN"}
              onBack={() => {
                addCountryModalType.close();
                setIsAddModalOpen(true);
              }}
            />
          )}
        </Suspense>
        );
      })()}

      <Suspense fallback={null}>
        <DeleteTripModal
          isOpen={deleteModal.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          trip={deleteModal.data}
          isDeleting={isDeleting}
        />
      </Suspense>

      {/* Onboarding – pierwsza wizyta, zachęta do stworzenia podróży */}
      <Suspense fallback={null}>
        <OnboardingFirstTripModal
          isOpen={showOnboardingModal}
          onClose={() => {
            setOnboardingSeen();
            setShowOnboardingModal(false);
          }}
          onCreateTrip={() => {
            setShowOnboardingModal(false);
            setIsAddModalOpen(true);
          }}
        />
      </Suspense>

      {/* Upgrade Prompt */}
      <UpgradePrompt
        isOpen={isUpgradePromptOpen}
        onClose={() => setIsUpgradePromptOpen(false)}
        currentCount={tripLimitInfo?.currentCount || 0}
        limit={tripLimitInfo?.limit || 1}
        onUpgrade={() => {
          setIsUpgradePromptOpen(false);
          setIsUpgradeToPremiumModalOpen(true);
        }}
      />

      {/* Upgrade to Premium Modal */}
      <Suspense fallback={null}>
        <UpgradeToPremiumModal
          isOpen={isUpgradeToPremiumModalOpen}
          onClose={() => setIsUpgradeToPremiumModalOpen(false)}
          userEmail={user?.email}
          onSuccess={async () => {
            // Po udanym upgrade, sprawdź czy są zapisane dane podróży
            const pendingTrip = getPendingTrip();
            if (pendingTrip) {
              // Wyczyść zapisane dane
              clearPendingTrip();
              
              // Otwórz modal dodawania podróży z przywróconymi danymi
              setIsAddModalOpen(true);
              
              // Ustaw zapisane dane jako initialValues
              setSavedTripFormData({
                name: pendingTrip.name,
                startDate: pendingTrip.startDate,
                endDate: pendingTrip.endDate,
                baseCurrency: pendingTrip.baseCurrency,
                initialBudgets: pendingTrip.initialBudgets,
                totalBudget: pendingTrip.totalBudget != null ? String(pendingTrip.totalBudget) : undefined,
                userName: pendingTrip.userName,
              });
            }
          }}
        />
      </Suspense>
    </>
  );
}

