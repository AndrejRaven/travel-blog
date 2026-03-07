"use client";

import { useSearchParams } from "next/navigation";
import { ArrowLeft, TrendingUp, Banknote } from "lucide-react";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import Link from "@/components/ui/Link";
import KursyWalutClient from "./KursyWalutClient";
import ExchangeAnalyticsClient from "../kursy-i-wymiana/ExchangeAnalyticsClient";

export type KursyTab = "waluty" | "wymiana";

const TABS: { id: KursyTab; label: string; icon: React.ReactNode }[] = [
  { id: "waluty", label: "Kursy walut", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "wymiana", label: "Transakcje i wymiana", icon: <Banknote className="w-4 h-4" /> },
];

function isValidTab(tab: string | null): tab is KursyTab {
  return tab === "waluty" || tab === "wymiana";
}

interface KursyClientProps {
  slug: string;
}

export default function KursyClient({ slug }: KursyClientProps) {
  const searchParams = useSearchParams();
  const tab = isValidTab(searchParams.get("tab")) ? searchParams.get("tab") : "waluty";
  const currentTab = tab ?? "waluty";

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
        title="Kursy"
        subtitle="Kursy walut i transakcje wymiany"
      />

      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
        {TABS.map(({ id, label, icon }) => (
          <Link
            key={id}
            href={`/portfel-podrozniczy/${slug}/kursy?tab=${id}`}
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

      {currentTab === "waluty" && <KursyWalutClient slug={slug} embedded />}
      {currentTab === "wymiana" && <ExchangeAnalyticsClient slug={slug} embedded />}
    </PageLayout>
  );
}
