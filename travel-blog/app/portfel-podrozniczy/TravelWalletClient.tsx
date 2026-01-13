"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/shared/PageLayout";
import TravelWalletDashboard from "@/components/pages/TravelWalletDashboard";
import { getCurrentTrip } from "@/lib/travel-wallet/trips-storage";
import type { TravelWalletData, Trip } from "@/lib/travel-wallet/types";

export default function TravelWalletClient() {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [data, setData] = useState<TravelWalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Załaduj dane z localStorage po zamontowaniu komponentu
  useEffect(() => {
    const currentTrip = getCurrentTrip();
    if (!currentTrip) {
      // Jeśli nie ma aktualnej podróży, przekieruj do listy podróży
      router.push("/portfel-podrozniczy");
      return;
    }
    setTrip(currentTrip);
    setData(currentTrip.data);
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <PageLayout maxWidth="6xl">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Ładowanie danych...
          </p>
        </div>
      </PageLayout>
    );
  }

  if (!data || !trip) {
    return (
      <PageLayout maxWidth="6xl">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Nie udało się załadować danych.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth="6xl">
      <TravelWalletDashboard data={data} slug={trip.slug} />
    </PageLayout>
  );
}
