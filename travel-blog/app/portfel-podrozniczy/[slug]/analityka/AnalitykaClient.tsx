"use client";

import { useSearchParams } from "next/navigation";
import { Home, Car, UtensilsCrossed, Globe, Target } from "lucide-react";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import Link from "@/components/ui/Link";
import { ArrowLeft } from "lucide-react";
import AccommodationAnalyticsClient from "../analityka-noclegow/AccommodationAnalyticsClient";
import TransportAnalyticsClient from "../analityka-transportu/TransportAnalyticsClient";
import FoodAnalyticsClient from "../analityka-jedzenia/FoodAnalyticsClient";
import CountryComparisonClient from "../porownanie-krajow/CountryComparisonClient";
import BudgetVsActualClient from "../budzet-vs-wykonanie/BudgetVsActualClient";

export type AnalitykaTab = "noclegi" | "transport" | "jedzenie" | "porownanie-krajow" | "budzet";

const TABS: { id: AnalitykaTab; label: string; icon: React.ReactNode }[] = [
  { id: "noclegi", label: "Noclegi", icon: <Home className="w-4 h-4" /> },
  { id: "transport", label: "Transport", icon: <Car className="w-4 h-4" /> },
  { id: "jedzenie", label: "Jedzenie", icon: <UtensilsCrossed className="w-4 h-4" /> },
  { id: "porownanie-krajow", label: "Porównanie krajów", icon: <Globe className="w-4 h-4" /> },
  { id: "budzet", label: "Budżet vs wykonanie", icon: <Target className="w-4 h-4" /> },
];

function isValidTab(tab: string | null): tab is AnalitykaTab {
  return (
    tab === "noclegi" ||
    tab === "transport" ||
    tab === "jedzenie" ||
    tab === "porownanie-krajow" ||
    tab === "budzet"
  );
}

interface AnalitykaClientProps {
  slug: string;
}

export default function AnalitykaClient({ slug }: AnalitykaClientProps) {
  const searchParams = useSearchParams();
  const tab = isValidTab(searchParams.get("tab")) ? searchParams.get("tab") : "noclegi";
  const currentTab = tab ?? "noclegi";

  return (
    <PageLayout maxWidth="6xl">
      <div className="mb-6">
        <Link
          href={`/portfel-podrozniczy/${slug}`}
          variant="default"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Powrót do dashboardu
        </Link>
      </div>

      <PageHeader
        title="Analityka"
        subtitle="Noclegi, transport, jedzenie, porównanie krajów i budżet"
      />

      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
        {TABS.map(({ id, label, icon }) => (
          <Link
            key={id}
            href={`/portfel-podrozniczy/${slug}/analityka?tab=${id}`}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentTab === id
                ? "bg-blue-600 dark:bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {icon}
            {label}
          </Link>
        ))}
      </div>

      {currentTab === "noclegi" && <AccommodationAnalyticsClient slug={slug} embedded />}
      {currentTab === "transport" && <TransportAnalyticsClient slug={slug} embedded />}
      {currentTab === "jedzenie" && <FoodAnalyticsClient slug={slug} embedded />}
      {currentTab === "porownanie-krajow" && <CountryComparisonClient slug={slug} embedded />}
      {currentTab === "budzet" && <BudgetVsActualClient slug={slug} embedded />}
    </PageLayout>
  );
}
