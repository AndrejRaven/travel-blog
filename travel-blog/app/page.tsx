import React from "react";
import { getHomepageData } from "@/lib/queries/functions";
import HomePageClient from "@/components/pages/HomePageClient";

export default async function Home() {
  // Pobierz dane homepage z Sanity na serwerze
  const homepageData = await getHomepageData();

  // Obsługa błędów
  if (!homepageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Brak danych
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Nie znaleziono danych strony głównej w Sanity
          </p>
        </div>
      </div>
    );
  }

  return <HomePageClient homepageData={homepageData} />;
}
