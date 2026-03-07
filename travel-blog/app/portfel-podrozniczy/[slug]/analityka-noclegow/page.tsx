"use client";

import { use } from "react";
import AccommodationAnalyticsClient from "./AccommodationAnalyticsClient";

interface AccommodationAnalyticsPageProps {
  params: Promise<{ slug: string }>;
}

export default function AccommodationAnalyticsPage({
  params,
}: AccommodationAnalyticsPageProps) {
  const { slug } = use(params);

  return <AccommodationAnalyticsClient slug={slug} />;
}
