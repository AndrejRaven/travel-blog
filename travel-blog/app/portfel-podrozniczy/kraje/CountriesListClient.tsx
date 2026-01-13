"use client";

import { useState, useEffect } from "react";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import CountriesList from "@/components/pages/CountriesList";
import { getAllCountries } from "@/lib/travel-wallet/countries";
import type { Country } from "@/lib/travel-wallet/types";

export default function CountriesListClient() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const allCountries = getAllCountries();
    setCountries(allCountries);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <PageLayout maxWidth="6xl">
        <PageHeader
          title="Kraje"
          subtitle="Lista wszystkich krajów w portfelu podróżniczym"
        />
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Ładowanie danych...</p>
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
      <CountriesList countries={countries} />
    </PageLayout>
  );
}

