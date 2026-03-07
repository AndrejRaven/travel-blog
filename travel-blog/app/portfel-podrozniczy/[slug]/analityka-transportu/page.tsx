"use client";

import { use } from "react";
import TransportAnalyticsClient from "./TransportAnalyticsClient";

interface TransportAnalyticsPageProps {
  params: Promise<{ slug: string }>;
}

export default function TransportAnalyticsPage({
  params,
}: TransportAnalyticsPageProps) {
  const { slug } = use(params);

  return <TransportAnalyticsClient slug={slug} />;
}
