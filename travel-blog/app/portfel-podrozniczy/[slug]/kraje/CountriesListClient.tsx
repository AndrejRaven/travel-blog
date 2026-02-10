"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import CountriesList from "@/components/pages/CountriesList";
import { getAllCountries } from "@/lib/travel-wallet/countries";
import { getTripBySlug } from "@/lib/travel-wallet/trips-storage";
import type { Country } from "@/lib/travel-wallet/types";

interface CountriesListClientProps {
  slug: string;
}

export default function CountriesListClient({
  slug,
}: CountriesListClientProps) {
  const router = useRouter();
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const trip = getTripBySlug(slug);
    if (!trip) {
      router.push("/portfel-podrozniczy");
      return;
    }

    const allCountries = getAllCountries(trip.id);
    setCountries(allCountries);
    setIsLoading(false);
  }, [slug, router]);

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
      <PageHeader
        title="Kraje"
        subtitle="Lista wszystkich krajów w portfelu podróżniczym"
      />
      <CountriesList
        countries={countries}
        slug={slug}
        tripId={getTripBySlug(slug)?.id}
      />
    </PageLayout>
  );
}
